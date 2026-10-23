'use client';

import React from 'react';
import type { FileItem } from '@/types';
import { X, Plus, FileCode, FileText, Globe, Code2 } from 'lucide-react';

interface EditorTabsProps {
  openFiles: FileItem[];
  activeFileId: string | null;
  onSelectTab: (fileId: string) => void;
  onCloseTab: (fileId: string) => void;
  onNewFile?: () => void;
}

export function getFileIcon(filename: string, language?: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || language;
  switch (ext) {
    case 'html':
      return <Globe className="w-3.5 h-3.5 text-[#e34c26] shrink-0" />;
    case 'css':
      return <Code2 className="w-3.5 h-3.5 text-[#264de4] shrink-0" />;
    case 'js':
    case 'mjs':
      return <FileCode className="w-3.5 h-3.5 text-[#f7df1e] shrink-0" />;
    case 'ts':
    case 'tsx':
      return <FileCode className="w-3.5 h-3.5 text-[#3178c6] shrink-0" />;
    case 'py':
      return <Code2 className="w-3.5 h-3.5 text-[#3776ab] shrink-0" />;
    case 'cpp':
    case 'c':
    case 'h':
      return <Code2 className="w-3.5 h-3.5 text-[#659ad2] shrink-0" />;
    default:
      return <FileText className="w-3.5 h-3.5 text-[#858585] shrink-0" />;
  }
}

export function EditorTabs({
  openFiles,
  activeFileId,
  onSelectTab,
  onCloseTab,
  onNewFile,
}: EditorTabsProps) {
  return (
    <div className="flex items-center bg-[#252526] border-b border-[#3c3c3c] overflow-x-auto no-scrollbar h-9 select-none shrink-0">
      <div className="flex items-center h-full">
        {openFiles.map((file) => {
          const isActive = file.id === activeFileId;
          return (
            <div
              key={file.id}
              onClick={() => onSelectTab(file.id)}
              className={`group flex items-center gap-2 h-full px-3 text-xs cursor-pointer border-r border-[#2d2d2d] transition-colors relative min-w-[120px] max-w-[200px] ${
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
          className="flex items-center justify-center h-full px-2 text-[#858585] hover:text-white hover:bg-[#2d2d2d] transition-colors"
          title="New File"
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
