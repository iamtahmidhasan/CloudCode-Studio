'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Project, FileItem, FolderItem } from '@/types';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  RefreshCw,
  Search,
  FilePlus,
  FolderPlus,
  Trash2,
  Edit2,
  Copy,
  X,
  Minimize2,
  Folder,
  FolderOpen,
  LayoutGrid,
  List,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Monitor,
  ArrowUpDown,
  Code2,
  Info,
  HardDrive,
  FileText,
  FileCode,
  Globe,
  FileJson,
  Home,
  Clock,
  FolderTree,
  FolderMinus,
  Layers,
} from 'lucide-react';
import {
  buildFileTree,
  getFileIcon,
  isDescendantOf,
  getFolderDescendantCounts,
  type TreeNode,
} from '@/lib/explorer/tree-utils';

export const HOME_FOLDER_ID = '__HOME__';

interface WindowsExplorerViewProps {
  project: Project | undefined;
  projects?: Project[];
  files: FileItem[];
  folders: FolderItem[];
  activeFileId: string | null;
  expandedFolderIds: string[];
  activeWorkspaceRootId?: string | null;
  activeWorkspaceName?: string;
  onOpenFolderAsWorkspace?: (folderId: string | null) => void;
  initialFolderId?: string | null;
  onClose: () => void;
  onSelectFile?: (fileId: string) => void;
  onOpenFileInEditor: (fileId: string) => void;
  onCreateFile: (name: string, folderId?: string | null) => void;
  onRenameFile: (fileId: string, newName: string) => void;
  onDeleteFile: (fileId: string) => void;
  onDuplicateFile: (fileId: string) => void;
  onCreateFolder: (name: string, parentId?: string | null) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onMoveItem: (itemId: string, itemType: 'file' | 'folder', targetFolderId: string | null) => void;
  onToggleFolderExpanded: (folderId: string) => void;
}

type ViewMode = 'nested' | 'grid' | 'details';
type SortField = 'name' | 'type' | 'size' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getFileDescription(filename: string, language?: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html':
    case 'htm':
      return 'HTML Document';
    case 'css':
      return 'Cascading Style Sheet';
    case 'js':
    case 'mjs':
    case 'cjs':
      return 'JavaScript File';
    case 'jsx':
      return 'React JSX Component';
    case 'ts':
      return 'TypeScript Source File';
    case 'tsx':
      return 'React TSX Component';
    case 'py':
      return 'Python Script';
    case 'cpp':
    case 'cxx':
    case 'cc':
    case 'c':
      return 'C/C++ Source File';
    case 'h':
    case 'hpp':
      return 'C/C++ Header File';
    case 'json':
      return 'JSON File';
    case 'md':
    case 'markdown':
      return 'Markdown Document';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'svg':
    case 'ico':
    case 'gif':
      return 'Image File';
    default:
      return `${language ? language.toUpperCase() + ' ' : ''}File`;
  }
}

interface NestedTreeNodeRowProps {
  node: TreeNode;
  selectedItemId: string | null;
  dragOverFolderId: string | null | 'ROOT';
  activeFileId: string | null;
  folders: FolderItem[];
  files: FileItem[];
  onSelectFolder: (folder: FolderItem) => void;
  onSelectFile: (file: FileItem) => void;
  onDoubleClickFile: (fileId: string) => void;
  onToggleExpand: (folderId: string) => void;
  onContextMenu: (e: React.MouseEvent, type: 'file' | 'folder', id: string, name: string, path: string) => void;
  onDragStart: (e: React.DragEvent, id: string, type: 'file' | 'folder', name: string) => void;
  onDragOver: (e: React.DragEvent, folderId: string | null) => void;
  onDrop: (e: React.DragEvent, folderId: string | null) => void;
  onCreateInFolder: (type: 'file' | 'folder', folderId: string) => void;
}

