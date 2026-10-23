'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { Project, FileItem, FolderItem, ProjectTemplate } from '@/types';
import {
  Folder,
  FolderOpen,
  FilePlus,
  FolderPlus,
  Download,
  Upload,
  Trash2,
  Copy,
  Edit2,
  ChevronDown,
  ChevronRight,
  Layers,
  Check,
  X,
  FileText,
  MoreVertical,
  FolderInput,
  FolderMinus,
  RefreshCw,
  AlertTriangle,
  Search,
  Maximize2,
} from 'lucide-react';
import {
  buildFileTree,
  getFileIcon,
  isDescendantOf,
  getFolderDescendantCounts,
  getWorkspaceDescendantIds,
  type TreeNode,
  type TreeFileNode,
} from '@/lib/explorer/tree-utils';
import { ExportImportService } from '@/lib/persistence/export-import';

interface FileExplorerProps {
  projects?: Project[];
  activeProject?: Project;
  files: FileItem[];
  folders: FolderItem[];
  activeFileId: string | null;
  expandedFolderIds: string[];
  activeWorkspaceRootId?: string | null;
  activeWorkspaceName?: string;
  onOpenFolderAsWorkspace?: (folderId: string | null) => void;
  onOpenFolderDialog?: () => void;
  onToggleFullscreen?: () => void;
  onSelectFile: (fileId: string) => void;
  onSelectProject?: (projectId: string) => void;
  onCreateProject?: (name: string, template: ProjectTemplate) => void;
  onDeleteProject?: (projectId: string) => void;
  onCreateFile: (name: string, folderId?: string | null) => void;
  onRenameFile: (fileId: string, newName: string) => void;
  onDeleteFile: (fileId: string) => void;
  onDuplicateFile: (fileId: string) => void;
  onCreateFolder: (name: string, parentId?: string | null) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onMoveItem: (itemId: string, itemType: 'file' | 'folder', targetFolderId: string | null) => void;
  onToggleFolderExpanded: (folderId: string) => void;
  onCollapseAllFolders: () => void;
  onExpandAllFolders: () => void;
}

interface ContextMenuState {
  x: number;
  y: number;
  type: 'file' | 'folder' | 'root';
  targetId?: string;
  targetName?: string;
  targetPath?: string;
}

interface InlineCreationState {
  type: 'file' | 'folder';
  targetFolderId: string | null;
  depth: number;
}

interface TreeNodeItemProps {
  node: TreeNode;
  activeFileId: string | null;
  dragOverFolderId: string | null | 'ROOT';
  inlineCreation: InlineCreationState | null;
  inlineName: string;
  inlineError: string | null;
  renamingItem: { id: string; type: 'file' | 'folder'; currentName: string } | null;
  renameValue: string;
  renameError: string | null;
  filesCount: number;
  onSelectFile: (fileId: string) => void;
  onToggleFolderExpanded: (folderId: string) => void;
  onOpenFolderAsWorkspace?: (folderId: string) => void;
  onStartInlineCreation: (type: 'file' | 'folder', targetFolderId: string | null, depth: number) => void;
  onCancelInlineCreation: () => void;
  onChangeInlineName: (val: string) => void;
  onSubmitInlineCreation: (e?: React.FormEvent) => void;
  onStartRenaming: (id: string, type: 'file' | 'folder', currentName: string) => void;
  onChangeRenameValue: (val: string) => void;
  onSubmitRename: (e?: React.FormEvent) => void;
  onDeleteFile: (fileId: string) => void;
  onDuplicateFile: (fileId: string) => void;
  onDragStart: (e: React.DragEvent, id: string, type: 'file' | 'folder', name: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, targetFolderId: string | null) => void;
  onDrop: (e: React.DragEvent, targetFolderId: string | null) => void;
  onOpenContextMenu: (e: React.MouseEvent, type: 'file' | 'folder' | 'root', id?: string, name?: string, path?: string) => void;
}

