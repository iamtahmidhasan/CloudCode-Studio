'use client';

import React, { useState, useMemo } from 'react';
import type { FolderItem, FileItem, Project } from '@/types';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Search,
  X,
  Check,
  Layers,
  FolderTree,
} from 'lucide-react';
import { getFolderDescendantCounts } from '@/lib/explorer/tree-utils';

interface OpenFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | undefined;
  folders: FolderItem[];
  files: FileItem[];
  activeWorkspaceRootId: string | null;
  onSelectWorkspaceRoot: (folderId: string | null) => void;
}

export function OpenFolderDialog({
  isOpen,
  onClose,
  project,
  folders,
  files,
  activeWorkspaceRootId,
  onSelectWorkspaceRoot,
}: OpenFolderDialogProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(activeWorkspaceRootId);
  const [expandedFolderIds, setExpandedFolderIds] = useState<string[]>(() => folders.map((f) => f.id));
  const [searchQuery, setSearchQuery] = useState('');

  // Expand / collapse folder toggle
  const toggleExpanded = (folderId: string) => {
    setExpandedFolderIds((prev) =>
      prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId]
    );
  };

  // Filtered folders if search is active
  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) return folders;
    const q = searchQuery.toLowerCase();
    return folders.filter((f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q));
  }, [folders, searchQuery]);

  // Selected folder stats
  const selectedFolder = folders.find((f) => f.id === selectedFolderId);
  const selectedStats = selectedFolder
    ? getFolderDescendantCounts(selectedFolder.id, folders, files)
    : null;

  if (!isOpen) return null;

  // Build recursive folder tree representation
  interface FolderTreeNode {
    folder: FolderItem;
    children: FolderTreeNode[];
  }

  function buildFolderTree(parentId: string | null): FolderTreeNode[] {
    return filteredFolders
      .filter((f) => (f.parentId || null) === parentId)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
      .map((f) => ({
        folder: f,
        children: buildFolderTree(f.id),
      }));
  }

  const rootNodes = buildFolderTree(null);

  const handleConfirm = () => {
    onSelectWorkspaceRoot(selectedFolderId);
    onClose();
  };

  const handleResetToProject = () => {
    onSelectWorkspaceRoot(null);
    onClose();
  };

  function renderFolderNode(node: FolderTreeNode, depth: number = 0) {
    const isExpanded = expandedFolderIds.includes(node.folder.id);
    const isSelected = selectedFolderId === node.folder.id;
    const isCurrentRoot = activeWorkspaceRootId === node.folder.id;
    const stats = getFolderDescendantCounts(node.folder.id, folders, files);

    return (
      <div key={node.folder.id} className="flex flex-col select-none">
        <div
          onClick={() => setSelectedFolderId(node.folder.id)}
          onDoubleClick={() => toggleExpanded(node.folder.id)}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          className={`flex items-center justify-between py-1.5 pr-2.5 rounded cursor-pointer transition-colors text-xs ${
            isSelected
              ? 'bg-[#007acc] text-white font-medium'
              : 'hover:bg-[#2a2d2e] text-[#cccccc] hover:text-white'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate flex-1 mr-2">
            {node.children.length > 0 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(node.folder.id);
                }}
                className={`p-0.5 rounded hover:bg-white/10 ${isSelected ? 'text-white' : 'text-[#858585]'}`}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <div className="w-4 shrink-0" />
            )}

            {isExpanded ? (
              <FolderOpen className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-[#dcb67a]'}`} />
            ) : (
              <Folder className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-[#dcb67a]'}`} />
            )}

            <span className="truncate">{node.folder.name}</span>

            {isCurrentRoot && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-sans uppercase font-bold tracking-wider shrink-0 ${
                isSelected ? 'bg-white/20 text-white' : 'bg-[#007acc]/30 text-[#38bdf8]'
              }`}>
                Current Root
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[11px] font-mono ${isSelected ? 'text-white/80' : 'text-[#777777]'}`}>
              {stats.fileCount} {stats.fileCount === 1 ? 'file' : 'files'}
            </span>
          </div>
        </div>

        {isExpanded && node.children.length > 0 && (
          <div className="flex flex-col">
            {node.children.map((child) => renderFolderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-[#cccccc] font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-[#252526] border-b border-[#3c3c3c] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-[#007acc]" />
            <h2 className="text-sm font-semibold text-white">Open Folder as Workspace Root</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#858585] hover:text-white hover:bg-[#333333] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 flex flex-col gap-3 flex-1 overflow-hidden">
          <p className="text-xs text-[#999999] leading-relaxed">
            Select a folder from project <strong className="text-white">&quot;{project?.name}&quot;</strong> to set as the active workspace root. 
            Only this folder and its descendants will be visible in the File Explorer and editor.
          </p>

          {/* Search Input */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-[#6e6e6e]" />
            <input
              type="text"
              placeholder="Search folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#252526] border border-[#3c3c3c] focus:border-[#007acc] rounded text-white text-xs outline-none transition-colors"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-[#858585] hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Folder Tree Scroll Area */}
          <div className="flex-1 min-h-[220px] max-h-[300px] overflow-y-auto bg-[#181818] border border-[#2d2d2d] rounded p-2 flex flex-col gap-0.5">
            {folders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-[#666666] py-8">
                <Folder className="w-8 h-8 mb-2 opacity-30" />
                <span className="text-xs">No folders exist in this project</span>
                <span className="text-[11px] text-[#555555] mt-1">Create folders in the File Explorer first</span>
              </div>
            ) : rootNodes.length === 0 ? (
              <div className="flex items-center justify-center h-full text-[#666666] text-xs py-8">
                No matching folders found
              </div>
            ) : (
              rootNodes.map((node) => renderFolderNode(node, 0))
            )}
          </div>

          {/* Selected Folder Summary Card */}
          {selectedFolder && selectedStats && (
            <div className="p-2.5 rounded bg-[#252526] border border-[#333333] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <FolderOpen className="w-4 h-4 text-[#dcb67a] shrink-0" />
                <div className="flex flex-col truncate">
                  <span className="font-semibold text-white truncate">{selectedFolder.name}</span>
                  <span className="text-[11px] font-mono text-[#858585] truncate">{selectedFolder.path}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-[11px] text-[#858585]">
                <span>{selectedStats.folderCount} subfolders</span>
                <span>•</span>
                <span>{selectedStats.fileCount} files</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-[#252526] border-t border-[#3c3c3c] flex items-center justify-between gap-2">
          {activeWorkspaceRootId ? (
            <button
              type="button"
              onClick={handleResetToProject}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#333333] hover:bg-[#3c3c3c] text-white text-xs font-medium transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-[#007acc]" />
              <span>Open Entire Project</span>
            </button>
          ) : (
            <div className="text-[11px] text-[#777777]">Entire project currently open</div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded hover:bg-[#333333] text-[#cccccc] hover:text-white text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedFolderId}
              onClick={handleConfirm}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#007acc] hover:bg-[#1177bb] disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Select as Workspace Root</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