function NestedTreeNodeRow({
  node,
  selectedItemId,
  dragOverFolderId,
  activeFileId,
  folders,
  files,
  onSelectFolder,
  onSelectFile,
  onDoubleClickFile,
  onToggleExpand,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDrop,
  onCreateInFolder,
}: NestedTreeNodeRowProps) {
  if (node.type === 'folder') {
    const isSelected = selectedItemId === node.id;
    const isDragTarget = dragOverFolderId === node.id;
    const counts = getFolderDescendantCounts(node.id, folders, files);

    return (
      <div className="flex flex-col select-none">
        <div
          draggable
          onDragStart={(e) => onDragStart(e, node.id, 'folder', node.name)}
          onDragOver={(e) => onDragOver(e, node.id)}
          onDrop={(e) => onDrop(e, node.id)}
          onClick={(e) => {
            e.stopPropagation();
            onSelectFolder(node.folder);
          }}
          onDoubleClick={() => onToggleExpand(node.id)}
          onContextMenu={(e) => onContextMenu(e, 'folder', node.id, node.name, node.path)}
          style={{ paddingLeft: `${node.depth * 20 + 8}px` }}
          className={`flex items-center px-3 py-1.5 cursor-pointer border-b border-[#2d2d2d] group transition-colors text-xs ${
            isSelected
              ? 'bg-[#007acc]/20 text-white font-medium border-l-2 border-l-[#007acc]'
              : isDragTarget
              ? 'bg-[#007acc]/30 text-white'
              : 'hover:bg-[#2a2d2e] text-[#cccccc] hover:text-white'
          }`}
        >
          {/* Chevron + Folder Icon + Name */}
          <div className="flex-1 flex items-center gap-1.5 truncate pr-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(node.id);
              }}
              className="p-0.5 rounded hover:bg-white/10 shrink-0 text-[#858585] hover:text-white"
              title={node.isExpanded ? 'Collapse Folder' : 'Expand Folder'}
            >
              {node.isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
            {node.isExpanded ? (
              <FolderOpen className="w-4 h-4 text-[#dcb67a] shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-[#dcb67a] shrink-0" />
            )}
            <span className="truncate font-semibold">{node.name}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#252526] text-[#858585] font-mono shrink-0 ml-1">
              {counts.fileCount} {counts.fileCount === 1 ? 'file' : 'files'}
            </span>
          </div>

          {/* Path column */}
          <div className="w-44 text-[11px] text-[#858585] font-mono truncate hidden sm:block">
            {node.path}
          </div>

          {/* Date modified */}
          <div className="w-36 text-[11px] text-[#858585] hidden md:block">
            {formatDate(node.folder.updatedAt)}
          </div>

          {/* Type */}
          <div className="w-28 text-[11px] text-[#858585] hidden lg:block">
            File folder
          </div>

          {/* Quick Actions on hover */}
          <div className="w-20 text-right opacity-0 group-hover:opacity-100 flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCreateInFolder('file', node.id);
              }}
              className="p-1 rounded hover:bg-[#333333] text-[#858585] hover:text-[#007acc]"
              title="New File in this folder"
            >
              <FilePlus className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCreateInFolder('folder', node.id);
              }}
              className="p-1 rounded hover:bg-[#333333] text-[#858585] hover:text-[#dcb67a]"
              title="New Subfolder in this folder"
            >
              <FolderPlus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Children if expanded */}
        {node.isExpanded && (
          <div className="flex flex-col">
            {node.children.length === 0 ? (
              <div
                style={{ paddingLeft: `${node.depth * 20 + 36}px` }}
                className="py-1.5 px-3 text-[11px] text-[#666666] italic flex items-center gap-2 border-b border-[#2d2d2d]/50"
              >
                <span>(Empty folder)</span>
                <button
                  type="button"
                  onClick={() => onCreateInFolder('file', node.id)}
                  className="not-italic text-[#007acc] hover:underline"
                >
                  + Add file
                </button>
              </div>
            ) : (
              node.children.map((child) => (
                <NestedTreeNodeRow
                  key={child.id}
                  node={child}
                  selectedItemId={selectedItemId}
                  dragOverFolderId={dragOverFolderId}
                  activeFileId={activeFileId}
                  folders={folders}
                  files={files}
                  onSelectFolder={onSelectFolder}
                  onSelectFile={onSelectFile}
                  onDoubleClickFile={onDoubleClickFile}
                  onToggleExpand={onToggleExpand}
                  onContextMenu={onContextMenu}
                  onDragStart={onDragStart}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  onCreateInFolder={onCreateInFolder}
                />
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  // File Node
  const isSelected = selectedItemId === node.id;
  const isActive = node.id === activeFileId;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, node.id, 'file', node.name)}
      onClick={(e) => {
        e.stopPropagation();
        onSelectFile(node.file);
      }}
      onDoubleClick={() => onDoubleClickFile(node.file.id)}
      onContextMenu={(e) => onContextMenu(e, 'file', node.id, node.name, node.path)}
      style={{ paddingLeft: `${node.depth * 20 + 28}px` }}
      className={`flex items-center px-3 py-1.5 cursor-pointer border-b border-[#2d2d2d] transition-colors text-xs ${
        isSelected
          ? 'bg-[#007acc]/20 text-white font-medium border-l-2 border-l-[#007acc]'
          : isActive
          ? 'bg-[#2a2d2e] text-white'
          : 'hover:bg-[#2a2d2e] text-[#cccccc] hover:text-white'
      }`}
    >
      <div className="flex-1 flex items-center gap-2 truncate pr-2">
        {getFileIcon(node.name, node.file.language)}
        <span className="truncate">{node.name}</span>
      </div>

      <div className="w-44 text-[11px] text-[#858585] font-mono truncate hidden sm:block">
        {node.path}
      </div>

      <div className="w-36 text-[11px] text-[#858585] hidden md:block">
        {formatDate(node.file.updatedAt)}
      </div>

      <div className="w-28 text-[11px] text-[#858585] truncate hidden lg:block">
        {getFileDescription(node.name, node.file.language)}
      </div>

      <div className="w-20 text-right text-[11px] text-[#858585] font-mono">
        {formatBytes(node.file.content?.length || 0)}
      </div>
    </div>
  );
}

export function WindowsExplorerView({
  project,
  files,
  folders,
  activeFileId,
  expandedFolderIds,
  activeWorkspaceRootId,
  activeWorkspaceName,
  onOpenFolderAsWorkspace,
  initialFolderId = HOME_FOLDER_ID,
  onClose,
  onSelectFile,
  onOpenFileInEditor,
  onCreateFile,
  onRenameFile,
  onDeleteFile,
  onDuplicateFile,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveItem,
  onToggleFolderExpanded,
}: WindowsExplorerViewProps) {
  // Navigation State
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(initialFolderId ?? HOME_FOLDER_ID);
  const [history, setHistory] = useState<(string | null)[]>([initialFolderId ?? HOME_FOLDER_ID]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const homeFolder = useMemo(() => {
    return (
      folders.find((f) => f.name.toLowerCase() === 'home' && (!f.parentId || f.path === '/Home')) ||
      folders.find((f) => f.name.toLowerCase() === 'home')
    );
  }, [folders]);

  const projectsFolder = useMemo(() => {
    return folders.find((f) => f.name.toLowerCase() === 'projects');
  }, [folders]);

  const templatesFolder = useMemo(() => {
    return folders.find((f) => f.name.toLowerCase() === 'templates');
  }, [folders]);

  const activeWorkspaceFolder = useMemo(() => {
    return activeWorkspaceRootId ? folders.find((f) => f.id === activeWorkspaceRootId) : undefined;
  }, [folders, activeWorkspaceRootId]);

  const isHome = currentFolderId === HOME_FOLDER_ID || (homeFolder ? currentFolderId === homeFolder.id : false);

  // View Options
  const [viewMode, setViewMode] = useState<ViewMode>('nested');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreviewPane, setShowPreviewPane] = useState(true);

  // Canvas Collapsed Folders State for Nested View (empty = all expanded)
  const [canvasCollapsedFolderIds, setCanvasCollapsedFolderIds] = useState<string[]>([]);

  const toggleCanvasFolderExpanded = (folderId: string) => {
    setCanvasCollapsedFolderIds((prev) =>
      prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId]
    );
  };

  const expandAllCanvasFolders = () => {
    setCanvasCollapsedFolderIds([]);
  };

  const collapseAllCanvasFolders = () => {
    setCanvasCollapsedFolderIds(folders.map((f) => f.id));
  };

  // Selection
  const [selectedItem, setSelectedItem] = useState<{ id: string; type: 'file' | 'folder' } | null>(null);

  // Modals & Inline inputs
  const [isCreatingNew, setIsCreatingNew] = useState<'file' | 'folder' | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const [renamingItem, setRenamingItem] = useState<{ id: string; type: 'file' | 'folder'; name: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);

  // Folder Delete Confirmation Modal
  const [deleteConfirmFolder, setDeleteConfirmFolder] = useState<FolderItem | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Drag and drop state
  const [draggingItem, setDraggingItem] = useState<{ id: string; type: 'file' | 'folder'; name: string } | null>(null);
  const [dragOverTargetId, setDragOverTargetId] = useState<string | null | 'ROOT'>(null);

  // Context Menu
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: 'file' | 'folder' | 'canvas';
    targetId?: string;
    targetName?: string;
    targetPath?: string;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Handle global escape to close or close context menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (contextMenu) {
          setContextMenu(null);
        } else if (isCreatingNew) {
          setIsCreatingNew(null);
        } else if (renamingItem) {
          setRenamingItem(null);
        } else {
          onClose();
        }
      }
    };
    const handleClick = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClick);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClick);
    };
  }, [contextMenu, isCreatingNew, renamingItem, onClose]);

  // Navigate to folder and update history
  const navigateToFolder = (folderId: string | null) => {
    if (folderId === currentFolderId) return;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(folderId);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentFolderId(folderId);
    setSelectedItem(null);
  };

  // Back / Forward / Up
  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;
  const canGoUp = currentFolderId !== HOME_FOLDER_ID;

  const handleGoBack = () => {
    if (canGoBack) {
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      setCurrentFolderId(history[nextIndex]);
      setSelectedItem(null);
    }
  };

  const handleGoForward = () => {
    if (canGoForward) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setCurrentFolderId(history[nextIndex]);
      setSelectedItem(null);
    }
  };

  const handleGoUp = () => {
    if (isHome) return;
    if (!currentFolderId) {
      // At Project Root, going Up navigates to Home
      navigateToFolder(HOME_FOLDER_ID);
      return;
    }
    const current = folders.find((f) => f.id === currentFolderId);
    if (!current || (homeFolder && current.parentId === homeFolder.id)) {
      navigateToFolder(HOME_FOLDER_ID);
      return;
    }
    navigateToFolder(current.parentId || null);
  };

  // Current folder object & path segments
  const currentFolder = isHome ? homeFolder : folders.find((f) => f.id === currentFolderId);

  const breadcrumbSegments = useMemo(() => {
    if (isHome) {
      return [{ id: HOME_FOLDER_ID, name: 'Home', isHome: true }];
    }

    const list: { id: string | null; name: string; isHome?: boolean }[] = [
      { id: HOME_FOLDER_ID, name: 'Home', isHome: true },
    ];
    if (!currentFolderId) return list;

    const pathFolders: FolderItem[] = [];
    let curr: FolderItem | undefined = folders.find((f) => f.id === currentFolderId);
    while (curr) {
      if (homeFolder && curr.id === homeFolder.id) {
        break;
      }
      pathFolders.unshift(curr);
      curr = curr.parentId ? folders.find((f) => f.id === curr?.parentId) : undefined;
    }

    for (const f of pathFolders) {
      list.push({ id: f.id, name: f.name });
    }
    return list;
  }, [currentFolderId, folders, homeFolder, isHome]);

  // Home Directory view collections: All Folders on Home & Recent Files
  const homeFolders = useMemo(() => {
    let list = homeFolder
      ? folders.filter((f) => f.parentId === homeFolder.id)
      : folders.filter((f) => !f.parentId);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'updatedAt') cmp = a.updatedAt - b.updatedAt;
      else cmp = a.name.localeCompare(b.name);
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [folders, homeFolder, searchQuery, sortField, sortDirection]);

  const recentFiles = useMemo(() => {
    let list = [...files];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q));
    }
    list.sort((a, b) => b.updatedAt - a.updatedAt);
    return list;
  }, [files, searchQuery]);

  // Hierarchical Tree Nodes for Nested View
  const canvasTreeNodes = useMemo(() => {
    const rootFolderId = isHome ? (homeFolder ? homeFolder.id : null) : currentFolderId;

    let effectiveFolders = folders;
    let effectiveFiles = files;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      effectiveFolders = folders.filter((f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q));
      effectiveFiles = files.filter((f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q));
    }

    const collapsedSet = new Set(canvasCollapsedFolderIds);
    const expandedList = searchQuery.trim()
      ? folders.map((f) => f.id)
      : folders.filter((f) => !collapsedSet.has(f.id)).map((f) => f.id);

    if (rootFolderId === null) {
      return buildFileTree(effectiveFolders, effectiveFiles, expandedList);
    } else {
      const expandedSet = new Set(expandedList);
      function buildSubBranch(parentId: string, depth: number): TreeNode[] {
        const childFolders = effectiveFolders
          .filter((f) => f.parentId === parentId)
          .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
        const childFiles = effectiveFiles
          .filter((f) => f.folderId === parentId)
          .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

        const nodes: TreeNode[] = [];
        for (const folder of childFolders) {
          const isExpanded = expandedSet.has(folder.id);
          const subChildren = buildSubBranch(folder.id, depth + 1);
          nodes.push({
            type: 'folder',
            id: folder.id,
            name: folder.name,
            path: folder.path,
            depth,
            folder,
            children: subChildren,
            isExpanded,
            isEmpty: subChildren.length === 0,
          });
        }
        for (const file of childFiles) {
          nodes.push({
            type: 'file',
            id: file.id,
            name: file.name,
            path: file.path,
            depth,
            file,
          });
        }
        return nodes;
      }
      return buildSubBranch(rootFolderId, 0);
    }
  }, [isHome, homeFolder, currentFolderId, folders, files, canvasCollapsedFolderIds, searchQuery]);

  // Get items directly in current folder (or search matches)
  const currentItems = useMemo(() => {
    if (isHome) {
      return { folders: [], files: [] };
    }

    let childFolders = folders.filter((f) => (f.parentId || null) === (currentFolderId || null));
    let childFiles = files.filter((f) => (f.folderId || null) === (currentFolderId || null));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      childFolders = folders.filter((f) => f.name.toLowerCase().includes(q));
      childFiles = files.filter((f) => f.name.toLowerCase().includes(q));
    }

    // Sort folders
    childFolders.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'updatedAt') cmp = a.updatedAt - b.updatedAt;
      else cmp = a.name.localeCompare(b.name);
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    // Sort files
    childFiles.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'type') cmp = (a.language || '').localeCompare(b.language || '');
      else if (sortField === 'size') cmp = (a.content?.length || 0) - (b.content?.length || 0);
      else if (sortField === 'updatedAt') cmp = a.updatedAt - b.updatedAt;
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return { folders: childFolders, files: childFiles };
  }, [currentFolderId, files, folders, searchQuery, sortField, sortDirection, isHome]);

  // Total count & selected file detail
  const totalItemCount = isHome
    ? homeFolders.length + recentFiles.length
    : currentItems.folders.length + currentItems.files.length;
  const selectedFile = selectedItem?.type === 'file' ? files.find((f) => f.id === selectedItem.id) : null;
  const selectedFolder = selectedItem?.type === 'folder' ? folders.find((f) => f.id === selectedItem.id) : null;

  // Sorting toggle
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Creation & Renaming handlers
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newItemName.trim();
    if (!clean) {
      setIsCreatingNew(null);
      return;
    }
    if (/[\\/:*?"<>|]/.test(clean)) {
      setCreateError('Invalid characters: \\ / : * ? " < > |');
      return;
    }

    try {
      const targetFolderId = isHome ? (homeFolder ? homeFolder.id : null) : currentFolderId;
      if (isCreatingNew === 'file') {
        onCreateFile(clean, targetFolderId);
      } else {
        onCreateFolder(clean, targetFolderId);
      }
      setIsCreatingNew(null);
      setNewItemName('');
      setCreateError(null);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingItem) return;
    const clean = renameValue.trim();
    if (!clean || clean === renamingItem.name) {
      setRenamingItem(null);
      return;
    }
    if (/[\\/:*?"<>|]/.test(clean)) {
      setRenameError('Invalid characters: \\ / : * ? " < > |');
      return;
    }

    try {
      if (renamingItem.type === 'file') {
        onRenameFile(renamingItem.id, clean);
      } else {
        onRenameFolder(renamingItem.id, clean);
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

  const handleDragOver = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggingItem) return;

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
    setDragOverTargetId(targetFolderId ?? 'ROOT');
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
        setDragOverTargetId(null);
        return;
      }
    }

    try {
      onMoveItem(draggingItem.id, draggingItem.type, targetFolderId);
      showToast(`Moved "${draggingItem.name}"`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Move failed');
    }

    setDraggingItem(null);
    setDragOverTargetId(null);
  };

  // Context Menu
  const openContextMenu = (e: React.MouseEvent, type: 'file' | 'folder' | 'canvas', id?: string, name?: string, path?: string) => {
    e.preventDefault();
    e.stopPropagation();

    const x = Math.min(e.clientX, window.innerWidth - 190);
    const y = Math.min(e.clientY, window.innerHeight - 250);

    setContextMenu({ x, y, type, targetId: id, targetName: name, targetPath: path });
  };

  // Left Tree View recursive renderer
  const leftTreeNodes = useMemo(() => {
    return buildFileTree(folders, [], expandedFolderIds);
  }, [folders, expandedFolderIds]);

  const renderLeftTreeNode = (node: TreeNode) => {
    if (node.type !== 'folder') return null;
    const isCurrent = node.id === currentFolderId;

    return (
      <div key={node.id} className="flex flex-col select-none">
        <div
          onClick={() => navigateToFolder(node.id)}
          onDragOver={(e) => handleDragOver(e, node.id)}
          onDrop={(e) => handleDrop(e, node.id)}
          style={{ paddingLeft: `${node.depth * 14 + 10}px` }}
          className={`flex items-center justify-between py-1 pr-2 cursor-pointer transition-colors text-xs rounded ${
            isCurrent
              ? 'bg-[#007acc] text-white font-medium'
              : 'hover:bg-[#2a2d2e] text-[#cccccc] hover:text-white'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate flex-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFolderExpanded(node.id);
              }}
              className="p-0.5 rounded hover:bg-white/20 shrink-0"
            >
              {node.isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
            <Folder className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-white' : 'text-[#dcb67a]'}`} />
            <span className="truncate">{node.name}</span>
          </div>
        </div>

        {node.isExpanded && (
          <div className="flex flex-col">
            {node.children.map((child) => renderLeftTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#1e1e1e] text-white font-sans select-none overflow-hidden animate-in fade-in zoom-in-[0.99] duration-150">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 bg-[#007acc] text-white rounded-md shadow-2xl text-xs font-medium animate-in fade-in zoom-in-95 duration-150">
          {toastMessage}
        </div>
      )}

      {/* WINDOW TITLE BAR (Windows 11 Fluent style) */}
      <div className="flex items-center justify-between h-10 px-3 bg-[#181818] border-b border-[#2d2d2d] shrink-0">
        {/* Window Tabs / Title */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-[#252526] border-t-2 border-[#007acc] rounded-t text-xs font-medium text-white shadow-sm">
            {isHome ? (
              <>
                <Home className="w-4 h-4 text-sky-400" />
                <span>Home (All Folders)</span>
              </>
            ) : (
              <>
                <Folder className="w-4 h-4 text-[#dcb67a]" />
                <span>{currentFolder?.name || activeWorkspaceName || 'Workspace'}</span>
                {activeWorkspaceRootId && currentFolderId === activeWorkspaceRootId && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#007acc] text-white font-mono uppercase font-bold tracking-wider">
                    WORKSPACE ROOT
                  </span>
                )}
              </>
            )}
          </div>
          <span className="text-xs text-[#858585] hidden sm:inline">
            {activeWorkspaceRootId ? `[Scoped: ${activeWorkspaceName}]` : '- Windows File Explorer'}
          </span>
        </div>

        {/* Window Controls (Minimize, Restore, Close) */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[#333333] text-[#cccccc] hover:text-white transition-colors"
            title="Return to Code Editor (Esc)"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-red-600 text-[#cccccc] hover:text-white transition-colors"
            title="Close Explorer (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TOP COMMAND BAR / RIBBON */}
      <div className="flex flex-wrap items-center justify-between px-3 py-1.5 bg-[#252526] border-b border-[#2d2d2d] gap-2 shrink-0 text-xs">
        {/* Left Action Buttons */}
        <div className="flex items-center gap-1">
          {/* New Item Buttons */}
          <button
            type="button"
            onClick={() => {
              setIsCreatingNew('file');
              setNewItemName('');
              setCreateError(null);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-[#333333] text-[#cccccc] hover:text-white transition-colors"
            title="Create New File in current folder"
          >
            <FilePlus className="w-3.5 h-3.5 text-[#007acc]" />
            <span>New file</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsCreatingNew('folder');
              setNewItemName('');
              setCreateError(null);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-[#333333] text-[#cccccc] hover:text-white transition-colors"
            title="Create New Folder in current folder"
          >
            <FolderPlus className="w-3.5 h-3.5 text-[#dcb67a]" />
            <span>New folder</span>
          </button>

          <div className="w-px h-4 bg-[#3c3c3c] mx-1" />

          {/* Action on selected */}
          {selectedItem && (
            <>
              {selectedItem.type === 'file' && (
                <button
                  type="button"
                  onClick={() => onOpenFileInEditor(selectedItem.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-[#007acc]/20 hover:bg-[#007acc] text-sky-300 hover:text-white rounded transition-colors font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Editor</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const targetName = selectedFile?.name || selectedFolder?.name || '';
                  setRenamingItem({ id: selectedItem.id, type: selectedItem.type, name: targetName });
                  setRenameValue(targetName);
                  setRenameError(null);
                }}
                className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#333333] text-[#cccccc] hover:text-white transition-colors"
                title="Rename Selected"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Rename</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedItem.type === 'file') {
                    onDeleteFile(selectedItem.id);
                    setSelectedItem(null);
                  } else {
                    const f = folders.find((fol) => fol.id === selectedItem.id);
                    if (f) setDeleteConfirmFolder(f);
                  }
                }}
                className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-red-950/60 hover:text-red-300 text-red-400 transition-colors"
                title="Delete Selected"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
              {selectedItem.type === 'folder' && onOpenFolderAsWorkspace && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenFolderAsWorkspace(selectedItem.id);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#007acc] hover:bg-[#1177bb] text-white rounded transition-colors font-medium shadow-sm"
                  title="Open this folder in Code Editor without parent folders"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Open Folder in Code Editor</span>
                </button>
              )}
            </>
          )}

          {/* Current directory workspace root toggle */}
          {onOpenFolderAsWorkspace && (
            <>
              {currentFolderId && currentFolderId !== HOME_FOLDER_ID && currentFolderId !== activeWorkspaceRootId && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenFolderAsWorkspace(currentFolderId);
                    showToast(`Set "${currentFolder?.name}" as Workspace Root`);
                  }}
                  className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#007acc]/20 hover:bg-[#007acc] text-sky-300 hover:text-white transition-colors"
                  title="Set current directory as Workspace Root"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Set as Workspace Root</span>
                </button>
              )}
              {activeWorkspaceRootId && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenFolderAsWorkspace(null);
                    showToast('Cleared Workspace Root (Full Project Open)');
                  }}
                  className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#333333] hover:bg-[#3c3c3c] text-[#cccccc] hover:text-white transition-colors"
                  title="Clear Workspace Root (Open Entire Project)"
                >
                  <Layers className="w-3.5 h-3.5 text-[#007acc]" />
                  <span className="hidden sm:inline">Clear Root</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Right View & Filter Toggles */}
        <div className="flex items-center gap-1">
          {/* View Mode Toggle */}
          {/* View Mode Toggle: Nested, Grid, Details */}
          <div className="flex items-center bg-[#1e1e1e] p-0.5 rounded border border-[#3c3c3c]">
            <button
              type="button"
              onClick={() => setViewMode('nested')}
              className={`p-1 rounded flex items-center gap-1 transition-colors ${
                viewMode === 'nested' ? 'bg-[#007acc] text-white font-medium shadow-sm' : 'text-[#858585] hover:text-white'
              }`}
              title="Nested Tree View (Show Folders & Files Nested)"
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span className="text-[11px] px-1 hidden md:inline">Nested</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded flex items-center gap-1 transition-colors ${
                viewMode === 'grid' ? 'bg-[#007acc] text-white font-medium shadow-sm' : 'text-[#858585] hover:text-white'
              }`}
              title="Large Icons / Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="text-[11px] px-1 hidden md:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('details')}
              className={`p-1 rounded flex items-center gap-1 transition-colors ${
                viewMode === 'details' ? 'bg-[#007acc] text-white font-medium shadow-sm' : 'text-[#858585] hover:text-white'
              }`}
              title="Details Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="text-[11px] px-1 hidden md:inline">Details</span>
            </button>
          </div>

          {/* Toggle Preview Pane */}
          <button
            type="button"
            onClick={() => setShowPreviewPane(!showPreviewPane)}
            className={`p-1.5 rounded border border-[#3c3c3c] ${showPreviewPane ? 'bg-[#007acc]/20 text-sky-400 border-[#007acc]' : 'bg-[#1e1e1e] text-[#858585] hover:text-white'}`}
            title="Toggle Details & Code Preview Pane"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* NAVIGATION BAR & ADDRESS BAR */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1e1e1e] border-b border-[#2d2d2d] shrink-0 text-xs">
        {/* Back / Forward / Up / Home / Refresh */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={handleGoBack}
            disabled={!canGoBack}
            className="p-1.5 rounded hover:bg-[#2d2d2d] disabled:opacity-30 disabled:hover:bg-transparent text-[#cccccc] hover:text-white transition-colors"
            title="Back (Alt+Left)"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleGoForward}
            disabled={!canGoForward}
            className="p-1.5 rounded hover:bg-[#2d2d2d] disabled:opacity-30 disabled:hover:bg-transparent text-[#cccccc] hover:text-white transition-colors"
            title="Forward (Alt+Right)"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleGoUp}
            disabled={!canGoUp}
            className="p-1.5 rounded hover:bg-[#2d2d2d] disabled:opacity-30 disabled:hover:bg-transparent text-[#cccccc] hover:text-white transition-colors"
            title={currentFolderId === null ? 'Up to Home (All Folders)' : 'Up to Parent Directory'}
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => navigateToFolder(HOME_FOLDER_ID)}
            className={`p-1.5 rounded hover:bg-[#2d2d2d] transition-colors ${
              isHome ? 'text-sky-400 bg-[#2d2d2d]' : 'text-[#cccccc] hover:text-white'
            }`}
            title="Home (All Folders)"
          >
            <Home className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => navigateToFolder(currentFolderId)}
            className="p-1.5 rounded hover:bg-[#2d2d2d] text-[#cccccc] hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Windows Clickable Breadcrumb Address Bar */}
        <div className="flex-1 flex items-center bg-[#252526] hover:bg-[#2a2d2e] border border-[#3c3c3c] focus-within:border-[#007acc] rounded px-2 py-1 overflow-x-auto no-scrollbar gap-1 transition-colors">
          {isHome ? (
            <Home className="w-3.5 h-3.5 text-sky-400 shrink-0 mr-1" />
          ) : (
            <Monitor className="w-3.5 h-3.5 text-[#007acc] shrink-0 mr-1" />
          )}
          {breadcrumbSegments.map((seg, idx) => {
            const isLast = idx === breadcrumbSegments.length - 1;
            return (
              <React.Fragment key={seg.id || 'root'}>
                <button
                  type="button"
                  onClick={() => navigateToFolder(seg.id)}
                  className={`px-1.5 py-0.5 rounded transition-colors whitespace-nowrap flex items-center gap-1 ${
                    isLast ? 'font-semibold text-white bg-[#333333]' : 'text-[#858585] hover:text-white hover:bg-[#333333]'
                  }`}
                >
                  {seg.isHome && <Home className="w-3 h-3 text-sky-400 shrink-0" />}
                  <span>{seg.name}</span>
                </button>
                {!isLast && <ChevronRight className="w-3 h-3 text-[#555555] shrink-0" />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative flex items-center w-40 sm:w-60 shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-2 text-[#6e6e6e]" />
          <input
            type="text"
            placeholder={`Search ${currentFolder?.name || 'project'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-6 py-1 bg-[#252526] border border-[#3c3c3c] focus:border-[#007acc] rounded text-white text-xs outline-none"
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

      {/* Delete Folder Modal Confirmation */}
      {deleteConfirmFolder && (
        <div className="p-3 bg-red-950/70 border-b border-red-700 flex items-center justify-between text-xs z-30 shrink-0">
          <div className="flex items-center gap-2 text-red-200">
            <Trash2 className="w-4 h-4 text-red-400 shrink-0" />
            <span>
              Delete folder &quot;{deleteConfirmFolder.name}&quot; and all of its contents?
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDeleteConfirmFolder(null)}
              className="px-2.5 py-1 bg-[#333333] hover:bg-[#444444] rounded text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onDeleteFolder(deleteConfirmFolder.id);
                setDeleteConfirmFolder(null);
                setSelectedItem(null);
              }}
              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 font-semibold rounded text-white"
            >
              Delete All
            </button>
          </div>
        </div>
      )}

      {/* MAIN TWO-PANE EXPLORER BODY */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* LEFT NAVIGATION PANE (Windows Quick Access / Folder Tree) */}
        <div className="w-56 bg-[#181818] border-r border-[#2d2d2d] flex flex-col overflow-y-auto p-2 shrink-0 hidden md:flex">
          <div className="text-[10px] text-[#858585] uppercase font-bold tracking-wider mb-1 px-2">
            Quick Access
          </div>

          {/* Home Directory entry */}
          <div
            onClick={() => navigateToFolder(HOME_FOLDER_ID)}
            className={`flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer text-xs mb-1 transition-colors ${
              isHome
                ? 'bg-[#007acc] text-white font-medium shadow-sm'
                : 'hover:bg-[#2a2d2e] text-[#cccccc] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <Home className={`w-4 h-4 shrink-0 ${isHome ? 'text-white' : 'text-sky-400'}`} />
              <span className="truncate">Home (All Folders)</span>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isHome ? 'bg-white/20 text-white' : 'bg-[#252526] text-[#858585]'
              }`}
            >
              {folders.length}
            </span>
          </div>

          {/* Quick Access Top-Level Folders */}
          {projectsFolder && (
            <div
              onClick={() => navigateToFolder(projectsFolder.id)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded cursor-pointer text-xs mb-1 transition-colors ${
                currentFolderId === projectsFolder.id
                  ? 'bg-[#007acc] text-white font-medium shadow-sm'
                  : 'hover:bg-[#2a2d2e] text-[#cccccc] hover:text-white'
              }`}
            >
              <Folder className={`w-4 h-4 shrink-0 ${currentFolderId === projectsFolder.id ? 'text-white' : 'text-[#dcb67a]'}`} />
              <span className="truncate">Projects</span>
            </div>
          )}

          {templatesFolder && (
            <div
              onClick={() => navigateToFolder(templatesFolder.id)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded cursor-pointer text-xs mb-1 transition-colors ${
                currentFolderId === templatesFolder.id
                  ? 'bg-[#007acc] text-white font-medium shadow-sm'
                  : 'hover:bg-[#2a2d2e] text-[#cccccc] hover:text-white'
              }`}
            >
              <Folder className={`w-4 h-4 shrink-0 ${currentFolderId === templatesFolder.id ? 'text-white' : 'text-[#dcb67a]'}`} />
              <span className="truncate">Templates</span>
            </div>
          )}

          {/* Active Workspace Pin if set */}
          {activeWorkspaceRootId && activeWorkspaceFolder && (
            <div
              onClick={() => navigateToFolder(activeWorkspaceRootId)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded cursor-pointer text-xs mb-1 transition-colors ${
                currentFolderId === activeWorkspaceRootId
                  ? 'bg-[#007acc] text-white font-medium shadow-sm'
                  : 'hover:bg-[#2a2d2e] text-[#cccccc] hover:text-white'
              }`}
              title="Currently Open Workspace Folder in Code Editor"
            >
              <FolderOpen className={`w-4 h-4 shrink-0 ${currentFolderId === activeWorkspaceRootId ? 'text-white' : 'text-sky-400'}`} />
              <span className="truncate font-medium">{activeWorkspaceFolder.name} (Active)</span>
            </div>
          )}

          <div className="text-[10px] text-[#858585] uppercase font-bold tracking-wider mt-2 mb-1 px-2">
            Folders
          </div>

          {/* Recursive Left Folder Tree */}
          <div className="flex flex-col gap-0.5">
            {leftTreeNodes.map((node) => renderLeftTreeNode(node))}
          </div>
        </div>

        {/* CENTER DIRECTORY CANVAS */}
        <div
          onClick={() => setSelectedItem(null)}
          onContextMenu={(e) => openContextMenu(e, 'canvas')}
          onDragOver={(e) => handleDragOver(e, currentFolderId)}
          onDrop={(e) => handleDrop(e, currentFolderId)}
          className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e] overflow-y-auto p-3 relative"
        >
          {/* Inline New Item Creation Box */}
          {isCreatingNew && (
            <form
              onSubmit={handleCreateSubmit}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 p-2 mb-3 bg-[#252526] border border-[#007acc] rounded shadow-md max-w-sm"
            >
              {isCreatingNew === 'folder' ? (
                <Folder className="w-4 h-4 text-[#dcb67a] shrink-0" />
              ) : (
                <FileText className="w-4 h-4 text-[#007acc] shrink-0" />
              )}
              <input
                type="text"
                placeholder={isCreatingNew === 'folder' ? 'Folder name...' : 'filename.ext...'}
                value={newItemName}
                onChange={(e) => {
                  setNewItemName(e.target.value);
                  setCreateError(null);
                }}
                autoFocus
                className="flex-1 px-2 py-0.5 bg-[#1e1e1e] border border-[#3c3c3c] focus:border-[#007acc] text-white text-xs outline-none rounded"
              />
              <button type="submit" className="px-2 py-0.5 bg-[#007acc] hover:bg-[#1177bb] text-white rounded text-xs font-medium">
                Create
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingNew(null)}
                className="p-1 hover:text-red-400 text-[#858585]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              {createError && <span className="text-[10px] text-red-400 block w-full mt-1">{createError}</span>}
            </form>
          )}

          {/* Inline Renaming Box */}
          {renamingItem && (
            <form
              onSubmit={handleRenameSubmit}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 p-2 mb-3 bg-[#252526] border border-[#007acc] rounded shadow-md max-w-sm"
            >
              <input
                type="text"
                value={renameValue}
                onChange={(e) => {
                  setRenameValue(e.target.value);
                  setRenameError(null);
                }}
                autoFocus
                className="flex-1 px-2 py-0.5 bg-[#1e1e1e] border border-[#3c3c3c] focus:border-[#007acc] text-white text-xs outline-none rounded"
              />
              <button type="submit" className="px-2 py-0.5 bg-[#007acc] hover:bg-[#1177bb] text-white rounded text-xs font-medium">
                Rename
              </button>
              <button
                type="button"
                onClick={() => setRenamingItem(null)}
                className="p-1 hover:text-red-400 text-[#858585]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              {renameError && <span className="text-[10px] text-red-400 block w-full mt-1">{renameError}</span>}
            </form>
          )}

          {/* CANVAS BODY: NESTED TREE VIEW, HOME VIEW, OR SPECIFIC FOLDER */}
          {viewMode === 'nested' ? (
            /* NESTED TREE VIEW: FOLDERS & FILES HIERARCHICALLY NESTED */
            <div className="flex flex-col flex-1">
              {/* Nested Toolbar Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2d2d2d] shrink-0">
                <div className="flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-sky-400" />
                  <h2 className="text-sm font-semibold text-white tracking-wide">
                    {isHome ? 'Project Structure (Nested)' : `${currentFolder?.name || 'Folder'} (Nested)`}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] bg-[#2a2d2e] text-[#858585] font-mono">
                    {folders.length} {folders.length === 1 ? 'folder' : 'folders'}, {files.length} {files.length === 1 ? 'file' : 'files'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={expandAllCanvasFolders}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#252526] hover:bg-[#333333] border border-[#3c3c3c] text-xs text-[#cccccc] hover:text-white transition-colors"
                    title="Expand all folders"
                  >
                    <FolderOpen className="w-3 h-3 text-[#dcb67a]" />
                    <span className="text-[11px]">Expand All</span>
                  </button>
                  <button
                    type="button"
                    onClick={collapseAllCanvasFolders}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#252526] hover:bg-[#333333] border border-[#3c3c3c] text-xs text-[#cccccc] hover:text-white transition-colors"
                    title="Collapse all folders"
                  >
                    <FolderMinus className="w-3 h-3" />
                    <span className="text-[11px]">Collapse All</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNew('folder');
                      setNewItemName('');
                      setCreateError(null);
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#007acc] hover:bg-[#1177bb] text-xs text-white font-medium transition-colors ml-1"
                    title="New folder in root"
                  >
                    <FolderPlus className="w-3 h-3" />
                    <span className="text-[11px]">New Folder</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNew('file');
                      setNewItemName('');
                      setCreateError(null);
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#252526] hover:bg-[#333333] border border-[#3c3c3c] text-xs text-white font-medium transition-colors"
                    title="New file in root"
                  >
                    <FilePlus className="w-3 h-3 text-[#007acc]" />
                    <span className="text-[11px]">New File</span>
                  </button>
                </div>
              </div>

              {/* Nested Tree Table */}
              <div className="flex flex-col border border-[#2d2d2d] rounded overflow-hidden">
                {/* Table Header */}
                <div className="flex items-center px-3 py-1.5 bg-[#252526] text-[#858585] font-semibold text-[11px] border-b border-[#2d2d2d] select-none sticky top-0 z-10">
                  <div className="flex-1">Name / Hierarchy</div>
                  <div className="w-44 hidden sm:block">Path</div>
                  <div className="w-36 hidden md:block">Date modified</div>
                  <div className="w-28 hidden lg:block">Type</div>
                  <div className="w-20 text-right">Size / Items</div>
                </div>

                {/* Tree Rows */}
                {canvasTreeNodes.length === 0 ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center">
                    <Folder className="w-12 h-12 text-[#3c3c3c] mb-2" />
                    <p className="text-xs text-[#858585] mb-2">No folders or files found.</p>
                  </div>
                ) : (
                  canvasTreeNodes.map((node) => (
                    <NestedTreeNodeRow
                      key={node.id}
                      node={node}
                      selectedItemId={selectedItem?.id || null}
                      dragOverFolderId={dragOverTargetId}
                      activeFileId={activeFileId}
                      folders={folders}
                      files={files}
                      onSelectFolder={(f) => {
                        setSelectedItem({ id: f.id, type: 'folder' });
                      }}
                      onSelectFile={(f) => {
                        setSelectedItem({ id: f.id, type: 'file' });
                        onSelectFile?.(f.id);
                      }}
                      onDoubleClickFile={(fId) => onOpenFileInEditor(fId)}
                      onToggleExpand={toggleCanvasFolderExpanded}
                      onContextMenu={openContextMenu}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onCreateInFolder={(type, folderId) => {
                        setCurrentFolderId(folderId);
                        setIsCreatingNew(type);
                        setNewItemName('');
                        setCreateError(null);
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          ) : isHome ? (
            /* HOME DIRECTORY VIEW: ALL FOLDERS & RECENT FILES */
            <div className="flex flex-col gap-6">
              {/* All Folders Section */}
              <div>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#2d2d2d]">
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-[#dcb67a]" />
                    <h2 className="text-sm font-semibold text-white tracking-wide">All Folders</h2>
                    <span className="px-2 py-0.5 rounded-full text-[11px] bg-[#2a2d2e] text-[#858585] font-mono">
                      {homeFolders.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNew('folder');
                      setNewItemName('');
                      setCreateError(null);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-[#252526] hover:bg-[#333333] border border-[#3c3c3c] rounded text-xs text-white transition-colors"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-[#dcb67a]" />
                    <span>New folder</span>
                  </button>
                </div>

                {homeFolders.length === 0 ? (
                  <div className="p-8 border border-dashed border-[#333333] rounded-lg text-center flex flex-col items-center justify-center">
                    <Folder className="w-12 h-12 text-[#3c3c3c] mb-2" />
                    <p className="text-xs text-[#858585] mb-3">No folders in this project yet.</p>
                    <button
                      type="button"
                      onClick={() => setIsCreatingNew('folder')}
                      className="px-3 py-1.5 bg-[#007acc] hover:bg-[#1177bb] text-white rounded text-xs font-medium flex items-center gap-1.5"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>Create First Folder</span>
                    </button>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {homeFolders.map((folder) => {
                      const isSelected = selectedItem?.id === folder.id;
                      const isDragTarget = dragOverTargetId === folder.id;
                      const counts = getFolderDescendantCounts(folder.id, folders, files);

                      return (
                        <div
                          key={folder.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, folder.id, 'folder', folder.name)}
                          onDragOver={(e) => handleDragOver(e, folder.id)}
                          onDrop={(e) => handleDrop(e, folder.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem({ id: folder.id, type: 'folder' });
                          }}
                          onDoubleClick={() => navigateToFolder(folder.id)}
                          onContextMenu={(e) => openContextMenu(e, 'folder', folder.id, folder.name, folder.path)}
                          className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all group ${
                            isSelected
                              ? 'bg-[#007acc]/20 border-[#007acc] shadow-lg'
                              : isDragTarget
                              ? 'bg-[#007acc]/30 border-[#007acc] scale-105'
                              : 'bg-[#252526]/70 hover:bg-[#2a2d2e] border-[#333333] hover:border-[#444444]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Folder className="w-10 h-10 text-[#dcb67a] drop-shadow" />
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e1e1e] text-[#858585] group-hover:text-white font-mono">
                              {counts.fileCount} {counts.fileCount === 1 ? 'file' : 'files'}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-white truncate max-w-full mb-0.5">
                            {folder.name}
                          </span>
                          <span className="text-[10px] text-[#858585] truncate font-mono" title={folder.path}>
                            {folder.path}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Details View for All Folders in Home */
                  <div className="flex flex-col border border-[#2d2d2d] rounded overflow-hidden">
                    <div className="flex items-center px-3 py-1.5 bg-[#252526] text-[#858585] font-semibold text-[11px] border-b border-[#2d2d2d]">
                      <div className="flex-1">Name</div>
                      <div className="w-48 hidden sm:block">Path</div>
                      <div className="w-36 hidden md:block">Modified</div>
                      <div className="w-24 text-right">Items</div>
                    </div>
                    {homeFolders.map((folder) => {
                      const isSelected = selectedItem?.id === folder.id;
                      const counts = getFolderDescendantCounts(folder.id, folders, files);

                      return (
                        <div
                          key={folder.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, folder.id, 'folder', folder.name)}
                          onDragOver={(e) => handleDragOver(e, folder.id)}
                          onDrop={(e) => handleDrop(e, folder.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem({ id: folder.id, type: 'folder' });
                          }}
                          onDoubleClick={() => navigateToFolder(folder.id)}
                          onContextMenu={(e) => openContextMenu(e, 'folder', folder.id, folder.name, folder.path)}
                          className={`flex items-center px-3 py-2 cursor-pointer border-b border-[#2d2d2d] transition-colors ${
                            isSelected
                              ? 'bg-[#007acc]/20 text-white font-medium'
                              : 'hover:bg-[#2a2d2e] text-[#cccccc] hover:text-white'
                          }`}
                        >
                          <div className="flex-1 flex items-center gap-2 truncate pr-2">
                            <Folder className="w-4 h-4 text-[#dcb67a] shrink-0" />
                            <span className="truncate font-medium">{folder.name}</span>
                          </div>
                          <div className="w-48 text-[11px] text-[#858585] font-mono truncate hidden sm:block">
                            {folder.path}
                          </div>
                          <div className="w-36 text-[11px] text-[#858585] hidden md:block">
                            {formatDate(folder.updatedAt)}
                          </div>
                          <div className="w-24 text-right text-[11px] text-[#858585]">
                            {counts.fileCount} files
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recent Files Section */}
              {recentFiles.length > 0 && (
                <div>
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#2d2d2d]">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-sky-400" />
                      <h2 className="text-sm font-semibold text-white tracking-wide">Recent Files</h2>
                      <span className="px-2 py-0.5 rounded-full text-[11px] bg-[#2a2d2e] text-[#858585] font-mono">
                        {recentFiles.length}
                      </span>
                    </div>
                  </div>

                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {recentFiles.slice(0, 12).map((file) => {
                        const isSelected = selectedItem?.id === file.id;

                        return (
                          <div
                            key={file.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, file.id, 'file', file.name)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem({ id: file.id, type: 'file' });
                              onSelectFile?.(file.id);
                            }}
                            onDoubleClick={() => onOpenFileInEditor(file.id)}
                            onContextMenu={(e) => openContextMenu(e, 'file', file.id, file.name, file.path)}
                            className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-[#007acc]/20 border-[#007acc] shadow-md'
                                : 'bg-[#252526]/60 hover:bg-[#2a2d2e] border-[#333333] hover:border-[#444444]'
                            }`}
                          >
                            <div className="w-10 h-10 flex items-center justify-center mb-1.5 drop-shadow">
                              {getFileIcon(file.name, file.language)}
                            </div>
                            <span className="text-xs font-medium text-center truncate max-w-full text-white">
                              {file.name}
                            </span>
                            <span className="text-[10px] text-[#858585] truncate max-w-full font-mono mt-0.5">
                              {file.path}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col border border-[#2d2d2d] rounded overflow-hidden">
                      <div className="flex items-center px-3 py-1.5 bg-[#252526] text-[#858585] font-semibold text-[11px] border-b border-[#2d2d2d]">
                        <div className="flex-1">Name</div>
                        <div className="w-48 hidden sm:block">Location</div>
                        <div className="w-36 hidden md:block">Modified</div>
                        <div className="w-24 text-right">Size</div>
                      </div>
                      {recentFiles.slice(0, 15).map((file) => {
                        const isSelected = selectedItem?.id === file.id;

                        return (
                          <div
                            key={file.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, file.id, 'file', file.name)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem({ id: file.id, type: 'file' });
                              onSelectFile?.(file.id);
                            }}
                            onDoubleClick={() => onOpenFileInEditor(file.id)}
                            onContextMenu={(e) => openContextMenu(e, 'file', file.id, file.name, file.path)}
                            className={`flex items-center px-3 py-1.5 cursor-pointer border-b border-[#2d2d2d] transition-colors ${
                              isSelected
                                ? 'bg-[#007acc]/20 text-white font-medium'
                                : 'hover:bg-[#2a2d2e] text-[#cccccc] hover:text-white'
                            }`}
                          >
                            <div className="flex-1 flex items-center gap-2 truncate pr-2">
                              {getFileIcon(file.name, file.language)}
                              <span className="truncate">{file.name}</span>
                            </div>
                            <div className="w-48 text-[11px] text-[#858585] font-mono truncate hidden sm:block">
                              {file.path}
                            </div>
                            <div className="w-36 text-[11px] text-[#858585] hidden md:block">
                              {formatDate(file.updatedAt)}
                            </div>
                            <div className="w-24 text-right text-[11px] text-[#858585]">
                              {formatBytes(file.content?.length || 0)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : totalItemCount === 0 && !isCreatingNew ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
              <Folder className="w-16 h-16 text-[#3c3c3c] mb-3" />
              <p className="text-sm font-medium text-[#858585]">This folder is empty.</p>
              <div className="flex items-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew('file')}
                  className="px-3 py-1.5 bg-[#252526] hover:bg-[#333333] border border-[#3c3c3c] rounded text-xs text-white flex items-center gap-1.5 transition-colors"
                >
                  <FilePlus className="w-3.5 h-3.5 text-[#007acc]" />
                  <span>Create file</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew('folder')}
                  className="px-3 py-1.5 bg-[#252526] hover:bg-[#333333] border border-[#3c3c3c] rounded text-xs text-white flex items-center gap-1.5 transition-colors"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-[#dcb67a]" />
                  <span>Create folder</span>
                </button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            /* GRID VIEW (Large Icons Cards) */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {/* Folder Cards */}
              {currentItems.folders.map((folder) => {
                const isSelected = selectedItem?.id === folder.id;
                const isDragTarget = dragOverTargetId === folder.id;

                return (
                  <div
                    key={folder.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, folder.id, 'folder', folder.name)}
                    onDragOver={(e) => handleDragOver(e, folder.id)}
                    onDrop={(e) => handleDrop(e, folder.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedItem({ id: folder.id, type: 'folder' });
                    }}
                    onDoubleClick={() => navigateToFolder(folder.id)}
                    onContextMenu={(e) => openContextMenu(e, 'folder', folder.id, folder.name, folder.path)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#007acc]/20 border-[#007acc] shadow-md'
                        : isDragTarget
                        ? 'bg-[#007acc]/30 border-[#007acc] scale-105'
                        : 'bg-[#252526]/60 hover:bg-[#2a2d2e] border-transparent hover:border-[#3c3c3c]'
                    }`}
                  >
                    <Folder className="w-12 h-12 text-[#dcb67a] mb-2 drop-shadow" />
                    <span className="text-xs font-medium text-center truncate max-w-full text-white">
                      {folder.name}
                    </span>
                    <span className="text-[10px] text-[#858585] mt-0.5">Folder</span>
                  </div>
                );
              })}

              {/* File Cards */}
              {currentItems.files.map((file) => {
                const isSelected = selectedItem?.id === file.id;
                const isActive = file.id === activeFileId;

                return (
                  <div
                    key={file.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, file.id, 'file', file.name)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedItem({ id: file.id, type: 'file' });
                      onSelectFile?.(file.id);
                    }}
                    onDoubleClick={() => onOpenFileInEditor(file.id)}
                    onContextMenu={(e) => openContextMenu(e, 'file', file.id, file.name, file.path)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#007acc]/20 border-[#007acc] shadow-md'
                        : isActive
                        ? 'bg-[#2a2d2e] border-[#007acc]/40'
                        : 'bg-[#252526]/60 hover:bg-[#2a2d2e] border-transparent hover:border-[#3c3c3c]'
                    }`}
                  >
                    <div className="w-12 h-12 flex items-center justify-center mb-2 drop-shadow">
                      {file.name.endsWith('.html') ? (
                        <Globe className="w-10 h-10 text-[#e34c26]" />
                      ) : file.name.endsWith('.css') ? (
                        <Code2 className="w-10 h-10 text-[#264de4]" />
                      ) : file.name.endsWith('.ts') || file.name.endsWith('.tsx') ? (
                        <FileCode className="w-10 h-10 text-[#3178c6]" />
                      ) : file.name.endsWith('.js') || file.name.endsWith('.jsx') ? (
                        <FileCode className="w-10 h-10 text-[#f7df1e]" />
                      ) : file.name.endsWith('.py') ? (
                        <Code2 className="w-10 h-10 text-[#3776ab]" />
                      ) : file.name.endsWith('.json') ? (
                        <FileJson className="w-10 h-10 text-[#f59e0b]" />
                      ) : (
                        <FileText className="w-10 h-10 text-[#858585]" />
                      )}
                    </div>
                    <span className="text-xs font-medium text-center truncate max-w-full text-white">
                      {file.name}
                    </span>
                    <span className="text-[10px] text-[#858585] mt-0.5">
                      {formatBytes(file.content?.length || 0)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            /* DETAILS VIEW (Table View) */
            <div className="flex flex-col w-full text-xs">
              {/* Table Header */}
              <div className="flex items-center px-3 py-1.5 bg-[#252526] border-b border-[#3c3c3c] text-[#858585] font-semibold select-none sticky top-0 z-10">
                <div
                  onClick={() => toggleSort('name')}
                  className="flex-1 flex items-center gap-1 cursor-pointer hover:text-white"
                >
                  <span>Name</span>
                  {sortField === 'name' && (
                    <ArrowUpDown className="w-3 h-3 text-[#007acc]" />
                  )}
                </div>
                <div
                  onClick={() => toggleSort('updatedAt')}
                  className="w-40 flex items-center gap-1 cursor-pointer hover:text-white hidden sm:flex"
                >
                  <span>Date modified</span>
                  {sortField === 'updatedAt' && (
                    <ArrowUpDown className="w-3 h-3 text-[#007acc]" />
                  )}
                </div>
                <div
                  onClick={() => toggleSort('type')}
                  className="w-36 flex items-center gap-1 cursor-pointer hover:text-white hidden md:flex"
                >
                  <span>Type</span>
                  {sortField === 'type' && (
                    <ArrowUpDown className="w-3 h-3 text-[#007acc]" />
                  )}
                </div>
                <div
                  onClick={() => toggleSort('size')}
                  className="w-24 flex items-center justify-end gap-1 cursor-pointer hover:text-white"
                >
                  <span>Size</span>
                  {sortField === 'size' && (
                    <ArrowUpDown className="w-3 h-3 text-[#007acc]" />
                  )}
                </div>
              </div>

              {/* Folder Rows */}
              {currentItems.folders.map((folder) => {
                const isSelected = selectedItem?.id === folder.id;

                return (
                  <div
                    key={folder.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, folder.id, 'folder', folder.name)}
                    onDragOver={(e) => handleDragOver(e, folder.id)}
                    onDrop={(e) => handleDrop(e, folder.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedItem({ id: folder.id, type: 'folder' });
                    }}
                    onDoubleClick={() => navigateToFolder(folder.id)}
                    onContextMenu={(e) => openContextMenu(e, 'folder', folder.id, folder.name, folder.path)}
                    className={`flex items-center px-3 py-1.5 cursor-pointer border-b border-[#2d2d2d] transition-colors ${
                      isSelected
                        ? 'bg-[#007acc]/20 text-white font-medium'
                        : 'hover:bg-[#2a2d2e] text-[#cccccc] hover:text-white'
                    }`}
                  >
                    <div className="flex-1 flex items-center gap-2 truncate pr-2">
                      <Folder className="w-4 h-4 text-[#dcb67a] shrink-0" />
                      <span className="truncate">{folder.name}</span>
                    </div>
                    <div className="w-40 text-[11px] text-[#858585] hidden sm:block">
                      {formatDate(folder.updatedAt)}
                    </div>
                    <div className="w-36 text-[11px] text-[#858585] hidden md:block">
                      File folder
                    </div>
                    <div className="w-24 text-right text-[11px] text-[#858585]">-</div>
                  </div>
                );
              })}

              {/* File Rows */}
              {currentItems.files.map((file) => {
                const isSelected = selectedItem?.id === file.id;

                return (
                  <div
                    key={file.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, file.id, 'file', file.name)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedItem({ id: file.id, type: 'file' });
                      onSelectFile?.(file.id);
                    }}
                    onDoubleClick={() => onOpenFileInEditor(file.id)}
                    onContextMenu={(e) => openContextMenu(e, 'file', file.id, file.name, file.path)}
                    className={`flex items-center px-3 py-1.5 cursor-pointer border-b border-[#2d2d2d] transition-colors ${
                      isSelected
                        ? 'bg-[#007acc]/20 text-white font-medium'
                        : 'hover:bg-[#2a2d2e] text-[#cccccc] hover:text-white'
                    }`}
                  >
                    <div className="flex-1 flex items-center gap-2 truncate pr-2">
                      {getFileIcon(file.name, file.language)}
                      <span className="truncate">{file.name}</span>
                    </div>
                    <div className="w-40 text-[11px] text-[#858585] hidden sm:block">
                      {formatDate(file.updatedAt)}
                    </div>
                    <div className="w-36 text-[11px] text-[#858585] hidden md:block">
                      {getFileDescription(file.name, file.language)}
                    </div>
                    <div className="w-24 text-right text-[11px] text-[#858585]">
                      {formatBytes(file.content?.length || 0)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT PREVIEW / DETAILS PANE (Windows 11 Details Pane) */}
        {showPreviewPane && (selectedFile || selectedFolder) && (
          <div className="w-72 bg-[#181818] border-l border-[#2d2d2d] flex flex-col p-3 text-xs overflow-y-auto shrink-0 hidden lg:flex">
            <div className="flex items-center justify-between pb-2 border-b border-[#2d2d2d] mb-3">
              <span className="font-semibold text-white">Item Details</span>
              <button
                type="button"
                onClick={() => setShowPreviewPane(false)}
                className="text-[#858585] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {selectedFile ? (
              <div className="flex flex-col gap-3">
                {/* Big Icon & Name */}
                <div className="flex flex-col items-center p-3 bg-[#252526] rounded border border-[#2d2d2d]">
                  <div className="mb-2">
                    {getFileIcon(selectedFile.name, selectedFile.language)}
                  </div>
                  <span className="font-medium text-center text-white break-all">
                    {selectedFile.name}
                  </span>
                  <span className="text-[10px] text-[#858585] mt-0.5">
                    {getFileDescription(selectedFile.name, selectedFile.language)}
                  </span>
                </div>

                {/* Properties */}
                <div className="flex flex-col gap-1.5 text-[11px]">
                  <div className="flex justify-between py-1 border-b border-[#2d2d2d]">
                    <span className="text-[#858585]">Size:</span>
                    <span className="text-white font-mono">{formatBytes(selectedFile.content?.length || 0)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#2d2d2d]">
                    <span className="text-[#858585]">Path:</span>
                    <span className="text-white font-mono truncate max-w-[150px]">{selectedFile.path}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#2d2d2d]">
                    <span className="text-[#858585]">Modified:</span>
                    <span className="text-white">{formatDate(selectedFile.updatedAt)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#2d2d2d]">
                    <span className="text-[#858585]">Lines:</span>
                    <span className="text-white font-mono">{(selectedFile.content || '').split('\n').length}</span>
                  </div>
                </div>

                {/* Open in Editor CTA */}
                <button
                  type="button"
                  onClick={() => onOpenFileInEditor(selectedFile.id)}
                  className="w-full py-1.5 bg-[#007acc] hover:bg-[#1177bb] text-white rounded font-medium flex items-center justify-center gap-2 transition-colors mt-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Monaco Editor</span>
                </button>

                {/* Code Snippet Preview */}
                <div className="flex flex-col gap-1 mt-1">
                  <span className="text-[10px] text-[#858585] uppercase font-bold tracking-wider">Preview</span>
                  <div className="p-2 bg-[#141414] border border-[#2d2d2d] rounded text-[10px] font-mono text-[#cccccc] max-h-48 overflow-hidden select-text whitespace-pre-wrap opacity-80">
                    {selectedFile.content?.slice(0, 400) || '// (Empty file)'}
                    {(selectedFile.content?.length || 0) > 400 && '\n...'}
                  </div>
                </div>
              </div>
            ) : selectedFolder ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col items-center p-3 bg-[#252526] rounded border border-[#2d2d2d]">
                  <Folder className="w-12 h-12 text-[#dcb67a] mb-2" />
                  <span className="font-medium text-center text-white break-all">{selectedFolder.name}</span>
                  <span className="text-[10px] text-[#858585] mt-0.5">File folder</span>
                </div>

                <div className="flex flex-col gap-1.5 text-[11px]">
                  <div className="flex justify-between py-1 border-b border-[#2d2d2d]">
                    <span className="text-[#858585]">Path:</span>
                    <span className="text-white font-mono truncate max-w-[150px]">{selectedFolder.path}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#2d2d2d]">
                    <span className="text-[#858585]">Modified:</span>
                    <span className="text-white">{formatDate(selectedFolder.updatedAt)}</span>
                  </div>
                  {(() => {
                    const counts = getFolderDescendantCounts(selectedFolder.id, folders, files);
                    return (
                      <>
                        <div className="flex justify-between py-1 border-b border-[#2d2d2d]">
                          <span className="text-[#858585]">Contains:</span>
                          <span className="text-white">{counts.fileCount} files, {counts.folderCount} folders</span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <button
                  type="button"
                  onClick={() => navigateToFolder(selectedFolder.id)}
                  className="w-full py-1.5 bg-[#007acc] hover:bg-[#1177bb] text-white rounded font-medium flex items-center justify-center gap-2 transition-colors mt-1"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Open Folder</span>
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* WINDOW STATUS BAR */}
      <div className="flex items-center justify-between h-6 px-3 bg-[#181818] border-t border-[#2d2d2d] text-[11px] text-[#858585] shrink-0 select-none">
        <div>
          {isHome ? (
            <span>{homeFolders.length} {homeFolders.length === 1 ? 'folder' : 'folders'}, {recentFiles.length} files</span>
          ) : (
            <span>{totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}</span>
          )}
          {selectedItem && (
            <span className="ml-3 pl-3 border-l border-[#333333] text-[#cccccc]">
              1 item selected {selectedFile ? `(${formatBytes(selectedFile.content?.length || 0)})` : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span>Windows File Explorer Mode</span>
        </div>
      </div>

      {/* FLOATING CONTEXT MENU */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 min-w-[170px] bg-[#1e1e1e] border border-[#3c3c3c] rounded shadow-2xl py-1 text-xs text-[#cccccc]"
        >
          {contextMenu.type === 'file' && (
            <>
              <button
                type="button"
                onClick={() => {
                  if (contextMenu.targetId) onOpenFileInEditor(contextMenu.targetId);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex items-center gap-2"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Monaco Editor</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (contextMenu.targetId && contextMenu.targetName) {
                    setRenamingItem({ id: contextMenu.targetId, type: 'file', name: contextMenu.targetName });
                    setRenameValue(contextMenu.targetName);
                  }
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex items-center gap-2"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Rename</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (contextMenu.targetId) onDuplicateFile(contextMenu.targetId);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex items-center gap-2"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicate</span>
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
                  if (contextMenu.targetId) navigateToFolder(contextMenu.targetId);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex items-center gap-2"
              >
                <FolderOpen className="w-3.5 h-3.5 text-[#dcb67a]" />
                <span>Open Folder</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (contextMenu.targetId && contextMenu.targetName) {
                    setRenamingItem({ id: contextMenu.targetId, type: 'folder', name: contextMenu.targetName });
                    setRenameValue(contextMenu.targetName);
                  }
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex items-center gap-2"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Rename</span>
              </button>
              {onOpenFolderAsWorkspace && (
                <button
                  type="button"
                  onClick={() => {
                    if (contextMenu.targetId) {
                      onOpenFolderAsWorkspace(contextMenu.targetId);
                      onClose();
                    }
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex items-center gap-2 text-sky-300 font-medium"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Open Folder in Code Editor</span>
                </button>
              )}
              <div className="h-px bg-[#333333] my-1" />
              <button
                type="button"
                onClick={() => {
                  const f = folders.find((fol) => fol.id === contextMenu.targetId);
                  if (f) setDeleteConfirmFolder(f);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-red-900/60 hover:text-red-300 text-red-400 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </>
          )}

          {contextMenu.type === 'canvas' && (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNew('file');
                  setNewItemName('');
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex items-center gap-2"
              >
                <FilePlus className="w-3.5 h-3.5 text-[#007acc]" />
                <span>New File</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNew('folder');
                  setNewItemName('');
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex items-center gap-2"
              >
                <FolderPlus className="w-3.5 h-3.5 text-[#dcb67a]" />
                <span>New Folder</span>
              </button>
              <div className="h-px bg-[#333333] my-1" />
              <button
                type="button"
                onClick={() => {
                  setViewMode(viewMode === 'nested' ? 'grid' : viewMode === 'grid' ? 'details' : 'nested');
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#007acc] hover:text-white flex items-center gap-2"
              >
                <FolderTree className="w-3.5 h-3.5" />
                <span>Toggle View (Nested / Grid / Details)</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
