import type { FileItem, ConsoleMessage, ExecutionResult } from '@/types';
import type { ExecutionAdapter } from '../types';

const PYODIDE_WORKER_SCRIPT = `
let pyodideInstance = null;
let isInitializing = false;
let initFailed = false;
let pendingInputResolver = null;
const queuedStdin = [];

const PYODIDE_BASE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';

// Global input bridge between Python worker and main thread UI
self.request_input_from_browser = function(promptText) {
  self.postMessage({ type: 'INPUT_REQUEST', prompt: promptText || '' });
  return new Promise((resolve) => {
    pendingInputResolver = resolve;
  });
};

async function getPyodide() {
  if (pyodideInstance) return pyodideInstance;
  if (initFailed) return null;

  if (isInitializing) {
    while (isInitializing) {
      await new Promise(r => setTimeout(r, 100));
    }
    return pyodideInstance;
  }

  isInitializing = true;
  self.postMessage({ type: 'STATUS', text: 'Loading Python 3.12 WebAssembly runtime & standard libraries...' });

  try {
    const loadPromise = new Promise((resolve, reject) => {
      try {
        importScripts(PYODIDE_BASE_URL + 'pyodide.js');
        resolve();
      } catch (err) {
        reject(err);
      }
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('CDN connection timed out')), 10000)
    );

    await Promise.race([loadPromise, timeoutPromise]);

    self.postMessage({ type: 'STATUS', text: 'Initializing Python 3.12 WebAssembly environment...' });

    // loadPyodide MUST have indexURL to find python_stdlib.zip and pyodide.asm.wasm
    pyodideInstance = await loadPyodide({
      indexURL: PYODIDE_BASE_URL,
      stdout: (text) => self.postMessage({ type: 'STDOUT', text }),
      stderr: (text) => self.postMessage({ type: 'STDERR', text })
    });

    // Provide safe C-level stdin hook so CPython never throws OSError Errno 29
    if (pyodideInstance.setStdin) {
      pyodideInstance.setStdin({
        stdin: () => {
          if (queuedStdin.length > 0) {
            return queuedStdin.shift() + '\\n';
          }
          return '0\\n';
        },
        error: false,
        isatty: false
      });
    }

    // Initialize Python AST transformer and interactive async input bridge
    await pyodideInstance.runPythonAsync(\`
import sys
import builtins
import ast
import js

# Interactive async input function that requests input from the UI
async def _async_input(prompt=''):
    res = await js.request_input_from_browser(str(prompt or ''))
    val = str(res) if res is not None else ''
    if prompt:
        print(f"{prompt}{val}")
    else:
        print(val)
    return val

def _prepare_user_code(source_code):
    try:
        tree = ast.parse(source_code)
        has_input = False
        for node in ast.walk(tree):
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == 'input':
                has_input = True
                break
        if not has_input:
            return source_code

        async_funcs = set()
        changed = True
        while changed:
            changed = False
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    if node.name not in async_funcs:
                        for child in ast.walk(node):
                            if isinstance(child, ast.Call) and isinstance(child.func, ast.Name):
                                if child.func.id == 'input' or child.func.id in async_funcs:
                                    async_funcs.add(node.name)
                                    changed = True
                                    break

        class _InputTransformer(ast.NodeTransformer):
            def visit_Call(self, node):
                self.generic_visit(node)
                if isinstance(node.func, ast.Name):
                    if node.func.id == 'input':
                        node.func.id = '_async_input'
                        return ast.copy_location(ast.Await(value=node), node)
                    elif node.func.id in async_funcs:
                        return ast.copy_location(ast.Await(value=node), node)
                return node

            def visit_FunctionDef(self, node):
                self.generic_visit(node)
                if node.name in async_funcs:
                    new_node = ast.AsyncFunctionDef(
                        name=node.name,
                        args=node.args,
                        body=node.body,
                        decorator_list=node.decorator_list,
                        returns=node.returns,
                        type_comment=getattr(node, 'type_comment', None)
                    )
                    return ast.copy_location(new_node, node)
                return node

        transformer = _InputTransformer()
        new_tree = transformer.visit(tree)
        ast.fix_missing_locations(new_tree)
        return ast.unparse(new_tree)
    except Exception:
        return source_code
\`);

    self.postMessage({ type: 'STATUS', text: 'Python 3.12 runtime ready with interactive input support.' });
    isInitializing = false;
    return pyodideInstance;
  } catch (err) {
    isInitializing = false;
    initFailed = true;
    self.postMessage({
      type: 'STATUS',
      text: 'Note: Pyodide CDN unavailable (' + (err.message || String(err)) + '). Using built-in Python client runtime.'
    });
    return null;
  }
}

// Built-in Python Runtime Fallback for offline mode
async function runPythonFallback(code) {
  const print = (...args) => {
    const formatted = args.map(a => {
      if (a === null || a === undefined) return 'None';
      if (typeof a === 'boolean') return a ? 'True' : 'False';
      if (typeof a === 'object') {
        if (Array.isArray(a)) return '[' + a.map(x => typeof x === 'string' ? "'" + x + "'" : String(x)).join(', ') + ']';
        try { return JSON.stringify(a).replace(/"/g, "'"); } catch(e) { return String(a); }
      }
      return String(a);
    }).join(' ');
    self.postMessage({ type: 'STDOUT', text: formatted });
  };

  const len = (x) => (x && typeof x.length === 'number' ? x.length : (x && typeof x.size === 'number' ? x.size : Object.keys(x || {}).length));
  const range = (start, stop, step) => {
    if (stop === undefined) { stop = start; start = 0; }
    if (step === undefined) step = 1;
    const res = [];
    if (step > 0) {
      for (let i = start; i < stop; i += step) res.push(i);
    } else if (step < 0) {
      for (let i = start; i > stop; i += step) res.push(i);
    }
    return res;
  };
  const sum = (iterable, start = 0) => (Array.from(iterable).reduce((a, b) => a + b, start));
  const min = (...args) => {
    const list = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
    return Math.min(...list);
  };
  const max = (...args) => {
    const list = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
    return Math.max(...list);
  };
  const abs = (x) => Math.abs(x);
  const round = (x, n = 0) => {
    const factor = Math.pow(10, n);
    return Math.round(x * factor) / factor;
  };
  const enumerate = (iterable, start = 0) => Array.from(iterable).map((item, idx) => [idx + start, item]);
  const zip = (...iterables) => {
    const minLen = Math.min(...iterables.map(it => it.length || 0));
    const res = [];
    for (let i = 0; i < minLen; i++) {
      res.push(iterables.map(it => it[i]));
    }
    return res;
  };
  const sorted = (iterable, reverse = false) => {
    const arr = [...iterable].sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));
    return reverse ? arr.reverse() : arr;
  };
  const reversed = (iterable) => [...iterable].reverse();
  const input = async (promptText = '') => {
    if (promptText) print(promptText);
    const res = await self.request_input_from_browser(promptText);
    print(res);
    return String(res);
  };
  const any = (iterable) => Array.from(iterable).some(Boolean);
  const all = (iterable) => Array.from(iterable).every(Boolean);

  const math = {
    pi: Math.PI,
    e: Math.E,
    sqrt: Math.sqrt,
    floor: Math.floor,
    ceil: Math.ceil,
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    pow: Math.pow,
    log: Math.log,
    exp: Math.exp,
  };

  const sys = {
    version: '3.12.0 (Browser WebAssembly Runtime)',
    platform: 'emscripten',
    argv: ['main.py']
  };

  let jsCode = code
    .replace(/^\\s*import\\s+.*$/gm, '// $&')
    .replace(/^\\s*from\\s+.*import\\s+.*$/gm, '// $&')
    .replace(/\\bTrue\\b/g, 'true')
    .replace(/\\bFalse\\b/g, 'false')
    .replace(/\\bNone\\b/g, 'null')
    .replace(/\\band\\b/g, '&&')
    .replace(/\\bor\\b/g, '||')
    .replace(/\\bnot\\b/g, '!')
    .replace(/\\belif\\b/g, 'else if');

  // Handle input(...) with await
  jsCode = jsCode.replace(/\\binput\\s*\\(/g, 'await input(');

  // Handle f-strings
  jsCode = jsCode.replace(/f"([^"\\n]*)"/g, (_, content) => {
    const interpolated = content.replace(/\\{([^}]+)\\}/g, '\${$1}');
    return '\`' + interpolated + '\`';
  });
  jsCode = jsCode.replace(/f'([^'\\n]*)'/g, (_, content) => {
    const interpolated = content.replace(/\\{([^}]+)\\}/g, '\${$1}');
    return '\`' + interpolated + '\`';
  });

  const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
  const evalFn = new AsyncFunction(
    'print', 'len', 'range', 'sum', 'min', 'max', 'abs', 'round',
    'enumerate', 'zip', 'sorted', 'reversed', 'input', 'any', 'all',
    'math', 'sys',
    jsCode
  );

  await evalFn(
    print, len, range, sum, min, max, abs, round,
    enumerate, zip, sorted, reversed, input, any, all,
    math, sys
  );
}

self.onmessage = async (e) => {
  const { type, code, text } = e.data;

  // Handle input response from main thread
  if (type === 'INPUT_RESPONSE') {
    if (pendingInputResolver) {
      const resolver = pendingInputResolver;
      pendingInputResolver = null;
      resolver(text || '');
    } else {
      queuedStdin.push(text || '');
    }
    return;
  }

  if (type === 'RUN') {
    try {
      const pyodide = await getPyodide();
      self.postMessage({ type: 'RUNNING' });

      if (pyodide) {
        // Auto-load packages if imported
        try {
          if (pyodide.loadPackagesFromImports) {
            await pyodide.loadPackagesFromImports(code);
          }
        } catch (pkgErr) {
          // ignore optional package load error
        }

        // Prepare code with AST transformer to support interactive input
        let preparedCode = code;
        try {
          const prepResult = pyodide.globals.get('_prepare_user_code');
          if (prepResult) {
            const transformed = prepResult(code);
            if (transformed !== undefined && transformed !== null) {
              preparedCode = String(transformed);
            }
            if (typeof prepResult.destroy === 'function') {
              prepResult.destroy();
            }
          }
        } catch (prepErr) {
          preparedCode = code;
        }

        const result = await pyodide.runPythonAsync(preparedCode);
        if (result !== undefined && result !== null) {
          try {
            const repr = String(result);
            if (repr && repr !== 'None' && repr !== '[object Object]') {
              self.postMessage({ type: 'STDOUT', text: repr });
            }
          } catch (rErr) {}
        }
        self.postMessage({ type: 'SUCCESS' });
      } else {
        // Offline / CDN unavailable fallback
        await runPythonFallback(code);
        self.postMessage({ type: 'SUCCESS' });
      }
    } catch (err) {
      self.postMessage({ type: 'ERROR', error: err.message || String(err) });
    }
  }
};
`;

