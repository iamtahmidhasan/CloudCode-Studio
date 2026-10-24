'use client';

import React from 'react';
import type { FileItem } from '@/types';
import { X, Plus, Play, Check, RefreshCw, StopCircle, FolderOpen } from 'lucide-react';
import { getFileIcon } from '@/lib/explorer/tree-utils';

export { getFileIcon };

interface EditorTabsProps {
  openFiles: FileItem[];
  activeFileId: string | null;
  onSelectTab: (fileId: string) => void;
  onCloseTab: (fileId: string) => void;
  onNewFile?: () => void;
  activeFile?: FileItem | undefined;
  isSaving?: boolean;
  onRun?: () => void;
  onCancel?: () => void;
  isRunning?: boolean;
  onOpenExplorer?: (folderId?: string | null) => void;
}

export function EditorTabs({
  openFiles,
  activeFileId,
  onSelectTab,
  onCloseTab,
  onNewFile,
  activeFile,
  isSaving,
  onRun,
  onCancel,
  isRunning,
  onOpenExplorer,
}: EditorTabsProps) {
  return (
    <div className="flex items-center justify-between bg-[#252526] border-b border-[#3c3c3c] h-9 select-none shrink-0 overflow-hidden">
      {/* Scrollable Tabs */}
      <div className="flex items-center overflow-x-auto no-scrollbar h-full min-w-0 flex-1">
        <div className="flex items-center h-full">
          {openFiles.map((file) => {
            const isActive = file.id === activeFileId;
            return (
              <div
                key={file.id}
                onClick={() => onSelectTab(file.id)}
                className={`group flex items-center gap-2 h-full px-3 text-xs cursor-pointer border-r border-[#2d2d2d] transition-colors relative min-w-[120px] max-w-[200px] shrink-0 ${
                  isActive
                    ? 'bg-[#1e1e1e] text-[#ffffff] font-medium border-t-2 border-t-[#007acc]'
                    : 'bg-[#2d2d2d] text-[#969696] hover:bg-[#2a2a2a] hover:text-[#cccccc] border-t-2 border-t-transparent'
                }`}
              >
                {getFileIcon(file.name, file.language)}
                <span className="truncate flex-1">{file.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(file.id);
                  }}
                  className={`p-0.5 rounded hover:bg-[#3c3c3c] text-[#858585] hover:text-white transition-opacity ${
                    isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  title="Close Tab"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {onNewFile && (
          <button
            type="button"
            onClick={onNewFile}
            className="flex items-center justify-center h-full px-2.5 text-[#858585] hover:text-white hover:bg-[#2d2d2d] transition-colors shrink-0"
            title="New File"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Right Action Buttons: File/Folder button, Save Status, Run/Stop button */}
      <div className="flex items-center gap-2 px-2.5 h-full shrink-0 bg-[#252526] border-l border-[#333333]">
        {onOpenExplorer && (
          <button
            type="button"
            onClick={() => onOpenExplorer(activeFile?.folderId || null)}
            className="flex items-center justify-center p-1.5 rounded hover:bg-[#333333] text-[#858585] hover:text-[#38bdf8] transition-colors"
            title="Open Folder in Full-Screen Windows Explorer"
          >
            <FolderOpen className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Autosave status indicator */}
        {typeof isSaving === 'boolean' && (
          <div className="flex items-center gap-1 text-[11px] px-1 select-none">
            {isSaving ? (
              <span className="flex items-center gap-1 text-amber-400">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span className="hidden sm:inline">Saving...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-500">
                <Check className="w-3 h-3" />
                <span className="hidden sm:inline">Saved</span>
              </span>
            )}
          </div>
        )}

        {/* Action Run / Stop button */}
        {isRunning ? (
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-medium text-xs shadow-sm transition-colors cursor-pointer"
            title="Stop Execution"
          >
            <StopCircle className="w-3.5 h-3.5" />
            <span>Stop</span>
          </button>
        ) : (
          onRun && (
            <button
              type="button"
              onClick={onRun}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#0e639c] hover:bg-[#1177bb] text-white font-medium text-xs shadow-sm transition-colors cursor-pointer"
              title="Run Code (Ctrl+Enter)"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run</span>
            </button>
          )
        )}
      </div>
    </div>
  );
}
