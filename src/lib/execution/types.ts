import type { FileItem, ConsoleMessage, ExecutionResult } from '@/types';

export interface ExecutionAdapter {
  run(
    files: FileItem[],
    activeFile: FileItem,
    onMessage?: (msg: ConsoleMessage) => void
  ): Promise<ExecutionResult>;
  cancel?(): void;
  sendInput?(text: string): void;
}

export type { ConsoleMessage, ExecutionResult };
