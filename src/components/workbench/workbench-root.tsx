'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { editor } from 'monaco-editor';
import { useWorkspace } from '@/hooks/use-workspace';
import { useExecution } from '@/hooks/use-execution';
import { useMediaQuery } from '@/hooks/use-media-query';

import { ActivityBar } from './activity-bar';
import { StatusBar } from './status-bar';
import { MobileNav } from './mobile-nav';
import { MobileSymbolBar } from './mobile-symbol-bar';
import { FileExplorer } from '../explorer/file-explorer';
import { EditorTabs } from '../editor/editor-tabs';
import { Breadcrumbs } from '../editor/breadcrumbs';
import { MonacoEditorPane } from '../editor/monaco-editor-pane';
import { WebPreviewPane } from '../preview/web-preview-pane';
import { OutputPanel } from '../output/output-panel';
import { SettingsDialog } from '../settings/settings-dialog';
import { KeyboardShortcutsDialog } from '../settings/keyboard-shortcuts-dialog';
import { PanelResizer, type ResizeEvent } from './panel-resizer';
import { WindowsExplorerView, HOME_FOLDER_ID } from '../explorer/windows-explorer-view';
import { OpenFolderDialog } from '../explorer/open-folder-dialog';
import { usePwa } from '@/components/pwa/pwa-installer';

import {
  Play,
  Settings,
  Folder,
  FolderOpen,
  Minimize2,
  Maximize2,
  Terminal,
  Globe,
  Loader2,
  PanelBottom,
  PanelRight,
  Columns2,
  Rows2,
  X,
  Download,
} from 'lucide-react';
import type { MobileTab } from '@/types';

