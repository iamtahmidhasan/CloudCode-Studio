export type SupportedLanguage =
  | 'html'
  | 'css'
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'cpp';

export type ProjectTemplate = 'web' | 'typescript' | 'python' | 'cpp' | 'empty';

export interface FileItem {
  id: string;
  projectId: string;
  name: string;
  path: string;
  language: SupportedLanguage;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  template: ProjectTemplate;
  createdAt: number;
  updatedAt: number;
  lastOpenedAt: number;
}

export interface EditorSettings {
  id: 'current';
  theme: 'vscode-dark-plus' | 'vscode-light-plus';
  fontSize: number;
  tabSize: number;
  wordWrap: 'on' | 'off';
  minimapEnabled: boolean;
  lineNumbersEnabled: boolean;
  autoSaveEnabled: boolean;
}

export type MobileTab = 'code' | 'preview' | 'output' | 'files';
export type PanelPosition = 'bottom' | 'right';
export type PanelLayoutMode = 'tabs' | 'split';

export interface WorkspaceState {
  id: 'current';
  activeProjectId: string | null;
  activeFileId: string | null;
  openFileIds: string[];
  activePanel: MobileTab;
  isSidebarOpen: boolean;
  isBottomPanelOpen: boolean;
  bottomPanelTab: 'preview' | 'output';
  panelPosition: PanelPosition;
  panelLayoutMode: PanelLayoutMode;
  bottomPanelHeight: number;
  sidePanelWidth: number;
  splitRatio: number;
  lastUpdatedAt: number;
}

export type ConsoleMessageType = 'log' | 'info' | 'warn' | 'error' | 'system';

export interface ConsoleMessage {
  id: string;
  type: ConsoleMessageType;
  args: string[];
  timestamp: number;
}

export type ExecutionStatus = 'idle' | 'compiling' | 'running' | 'success' | 'error';

export interface ExecutionResult {
  success: boolean;
  messages: ConsoleMessage[];
  error?: string;
  executionTimeMs?: number;
}
