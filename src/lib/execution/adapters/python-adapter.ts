import type { FileItem, ConsoleMessage, ExecutionResult } from '@/types';
import type { ExecutionAdapter } from '../types';

const PYODIDE_WORKER_SCRIPT = `
let pyodideInstance = null;
let isInitializing = false;

async function getPyodide() {
  if (pyodideInstance) return pyodideInstance;
  if (isInitializing) {
    while (isInitializing) {
      await new Promise(r => setTimeout(r, 100));
    }
    return pyodideInstance;
  }

  isInitializing = true;
  self.postMessage({ type: 'STATUS', text: 'Fetching Pyodide WebAssembly runtime from CDN...' });

  try {
    importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js');
    self.postMessage({ type: 'STATUS', text: 'Initializing Python 3.12 WebAssembly environment...' });

    pyodideInstance = await loadPyodide({
      stdout: (text) => self.postMessage({ type: 'STDOUT', text }),
      stderr: (text) => self.postMessage({ type: 'STDERR', text })
    });

    self.postMessage({ type: 'STATUS', text: 'Python environment ready.' });
    isInitializing = false;
    return pyodideInstance;
  } catch (err) {
    isInitializing = false;
    throw err;
  }
}

self.onmessage = async (e) => {
  const { type, code } = e.data;
  if (type === 'RUN') {
    try {
      const pyodide = await getPyodide();
      self.postMessage({ type: 'RUNNING' });
      await pyodide.runPythonAsync(code);
      self.postMessage({ type: 'SUCCESS' });
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
        const { type, text, error } = event.data;

        switch (type) {
          case 'STATUS':
            notify('system', `[Pyodide] ${text}`);
            break;
          case 'STDOUT':
            notify('log', text);
            break;
          case 'STDERR':
            notify('warn', text);
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

      // 30-second timeout
      timeoutId = setTimeout(() => {
        this.cancel();
        notify('error', '[Python Timeout] Execution exceeded 30 seconds and was terminated.');
        resolve({
          success: false,
          messages,
          error: 'Execution timed out (30s)',
          executionTimeMs: 30000,
        });
      }, 30000);

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
