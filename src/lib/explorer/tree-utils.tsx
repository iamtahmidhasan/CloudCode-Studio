import React from 'react';
import type { FolderItem, FileItem } from '@/types';
import {
  FileCode,
  FileText,
  FileJson,
  Image as ImageIcon,
  Globe,
  Code2,
  Package,
} from 'lucide-react';

export interface TreeFileNode {
  type: 'file';
  id: string;
  name: string;
  path: string;
  depth: number;
  file: FileItem;
}

export interface TreeFolderNode {
  type: 'folder';
  id: string;
  name: string;
  path: string;
  depth: number;
  folder: FolderItem;
  children: TreeNode[];
  isExpanded: boolean;
  isEmpty: boolean;
}

export type TreeNode = TreeFileNode | TreeFolderNode;

export function getFileIcon(filename: string, language?: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || language;
  const lowerName = filename.toLowerCase();

  if (lowerName === 'package.json') {
    return <Package className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
  }

  switch (ext) {
    case 'html':
    case 'htm':
      return <Globe className="w-3.5 h-3.5 text-[#e34c26] shrink-0" />;
    case 'css':
    case 'scss':
    case 'less':
      return <Code2 className="w-3.5 h-3.5 text-[#264de4] shrink-0" />;
    case 'js':
    case 'mjs':
    case 'cjs':
      return <FileCode className="w-3.5 h-3.5 text-[#f7df1e] shrink-0" />;
    case 'jsx':
      return <FileCode className="w-3.5 h-3.5 text-[#61dafb] shrink-0" />;
    case 'ts':
      return <FileCode className="w-3.5 h-3.5 text-[#3178c6] shrink-0" />;
    case 'tsx':
      return <FileCode className="w-3.5 h-3.5 text-[#00b4d8] shrink-0" />;
    case 'py':
      return <Code2 className="w-3.5 h-3.5 text-[#3776ab] shrink-0" />;
    case 'cpp':
    case 'cxx':
    case 'cc':
    case 'c':
    case 'h':
    case 'hpp':
      return <Code2 className="w-3.5 h-3.5 text-[#659ad2] shrink-0" />;
    case 'json':
      return <FileJson className="w-3.5 h-3.5 text-[#f59e0b] shrink-0" />;
    case 'md':
    case 'markdown':
      return <FileText className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'ico':
    case 'webp':
      return <ImageIcon className="w-3.5 h-3.5 text-[#c084fc] shrink-0" />;
    default:
      return <FileText className="w-3.5 h-3.5 text-[#858585] shrink-0" />;
  }
}

/**
 * Builds a hierarchical tree from flat lists of folders and files.
 * If rootFolderId is provided, tree starts with immediate children of rootFolderId at depth 0.
 */
export function buildFileTree(
  folders: FolderItem[],
  files: FileItem[],
  expandedFolderIds: string[],
  rootFolderId: string | null = null
): TreeNode[] {
  const expandedSet = new Set(expandedFolderIds || []);

  function buildBranch(parentId: string | null, depth: number): TreeNode[] {
    // 1. Child folders
    const childFolders = folders
      .filter((f) => (f.parentId || null) === (parentId || null))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    // 2. Child files
    const childFiles = files
      .filter((f) => (f.folderId || null) === (parentId || null))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    const nodes: TreeNode[] = [];

    // Add folders first
    for (const folder of childFolders) {
      const isExpanded = expandedSet.has(folder.id);
      const subChildren = buildBranch(folder.id, depth + 1);

      const folderNode: TreeFolderNode = {
        type: 'folder',
        id: folder.id,
        name: folder.name,
        path: folder.path,
        depth,
        folder,
        children: subChildren,
        isExpanded,
        isEmpty: subChildren.length === 0,
      };

      nodes.push(folderNode);
    }

    // Add files
    for (const file of childFiles) {
      const fileNode: TreeFileNode = {
        type: 'file',
        id: file.id,
        name: file.name,
        path: file.path,
        depth,
        file,
      };
      nodes.push(fileNode);
    }

    return nodes;
  }

  return buildBranch(rootFolderId, 0);
}

/**
 * Returns a Set containing rootFolderId and all its recursive descendant folder IDs
 */
export function getWorkspaceDescendantIds(
  rootFolderId: string,
  folders: FolderItem[]
): Set<string> {
  const ids = new Set<string>([rootFolderId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const f of folders) {
      if (f.parentId && ids.has(f.parentId) && !ids.has(f.id)) {
        ids.add(f.id);
        changed = true;
      }
    }
  }
  return ids;
}

