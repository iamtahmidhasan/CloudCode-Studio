'use client';

import React from 'react';
import type { FileItem, Project } from '@/types';
import { ChevronRight, Play, Check, RefreshCw, StopCircle, FolderOpen } from 'lucide-react';
import { getFileIcon } from '@/lib/explorer/tree-utils';

interface BreadcrumbsProps {
  project: Project | undefined;
  file: FileItem | undefined;
  isSaving: boolean;
  activeWorkspaceRootId?: string | null;
  activeWorkspaceName?: string;
  rootFolderPath?: string;
  onRun?: () => void;
  onCancel?: () => void;
  isRunning?: boolean;
  onOpenExplorer?: (folderId?: string | null) => void;
}

export function Breadcrumbs({
  file,
  isSaving,
  activeWorkspaceRootId,
  activeWorkspaceName,
  rootFolderPath,
  onRun,
  onCancel,
  isRunning,
  onOpenExplorer,
}: BreadcrumbsProps) {
  // Compute path segments relative to workspace root boundary if active
  const pathSegments = React.useMemo(() => {
    if (!file) return [];
    let relPath = file.path.startsWith('/') ? file.path.substring(1) : file.path;

    if (activeWorkspaceRootId && rootFolderPath) {
      const cleanRoot = rootFolderPath.startsWith('/') ? rootFolderPath.substring(1) : rootFolderPath;
      if (relPath.startsWith(cleanRoot + '/')) {
        relPath = relPath.substring(cleanRoot.length + 1);
      } else if (relPath === cleanRoot) {
        relPath = '';
      }
    }

    return relPath ? relPath.split('/').filter(Boolean) : [file.name];
  }, [file, activeWorkspaceRootId, rootFolderPath]);

  const rootDisplayName = activeWorkspaceName || 'Workspace';

  return (
    <div className="flex items-center justify-between px-3 h-7 bg-[#1e1e1e] border-b border-[#2d2d2d] text-xs text-[#858585] select-none shrink-0">
      <div className="flex items-center gap-1.5 overflow-hidden">
        <button
          type="button"
          onClick={() => onOpenExplorer?.(activeWorkspaceRootId || null)}
          className={`font-semibold truncate max-w-[150px] transition-colors ${
            onOpenExplorer ? 'hover:text-[#38bdf8] cursor-pointer text-[#cccccc]' : 'text-[#cccccc]'
          }`}
          title={onOpenExplorer ? 'Open Workspace Root in Explorer' : undefined}
        >
          {rootDisplayName}
        </button>
        {pathSegments.map((segment, idx) => {
          const isLast = idx === pathSegments.length - 1;
          return (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-[#555555] shrink-0" />
              <div className="flex items-center gap-1 text-[#cccccc] font-medium truncate">
                {isLast && file && getFileIcon(file.name, file.language)}
                <span className="truncate">{segment}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        {onOpenExplorer && (
          <button
            type="button"
            onClick={() => onOpenExplorer(file?.folderId || null)}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[#2d2d2d] text-[#858585] hover:text-[#38bdf8] transition-colors"
            title="Open Folder in Full-Screen Windows Explorer"
          >
            <FolderOpen className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Autosave status indicator */}
        <div className="flex items-center gap-1 text-[11px] mr-1">
          {isSaving ? (
            <span className="flex items-center gap-1 text-amber-400">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Saving...</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-500">
              <Check className="w-3 h-3" />
              <span>Saved</span>
            </span>
          )}
        </div>

        {/* Action Run / Stop button */}
        {isRunning ? (
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white font-medium text-xs shadow-sm transition-colors"
          >
            <StopCircle className="w-3.5 h-3.5" />
            <span>Stop</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onRun}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#0e639c] hover:bg-[#1177bb] text-white font-medium text-xs shadow-sm transition-colors cursor-pointer"
            title="Run Code (Ctrl+Enter)"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run</span>
          </button>
        )}
      </div>
    </div>
  );
}