function TreeNodeItem({
  node,
  activeFileId,
  dragOverFolderId,
  inlineCreation,
  inlineName,
  inlineError,
  renamingItem,
  renameValue,
  renameError,
  filesCount,
  onSelectFile,
  onToggleFolderExpanded,
  onOpenFolderAsWorkspace,
  onStartInlineCreation,
  onCancelInlineCreation,
  onChangeInlineName,
  onSubmitInlineCreation,
  onStartRenaming,
  onChangeRenameValue,
  onSubmitRename,
  onDeleteFile,
  onDuplicateFile,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onOpenContextMenu,
}: TreeNodeItemProps) {
  if (node.type === 'folder') {
    const isTargetDrag = dragOverFolderId === node.id;
    const isCreatingInside = inlineCreation && inlineCreation.targetFolderId === node.id;
    const isRenaming = renamingItem && renamingItem.id === node.id;

    return (
      <div className="flex flex-col select-none">
        {/* Folder Row */}
        <div
          draggable={!isRenaming}
          onDragStart={(e) => onDragStart(e, node.id, 'folder', node.name)}
          onDragEnd={onDragEnd}
          onDragOver={(e) => onDragOver(e, node.id)}
          onDrop={(e) => onDrop(e, node.id)}
          onContextMenu={(e) => onOpenContextMenu(e, 'folder', node.id, node.name, node.path)}
          onClick={() => onToggleFolderExpanded(node.id)}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onOpenFolderAsWorkspace?.(node.id);
          }}
          title="Click to toggle, double-click to open folder in editor"
          style={{ paddingLeft: `${node.depth * 14 + 10}px` }}
          className={`group flex items-center justify-between py-1 pr-2 cursor-pointer transition-colors text-xs ${
            isTargetDrag
              ? 'bg-[#007acc]/25 border-l-2 border-[#007acc] text-white'
              : 'hover:bg-[#2a2d2e] text-[#cccccc] hover:text-white border-l-2 border-transparent'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate flex-1 mr-1">
            {/* Expand / Collapse Chevron */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFolderExpanded(node.id);
              }}
              className="p-0.5 rounded hover:bg-[#3c3c3c] text-[#858585] hover:text-white shrink-0"
            >
              {node.isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Folder Icon */}
            {node.isExpanded ? (
              <FolderOpen className="w-4 h-4 text-[#dcb67a] shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-[#dcb67a] shrink-0" />
            )}

            {/* Folder Name / Rename Input */}
            {isRenaming ? (
              <form
                onSubmit={onSubmitRename}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 flex flex-col"
              >
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => onChangeRenameValue(e.target.value)}
                  onBlur={() => onSubmitRename()}
                  autoFocus
                  className="w-full px-1.5 py-0.5 bg-[#1e1e1e] border border-[#007acc] rounded text-white text-xs outline-none"
                />
                {renameError && <span className="text-[10px] text-red-400 mt-0.5">{renameError}</span>}
              </form>
            ) : (
              <span className="truncate font-medium">{node.name}</span>
            )}
          </div>

          {/* Hover / Quick Action Icons */}
          {!isRenaming && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartInlineCreation('file', node.id, node.depth + 1);
                }}
                className="p-1 rounded hover:bg-[#3c3c3c] text-[#858585] hover:text-white"
                title="New File in Folder"
              >
                <FilePlus className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartInlineCreation('folder', node.id, node.depth + 1);
                }}
                className="p-1 rounded hover:bg-[#3c3c3c] text-[#858585] hover:text-white"
                title="New Subfolder"
              >
                <FolderPlus className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={(e) => onOpenContextMenu(e, 'folder', node.id, node.name, node.path)}
                className="p-1 rounded hover:bg-[#3c3c3c] text-[#858585] hover:text-white"
                title="More actions"
              >
                <MoreVertical className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Expanded Children */}
        {node.isExpanded && (
          <div className="flex flex-col">
            {/* Inline Creation Input inside this folder */}
            {isCreatingInside && (
              <form
                onSubmit={onSubmitInlineCreation}
                style={{ paddingLeft: `${(node.depth + 1) * 14 + 18}px` }}
                className="flex flex-col pr-3 py-1 bg-[#1e1e1e] border-y border-[#3c3c3c]"
              >
                <div className="flex items-center gap-1.5">
                  {inlineCreation.type === 'folder' ? (
                    <Folder className="w-3.5 h-3.5 text-[#dcb67a] shrink-0" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-[#007acc] shrink-0" />
                  )}
                  <input
                    type="text"
                    placeholder={inlineCreation.type === 'folder' ? 'Folder name...' : 'filename.ext...'}
                    value={inlineName}
                    onChange={(e) => onChangeInlineName(e.target.value)}
                    onBlur={() => {
                      if (!inlineName.trim()) onCancelInlineCreation();
                    }}
                    autoFocus
                    className="flex-1 px-1.5 py-0.5 bg-[#252526] border border-[#007acc] rounded text-white text-xs outline-none"
                  />
                  <button type="submit" className="p-1 hover:text-green-400 text-[#858585]">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={onCancelInlineCreation} className="p-1 hover:text-red-400 text-[#858585]">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {inlineError && <span className="text-[10px] text-red-400 pl-5 mt-0.5">{inlineError}</span>}
              </form>
            )}

            {/* Children Nodes or Empty State */}
            {node.children.length === 0 && !isCreatingInside ? (
              <div
                style={{ paddingLeft: `${(node.depth + 1) * 14 + 22}px` }}
                className="py-1 text-[11px] text-[#555555] italic select-none"
              >
                (empty folder)
              </div>
            ) : (
              node.children.map((child) => (
                <TreeNodeItem
                  key={child.id}
                  node={child}
                  activeFileId={activeFileId}
                  dragOverFolderId={dragOverFolderId}
                  inlineCreation={inlineCreation}
                  inlineName={inlineName}
                  inlineError={inlineError}
                  renamingItem={renamingItem}
                  renameValue={renameValue}
                  renameError={renameError}
                  filesCount={filesCount}
                  onSelectFile={onSelectFile}
                  onToggleFolderExpanded={onToggleFolderExpanded}
                  onOpenFolderAsWorkspace={onOpenFolderAsWorkspace}
                  onStartInlineCreation={onStartInlineCreation}
                  onCancelInlineCreation={onCancelInlineCreation}
                  onChangeInlineName={onChangeInlineName}
                  onSubmitInlineCreation={onSubmitInlineCreation}
                  onStartRenaming={onStartRenaming}
                  onChangeRenameValue={onChangeRenameValue}
                  onSubmitRename={onSubmitRename}
                  onDeleteFile={onDeleteFile}
                  onDuplicateFile={onDuplicateFile}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  onOpenContextMenu={onOpenContextMenu}
                />
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  // File Node
  const fileNode = node as TreeFileNode;
  const isActive = fileNode.id === activeFileId;
  const isRenaming = renamingItem && renamingItem.id === fileNode.id;

  return (
    <div
      draggable={!isRenaming}
      onDragStart={(e) => onDragStart(e, fileNode.id, 'file', fileNode.name)}
      onDragEnd={onDragEnd}
      onClick={() => onSelectFile(fileNode.id)}
      onContextMenu={(e) => onOpenContextMenu(e, 'file', fileNode.id, fileNode.name, fileNode.path)}
      style={{ paddingLeft: `${fileNode.depth * 14 + 24}px` }}
      className={`group flex items-center justify-between py-1 pr-2 cursor-pointer transition-colors text-xs select-none ${
        isActive
          ? 'bg-[#37373d] text-white font-medium border-l-2 border-[#007acc]'
          : 'hover:bg-[#2a2d2e] text-[#cccccc] hover:text-white border-l-2 border-transparent'
      }`}
    >
      <div className="flex items-center gap-2 truncate flex-1 mr-1">
        {getFileIcon(fileNode.name, fileNode.file.language)}

        {isRenaming ? (
          <form
            onSubmit={onSubmitRename}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 flex flex-col"
          >
            <input
              type="text"
              value={renameValue}
              onChange={(e) => onChangeRenameValue(e.target.value)}
              onBlur={() => onSubmitRename()}
              autoFocus
              className="w-full px-1.5 py-0.5 bg-[#1e1e1e] border border-[#007acc] rounded text-white text-xs outline-none"
            />
            {renameError && <span className="text-[10px] text-red-400 mt-0.5">{renameError}</span>}
          </form>
        ) : (
          <span className="truncate">{fileNode.name}</span>
        )}
      </div>

      {!isRenaming && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStartRenaming(fileNode.id, 'file', fileNode.name);
            }}
            className="p-1 rounded hover:bg-[#3c3c3c] text-[#858585] hover:text-white"
            title="Rename"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicateFile(fileNode.id);
            }}
            className="p-1 rounded hover:bg-[#3c3c3c] text-[#858585] hover:text-white"
            title="Duplicate"
          >
            <Copy className="w-3 h-3" />
          </button>
          {filesCount > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFile(fileNode.id);
              }}
              className="p-1 rounded hover:bg-[#3c3c3c] text-[#858585] hover:text-red-400"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => onOpenContextMenu(e, 'file', fileNode.id, fileNode.name, fileNode.path)}
            className="p-1 rounded hover:bg-[#3c3c3c] text-[#858585] hover:text-white"
            title="More actions"
          >
            <MoreVertical className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

export function FileExplorer({
  projects,
  activeProject,
  files,
  folders,
  activeFileId,
  expandedFolderIds,
  activeWorkspaceRootId,
  activeWorkspaceName,
  onOpenFolderAsWorkspace,
  onOpenFolderDialog,
  onToggleFullscreen,
  onSelectFile,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onCreateFile,
  onRenameFile,
  onDeleteFile,
  onDuplicateFile,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveItem,
  onToggleFolderExpanded,
  onCollapseAllFolders,
  onExpandAllFolders,
}: FileExplorerProps) {
  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Folder Delete Confirmation
  const [deleteConfirmFolder, setDeleteConfirmFolder] = useState<FolderItem | null>(null);

  // Move To Modal (for mobile and context menu)
  const [moveToItem, setMoveToItem] = useState<{ id: string; name: string; type: 'file' | 'folder' } | null>(null);
  const [selectedTargetFolderId, setSelectedTargetFolderId] = useState<string | null>(null);

  // Inline Creation state (inside tree)
  const [inlineCreation, setInlineCreation] = useState<InlineCreationState | null>(null);
  const [inlineName, setInlineName] = useState('');
  const [inlineError, setInlineError] = useState<string | null>(null);

  // Inline Renaming state
  const [renamingItem, setRenamingItem] = useState<{ id: string; type: 'file' | 'folder'; currentName: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Drag and Drop state
  const [draggingItem, setDraggingItem] = useState<{ id: string; type: 'file' | 'folder'; name: string } | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null | 'ROOT'>(null);

  // Notification / Toast for copy action
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Close context menu on outside click or escape
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
        setInlineCreation(null);
        setRenamingItem(null);
      }
    };

    window.addEventListener('mousedown', handleGlobalClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleGlobalClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Effective root ID for file/folder creation and drag-drop
  const effectiveRootId = activeWorkspaceRootId || null;

  // Build the hierarchical tree (scoped to activeWorkspaceRootId if active)
  const treeNodes = React.useMemo(() => {
    return buildFileTree(folders, files, expandedFolderIds, effectiveRootId);
  }, [folders, files, expandedFolderIds, effectiveRootId]);

  // Effective files scoped to active workspace root
  const effectiveFiles = React.useMemo(() => {
    if (!activeWorkspaceRootId) return files;
    const descendantFolderIds = getWorkspaceDescendantIds(activeWorkspaceRootId, folders);
    return files.filter((f) => (f.folderId && descendantFolderIds.has(f.folderId)));
  }, [files, folders, activeWorkspaceRootId]);

  // Inline Creation Handlers
  const handleStartInlineCreation = (type: 'file' | 'folder', targetFolderId: string | null, depth: number) => {
    if (targetFolderId && !expandedFolderIds.includes(targetFolderId)) {
      onToggleFolderExpanded(targetFolderId);
    }
    setInlineCreation({ type, targetFolderId, depth });
    setInlineName('');
    setInlineError(null);
  };

  const handleInlineCreationSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inlineCreation) return;

    const trimmed = inlineName.trim();
    if (!trimmed) {
      setInlineCreation(null);
      setInlineName('');
      setInlineError(null);
      return;
    }

    if (/[\\/:*?"<>|]/.test(trimmed)) {
      setInlineError('Names cannot contain: \\ / : * ? " < > |');
      return;
    }

    try {
      if (inlineCreation.type === 'file') {
        onCreateFile(trimmed, inlineCreation.targetFolderId);
      } else {
        onCreateFolder(trimmed, inlineCreation.targetFolderId);
      }
      setInlineCreation(null);
      setInlineName('');
      setInlineError(null);
    } catch (err: unknown) {
      setInlineError(err instanceof Error ? err.message : String(err));
    }
  };

  // Inline Rename Handlers
  const handleStartRenaming = (id: string, type: 'file' | 'folder', currentName: string) => {
    setRenamingItem({ id, type, currentName });
    setRenameValue(currentName);
    setRenameError(null);
  };

  const handleRenameSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!renamingItem) return;

    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === renamingItem.currentName) {
      setRenamingItem(null);
      setRenameValue('');
      setRenameError(null);
      return;
    }

    if (/[\\/:*?"<>|]/.test(trimmed)) {
      setRenameError('Names cannot contain: \\ / : * ? " < > |');
      return;
    }

    try {
      if (renamingItem.type === 'file') {
        onRenameFile(renamingItem.id, trimmed);
      } else {
        onRenameFolder(renamingItem.id, trimmed);
      }
      setRenamingItem(null);
      setRenameValue('');
      setRenameError(null);
    } catch (err: unknown) {
      setRenameError(err instanceof Error ? err.message : String(err));
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string, type: 'file' | 'folder', name: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ id, type, name }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggingItem({ id, type, name });
  };

  const handleDragEnd = () => {
    setDraggingItem(null);
    setDragOverFolderId(null);
  };

  const handleDragOver = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggingItem) return;

    // Check circular reference if dragging folder
    if (draggingItem.type === 'folder') {
      if (targetFolderId === draggingItem.id) {
        e.dataTransfer.dropEffect = 'none';
        return;
      }
      if (targetFolderId && isDescendantOf(targetFolderId, draggingItem.id, folders)) {
        e.dataTransfer.dropEffect = 'none';
        return;
      }
    }

    e.dataTransfer.dropEffect = 'move';
    setDragOverFolderId(targetFolderId ?? 'ROOT');
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggingItem) return;

    if (draggingItem.type === 'folder') {
      if (targetFolderId === draggingItem.id) return;
      if (targetFolderId && isDescendantOf(targetFolderId, draggingItem.id, folders)) {
        showToast('Cannot move a folder into its own subfolder');
        setDraggingItem(null);
        setDragOverFolderId(null);
        return;
      }
    }

    try {
      onMoveItem(draggingItem.id, draggingItem.type, targetFolderId);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to move');
    }

    setDraggingItem(null);
    setDragOverFolderId(null);
  };

  // Context Menu Triggers
  const openContextMenu = (e: React.MouseEvent, type: 'file' | 'folder' | 'root', id?: string, name?: string, path?: string) => {
    e.preventDefault();
    e.stopPropagation();

    const x = Math.min(e.clientX, window.innerWidth - 180);
    const y = Math.min(e.clientY, window.innerHeight - 240);

    setContextMenu({
      x,
      y,
      type,
      targetId: id,
      targetName: name,
      targetPath: path,
    });
  };

  const handleCopyPath = (path: string) => {
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    navigator.clipboard.writeText(cleanPath);
    showToast(`Copied "${cleanPath}" to clipboard`);
    setContextMenu(null);
  };

  // Confirm Folder Delete
  const requestDeleteFolder = (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId);
    if (!folder) return;

    const { fileCount, folderCount } = getFolderDescendantCounts(folderId, folders, files);
    if (fileCount > 0 || folderCount > 0) {
      setDeleteConfirmFolder(folder);
    } else {
      onDeleteFolder(folderId);
    }
  };

  // Project Creation Submit
  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim(), newProjectTemplate);
      setNewProjectName('');
      setIsCreatingProject(false);
    }
  };

  // Export / Import
  const handleExportJson = () => {
    if (activeProject) ExportImportService.downloadProjectJson(activeProject.id);
  };

  const handleExportZip = () => {
    if (activeProject) ExportImportService.downloadProjectZip(activeProject.id);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.name.endsWith('.json')) {
        const text = await file.text();
        const res = await ExportImportService.importProjectFromJson(text);
        onSelectProject(res.project.id);
        showToast(`Imported project "${res.project.name}"`);
      } else if (file.name.endsWith('.zip')) {
        const res = await ExportImportService.importProjectFromZip(file);
        onSelectProject(res.project.id);
        showToast(`Imported project "${res.project.name}"`);
      }
    } catch (err: unknown) {
      alert(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    e.target.value = '';
  };

  // Filtered nodes when search query is entered (scoped to workspace files)
  const filteredFiles = searchQuery.trim()
    ? effectiveFiles.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : null;

  return (
    <div
      onDragOver={(e) => handleDragOver(e, null)}
      onDrop={(e) => handleDrop(e, null)}
      onContextMenu={(e) => openContextMenu(e, 'root')}
      className="flex flex-col h-full bg-[#252526] text-[#cccccc] text-xs select-none border-r border-[#3c3c3c] relative overflow-hidden"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 px-3 py-1 bg-[#007acc] text-white rounded shadow-lg text-xs font-sans animate-in fade-in zoom-in-95 duration-150">
          {toastMessage}
        </div>
      )}

      {/* Explorer Top Toolbar & Project Switcher */}
      <div className="p-2 border-b border-[#3c3c3c] flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <span className="font-bold tracking-wider text-[11px] text-[#858585] uppercase">Explorer</span>

          {/* Action Toolbar */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => handleStartInlineCreation('file', effectiveRootId, 0)}
              className="p-1 rounded hover:bg-[#3c3c3c] text-[#cccccc] hover:text-white transition-colors"
              title="New File in Root"
            >
              <FilePlus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleStartInlineCreation('folder', effectiveRootId, 0)}
              className="p-1 rounded hover:bg-[#3c3c3c] text-[#cccccc] hover:text-white transition-colors"
              title="New Folder in Root"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
            {onOpenFolderDialog && (
              <button
                type="button"
                onClick={onOpenFolderDialog}
                className="p-1 rounded hover:bg-[#3c3c3c] text-[#cccccc] hover:text-[#38bdf8] transition-colors"
                title="Open Folder as Workspace Root..."
              >
                <FolderInput className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onCollapseAllFolders}
              className="p-1 rounded hover:bg-[#3c3c3c] text-[#cccccc] hover:text-white transition-colors"
              title="Collapse All Folders"
            >
              <FolderMinus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onExpandAllFolders}
              className="p-1 rounded hover:bg-[#3c3c3c] text-[#cccccc] hover:text-white transition-colors"
              title="Expand All Folders"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleExportZip}
              className="p-1 rounded hover:bg-[#3c3c3c] text-[#cccccc] hover:text-white transition-colors"
              title="Download Project ZIP"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="p-1 rounded hover:bg-[#3c3c3c] text-[#cccccc] hover:text-white transition-colors"
              title="Download Project JSON"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
            <label
              className="p-1 rounded hover:bg-[#3c3c3c] text-[#cccccc] hover:text-white cursor-pointer transition-colors"
              title="Import Project (JSON or ZIP)"
            >
              <Upload className="w-3.5 h-3.5" />
              <input type="file" accept=".json,.zip" onChange={handleImportFile} className="hidden" />
            </label>
            {onToggleFullscreen && (
              <button
                type="button"
                onClick={onToggleFullscreen}
                className="p-1 rounded hover:bg-[#3c3c3c] text-[#38bdf8] hover:text-white transition-colors ml-0.5 border-l border-[#3c3c3c] pl-1.5"
                title="Full Screen Windows File Explorer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Project Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded bg-[#1e1e1e] hover:bg-[#2a2d2e] border border-[#3c3c3c] text-left transition-colors"
          >
            <div className="flex items-center gap-1.5 overflow-hidden">
              <Folder className="w-3.5 h-3.5 text-[#007acc] shrink-0" />
              <span className="truncate font-medium text-white">{activeProject?.name || 'Select Project'}</span>
            </div>
            <ChevronDown className="w-3 h-3 text-[#858585] shrink-0" />
          </button>

          {/* Active Workspace Root Scoped Banner */}
          {activeWorkspaceRootId && (
            <div className="mt-1.5 flex items-center justify-between px-2 py-1 rounded bg-[#04395e]/80 border border-[#007acc]/50 text-xs">
              <div className="flex items-center gap-1.5 overflow-hidden">
                <FolderOpen className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                <div className="flex items-center gap-1 truncate">
                  <span className="font-semibold text-white truncate">
                    {activeWorkspaceName || 'Workspace'}
                  </span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-[#007acc] text-white font-mono uppercase font-bold tracking-wider shrink-0">
                    ROOT
                  </span>
                </div>
              </div>
              {onOpenFolderAsWorkspace && (
                <button
                  type="button"
                  onClick={() => onOpenFolderAsWorkspace(null)}
                  className="p-0.5 rounded hover:bg-white/10 text-[#cccccc] hover:text-white transition-colors"
                  title="Clear Workspace Root (Open Entire Project)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {isProjectDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1e1e1e] border border-[#3c3c3c] rounded shadow-2xl z-50 max-h-64 overflow-y-auto">
              <div className="p-1">
                <div className="flex items-center justify-between px-2 py-1 text-[10px] text-[#858585] uppercase font-semibold">
                  <span>Projects</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCreatingProject(true);
                      setIsProjectDropdownOpen(false);
                    }}
                    className="hover:text-white flex items-center gap-1"
                  >
                    <FolderPlus className="w-3 h-3" />
                    <span>New</span>
                  </button>
                </div>

                {projects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectProject(p.id);
                      setIsProjectDropdownOpen(false);
                    }}
                    className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer ${
                      p.id === activeProject?.id ? 'bg-[#04395e] text-white font-medium' : 'hover:bg-[#2a2d2e] text-[#cccccc]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Layers className="w-3.5 h-3.5 text-[#007acc] shrink-0" />
                      <span className="truncate">{p.name}</span>
                    </div>
                    {projects.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmProject(p);
                        }}
                        className="p-1 hover:text-red-400 opacity-60 hover:opacity-100"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Filter Input */}
        <div className="relative flex items-center">
          <Search className="w-3 h-3 absolute left-2 text-[#6e6e6e]" />
          <input
            type="text"
            placeholder="Search files in project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-6 pr-2 py-1 bg-[#1e1e1e] border border-[#3c3c3c] focus:border-[#007acc] rounded text-white text-xs outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-1.5 p-0.5 text-[#858585] hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* New Project Inline Modal */}
      {isCreatingProject && (
        <form onSubmit={handleCreateProjectSubmit} className="p-2.5 border-b border-[#3c3c3c] bg-[#1e1e1e] flex flex-col gap-2">
          <div className="font-semibold text-white">Create New Project</div>
          <input
            type="text"
            placeholder="Project name..."
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            className="w-full px-2 py-1 bg-[#252526] border border-[#3c3c3c] focus:border-[#007acc] rounded text-white outline-none"
            autoFocus
          />
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-[#858585]">Template:</span>
            <select
              value={newProjectTemplate}
              onChange={(e) => setNewProjectTemplate(e.target.value as ProjectTemplate)}
              className="w-full px-2 py-1 bg-[#252526] border border-[#3c3c3c] focus:border-[#007acc] rounded text-white text-xs outline-none"
            >
              <option value="web">Web (HTML + CSS + JS)</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python 3 (Pyodide)</option>
              <option value="cpp">C++ (WebAssembly)</option>
              <option value="empty">Empty Project</option>
            </select>
          </div>
          <div className="flex justify-end gap-1.5 mt-1">
            <button
              type="button"
              onClick={() => setIsCreatingProject(false)}
              className="px-2 py-1 rounded bg-[#333333] hover:bg-[#3c3c3c] text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-2.5 py-1 rounded bg-[#007acc] hover:bg-[#1177bb] text-white font-medium"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {/* Delete Project Confirmation Dialog */}
      {deleteConfirmProject && (
        <div className="p-2.5 bg-red-950/40 border-b border-red-800 flex flex-col gap-2">
          <span className="font-semibold text-red-200">Delete Project?</span>
          <p className="text-[11px] text-red-300">
            Are you sure you want to delete &quot;{deleteConfirmProject.name}&quot;? All files and folders will be permanently removed.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteConfirmProject(null)}
              className="px-2 py-1 rounded bg-[#333333] hover:bg-[#444444] text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onDeleteProject(deleteConfirmProject.id);
                setDeleteConfirmProject(null);
              }}
              className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Delete Non-Empty Folder Confirmation Dialog */}
      {deleteConfirmFolder && (
        <div className="p-3 bg-red-950/50 border-b border-red-700 flex flex-col gap-2 z-20">
          <div className="flex items-center gap-1.5 text-red-400 font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Delete Non-Empty Folder?</span>
          </div>
          <p className="text-[11px] text-red-200 leading-relaxed">
            Folder &quot;{deleteConfirmFolder.name}&quot; is not empty. Deleting it will permanently delete all its nested subfolders and files.
          </p>
          <div className="flex justify-end gap-2 mt-1">
            <button
              type="button"
              onClick={() => setDeleteConfirmFolder(null)}
              className="px-2.5 py-1 rounded bg-[#333333] hover:bg-[#444444] text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onDeleteFolder(deleteConfirmFolder.id);
                setDeleteConfirmFolder(null);
              }}
              className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              Delete All
            </button>
          </div>
        </div>
      )}

      {/* Hierarchical Tree Scroll View */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden py-1"
        onDragOver={(e) => handleDragOver(e, effectiveRootId)}
        onDrop={(e) => handleDrop(e, effectiveRootId)}
      >
        {/* Root Inline Creation Input */}
        {inlineCreation && inlineCreation.targetFolderId === effectiveRootId && (
          <form
            onSubmit={handleInlineCreationSubmit}
            className="flex flex-col px-3 py-1 bg-[#1e1e1e] border-y border-[#3c3c3c] mb-1"
          >
            <div className="flex items-center gap-1.5">
              {inlineCreation.type === 'folder' ? (
                <Folder className="w-3.5 h-3.5 text-[#dcb67a] shrink-0" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-[#007acc] shrink-0" />
              )}
              <input
                type="text"
                placeholder={inlineCreation.type === 'folder' ? 'Folder name...' : 'filename.ext...'}
                value={inlineName}
                onChange={(e) => {
                  setInlineName(e.target.value);
                  setInlineError(null);
                }}
                onBlur={() => {
                  if (!inlineName.trim()) setInlineCreation(null);
                }}
                autoFocus
                className="flex-1 px-1.5 py-0.5 bg-[#252526] border border-[#007acc] rounded text-white text-xs outline-none"
              />
              <button type="submit" className="p-1 hover:text-green-400 text-[#858585]">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => setInlineCreation(null)} className="p-1 hover:text-red-400 text-[#858585]">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {inlineError && <span className="text-[10px] text-red-400 pl-5 mt-0.5">{inlineError}</span>}
          </form>
        )}

        {/* Search Filtered Flat View OR Hierarchical Tree */}
        {filteredFiles ? (
          <div className="flex flex-col">
            <div className="px-3 py-1 text-[10px] text-[#858585] uppercase font-semibold">
              Search Results ({filteredFiles.length})
            </div>
            {filteredFiles.length === 0 ? (
              <div className="px-4 py-3 text-[#666666] text-center text-xs">No matching files found</div>
            ) : (
              filteredFiles.map((file) => (
                <div
                  key={file.id}
                  onClick={() => onSelectFile(file.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer text-xs ${
                    file.id === activeFileId
                      ? 'bg-[#37373d] text-white font-medium border-l-2 border-[#007acc]'
                      : 'hover:bg-[#2a2d2e] text-[#cccccc] border-l-2 border-transparent'
                  }`}
                >
                  {getFileIcon(file.name, file.language)}
                  <span className="truncate flex-1">{file.name}</span>
                  <span className="text-[10px] text-[#666666] truncate">{file.path}</span>
                </div>
              ))
            )}
          </div>
        ) : treeNodes.length === 0 && !inlineCreation ? (
          <div className="flex flex-col items-center justify-center h-48 text-[#666666] text-center px-4">
            <Folder className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-xs font-medium">
              {activeWorkspaceRootId ? `Empty Folder: ${activeWorkspaceName || 'Root'}` : 'Empty Project'}
            </p>
            <p className="text-[11px] text-[#555555] mt-1">
              {activeWorkspaceRootId
                ? 'Click + above to create files in this workspace folder'
                : 'Click + above or right-click to create files and folders'}
            </p>
          </div>
        ) : (
          treeNodes.map((node) => (
            <TreeNodeItem
              key={node.id}
              node={node}
              activeFileId={activeFileId}
              dragOverFolderId={dragOverFolderId}
              inlineCreation={inlineCreation}
              inlineName={inlineName}
              inlineError={inlineError}
              renamingItem={renamingItem}
              renameValue={renameValue}
              renameError={renameError}
              filesCount={files.length}
              onSelectFile={onSelectFile}
              onToggleFolderExpanded={onToggleFolderExpanded}
              onStartInlineCreation={handleStartInlineCreation}
              onCancelInlineCreation={() => setInlineCreation(null)}
              onChangeInlineName={(val) => {
                setInlineName(val);
                setInlineError(null);
              }}
              onSubmitInlineCreation={handleInlineCreationSubmit}
              onStartRenaming={handleStartRenaming}
              onChangeRenameValue={(val) => {
                setRenameValue(val);
                setRenameError(null);
              }}
              onSubmitRename={handleRenameSubmit}
              onDeleteFile={onDeleteFile}
              onDuplicateFile={onDuplicateFile}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onOpenContextMenu={openContextMenu}
            />
          ))
        )}
      </div>

      {/* Floating Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 min-w-[170px] bg-[#1e1e1e] border border-[#3c3c3c] rounded shadow-2xl py-1 text-xs text-[#cccccc] font-sans"
        >
          {contextMenu.type === 'file' && (
            <>
              <button
                type="button"
                onClick={() => {
                  if (contextMenu.targetId) onSelectFile(contextMenu.targetId);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#04395e] hover:text-white flex items-center gap-2"
              >
                <FileText className="w-3.5 h-3.5 text-[#007acc]" />
                <span>Open in Editor</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (contextMenu.targetId && contextMenu.targetName) {
                    handleStartRenaming(contextMenu.targetId, 'file', contextMenu.targetName);
                  }
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#04395e] hover:text-white flex items-center gap-2"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#858585]" />
                <span>Rename</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (contextMenu.targetId) onDuplicateFile(contextMenu.targetId);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#04395e] hover:text-white flex items-center gap-2"
              >
                <Copy className="w-3.5 h-3.5 text-[#858585]" />
                <span>Duplicate</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (contextMenu.targetPath) handleCopyPath(contextMenu.targetPath);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#04395e] hover:text-white flex items-center gap-2"
              >
                <Copy className="w-3.5 h-3.5 text-[#858585]" />
                <span>Copy Path</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (contextMenu.targetId && contextMenu.targetName) {
                    setMoveToItem({ id: contextMenu.targetId, name: contextMenu.targetName, type: 'file' });
                    setSelectedTargetFolderId(null);
                  }
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#04395e] hover:text-white flex items-center gap-2"
              >
                <FolderInput className="w-3.5 h-3.5 text-[#858585]" />
                <span>Move to...</span>
              </button>
              <div className="h-px bg-[#333333] my-1" />
              <button
                type="button"
                onClick={() => {
                  if (contextMenu.targetId) onDeleteFile(contextMenu.targetId);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-red-900/60 hover:text-red-300 text-red-400 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </>
          )}

          {contextMenu.type === 'folder' && (
            <>
              <button
                type="button"
                onClick={() => {
                  if (contextMenu.targetId) {
                    handleStartInlineCreation('file', contextMenu.targetId, 0);
                  }
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#04395e] hover:text-white flex items-center gap-2"
              >
                <FilePlus className="w-3.5 h-3.5 text-[#007acc]" />
                <span>New File</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (contextMenu.targetId) {
                    handleStartInlineCreation('folder', contextMenu.targetId, 0);
                  }
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#04395e] hover:text-white flex items-center gap-2"
              >
                <FolderPlus className="w-3.5 h-3.5 text-[#dcb67a]" />
                <span>New Folder</span>
              </button>
              <div className="h-px bg-[#333333] my-1" />
              <button
                type="button"
                onClick={() => {
                  if (contextMenu.targetId && contextMenu.targetName) {
                    handleStartRenaming(contextMenu.targetId, 'folder', contextMenu.targetName);
                  }
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#04395e] hover:text-white flex items-center gap-2"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#858585]" />
                <span>Rename</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (contextMenu.targetPath) handleCopyPath(contextMenu.targetPath);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#04395e] hover:text-white flex items-center gap-2"
              >
                <Copy className="w-3.5 h-3.5 text-[#858585]" />
                <span>Copy Path</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (contextMenu.targetId && contextMenu.targetName) {
                    setMoveToItem({ id: contextMenu.targetId, name: contextMenu.targetName, type: 'folder' });
                    setSelectedTargetFolderId(null);
                  }
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#04395e] hover:text-white flex items-center gap-2"
              >
                <FolderInput className="w-3.5 h-3.5 text-[#858585]" />
                <span>Move to...</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (contextMenu.targetId) onToggleFolderExpanded(contextMenu.targetId);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#04395e] hover:text-white flex items-center gap-2"
              >
                <Folder className="w-3.5 h-3.5 text-[#dcb67a]" />
                <span>Toggle Expand/Collapse</span>
              </button>
              {onOpenFolderAsWorkspace && (
                <button
                  type="button"
                  onClick={() => {
                    if (contextMenu.targetId) onOpenFolderAsWorkspace(contextMenu.targetId);
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#04395e] hover:text-white flex items-center gap-2 text-[#38bdf8]"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Open as Workspace Root</span>
                </button>
              )}
              <div className="h-px bg-[#333333] my-1" />
              <button
                type="button"
                onClick={() => {
                  if (contextMenu.targetId) requestDeleteFolder(contextMenu.targetId);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-red-900/60 hover:text-red-300 text-red-400 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </>
          )}

          {contextMenu.type === 'root' && (
            <>
              {activeWorkspaceRootId && onOpenFolderAsWorkspace && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenFolderAsWorkspace(null);
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#04395e] hover:text-white flex items-center gap-2 text-[#38bdf8]"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Open Entire Project</span>
                </button>
              )}
              {onOpenFolderDialog && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenFolderDialog();
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#04395e] hover:text-white flex items-center gap-2 text-white"
                >
                  <FolderInput className="w-3.5 h-3.5 text-[#007acc]" />
                  <span>Open Folder as Workspace...</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  handleStartInlineCreation('file', effectiveRootId, 0);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#04395e] hover:text-white flex items-center gap-2"
              >
                <FilePlus className="w-3.5 h-3.5 text-[#007acc]" />
                <span>New File</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleStartInlineCreation('folder', effectiveRootId, 0);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#04395e] hover:text-white flex items-center gap-2"
              >
                <FolderPlus className="w-3.5 h-3.5 text-[#dcb67a]" />
                <span>New Folder</span>
              </button>
              <div className="h-px bg-[#333333] my-1" />
              <button
                type="button"
                onClick={() => {
                  onCollapseAllFolders();
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#04395e] hover:text-white flex items-center gap-2"
              >
                <FolderMinus className="w-3.5 h-3.5 text-[#858585]" />
                <span>Collapse All</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onExpandAllFolders();
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#04395e] hover:text-white flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#858585]" />
                <span>Expand All</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Move To Modal Dialog (accessible on mobile & desktop) */}
      {moveToItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg shadow-2xl w-full max-w-sm flex flex-col overflow-hidden text-xs text-white">
            <div className="p-3 border-b border-[#3c3c3c] flex items-center justify-between font-semibold">
              <div className="flex items-center gap-2">
                <FolderInput className="w-4 h-4 text-[#007acc]" />
                <span>Move &quot;{moveToItem.name}&quot;</span>
              </div>
              <button
                type="button"
                onClick={() => setMoveToItem(null)}
                className="p-1 hover:text-white text-[#858585]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 flex flex-col gap-2 max-h-60 overflow-y-auto">
              <span className="text-[11px] text-[#858585]">Select destination folder:</span>

              {/* Root option */}
              <div
                onClick={() => setSelectedTargetFolderId(null)}
                className={`p-2 rounded cursor-pointer flex items-center gap-2 border ${
                  selectedTargetFolderId === null
                    ? 'bg-[#04395e] border-[#007acc] text-white font-medium'
                    : 'bg-[#252526] hover:bg-[#2d2d2d] border-[#3c3c3c] text-[#cccccc]'
                }`}
              >
                <Layers className="w-4 h-4 text-[#007acc]" />
                <span>/ (Root Directory)</span>
              </div>

              {/* List folders */}
              {folders.map((f) => {
                const isInvalid =
                  moveToItem.type === 'folder' &&
                  (f.id === moveToItem.id || isDescendantOf(f.id, moveToItem.id, folders));

                if (isInvalid) return null;

                return (
                  <div
                    key={f.id}
                    onClick={() => setSelectedTargetFolderId(f.id)}
                    className={`p-2 rounded cursor-pointer flex items-center gap-2 border ${
                      selectedTargetFolderId === f.id
                        ? 'bg-[#04395e] border-[#007acc] text-white font-medium'
                        : 'bg-[#252526] hover:bg-[#2d2d2d] border-[#3c3c3c] text-[#cccccc]'
                    }`}
                  >
                    <Folder className="w-4 h-4 text-[#dcb67a]" />
                    <span className="truncate">{f.path}</span>
                  </div>
                );
              })}
            </div>

            <div className="p-3 border-t border-[#3c3c3c] flex justify-end gap-2 bg-[#252526]">
              <button
                type="button"
                onClick={() => setMoveToItem(null)}
                className="px-3 py-1.5 rounded bg-[#333333] hover:bg-[#3c3c3c] text-white font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    onMoveItem(moveToItem.id, moveToItem.type, selectedTargetFolderId);
                    setMoveToItem(null);
                    showToast(`Moved "${moveToItem.name}"`);
                  } catch (err: unknown) {
                    alert(err instanceof Error ? err.message : 'Failed to move');
                  }
                }}
                className="px-3 py-1.5 rounded bg-[#007acc] hover:bg-[#1177bb] text-white font-semibold"
              >
                Move Here
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