/**
 * Filters folders and files to only those inside the active workspace root.
 * If rootFolderId is null, returns all items unchanged.
 */
export function filterWorkspaceItems(
  folders: FolderItem[],
  files: FileItem[],
  rootFolderId: string | null
): {
  workspaceFolders: FolderItem[];
  workspaceFiles: FileItem[];
  rootFolder: FolderItem | undefined;
} {
  if (!rootFolderId) {
    return {
      workspaceFolders: folders,
      workspaceFiles: files,
      rootFolder: undefined,
    };
  }

  const rootFolder = folders.find((f) => f.id === rootFolderId);
  if (!rootFolder) {
    return {
      workspaceFolders: folders,
      workspaceFiles: files,
      rootFolder: undefined,
    };
  }

  const descendantFolderIds = getWorkspaceDescendantIds(rootFolderId, folders);

  const workspaceFolders = folders.filter(
    (f) => descendantFolderIds.has(f.id) && f.id !== rootFolderId
  );

  const workspaceFiles = files.filter(
    (f) =>
      (f.folderId && descendantFolderIds.has(f.folderId)) ||
      f.path.startsWith(rootFolder.path + '/')
  );

  return {
    workspaceFolders,
    workspaceFiles,
    rootFolder,
  };
}

/**
 * Resolves a workspace relative path (e.g. ./styles/style.css or ../app.js)
 * and enforces security traversal boundaries: returns null if the path attempts
 * to break out of rootFolderPath.
 */
export function resolveWorkspaceRelativePath(
  sourceFilePath: string,
  relativePath: string,
  rootFolderPath: string = ''
): string | null {
  const cleanRel = relativePath.split('?')[0].split('#')[0].trim();
  if (
    !cleanRel ||
    cleanRel.startsWith('http://') ||
    cleanRel.startsWith('https://') ||
    cleanRel.startsWith('data:')
  ) {
    return null;
  }

  // Determine base folder of source file
  const sourceDir = sourceFilePath.includes('/')
    ? sourceFilePath.substring(0, sourceFilePath.lastIndexOf('/'))
    : '';

  let fullPath = '';
  if (cleanRel.startsWith('/')) {
    fullPath = rootFolderPath ? `${rootFolderPath}${cleanRel}` : cleanRel;
  } else {
    fullPath = sourceDir ? `${sourceDir}/${cleanRel}` : `/${cleanRel}`;
  }

  // Normalize path segments (handling . and ..)
  const parts = fullPath.split('/').filter(Boolean);
  const normalizedParts: string[] = [];
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') {
      normalizedParts.pop();
    } else {
      normalizedParts.push(part);
    }
  }

  const normalizedPath = '/' + normalizedParts.join('/');

  // Traversal boundary check
  if (rootFolderPath) {
    const normalizedRoot = rootFolderPath.startsWith('/') ? rootFolderPath : `/${rootFolderPath}`;
    if (normalizedPath !== normalizedRoot && !normalizedPath.startsWith(normalizedRoot + '/')) {
      return null;
    }
  }

  return normalizedPath;
}

/**
 * Checks if targetFolderId is a descendant of folderId (to prevent cycles during move)
 */
export function isDescendantOf(
  targetFolderId: string,
  ancestorFolderId: string,
  folders: FolderItem[]
): boolean {
  if (targetFolderId === ancestorFolderId) return true;

  let current = folders.find((f) => f.id === targetFolderId);
  while (current && current.parentId) {
    if (current.parentId === ancestorFolderId) return true;
    current = folders.find((f) => f.id === current?.parentId);
  }

  return false;
}

/**
 * Computes how many files and folders exist inside a given folder
 */
export function getFolderDescendantCounts(
  folderId: string,
  folders: FolderItem[],
  files: FileItem[]
): { fileCount: number; folderCount: number } {
  const folderIds = new Set<string>([folderId]);

  let changed = true;
  while (changed) {
    changed = false;
    for (const f of folders) {
      if (f.parentId && folderIds.has(f.parentId) && !folderIds.has(f.id)) {
        folderIds.add(f.id);
        changed = true;
      }
    }
  }

  const subfolderCount = folderIds.size - 1; // exclude itself
  let fileCount = 0;

  for (const file of files) {
    if (file.folderId && folderIds.has(file.folderId)) {
      fileCount++;
    }
  }

  return { fileCount, folderCount: subfolderCount };
}
