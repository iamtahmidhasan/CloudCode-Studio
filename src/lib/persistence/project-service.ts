import { db, DEFAULT_SETTINGS, DEFAULT_WORKSPACE } from '../database/db';
import { SEED_TEMPLATES } from '../database/seed';
import type {
  Project,
  FileItem,
  SupportedLanguage,
  ProjectTemplate,
  WorkspaceState,
  EditorSettings,
} from '@/types';

export function detectLanguageFromFilename(filename: string): SupportedLanguage {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
      return 'css';
    case 'js':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'py':
      return 'python';
    case 'cpp':
    case 'cxx':
    case 'cc':
    case 'c':
    case 'h':
    case 'hpp':
      return 'cpp';
    default:
      return 'javascript';
  }
}

export const ProjectService = {
  async getProjects(): Promise<Project[]> {
    return await db.projects.orderBy('lastOpenedAt').reverse().toArray();
  },

  async getProject(projectId: string): Promise<Project | undefined> {
    return await db.projects.get(projectId);
  },

  async getFiles(projectId: string): Promise<FileItem[]> {
    return await db.files.where('projectId').equals(projectId).toArray();
  },

  async getFile(fileId: string): Promise<FileItem | undefined> {
    return await db.files.get(fileId);
  },

  async getWorkspace(): Promise<WorkspaceState> {
    const ws = await db.workspace.get('current');
    return { ...DEFAULT_WORKSPACE, ...(ws || {}) };
  },

  async getSettings(): Promise<EditorSettings> {
    const s = await db.settings.get('current');
    return { ...DEFAULT_SETTINGS, ...(s || {}) };
  },

  async updateSettings(changes: Partial<EditorSettings>): Promise<void> {
    const current = await this.getSettings();
    await db.settings.put({ ...current, ...changes, id: 'current' });
  },

  async updateWorkspace(changes: Partial<WorkspaceState>): Promise<void> {
    const current = await this.getWorkspace();
    await db.workspace.put({
      ...current,
      ...changes,
      id: 'current',
      lastUpdatedAt: Date.now(),
    });
  },

  async createProject(
    name: string,
    template: ProjectTemplate = 'empty',
    description: string = ''
  ): Promise<{ project: Project; activeFile: FileItem }> {
    const now = Date.now();
    const projectId = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const templateData = SEED_TEMPLATES[template] || SEED_TEMPLATES.empty;

    const project: Project = {
      id: projectId,
      name: name.trim() || templateData.name,
      description: description || templateData.description,
      template,
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
    };

    await db.projects.add(project);

    let firstFile: FileItem | null = null;
    const createdFileIds: string[] = [];

    for (let i = 0; i < templateData.files.length; i++) {
      const f = templateData.files[i];
      const fileId = `file-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;
      const file: FileItem = {
        id: fileId,
        projectId,
        name: f.name,
        path: f.path,
        language: f.language,
        content: f.content,
        createdAt: now + i,
        updatedAt: now + i,
      };
      await db.files.add(file);
      createdFileIds.push(fileId);
      if (i === 0) firstFile = file;
    }

    if (!firstFile) {
      firstFile = await this.createFile(projectId, 'index.js', '/index.js', '// New file\n');
      createdFileIds.push(firstFile.id);
    }

    await this.updateWorkspace({
      activeProjectId: projectId,
      activeFileId: firstFile.id,
      openFileIds: createdFileIds,
    });

    return { project, activeFile: firstFile };
  },

  async renameProject(projectId: string, newName: string): Promise<void> {
    await db.projects.update(projectId, {
      name: newName.trim(),
      updatedAt: Date.now(),
    });
  },

  async deleteProject(projectId: string): Promise<void> {
    await db.transaction('rw', [db.projects, db.files, db.workspace], async () => {
      await db.files.where('projectId').equals(projectId).delete();
      await db.projects.delete(projectId);

      const ws = await this.getWorkspace();
      if (ws.activeProjectId === projectId) {
        const remaining = await db.projects.toArray();
        if (remaining.length > 0) {
          const next = remaining[0];
          const files = await db.files.where('projectId').equals(next.id).toArray();
          const firstFile = files[0];
          await this.updateWorkspace({
            activeProjectId: next.id,
            activeFileId: firstFile?.id || null,
            openFileIds: firstFile ? [firstFile.id] : [],
          });
        } else {
          // If no projects remain, create a clean default
          await this.createProject('Interactive Web Playground', 'web');
        }
      }
    });
  },

  async duplicateProject(projectId: string): Promise<Project> {
    const original = await this.getProject(projectId);
    if (!original) throw new Error('Project not found');

    const files = await this.getFiles(projectId);
    const now = Date.now();
    const newProjectId = `proj-${now}-${Math.random().toString(36).substring(2, 6)}`;

    const duplicated: Project = {
      ...original,
      id: newProjectId,
      name: `${original.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
    };

    await db.projects.add(duplicated);

    let firstFileId = '';
    const openIds: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const newFileId = `file-${now}-${i}`;
      await db.files.add({
        ...f,
        id: newFileId,
        projectId: newProjectId,
        createdAt: now + i,
        updatedAt: now + i,
      });
      openIds.push(newFileId);
      if (i === 0) firstFileId = newFileId;
    }

    await this.updateWorkspace({
      activeProjectId: newProjectId,
      activeFileId: firstFileId || null,
      openFileIds: openIds,
    });

    return duplicated;
  },

  async switchProject(projectId: string): Promise<void> {
    await db.projects.update(projectId, { lastOpenedAt: Date.now() });
    const files = await this.getFiles(projectId);
    const activeFile = files[0];
    await this.updateWorkspace({
      activeProjectId: projectId,
      activeFileId: activeFile?.id || null,
      openFileIds: activeFile ? [activeFile.id] : [],
    });
  },

  async createFile(
    projectId: string,
    name: string,
    path?: string,
    content: string = ''
  ): Promise<FileItem> {
    const cleanName = name.trim();
    const cleanPath = path || (cleanName.startsWith('/') ? cleanName : `/${cleanName}`);
    const language = detectLanguageFromFilename(cleanName);
    const now = Date.now();
    const fileId = `file-${now}-${Math.random().toString(36).substring(2, 6)}`;

    const file: FileItem = {
      id: fileId,
      projectId,
      name: cleanName,
      path: cleanPath,
      language,
      content,
      createdAt: now,
      updatedAt: now,
    };

    await db.files.add(file);

    // Open newly created file in workspace
    const ws = await this.getWorkspace();
    const openFileIds = ws.openFileIds.includes(fileId) ? ws.openFileIds : [...ws.openFileIds, fileId];
    await this.updateWorkspace({
      activeFileId: fileId,
      openFileIds,
    });

    return file;
  },

  async renameFile(fileId: string, newName: string): Promise<void> {
    const file = await this.getFile(fileId);
    if (!file) return;

    const cleanName = newName.trim();
    const language = detectLanguageFromFilename(cleanName);
    const parts = file.path.split('/');
    parts[parts.length - 1] = cleanName;
    const newPath = parts.join('/');

    await db.files.update(fileId, {
      name: cleanName,
      path: newPath,
      language,
      updatedAt: Date.now(),
    });
  },

  async deleteFile(fileId: string): Promise<void> {
    const file = await this.getFile(fileId);
    if (!file) return;

    await db.files.delete(fileId);
    const ws = await this.getWorkspace();
    const openFileIds = ws.openFileIds.filter((id) => id !== fileId);

    let activeFileId = ws.activeFileId;
    if (activeFileId === fileId) {
      activeFileId = openFileIds.length > 0 ? openFileIds[openFileIds.length - 1] : null;
      if (!activeFileId) {
        const remaining = await this.getFiles(file.projectId);
        activeFileId = remaining[0]?.id || null;
        if (activeFileId) openFileIds.push(activeFileId);
      }
    }

    await this.updateWorkspace({
      activeFileId,
      openFileIds,
    });
  },

  async duplicateFile(fileId: string): Promise<FileItem | undefined> {
    const file = await this.getFile(fileId);
    if (!file) return undefined;

    const extDot = file.name.lastIndexOf('.');
    const baseName = extDot !== -1 ? file.name.substring(0, extDot) : file.name;
    const ext = extDot !== -1 ? file.name.substring(extDot) : '';
    const newName = `${baseName}_copy${ext}`;

    return await this.createFile(file.projectId, newName, undefined, file.content);
  },

  async updateFileContent(fileId: string, content: string): Promise<void> {
    await db.files.update(fileId, {
      content,
      updatedAt: Date.now(),
    });
  },

  async openFileInTab(fileId: string): Promise<void> {
    const ws = await this.getWorkspace();
    const openFileIds = ws.openFileIds.includes(fileId) ? ws.openFileIds : [...ws.openFileIds, fileId];
    await this.updateWorkspace({
      activeFileId: fileId,
      openFileIds,
    });
  },

  async closeFileTab(fileId: string): Promise<void> {
    const ws = await this.getWorkspace();
    const openFileIds = ws.openFileIds.filter((id) => id !== fileId);

    let activeFileId = ws.activeFileId;
    if (activeFileId === fileId) {
      const closedIndex = ws.openFileIds.indexOf(fileId);
      if (openFileIds.length > 0) {
        const nextIndex = Math.min(closedIndex, openFileIds.length - 1);
        activeFileId = openFileIds[nextIndex];
      } else {
        activeFileId = null;
      }
    }

    await this.updateWorkspace({
      activeFileId,
      openFileIds,
    });
  },
};
