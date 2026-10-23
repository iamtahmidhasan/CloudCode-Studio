import Dexie, { type Table } from 'dexie';
import type { Project, FileItem, FolderItem, EditorSettings, WorkspaceState } from '@/types';

export class EditorDatabase extends Dexie {
  projects!: Table<Project, string>;
  files!: Table<FileItem, string>;
  folders!: Table<FolderItem, string>;
  settings!: Table<EditorSettings, string>;
  workspace!: Table<WorkspaceState, string>;

  constructor() {
    super('BrowserEditorDB');

    this.version(1).stores({
      projects: 'id, name, template, createdAt, updatedAt, lastOpenedAt',
      files: 'id, projectId, path, language, updatedAt',
      settings: 'id',
      workspace: 'id',
    });

    this.version(2).stores({
      projects: 'id, name, template, createdAt, updatedAt, lastOpenedAt',
      files: 'id, projectId, folderId, path, language, updatedAt',
      folders: 'id, projectId, parentId, path, name',
      settings: 'id',
      workspace: 'id',
    }).upgrade(async (tx) => {
      // Create folder records for any existing files that have nested directory paths
      const filesTable = tx.table('files');
      const foldersTable = tx.table('folders');
      const allFiles = await filesTable.toArray();
      const folderMap = new Map<string, string>(); // projectId:path -> folderId

      for (const f of allFiles) {
        if (f.path && f.path.includes('/')) {
          const parts = f.path.split('/').filter(Boolean);
          parts.pop(); // remove filename
          let currentPath = '';
          let parentId: string | null = null;

          for (const part of parts) {
            currentPath += '/' + part;
            const key = `${f.projectId}:${currentPath}`;
            let folderId = folderMap.get(key);
            if (!folderId) {
              folderId = `folder-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
              folderMap.set(key, folderId);
              await foldersTable.add({
                id: folderId,
                projectId: f.projectId,
                parentId,
                name: part,
                path: currentPath,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              });
            }
            parentId = folderId;
          }

          if (parentId) {
            await filesTable.update(f.id, { folderId: parentId });
          }
        }
      }
    });
  }
}

export const db = new EditorDatabase();

export const DEFAULT_SETTINGS: EditorSettings = {
  id: 'current',
  theme: 'vscode-dark-plus',
  fontSize: 14,
  tabSize: 2,
  wordWrap: 'on',
  minimapEnabled: true,
  lineNumbersEnabled: true,
  autoSaveEnabled: true,
};

export const DEFAULT_WORKSPACE: WorkspaceState = {
  id: 'current',
  activeProjectId: null,
  activeFileId: null,
  openFileIds: [],
  expandedFolderIds: [],
  activeWorkspaceRootId: null,
  activeWorkspaceName: undefined,
  activePanel: 'code',
  isSidebarOpen: true,
  isBottomPanelOpen: true,
  bottomPanelTab: 'preview',
  panelPosition: 'bottom',
  panelLayoutMode: 'tabs',
  bottomPanelHeight: 280,
  sidePanelWidth: 460,
  splitRatio: 0.5,
  lastUpdatedAt: Date.now(),
};
