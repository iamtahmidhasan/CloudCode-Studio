import { transform } from 'sucrase';
import type { FileItem, ConsoleMessage, ExecutionResult } from '@/types';
import type { ExecutionAdapter } from '../types';

export class TypeScriptExecutionAdapter implements ExecutionAdapter {
  private runnerIframe: HTMLIFrameElement | null = null;

  async run(
    files: FileItem[],
    activeFile: FileItem,
    onMessage?: (msg: ConsoleMessage) => void
  ): Promise<ExecutionResult> {
    const startTime = performance.now();
    const messages: ConsoleMessage[] = [];

    const notify = (msg: ConsoleMessage) => {
      messages.push(msg);
      onMessage?.(msg);
    };

    notify({
      id: `sys-${Date.now()}-ts`,
      type: 'system',
      args: [`[TypeScript Compiler] Compiling ${activeFile.name}...`],
      timestamp: Date.now(),
    });

    let jsCode = '';
    try {
      const transpiled = transform(activeFile.content, {
        transforms: ['typescript'],
        disableESTransforms: true,
      });
      jsCode = transpiled.code;
    } catch (compileErr: unknown) {
      const errMessage = compileErr instanceof Error ? compileErr.message : String(compileErr);
      notify({
        id: `err-${Date.now()}-compile`,
        type: 'error',
        args: [`[TypeScript Compilation Error] ${errMessage}`],
        timestamp: Date.now(),
      });

      return {
        success: false,
        messages,
        error: `Compilation Error: ${errMessage}`,
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    }

    notify({
      id: `sys-${Date.now()}-compiled`,
      type: 'system',
      args: ['[TypeScript Compiler] Compilation succeeded. Executing JavaScript...'],
      timestamp: Date.now(),
    });

    return new Promise<ExecutionResult>((resolve) => {
      // Execute in isolated sandboxed iframe with message listener
      const iframe = document.createElement('iframe');
      this.runnerIframe = iframe;
      iframe.style.display = 'none';
      iframe.setAttribute('sandbox', 'allow-scripts');

      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        window.removeEventListener('message', handleMessage);
        if (timeoutId) clearTimeout(timeoutId);
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
        this.runnerIframe = null;
      };

      const handleMessage = (event: MessageEvent) => {
        if (event.data?.source === 'ts-sandbox-runner') {
          if (event.data.type === 'log_event') {
            notify({
              id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              type: event.data.level,
              args: event.data.args,
              timestamp: Date.now(),
            });
          } else if (event.data.type === 'done') {
            cleanup();
            notify({
              id: `sys-${Date.now()}-done`,
              type: 'system',
              args: [`[Execution Finished] in ${Math.round(performance.now() - startTime)}ms`],
              timestamp: Date.now(),
            });
            resolve({
              success: !event.data.hadError,
              messages,
              error: event.data.error,
              executionTimeMs: Math.round(performance.now() - startTime),
            });
          }
        }
      };

      window.addEventListener('message', handleMessage);

      // Safe execution runner document
      const runnerHtml = `<!DOCTYPE html>
<html>
<head>
  <script>
    (function() {
      var hadError = false;
      var lastError = null;

      function serialize(arg) {
        if (arg === undefined) return 'undefined';
        if (arg === null) return 'null';
        if (typeof arg === 'function') return arg.toString();
        if (arg instanceof Error) return arg.stack || arg.message;
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch (e) {
            return Object.prototype.toString.call(arg);
          }
        }
        return String(arg);
      }

      function post(level, args) {
        try {
          var serialized = Array.prototype.slice.call(args).map(serialize);
          window.parent.postMessage({
            source: 'ts-sandbox-runner',
            type: 'log_event',
            level: level,
            args: serialized
          }, '*');
        } catch(e) {}
      }

      ['log', 'info', 'warn', 'error'].forEach(function(lvl) {
        console[lvl] = function() {
          post(lvl, arguments);
        };
      });

      window.onerror = function(msg, src, line, col, err) {
        hadError = true;
        lastError = msg;
        post('error', ['[Runtime Error] ' + msg + (line ? ' (' + line + ':' + (col || 0) + ')' : '')]);
        return false;
      };

      window.onload = function() {
        try {
          ${jsCode}
        } catch (e) {
          hadError = true;
          lastError = e instanceof Error ? e.message : String(e);
          console.error('[Runtime Exception] ' + lastError);
        } finally {
          setTimeout(function() {
            window.parent.postMessage({
              source: 'ts-sandbox-runner',
              type: 'done',
              hadError: hadError,
              error: lastError
            }, '*');
          }, 50);
        }
      };
    })();
  </script>
</head>
<body></body>
</html>`;

      iframe.srcdoc = runnerHtml;
      document.body.appendChild(iframe);

      // 10 second timeout safety net
      timeoutId = setTimeout(() => {
        cleanup();
        const timeoutMsg: ConsoleMessage = {
          id: `err-${Date.now()}-timeout`,
          type: 'error',
          args: ['[Execution Timeout] Script took longer than 10 seconds to execute.'],
          timestamp: Date.now(),
        };
        notify(timeoutMsg);
        resolve({
          success: false,
          messages,
          error: 'Execution timeout (10s)',
          executionTimeMs: 10000,
        });
      }, 10000);
    });
  }

  cancel(): void {
    if (this.runnerIframe && this.runnerIframe.parentNode) {
      this.runnerIframe.parentNode.removeChild(this.runnerIframe);
      this.runnerIframe = null;
    }
  }
}
