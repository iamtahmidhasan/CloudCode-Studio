'use client';

import React from 'react';
import type { FileItem, Project } from '@/types';
import { ChevronRight, Play, Check, RefreshCw, StopCircle } from 'lucide-react';
import { getFileIcon } from './editor-tabs';

interface BreadcrumbsProps {
  project: Project | undefined;
  file: FileItem | undefined;
  isSaving: boolean;
  onRun?: () => void;
  onCancel?: () => void;
  isRunning?: boolean;
}

export function Breadcrumbs({
  project,
  file,
  isSaving,
  onRun,
  onCancel,
  isRunning,
}: BreadcrumbsProps) {
  return (
    <div className="flex items-center justify-between px-3 h-7 bg-[#1e1e1e] border-b border-[#2d2d2d] text-xs text-[#858585] select-none shrink-0">
      <div className="flex items-center gap-1.5 overflow-hidden">
        <span className="font-semibold text-[#cccccc] truncate max-w-[150px]">
          {project?.name || 'Workspace'}
        </span>
        {file && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-[#555555] shrink-0" />
            <div className="flex items-center gap-1.5 text-[#cccccc] font-medium truncate">
              {getFileIcon(file.name, file.language)}
              <span className="truncate">{file.path.startsWith('/') ? file.path.substring(1) : file.path}</span>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Autosave status indicator */}
        <div className="flex items-center gap-1 text-[11px]">
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