export class PythonExecutionAdapter implements ExecutionAdapter {
  private worker: Worker | null = null;
  private workerBlobUrl: string | null = null;
  private isExecuting: boolean = false;

  private getOrCreateWorker(): Worker {
    if (!this.worker) {
      if (!this.workerBlobUrl) {
        const blob = new Blob([PYODIDE_WORKER_SCRIPT], { type: 'application/javascript' });
        this.workerBlobUrl = URL.createObjectURL(blob);
      }
      this.worker = new Worker(this.workerBlobUrl);
    }
    return this.worker;
  }

  sendInput(text: string): void {
    if (this.worker) {
      this.worker.postMessage({ type: 'INPUT_RESPONSE', text });
    }
  }

  async run(
    files: FileItem[],
    activeFile: FileItem,
    onMessage?: (msg: ConsoleMessage) => void
  ): Promise<ExecutionResult> {
    const startTime = performance.now();
    const messages: ConsoleMessage[] = [];
    this.isExecuting = true;

    const notify = (type: ConsoleMessage['type'], text: string) => {
      const msg: ConsoleMessage = {
        id: `py-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type,
        args: [text],
        timestamp: Date.now(),
      };
      messages.push(msg);
      onMessage?.(msg);
    };

    notify('system', `[Python Sandbox] Starting execution for ${activeFile.name}...`);

    return new Promise<ExecutionResult>((resolve) => {
      const worker = this.getOrCreateWorker();
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        worker.onmessage = null;
        this.isExecuting = false;
      };

      worker.onmessage = (event: MessageEvent) => {
        const { type, text, prompt, error } = event.data;

        switch (type) {
          case 'STATUS':
            notify('system', `[Python] ${text}`);
            break;
          case 'STDOUT':
            notify('log', text);
            break;
          case 'STDERR':
            notify('warn', text);
            break;
          case 'INPUT_REQUEST':
            // Reset timeout during active user input waiting
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = setTimeout(() => {
                this.cancel();
                notify('error', '[Python Timeout] Input prompt was waiting for over 2 minutes and timed out.');
                resolve({
                  success: false,
                  messages,
                  error: 'Input prompt timed out',
                  executionTimeMs: 120000,
                });
              }, 120000);
            }
            notify('input', prompt || '');
            break;
          case 'RUNNING':
            // Code execution started
            break;
          case 'SUCCESS':
            cleanup();
            notify('system', `[Python Finished] Execution completed in ${Math.round(performance.now() - startTime)}ms`);
            resolve({
              success: true,
              messages,
              executionTimeMs: Math.round(performance.now() - startTime),
            });
            break;
          case 'ERROR':
            cleanup();
            notify('error', `[Python Exception]\n${error}`);
            resolve({
              success: false,
              messages,
              error,
              executionTimeMs: Math.round(performance.now() - startTime),
            });
            break;
        }
      };

      worker.onerror = (err: ErrorEvent) => {
        cleanup();
        const errMsg = err.message || 'Worker runtime error';
        notify('error', `[Python Worker Error] ${errMsg}`);
        resolve({
          success: false,
          messages,
          error: errMsg,
          executionTimeMs: Math.round(performance.now() - startTime),
        });
      };

      // 60-second execution timeout
      timeoutId = setTimeout(() => {
        this.cancel();
        notify('error', '[Python Timeout] Execution exceeded 60 seconds and was terminated.');
        resolve({
          success: false,
          messages,
          error: 'Execution timed out (60s)',
          executionTimeMs: 60000,
        });
      }, 60000);

      worker.postMessage({ type: 'RUN', code: activeFile.content });
    });
  }

  cancel(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.isExecuting = false;
  }

  dispose(): void {
    this.cancel();
    if (this.workerBlobUrl) {
      URL.revokeObjectURL(this.workerBlobUrl);
      this.workerBlobUrl = null;
    }
  }
}
