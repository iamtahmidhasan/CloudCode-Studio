'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FileItem, ConsoleMessage, ExecutionStatus, ExecutionResult } from '@/types';
import { ExecutionManager } from '@/lib/execution/execution-manager';
import { buildHtmlPreviewDocument } from '@/lib/execution/adapters/html-adapter';

export function useExecution() {
  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const [messages, setMessages] = useState<ConsoleMessage[]>([]);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [previewDoc, setPreviewDoc] = useState<string>('');
  const [pendingInputPrompt, setPendingInputPrompt] = useState<string | null>(null);

  // Handle messages from the preview iframe
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      if (event.data?.source === 'ide-preview-sandbox') {
        const { type, args } = event.data;
        const newMsg: ConsoleMessage = {
          id: `sandbox-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          type: type || 'log',
          args: Array.isArray(args) ? args : [String(args)],
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, newMsg]);
      }
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, []);

  const clearConsole = useCallback(() => {
    setMessages([]);
  }, []);

  const addConsoleMessage = useCallback((msg: ConsoleMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const runCode = useCallback(
    async (files: FileItem[], activeFile: FileItem, rootFolderPath: string = '') => {
      if (!activeFile) return;

      setStatus('running');
      setPendingInputPrompt(null);

      // If active language is HTML/CSS/JS, generate fresh preview document
      if (['html', 'css', 'javascript'].includes(activeFile.language)) {
        const doc = buildHtmlPreviewDocument(files, activeFile, rootFolderPath);
        setPreviewDoc(doc);
      }

      try {
        const result: ExecutionResult = await ExecutionManager.execute(
          files,
          activeFile,
          (msg) => {
            if (msg.type === 'input') {
              setPendingInputPrompt(msg.args[0] || 'Enter input:');
              return;
            }
            setMessages((prev) => [...prev, msg]);
          }
        );

        setPendingInputPrompt(null);
        setStatus(result.success ? 'success' : 'error');
        if (result.executionTimeMs !== undefined) {
          setExecutionTime(result.executionTimeMs);
        }
      } catch (err: unknown) {
        setPendingInputPrompt(null);
        const errMsg = err instanceof Error ? err.message : String(err);
        setStatus('error');
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            type: 'error',
            args: [`Execution failed: ${errMsg}`],
            timestamp: Date.now(),
          },
        ]);
      }
    },
    []
  );

  const sendInput = useCallback((text: string) => {
    ExecutionManager.sendInput(text);
    setPendingInputPrompt(null);
  }, []);

  const cancelExecution = useCallback(() => {
    ExecutionManager.cancelCurrent();
    setPendingInputPrompt(null);
    setStatus('idle');
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}-cancelled`,
        type: 'system',
        args: ['Execution was stopped by user.'],
        timestamp: Date.now(),
      },
    ]);
  }, []);

  return {
    status,
    messages,
    executionTime,
    previewDoc,
    pendingInputPrompt,
    sendInput,
    runCode,
    cancelExecution,
    clearConsole,
    addConsoleMessage,
  };
}
