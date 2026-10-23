import Dexie, { type Table } from 'dexie';
import type { Project, FileItem, EditorSettings, WorkspaceState } from '@/types';

export class EditorDatabase extends Dexie {
  projects!: Table<Project, string>;
  files!: Table<FileItem, string>;
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