export function WorkbenchRoot() {
  const { isInstallable, promptInstall } = usePwa();
  const {
    isInitialized,
    isSaving,
    projects,
    files,
    folders,
    workspaceFiles,
    activeWorkspaceRootId,
    activeWorkspaceName,
    rootFolder,
    openFiles,
    activeProject,
    activeFile,
    workspace,
    settings,
    switchProject,
    createProject,
    deleteProject,
    openFolderAsWorkspace,
    createFile,
    renameFile,
    deleteFile,
    duplicateFile,
    createFolder,
    renameFolder,
    deleteFolder,
    moveItem,
    toggleFolderExpanded,
    collapseAllFolders,
    expandAllFolders,
    updateFileContent,
    saveNow,
    openFileInTab,
    closeFileTab,
    updateWorkspace,
    updateSettings,
  } = useWorkspace();

  const {
    status: executionStatus,
    messages: consoleMessages,
    executionTime,
    previewDoc,
    pendingInputPrompt,
    sendInput,
    runCode,
    cancelExecution,
    clearConsole,
  } = useExecution();

  const { isMobile } = useMediaQuery();

  // Automatically open panel & switch to output when interactive input is requested
  useEffect(() => {
    if (pendingInputPrompt) {
      if (isMobile) {
        updateWorkspace({ activePanel: 'output' });
      } else {
        updateWorkspace({ isBottomPanelOpen: true, bottomPanelTab: 'output' });
      }
    }
  }, [pendingInputPrompt, isMobile, updateWorkspace]);

  const [cursorPos, setCursorPos] = useState<{ line: number; col: number }>({ line: 1, col: 1 });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const chordRef = useRef<{ chord: string; timestamp: number } | null>(null);
  const [isOpenFolderDialogOpen, setIsOpenFolderDialogOpen] = useState(false);
  const [isExplorerFullscreen, setIsExplorerFullscreen] = useState(false);
  const [fullscreenInitialFolderId, setFullscreenInitialFolderId] = useState<string | null>(HOME_FOLDER_ID);

  const handleOpenWindowsExplorer = useCallback((folderId: string | null = HOME_FOLDER_ID) => {
    setFullscreenInitialFolderId(folderId);
    setIsExplorerFullscreen(true);
  }, []);

  // Active drag override values (used during active dragging for 60fps lag-free responsiveness)
  const [dragBottomHeight, setDragBottomHeight] = useState<number | null>(null);
  const [dragSideWidth, setDragSideWidth] = useState<number | null>(null);
  const [dragSplitRatio, setDragSplitRatio] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  // Effective dimensions: drag override if active, else persisted workspace value
  const bottomHeight = dragBottomHeight ?? (workspace.bottomPanelHeight || 280);
  const sideWidth = dragSideWidth ?? (workspace.sidePanelWidth || 460);
  const splitRatio = dragSplitRatio ?? (workspace.splitRatio || 0.5);

  const monacoEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const workspaceContainerRef = useRef<HTMLDivElement>(null);
  const panelContainerRef = useRef<HTMLDivElement>(null);

  // Mobile symbol insertion helper
  const handleInsertSymbol = useCallback((symbol: string) => {
    const ed = monacoEditorRef.current;
    if (!ed) return;
    ed.focus();
    ed.trigger('keyboard', 'type', { text: symbol });
  }, []);

  const handleUndo = useCallback(() => {
    monacoEditorRef.current?.trigger('source', 'undo', null);
  }, []);

  const handleRedo = useCallback(() => {
    monacoEditorRef.current?.trigger('source', 'redo', null);
  }, []);

  // Execution trigger (scoped to active workspace root)
  const handleRun = useCallback(() => {
    if (activeFile) {
      runCode(workspaceFiles, activeFile, rootFolder?.path || '');
      if (isMobile) {
        if (['html', 'css', 'javascript'].includes(activeFile.language)) {
          updateWorkspace({ activePanel: 'preview' });
        } else {
          updateWorkspace({ activePanel: 'output' });
        }
      } else {
        updateWorkspace({
          isBottomPanelOpen: true,
          bottomPanelTab: ['html', 'css', 'javascript'].includes(activeFile.language) ? 'preview' : 'output',
        });
      }
    }
  }, [activeFile, workspaceFiles, rootFolder, runCode, isMobile, updateWorkspace]);

  // Global VS Code keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check chord state: Ctrl+K followed by Ctrl+S (Open Keyboard Shortcuts)
      if (chordRef.current && Date.now() - chordRef.current.timestamp < 1500) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
          e.preventDefault();
          setIsShortcutsOpen(true);
          chordRef.current = null;
          return;
        }
      }

      // Start chord: Ctrl+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        chordRef.current = { chord: 'k', timestamp: Date.now() };
        return;
      }

      // Ctrl+S / Cmd+S: Save current file
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (activeFile) {
          saveNow(activeFile.id, activeFile.content);
        }
        return;
      }

      // Ctrl+Enter / Cmd+Enter: Run code
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
        return;
      }

      // Ctrl+B / Cmd+B: Toggle Sidebar
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        updateWorkspace({ isSidebarOpen: !workspace.isSidebarOpen });
        return;
      }

      // Ctrl+` / Cmd+` or Ctrl+J / Cmd+J: Toggle Bottom Terminal / Output Panel
      if ((e.ctrlKey || e.metaKey) && (e.key === '`' || e.key.toLowerCase() === 'j')) {
        e.preventDefault();
        updateWorkspace({ isBottomPanelOpen: !workspace.isBottomPanelOpen });
        return;
      }

      // Ctrl+P / Cmd+P: Quick Open / Explorer (intercept browser Print dialog)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p' && !e.shiftKey) {
        e.preventDefault();
        handleOpenWindowsExplorer();
        return;
      }

      // Ctrl+, / Cmd+,: Open Settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setIsSettingsOpen(true);
        return;
      }

      // Ctrl+Shift+P / Cmd+Shift+P or F1: VS Code Command Palette
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') || e.key === 'F1') {
        e.preventDefault();
        if (monacoEditorRef.current) {
          monacoEditorRef.current.focus();
          monacoEditorRef.current.trigger('keyboard', 'editor.action.quickCommand', null);
        }
        return;
      }

      // Ctrl+F / Cmd+F: Focus editor & Find
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f' && !e.shiftKey) {
        if (monacoEditorRef.current) {
          e.preventDefault();
          monacoEditorRef.current.focus();
          monacoEditorRef.current.trigger('keyboard', 'actions.find', null);
          return;
        }
      }

      // Ctrl+H / Cmd+H: Focus editor & Replace
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
        if (monacoEditorRef.current) {
          e.preventDefault();
          monacoEditorRef.current.focus();
          monacoEditorRef.current.trigger('keyboard', 'editor.action.startFindReplaceAction', null);
          return;
        }
      }

      // Alt+W or Ctrl+Alt+W: Close active file tab
      if ((e.altKey && e.key.toLowerCase() === 'w') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'w')) {
        e.preventDefault();
        if (workspace.activeFileId) {
          closeFileTab(workspace.activeFileId);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    workspace.isSidebarOpen,
    workspace.isBottomPanelOpen,
    workspace.activeFileId,
    activeFile,
    saveNow,
    handleRun,
    handleOpenWindowsExplorer,
    closeFileTab,
    updateWorkspace,
  ]);

  // Resizing Handlers
  const handleResizeBottom = useCallback(
    (e: ResizeEvent) => {
      const containerH = workspaceContainerRef.current?.clientHeight || window.innerHeight;
      const minH = 120;
      const maxH = Math.max(160, containerH - 120);
      setDragBottomHeight((prev) => {
        const current = prev ?? (workspace.bottomPanelHeight || 280);
        return Math.max(minH, Math.min(maxH, current - e.deltaY));
      });
      monacoEditorRef.current?.layout();
      setIsMaximized(false);
    },
    [workspace.bottomPanelHeight]
  );

  const handleResizeSide = useCallback(
    (e: ResizeEvent) => {
      const containerW = workspaceContainerRef.current?.clientWidth || window.innerWidth;
      const minW = 260;
      const maxW = Math.max(300, containerW - 250);
      setDragSideWidth((prev) => {
        const current = prev ?? (workspace.sidePanelWidth || 460);
        return Math.max(minW, Math.min(maxW, current - e.deltaX));
      });
      monacoEditorRef.current?.layout();
      setIsMaximized(false);
    },
    [workspace.sidePanelWidth]
  );

  const handleResizeSplit = useCallback(
    (e: ResizeEvent) => {
      const isBottom = workspace.panelPosition === 'bottom';
      const containerSize = isBottom
        ? panelContainerRef.current?.clientWidth || 800
        : panelContainerRef.current?.clientHeight || 600;
      const delta = isBottom ? e.deltaX : e.deltaY;
      const ratioDelta = delta / containerSize;
      setDragSplitRatio((prev) => {
        const current = prev ?? (workspace.splitRatio || 0.5);
        return Math.max(0.15, Math.min(0.85, current + ratioDelta));
      });
    },
    [workspace.panelPosition, workspace.splitRatio]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    updateWorkspace({
      bottomPanelHeight: bottomHeight,
      sidePanelWidth: sideWidth,
      splitRatio: splitRatio,
    });
    setDragBottomHeight(null);
    setDragSideWidth(null);
    setDragSplitRatio(null);
    setTimeout(() => {
      monacoEditorRef.current?.layout();
    }, 50);
  }, [bottomHeight, sideWidth, splitRatio, updateWorkspace]);

  const handleTogglePosition = useCallback(() => {
    const newPos = workspace.panelPosition === 'bottom' ? 'right' : 'bottom';
    updateWorkspace({ panelPosition: newPos });
    setTimeout(() => {
      monacoEditorRef.current?.layout();
    }, 50);
  }, [workspace.panelPosition, updateWorkspace]);

  const handleToggleLayoutMode = useCallback(() => {
    const newMode = workspace.panelLayoutMode === 'tabs' ? 'split' : 'tabs';
    updateWorkspace({ panelLayoutMode: newMode });
    setTimeout(() => {
      monacoEditorRef.current?.layout();
    }, 50);
  }, [workspace.panelLayoutMode, updateWorkspace]);

  const handleToggleMaximize = useCallback(() => {
    setIsMaximized((prev) => !prev);
    setTimeout(() => {
      monacoEditorRef.current?.layout();
    }, 50);
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#1e1e1e] text-[#cccccc]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#007acc]" />
          <span className="text-xs font-mono tracking-wider">INITIALIZING CLOUDCODE STUDIO...</span>
        </div>
      </div>
    );
  }

  const containerThemeClass = settings.theme === 'vscode-light-plus' ? 'light-theme' : 'dark';
  const isDockRight = workspace.panelPosition === 'right' && workspace.isBottomPanelOpen;

  return (
    <div
      className={`flex flex-col h-full w-full overflow-hidden bg-[#1e1e1e] text-[#cccccc] ${containerThemeClass}`}
    >
      {/* Mobile Top Header (Mobile only) */}
      {isMobile && (
        <header className="bg-[#252526] border-b border-[#3c3c3c] flex items-center justify-between px-3 pt-[env(safe-area-inset-top,0px)] h-[calc(2.75rem+env(safe-area-inset-top,0px))] select-none shrink-0 z-20">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <Folder className="w-4 h-4 text-[#007acc] shrink-0" />
            <span className="font-bold text-xs text-white truncate max-w-[160px]">
              {activeWorkspaceName || (activeWorkspaceRootId ? 'Workspace' : 'Home')}
            </span>
            {activeWorkspaceRootId && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#007acc] text-white font-mono uppercase font-bold tracking-wider shrink-0">
                ROOT
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenWindowsExplorer()}
              className="p-1 rounded text-[#858585] active:text-[#38bdf8] hover:text-[#38bdf8] transition-colors"
              title="Full Screen Windows File Explorer"
            >
              <FolderOpen className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRun}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#0e639c] active:bg-[#1177bb] text-white text-xs font-semibold shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run</span>
            </button>
            {isInstallable && (
              <button
                type="button"
                onClick={promptInstall}
                className="p-1 rounded text-[#38bdf8] hover:text-white hover:bg-[#38bdf8]/20 transition-colors animate-pulse"
                title="Install Code App (PWA)"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="p-1 rounded text-[#858585] active:text-white"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>
      )}

      {/* Main Workspace Body */}
      <div className="flex flex-1 w-full min-h-0 overflow-hidden relative">
        {/* Desktop / Tablet: Activity Bar */}
        {!isMobile && (
          <ActivityBar
            isSidebarOpen={workspace.isSidebarOpen}
            onToggleSidebar={() => updateWorkspace({ isSidebarOpen: !workspace.isSidebarOpen })}
            onOpenWindowsExplorer={() => handleOpenWindowsExplorer()}
            activeBottomTab={workspace.bottomPanelTab}
            onSelectBottomTab={(tab) => updateWorkspace({ isBottomPanelOpen: true, bottomPanelTab: tab })}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenShortcuts={() => setIsShortcutsOpen(true)}
            onRunCode={handleRun}
          />
        )}

        {/* Desktop / Tablet: Sidebar Explorer */}
        {!isMobile && workspace.isSidebarOpen && (
          <div className="w-64 h-full shrink-0 z-10 transition-all duration-150">
            <FileExplorer
              projects={projects}
              activeProject={activeProject}
              files={files}
              folders={folders}
              activeFileId={workspace.activeFileId}
              expandedFolderIds={workspace.expandedFolderIds || []}
              activeWorkspaceRootId={activeWorkspaceRootId}
              activeWorkspaceName={activeWorkspaceName}
              onOpenFolderAsWorkspace={openFolderAsWorkspace}
              onOpenFolderDialog={() => setIsOpenFolderDialogOpen(true)}
              onToggleFullscreen={() => handleOpenWindowsExplorer()}
              onSelectFile={openFileInTab}
              onSelectProject={switchProject}
              onCreateProject={createProject}
              onDeleteProject={deleteProject}
              onCreateFile={(name, folderId) => createFile(name, folderId)}
              onRenameFile={renameFile}
              onDeleteFile={deleteFile}
              onDuplicateFile={duplicateFile}
              onCreateFolder={createFolder}
              onRenameFolder={renameFolder}
              onDeleteFolder={deleteFolder}
              onMoveItem={moveItem}
              onToggleFolderExpanded={toggleFolderExpanded}
              onCollapseAllFolders={collapseAllFolders}
              onExpandAllFolders={expandAllFolders}
            />
          </div>
        )}

        {/* Central Workspace Area: Mobile Panel OR Desktop Flexible Layout */}
        <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden">
          {/* MOBILE CONTENT VIEWPORT */}
          {isMobile ? (
            <div className="flex-1 w-full min-h-0 flex flex-col overflow-hidden">
              {workspace.activePanel === 'code' && (
                <>
                  <EditorTabs
                    openFiles={openFiles}
                    activeFileId={workspace.activeFileId}
                    onSelectTab={openFileInTab}
                    onCloseTab={closeFileTab}
                    onNewFile={() => createFile('newfile.js')}
                  />
                  <Breadcrumbs
                    project={activeProject}
                    file={activeFile}
                    isSaving={isSaving}
                    activeWorkspaceRootId={activeWorkspaceRootId}
                    activeWorkspaceName={activeWorkspaceName}
                    rootFolderPath={rootFolder?.path || ''}
                    onRun={handleRun}
                    onCancel={cancelExecution}
                    isRunning={executionStatus === 'running'}
                    onOpenExplorer={handleOpenWindowsExplorer}
                  />
                  <div className="flex-1 w-full min-h-0 relative overflow-hidden">
                    <MonacoEditorPane
                      file={activeFile}
                      settings={settings}
                      onChangeContent={(content) => {
                        if (activeFile) updateFileContent(activeFile.id, content);
                      }}
                      onSave={() => {
                        if (activeFile) saveNow(activeFile.id, activeFile.content);
                      }}
                      onRun={handleRun}
                      onCursorChange={(line, col) => setCursorPos({ line, col })}
                      onMountEditor={(ed) => {
                        monacoEditorRef.current = ed;
                      }}
                      onToggleSidebar={() => updateWorkspace({ isSidebarOpen: !workspace.isSidebarOpen })}
                      onToggleBottomPanel={() => updateWorkspace({ isBottomPanelOpen: !workspace.isBottomPanelOpen })}
                      onQuickOpen={() => handleOpenWindowsExplorer()}
                      onOpenSettings={() => setIsSettingsOpen(true)}
                      onCloseActiveTab={() => {
                        if (workspace.activeFileId) closeFileTab(workspace.activeFileId);
                      }}
                      onOpenShortcuts={() => setIsShortcutsOpen(true)}
                    />
                  </div>
                  {/* Mobile Symbol Accessory Bar */}
                  <MobileSymbolBar
                    onInsertSymbol={handleInsertSymbol}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                  />
                </>
              )}

              {workspace.activePanel === 'files' && (
                <div className="flex-1 w-full min-h-0 flex flex-col overflow-hidden">
                  <FileExplorer
                    projects={projects}
                    activeProject={activeProject}
                    files={files}
                    folders={folders}
                    activeFileId={workspace.activeFileId}
                    expandedFolderIds={workspace.expandedFolderIds || []}
                    activeWorkspaceRootId={activeWorkspaceRootId}
                    activeWorkspaceName={activeWorkspaceName}
                    onOpenFolderAsWorkspace={openFolderAsWorkspace}
                    onOpenFolderDialog={() => setIsOpenFolderDialogOpen(true)}
                    onToggleFullscreen={() => handleOpenWindowsExplorer()}
                    onSelectFile={(fId) => {
                      openFileInTab(fId);
                      updateWorkspace({ activePanel: 'code' });
                    }}
                    onSelectProject={switchProject}
                    onCreateProject={createProject}
                    onDeleteProject={deleteProject}
                    onCreateFile={(name, folderId) => createFile(name, folderId)}
                    onRenameFile={renameFile}
                    onDeleteFile={deleteFile}
                    onDuplicateFile={duplicateFile}
                    onCreateFolder={createFolder}
                    onRenameFolder={renameFolder}
                    onDeleteFolder={deleteFolder}
                    onMoveItem={moveItem}
                    onToggleFolderExpanded={toggleFolderExpanded}
                    onCollapseAllFolders={collapseAllFolders}
                    onExpandAllFolders={expandAllFolders}
                  />
                </div>
              )}

              {workspace.activePanel === 'preview' && (
                <div className="flex-1 w-full min-h-0 overflow-hidden">
                  <WebPreviewPane previewDoc={previewDoc} onRefresh={handleRun} />
                </div>
              )}

              {workspace.activePanel === 'output' && (
                <div className="flex-1 w-full min-h-0 overflow-hidden">
                  <OutputPanel
                    messages={consoleMessages}
                    onClear={clearConsole}
                    executionTime={executionTime}
                    pendingInputPrompt={pendingInputPrompt}
                    onSubmitInput={sendInput}
                  />
                </div>
              )}
            </div>
          ) : (
            /* DESKTOP / TABLET WORKBENCH WITH DRAGGABLE RESIZABLE PANELS */
            <div
              ref={workspaceContainerRef}
              className={`flex flex-1 h-full min-w-0 min-h-0 overflow-hidden ${
                isDockRight ? 'flex-row' : 'flex-col'
              }`}
            >
              {/* Editor Workspace Column */}
              <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
                {/* Editor Tabs */}
                <EditorTabs
                  openFiles={openFiles}
                  activeFileId={workspace.activeFileId}
                  onSelectTab={openFileInTab}
                  onCloseTab={closeFileTab}
                  onNewFile={() => createFile('newfile.js')}
                />

                {/* Breadcrumbs */}
                <Breadcrumbs
                  project={activeProject}
                  file={activeFile}
                  isSaving={isSaving}
                  activeWorkspaceRootId={activeWorkspaceRootId}
                  activeWorkspaceName={activeWorkspaceName}
                  rootFolderPath={rootFolder?.path || ''}
                  onRun={handleRun}
                  onCancel={cancelExecution}
                  isRunning={executionStatus === 'running'}
                  onOpenExplorer={handleOpenWindowsExplorer}
                />

                {/* Editor View */}
                <div className="flex-1 w-full min-h-0 relative overflow-hidden">
                  <MonacoEditorPane
                    file={activeFile}
                    settings={settings}
                    onChangeContent={(content) => {
                      if (activeFile) updateFileContent(activeFile.id, content);
                    }}
                    onSave={() => {
                      if (activeFile) saveNow(activeFile.id, activeFile.content);
                    }}
                    onRun={handleRun}
                    onCursorChange={(line, col) => setCursorPos({ line, col })}
                    onMountEditor={(ed) => {
                      monacoEditorRef.current = ed;
                    }}
                    onToggleSidebar={() => updateWorkspace({ isSidebarOpen: !workspace.isSidebarOpen })}
                    onToggleBottomPanel={() => updateWorkspace({ isBottomPanelOpen: !workspace.isBottomPanelOpen })}
                    onQuickOpen={() => handleOpenWindowsExplorer()}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    onCloseActiveTab={() => {
                      if (workspace.activeFileId) closeFileTab(workspace.activeFileId);
                    }}
                    onOpenShortcuts={() => setIsShortcutsOpen(true)}
                  />
                </div>
              </div>

              {/* Draggable Resizer + Dockable Panel */}
              {workspace.isBottomPanelOpen && (
                <>
                  <PanelResizer
                    orientation={workspace.panelPosition === 'bottom' ? 'horizontal' : 'vertical'}
                    onResize={workspace.panelPosition === 'bottom' ? handleResizeBottom : handleResizeSide}
                    onDragStart={() => setIsDragging(true)}
                    onDragEnd={handleDragEnd}
                    ariaLabel={
                      workspace.panelPosition === 'bottom' ? 'Resize bottom panel' : 'Resize side panel'
                    }
                  />

                  <div
                    ref={panelContainerRef}
                    style={{
                      height:
                        workspace.panelPosition === 'bottom'
                          ? isMaximized
                            ? 'calc(100% - 36px)'
                            : `${bottomHeight}px`
                          : '100%',
                      width:
                        workspace.panelPosition === 'right'
                          ? isMaximized
                            ? 'calc(100% - 48px)'
                            : `${sideWidth}px`
                          : '100%',
                    }}
                    className={`shrink-0 flex flex-col bg-[#1e1e1e] relative overflow-hidden ${
                      workspace.panelPosition === 'bottom' ? 'w-full' : 'h-full border-l border-[#3c3c3c]'
                    }`}
                  >
                    {/* Panel Header Bar */}
                    <div className="h-8 bg-[#252526] border-b border-[#3c3c3c] flex items-center justify-between px-2 select-none shrink-0">
                      {/* Left Header: Tabs or Combined Split Title */}
                      <div className="flex items-center gap-1 h-full">
                        {workspace.panelLayoutMode === 'tabs' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => updateWorkspace({ bottomPanelTab: 'preview' })}
                              className={`flex items-center gap-1.5 px-3 h-full text-xs font-medium cursor-pointer border-t-2 transition-colors ${
                                workspace.bottomPanelTab === 'preview'
                                  ? 'text-white border-[#007acc] bg-[#1e1e1e]'
                                  : 'text-[#858585] border-transparent hover:text-white'
                              }`}
                            >
                              <Globe className="w-3.5 h-3.5 text-[#007acc]" />
                              <span>Web Preview</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => updateWorkspace({ bottomPanelTab: 'output' })}
                              className={`flex items-center gap-1.5 px-3 h-full text-xs font-medium cursor-pointer border-t-2 transition-colors ${
                                workspace.bottomPanelTab === 'output'
                                  ? 'text-white border-[#007acc] bg-[#1e1e1e]'
                                  : 'text-[#858585] border-transparent hover:text-white'
                              }`}
                            >
                              <Terminal className="w-3.5 h-3.5 text-[#007acc]" />
                              <span>Console Output</span>
                              {consoleMessages.length > 0 && (
                                <span className="px-1 py-0.2 bg-[#333333] rounded text-[10px]">
                                  {consoleMessages.length}
                                </span>
                              )}
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 px-2 text-xs font-medium text-white">
                            <div className="flex items-center gap-1 text-[#007acc]">
                              <Globe className="w-3.5 h-3.5" />
                              <span className="text-[#858585]">/</span>
                              <Terminal className="w-3.5 h-3.5" />
                            </div>
                            <span>Split View (Preview & Output)</span>
                          </div>
                        )}
                      </div>

                      {/* Right Header: Layout Controls & Actions */}
                      <div className="flex items-center gap-1">
                        {/* Split vs Tabs Toggle */}
                        <button
                          type="button"
                          onClick={handleToggleLayoutMode}
                          className={`p-1 rounded text-xs transition-colors ${
                            workspace.panelLayoutMode === 'split'
                              ? 'bg-[#04395e] text-white'
                              : 'text-[#858585] hover:text-white hover:bg-[#3c3c3c]'
                          }`}
                          title={
                            workspace.panelLayoutMode === 'split'
                              ? 'Switch to Tabbed View'
                              : 'Switch to Split View (Show Preview & Console Together)'
                          }
                        >
                          {workspace.panelPosition === 'bottom' ? (
                            <Columns2 className="w-3.5 h-3.5" />
                          ) : (
                            <Rows2 className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Move Dock Position (Bottom vs Right) */}
                        <button
                          type="button"
                          onClick={handleTogglePosition}
                          className="p-1 rounded text-[#858585] hover:text-white hover:bg-[#3c3c3c] transition-colors"
                          title={
                            workspace.panelPosition === 'bottom' ? 'Dock Panel to Right' : 'Dock Panel to Bottom'
                          }
                        >
                          {workspace.panelPosition === 'bottom' ? (
                            <PanelRight className="w-3.5 h-3.5" />
                          ) : (
                            <PanelBottom className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Maximize / Restore */}
                        <button
                          type="button"
                          onClick={handleToggleMaximize}
                          className="p-1 rounded text-[#858585] hover:text-white hover:bg-[#3c3c3c] transition-colors"
                          title={isMaximized ? 'Restore Panel Size' : 'Maximize Panel'}
                        >
                          {isMaximized ? (
                            <Minimize2 className="w-3.5 h-3.5" />
                          ) : (
                            <Maximize2 className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Close Panel */}
                        <button
                          type="button"
                          onClick={() => updateWorkspace({ isBottomPanelOpen: false })}
                          className="p-1 rounded text-[#858585] hover:text-white hover:bg-[#3c3c3c] transition-colors"
                          title="Close Panel (Ctrl+`)"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Panel Content Area */}
                    <div className="flex-1 w-full min-h-0 min-w-0 overflow-hidden relative">
                      {workspace.panelLayoutMode === 'tabs' ? (
                        /* TABBED VIEW */
                        workspace.bottomPanelTab === 'preview' ? (
                          <WebPreviewPane previewDoc={previewDoc} onRefresh={handleRun} isDragging={isDragging} />
                        ) : (
                          <OutputPanel
                            messages={consoleMessages}
                            onClear={clearConsole}
                            executionTime={executionTime}
                            pendingInputPrompt={pendingInputPrompt}
                            onSubmitInput={sendInput}
                          />
                        )
                      ) : (
                        /* SPLIT VIEW (Shows BOTH Preview and Console with Draggable Divider) */
                        <div
                          className={`flex flex-1 w-full h-full min-w-0 min-h-0 overflow-hidden ${
                            workspace.panelPosition === 'bottom' ? 'flex-row' : 'flex-col'
                          }`}
                        >
                          {/* Preview Section */}
                          <div
                            style={{
                              width: workspace.panelPosition === 'bottom' ? `${splitRatio * 100}%` : '100%',
                              height: workspace.panelPosition === 'right' ? `${splitRatio * 100}%` : '100%',
                            }}
                            className="min-w-0 min-h-0 overflow-hidden"
                          >
                            <WebPreviewPane previewDoc={previewDoc} onRefresh={handleRun} isDragging={isDragging} />
                          </div>

                          {/* Independent Split Resizer Divider */}
                          <PanelResizer
                            orientation={workspace.panelPosition === 'bottom' ? 'vertical' : 'horizontal'}
                            onResize={handleResizeSplit}
                            onDragStart={() => setIsDragging(true)}
                            onDragEnd={handleDragEnd}
                            ariaLabel="Resize split panels"
                          />

                          {/* Console Output Section */}
                          <div
                            style={{
                              width:
                                workspace.panelPosition === 'bottom' ? `${(1 - splitRatio) * 100}%` : '100%',
                              height:
                                workspace.panelPosition === 'right' ? `${(1 - splitRatio) * 100}%` : '100%',
                            }}
                            className="min-w-0 min-h-0 overflow-hidden"
                          >
                            <OutputPanel
                              messages={consoleMessages}
                              onClear={clearConsole}
                              executionTime={executionTime}
                              pendingInputPrompt={pendingInputPrompt}
                              onSubmitInput={sendInput}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation (Mobile Only) */}
      {isMobile && (
        <MobileNav
          activeTab={workspace.activePanel}
          onSelectTab={(tab: MobileTab) => updateWorkspace({ activePanel: tab })}
          outputCount={consoleMessages.length}
        />
      )}

      {/* Desktop / Tablet Status Bar */}
      {!isMobile && (
        <StatusBar
          projectName={activeWorkspaceName || 'Workspace'}
          language={activeFile?.language}
          cursorLine={cursorPos.line}
          cursorCol={cursorPos.col}
          executionStatus={executionStatus}
          tabSize={settings.tabSize}
          theme={settings.theme}
          onThemeClick={() =>
            updateSettings({
              theme: settings.theme === 'vscode-dark-plus' ? 'vscode-light-plus' : 'vscode-dark-plus',
            })
          }
        />
      )}

      {/* Settings Modal */}
      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
      />

      {/* Keyboard Shortcuts Reference Modal */}
      <KeyboardShortcutsDialog
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Full-Screen Windows File Explorer View */}
      {isExplorerFullscreen && (
        <WindowsExplorerView
          project={activeProject}
          projects={projects}
          files={files}
          folders={folders}
          activeFileId={workspace.activeFileId}
          expandedFolderIds={workspace.expandedFolderIds || []}
          activeWorkspaceRootId={activeWorkspaceRootId}
          activeWorkspaceName={activeWorkspaceName}
          onOpenFolderAsWorkspace={openFolderAsWorkspace}
          initialFolderId={fullscreenInitialFolderId}
          onClose={() => setIsExplorerFullscreen(false)}
          onSelectFile={openFileInTab}
          onOpenFileInEditor={(fileId) => {
            openFileInTab(fileId);
            setIsExplorerFullscreen(false);
            if (isMobile) {
              updateWorkspace({ activePanel: 'code' });
            }
          }}
          onCreateFile={(name, folderId) => createFile(name, folderId)}
          onRenameFile={renameFile}
          onDeleteFile={deleteFile}
          onDuplicateFile={duplicateFile}
          onCreateFolder={createFolder}
          onRenameFolder={renameFolder}
          onDeleteFolder={deleteFolder}
          onMoveItem={moveItem}
          onToggleFolderExpanded={toggleFolderExpanded}
        />
      )}

      {/* Open Folder as Workspace Root Dialog */}
      <OpenFolderDialog
        isOpen={isOpenFolderDialogOpen}
        onClose={() => setIsOpenFolderDialogOpen(false)}
        project={activeProject}
        folders={folders}
        files={files}
        activeWorkspaceRootId={activeWorkspaceRootId}
        onSelectWorkspaceRoot={(folderId) => openFolderAsWorkspace(folderId)}
      />
    </div>
  );
}
