'use client';

import React, { useRef, useEffect } from 'react';
import Editor, { type OnMount, type BeforeMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { initializeMonaco } from '@/lib/editor/monaco-config';
import type { FileItem, EditorSettings } from '@/types';
import { Loader2 } from 'lucide-react';

interface MonacoEditorPaneProps {
  file: FileItem | undefined;
  settings: EditorSettings;
  onChangeContent: (content: string) => void;
  onSave?: () => void;
  onRun?: () => void;
  onCursorChange?: (line: number, col: number) => void;
  onMountEditor?: (editor: editor.IStandaloneCodeEditor) => void;
}

export function MonacoEditorPane({
  file,
  settings,
  onChangeContent,
  onSave,
  onRun,
  onCursorChange,
  onMountEditor,
}: MonacoEditorPaneProps) {
  const localEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleBeforeMount: BeforeMount = (monaco) => {
    initializeMonaco(monaco);
  };

  const handleEditorDidMount: OnMount = (editorInstance, monaco) => {
    localEditorRef.current = editorInstance;
    onMountEditor?.(editorInstance);

    // Keybindings: Ctrl+S / Cmd+S
    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave?.();
    });

    // Keybindings: Ctrl+Enter / Cmd+Enter to run
    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRun?.();
    });

    // Cursor position tracker
    editorInstance.onDidChangeCursorPosition((e) => {
      onCursorChange?.(e.position.lineNumber, e.position.column);
    });

    // Mobile / touch layout listener
    editorInstance.layout();
  };

  // Keep editor layout responsive on container size changes
  useEffect(() => {
    const handleResize = () => {
      localEditorRef.current?.layout();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!file) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-[#1e1e1e] text-[#858585] p-6 select-none">
        <div className="text-4xl mb-3 opacity-30">⌨️</div>
        <p className="text-sm font-medium">No file open</p>
        <p className="text-xs text-[#6e6e6e] mt-1">Select a file from the explorer to start editing</p>
      </div>
    );
  }

  // Map language to Monaco language id
  const monacoLanguage =
    file.language === 'cpp'
      ? 'cpp'
      : file.language === 'python'
      ? 'python'
      : file.language === 'typescript'
      ? 'typescript'
      : file.language === 'javascript'
      ? 'javascript'
      : file.language === 'html'
      ? 'html'
      : file.language === 'css'
      ? 'css'
      : 'plaintext';

  return (
    <div className="relative flex-1 w-full h-full overflow-hidden bg-[#1e1e1e]">
      <Editor
        height="100%"
        width="100%"
        path={file.id}
        defaultLanguage={monacoLanguage}
        language={monacoLanguage}
        value={file.content}
        theme={settings.theme}
        beforeMount={handleBeforeMount}
        onMount={handleEditorDidMount}
        onChange={(val) => onChangeContent(val || '')}
        loading={
          <div className="flex h-full w-full items-center justify-center bg-[#1e1e1e] text-[#858585]">
            <Loader2 className="h-6 w-6 animate-spin text-[#007acc] mr-2" />
            <span className="text-xs font-mono">Loading Monaco Editor...</span>
          </div>
        }
        options={{
          fontSize: settings.fontSize,
          tabSize: settings.tabSize,
          wordWrap: settings.wordWrap,
          minimap: { enabled: settings.minimapEnabled },
          lineNumbers: settings.lineNumbersEnabled ? 'on' : 'off',
          lineNumbersMinChars: 3,
          glyphMargin: false,
          folding: true,
          renderLineHighlight: 'all',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true, indentation: true },
          formatOnPaste: true,
          formatOnType: true,
          suggest: {
            preview: true,
            showIcons: true,
            snippetsPreventQuickSuggestions: false,
          },
          quickSuggestions: {
            other: true,
            comments: false,
            strings: true,
          },
          padding: { top: 8, bottom: 8 },
        }}
      />
    </div>
  );
}
