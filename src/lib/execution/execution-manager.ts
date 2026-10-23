import type { FileItem, ConsoleMessage, ExecutionResult, SupportedLanguage } from '@/types';
import type { ExecutionAdapter } from './types';
import { HtmlExecutionAdapter } from './adapters/html-adapter';
import { TypeScriptExecutionAdapter } from './adapters/ts-adapter';
import { PythonExecutionAdapter } from './adapters/python-adapter';
import { CppExecutionAdapter } from './adapters/cpp-adapter';

export class ExecutionManager {
  private static htmlAdapter = new HtmlExecutionAdapter();
  private static tsAdapter = new TypeScriptExecutionAdapter();
  private static pythonAdapter = new PythonExecutionAdapter();
  private static cppAdapter = new CppExecutionAdapter();

  private static currentAdapter: ExecutionAdapter | null = null;

  static getAdapterForLanguage(language: SupportedLanguage): ExecutionAdapter {
    switch (language) {
      case 'html':
      case 'css':
      case 'javascript':
        return this.htmlAdapter;
      case 'typescript':
        return this.tsAdapter;
      case 'python':
        return this.pythonAdapter;
      case 'cpp':
        return this.cppAdapter;
      default:
        return this.htmlAdapter;
    }
  }

  static async execute(
    files: FileItem[],
    activeFile: FileItem,
    onMessage?: (msg: ConsoleMessage) => void
  ): Promise<ExecutionResult> {
    const adapter = this.getAdapterForLanguage(activeFile.language);
    this.currentAdapter = adapter;

    try {
      return await adapter.run(files, activeFile, onMessage);
    } finally {
      this.currentAdapter = null;
    }
  }

  static cancelCurrent(): void {
    if (this.currentAdapter && typeof this.currentAdapter.cancel === 'function') {
      this.currentAdapter.cancel();
      this.currentAdapter = null;
    }
    // Also cancel python specifically if active
    this.pythonAdapter.cancel();
    this.tsAdapter.cancel();
  }
}
