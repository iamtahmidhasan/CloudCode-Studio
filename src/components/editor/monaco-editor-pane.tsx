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
  onToggleSidebar?: () => void;
  onToggleBottomPanel?: () => void;
  onQuickOpen?: () => void;
  onOpenSettings?: () => void;
  onCloseActiveTab?: () => void;
  onOpenShortcuts?: () => void;
}

export function MonacoEditorPane({
  file,
  settings,
  onChangeContent,
  onSave,
  onRun,
  onCursorChange,
  onMountEditor,
  onToggleSidebar,
  onToggleBottomPanel,
  onQuickOpen,
  onOpenSettings,
  onCloseActiveTab,
  onOpenShortcuts,
}: MonacoEditorPaneProps) {
  const localEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleBeforeMount: BeforeMount = (monaco) => {
    initializeMonaco(monaco);
  };

  const handleEditorDidMount: OnMount = (editorInstance, monaco) => {
    localEditorRef.current = editorInstance;
    onMountEditor?.(editorInstance);

    // Keybindings: Ctrl+Space / Cmd+Space (Trigger Suggestions / IntelliSense)
    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
      editorInstance.trigger('keyboard', 'editor.action.triggerSuggest', null);
    });

    // Keybindings: Ctrl+S / Cmd+S (Save)
    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave?.();
    });

    // Keybindings: Ctrl+Enter / Cmd+Enter (Run code)
    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRun?.();
    });

    // Keybindings: Ctrl+B / Cmd+B (Toggle Sidebar)
    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
      onToggleSidebar?.();
    });

    // Keybindings: Ctrl+P / Cmd+P (Quick Open / File Explorer)
    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP, () => {
      onQuickOpen?.();
    });

    // Keybindings: Ctrl+J / Cmd+J (Toggle Bottom Dock Panel)
    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyJ, () => {
      onToggleBottomPanel?.();
    });

    // Keybindings: Ctrl+` / Cmd+` (Toggle Bottom Dock Panel)
    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Backquote, () => {
      onToggleBottomPanel?.();
    });

    // Keybindings: Ctrl+, / Cmd+, (Open Settings)
    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Comma, () => {
      onOpenSettings?.();
    });

    // Keybindings: Alt+W (Close Active Tab safely)
    editorInstance.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyW, () => {
      onCloseActiveTab?.();
    });

    // Keybindings: Ctrl+K Ctrl+S (Open Keyboard Shortcuts)
    editorInstance.addCommand(
      monaco.KeyMod.chord(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS
      ),
      () => {
        onOpenShortcuts?.();
      }
    );

    // Keybindings: Ctrl+Shift+P / Cmd+Shift+P (VS Code Command Palette)
    editorInstance.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP,
      () => {
        editorInstance.trigger('keyboard', 'editor.action.quickCommand', null);
      }
    );

    // Keybindings: Shift+Alt+F (Format Document)
    editorInstance.addCommand(
      monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF,
      () => {
        editorInstance.trigger('keyboard', 'editor.action.formatDocument', null);
      }
    );

    // Cursor position tracker
    editorInstance.onDidChangeCursorPosition((e) => {
      onCursorChange?.(e.position.lineNumber, e.position.column);
    });

    // Fast Emmet expansion for ! or html:5 on Enter
    editorInstance.onKeyDown((e) => {
      if (e.keyCode === monaco.KeyCode.Enter && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        const model = editorInstance.getModel();
        const pos = editorInstance.getPosition();
        if (model && pos && model.getLanguageId() === 'html') {
          const line = model.getLineContent(pos.lineNumber).trim();
          if (line === '!' || line === 'html:5') {
            setTimeout(() => {
              const currentModel = editorInstance.getModel();
              if (currentModel) {
                const currentContent = currentModel.getValue();
                if (currentContent.includes('<!DOCTYPE html>')) return;

                const lineContentNow = currentModel.getLineContent(pos.lineNumber);
                if (lineContentNow.trim() === '!' || lineContentNow.trim() === 'html:5') {
                  const range = new monaco.Range(pos.lineNumber, 1, pos.lineNumber, lineContentNow.length + 1);
                  editorInstance.executeEdits('emmet-quick', [
                    {
                      range,
                      text: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Document</title>\n</head>\n<body>\n  \n</body>\n</html>\n`,
                    },
                  ]);
                  editorInstance.setPosition({ lineNumber: pos.lineNumber + 8, column: 3 });
                }
              }
            }, 60);
          }
        }
      }
    });

    // Mobile / touch layout listener
    editorInstance.layout();
  };

  const containerRef = useRef<HTMLDivElement>(null);

  // Keep editor layout responsive on container size changes
  useEffect(() => {
    const handleResize = () => {
      localEditorRef.current?.layout();
    };
    window.addEventListener('resize', handleResize);

    const ro = new ResizeObserver(() => {
      localEditorRef.current?.layout();
    });
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      ro.disconnect();
    };
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
    <div ref={containerRef} className="relative flex-1 w-full h-full min-h-0 overflow-hidden bg-[#1e1e1e]">
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
          scrollBeyondLastColumn: 0,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true, indentation: true },
          acceptSuggestionOnEnter: 'on',
          tabCompletion: 'on',
          snippetSuggestions: 'top',
          suggestSelection: 'first',
          suggestOnTriggerCharacters: true,
          quickSuggestionsDelay: 10,
          suggest: {
            preview: true,
            showIcons: true,
            showSnippets: true,
            showWords: true,
            showFunctions: true,
            showMethods: true,
            showKeywords: true,
            showClasses: true,
            showVariables: true,
            showConstants: true,
            showProperties: true,
            snippetsPreventQuickSuggestions: false,
          },
          quickSuggestions: {
            other: true,
            comments: false,
            strings: true,
          },
          padding: { top: 4, bottom: 4 },
        }}
      />
    </div>
  );
}
