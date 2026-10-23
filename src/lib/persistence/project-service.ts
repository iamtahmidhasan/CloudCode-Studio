import { db, DEFAULT_SETTINGS, DEFAULT_WORKSPACE } from '../database/db';
import { SEED_TEMPLATES } from '../database/seed';
import type {
  Project,
  FileItem,
  FolderItem,
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
    case 'jsx':
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
    case 'json':
      return 'json';
    case 'md':
    case 'markdown':
      return 'markdown';
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

  async getFolders(projectId: string): Promise<FolderItem[]> {
    return await db.folders.where('projectId').equals(projectId).toArray();
  },

  async getFolder(folderId: string): Promise<FolderItem | undefined> {
    return await db.folders.get(folderId);
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
    const projectId = `proj-${now}-${Math.random().toString(36).substring(2, 6)}`;
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
    const folderMap = new Map<string, string>(); // path -> folderId

    for (let i = 0; i < templateData.files.length; i++) {
      const f = templateData.files[i];
      let folderId: string | null = null;

      if (f.path && f.path.includes('/')) {
        const parts = f.path.split('/').filter(Boolean);
        if (parts.length > 1) {
          parts.pop(); // remove filename
          let currentPath = '';
          let parentId: string | null = null;

          for (const part of parts) {
            currentPath += '/' + part;
            let existingFolderId = folderMap.get(currentPath);
            if (!existingFolderId) {
              existingFolderId = `folder-${now}-${Math.random().toString(36).substring(2, 6)}`;
              folderMap.set(currentPath, existingFolderId);
              await db.folders.add({
                id: existingFolderId,
                projectId,
                parentId,
                name: part,
                path: currentPath,
                createdAt: now + i,
                updatedAt: now + i,
              });
            }
            parentId = existingFolderId;
          }
          folderId = parentId;
        }
      }

      const fileId = `file-${now}-${i}-${Math.random().toString(36).substring(2, 6)}`;
      const file: FileItem = {
        id: fileId,
        projectId,
        folderId,
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
      firstFile = await this.createFile(projectId, 'index.js', null, '// New file\n');
      createdFileIds.push(firstFile.id);
    }

    await this.updateWorkspace({
      activeProjectId: projectId,
      activeFileId: firstFile.id,
      openFileIds: createdFileIds,
      expandedFolderIds: Array.from(folderMap.values()),
      activeWorkspaceRootId: null,
      activeWorkspaceName: undefined,
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
    await db.transaction('rw', [db.projects, db.files, db.folders, db.workspace], async () => {
      await db.files.where('projectId').equals(projectId).delete();
      await db.folders.where('projectId').equals(projectId).delete();
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
            expandedFolderIds: [],
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
    const folders = await this.getFolders(projectId);
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

    // Duplicate folders and preserve ID mapping
    const folderIdMap = new Map<string, string>();
    for (const folder of folders) {
      const newFolderId = `folder-${now}-${Math.random().toString(36).substring(2, 6)}`;
      folderIdMap.set(folder.id, newFolderId);
    }

    for (const folder of folders) {
      const newFolderId = folderIdMap.get(folder.id)!;
      const newParentId = folder.parentId ? folderIdMap.get(folder.parentId) || null : null;
      await db.folders.add({
        ...folder,
        id: newFolderId,
        projectId: newProjectId,
        parentId: newParentId,
        createdAt: now,
        updatedAt: now,
      });
    }

    let firstFileId = '';
    const openIds: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const newFileId = `file-${now}-${i}`;
      const newFolderId = f.folderId ? folderIdMap.get(f.folderId) || null : null;
      await db.files.add({
        ...f,
        id: newFileId,
        projectId: newProjectId,
        folderId: newFolderId,
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
      expandedFolderIds: Array.from(folderIdMap.values()),
      activeWorkspaceRootId: null,
      activeWorkspaceName: undefined,
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
      activeWorkspaceRootId: null,
      activeWorkspaceName: undefined,
    });
  },

  async createFolder(
    projectId: string,
    name: string,
    parentId: string | null = null
  ): Promise<FolderItem> {
    const cleanName = name.trim();
    if (!cleanName) throw new Error('Folder name cannot be empty.');
    if (/[\\/:*?"<>|]/.test(cleanName)) {
      throw new Error('Folder name cannot contain characters: \\ / : * ? " < > |');
    }

    // Check sibling collision
    const existing = await db.folders
      .where('projectId')
      .equals(projectId)
      .filter((f) => (f.parentId || null) === (parentId || null) && f.name.toLowerCase() === cleanName.toLowerCase())
      .toArray();
    if (existing.length > 0) {
      throw new Error(`A folder named "${cleanName}" already exists in this folder.`);
    }

    let folderPath = '/' + cleanName;
    if (parentId) {
      const parent = await db.folders.get(parentId);
      if (parent) {
        folderPath = `${parent.path}/${cleanName}`;
      }
    }

    const now = Date.now();
    const folderId = `folder-${now}-${Math.random().toString(36).substring(2, 6)}`;
    const newFolder: FolderItem = {
      id: folderId,
      projectId,
      parentId: parentId || null,
      name: cleanName,
      path: folderPath,
      createdAt: now,
      updatedAt: now,
    };

    await db.folders.add(newFolder);

    // Expand parent folder and this new folder in workspace
    const ws = await this.getWorkspace();
    const expanded = new Set(ws.expandedFolderIds || []);
    if (parentId) expanded.add(parentId);
    expanded.add(folderId);
    await this.updateWorkspace({ expandedFolderIds: Array.from(expanded) });

    return newFolder;
  },

  async renameFolder(folderId: string, newName: string): Promise<void> {
    const cleanName = newName.trim();
    if (!cleanName) throw new Error('Folder name cannot be empty.');
    if (/[\\/:*?"<>|]/.test(cleanName)) {
      throw new Error('Folder name cannot contain characters: \\ / : * ? " < > |');
    }

    const folder = await db.folders.get(folderId);
    if (!folder) return;
    if (folder.name === cleanName) return;

    // Check sibling collision
    const existing = await db.folders
      .where('projectId')
      .equals(folder.projectId)
      .filter((f) => f.id !== folderId && (f.parentId || null) === (folder.parentId || null) && f.name.toLowerCase() === cleanName.toLowerCase())
      .toArray();
    if (existing.length > 0) {
      throw new Error(`A folder named "${cleanName}" already exists in this folder.`);
    }

    const oldPath = folder.path;
    const parentPath = folder.parentId
      ? oldPath.substring(0, oldPath.lastIndexOf('/'))
      : '';
    const newPath = parentPath ? `${parentPath}/${cleanName}` : `/${cleanName}`;

    await db.transaction('rw', [db.folders, db.files], async () => {
      // 1. Update this folder
      await db.folders.update(folderId, {
        name: cleanName,
        path: newPath,
        updatedAt: Date.now(),
      });

      // 2. Update all descendant folders
      const allFolders = await db.folders.where('projectId').equals(folder.projectId).toArray();
      for (const f of allFolders) {
        if (f.path.startsWith(oldPath + '/')) {
          const updatedPath = newPath + f.path.substring(oldPath.length);
          await db.folders.update(f.id, { path: updatedPath, updatedAt: Date.now() });
        }
      }

      // 3. Update all descendant files
      const allFiles = await db.files.where('projectId').equals(folder.projectId).toArray();
      for (const f of allFiles) {
        if (f.path.startsWith(oldPath + '/')) {
          const updatedPath = newPath + f.path.substring(oldPath.length);
          await db.files.update(f.id, { path: updatedPath, updatedAt: Date.now() });
        }
      }

      // 4. Update workspace root display name if this folder is the active root
      const ws = await this.getWorkspace();
      if (ws.activeWorkspaceRootId === folderId) {
        await this.updateWorkspace({ activeWorkspaceName: cleanName });
      }
    });
  },

  async deleteFolder(folderId: string): Promise<void> {
    const folder = await db.folders.get(folderId);
    if (!folder) return;

    await db.transaction('rw', [db.folders, db.files, db.workspace], async () => {
      const allFolders = await db.folders.where('projectId').equals(folder.projectId).toArray();
      const folderIdsToDelete = new Set<string>([folderId]);

      // Collect all descendants recursively
      let changed = true;
      while (changed) {
        changed = false;
        for (const f of allFolders) {
          if (f.parentId && folderIdsToDelete.has(f.parentId) && !folderIdsToDelete.has(f.id)) {
            folderIdsToDelete.add(f.id);
            changed = true;
          }
        }
      }

      // Collect all files in any of these folders
      const allFiles = await db.files.where('projectId').equals(folder.projectId).toArray();
      const fileIdsToDelete: string[] = [];
      for (const f of allFiles) {
        if ((f.folderId && folderIdsToDelete.has(f.folderId)) || f.path.startsWith(folder.path + '/')) {
          fileIdsToDelete.push(f.id);
        }
      }

      // Delete files and folders from DB
      await db.files.bulkDelete(fileIdsToDelete);
      await db.folders.bulkDelete(Array.from(folderIdsToDelete));

      // Update workspace state: remove closed tabs and deleted folder IDs
      const ws = await this.getWorkspace();
      const openFileIds = ws.openFileIds.filter((id) => !fileIdsToDelete.includes(id));
      let activeFileId = ws.activeFileId;

      if (activeFileId && fileIdsToDelete.includes(activeFileId)) {
        activeFileId = openFileIds.length > 0 ? openFileIds[openFileIds.length - 1] : null;
        if (!activeFileId) {
          const remaining = await db.files.where('projectId').equals(folder.projectId).toArray();
          activeFileId = remaining[0]?.id || null;
          if (activeFileId) openFileIds.push(activeFileId);
        }
      }

      const expandedFolderIds = (ws.expandedFolderIds || []).filter((id) => !folderIdsToDelete.has(id));
      const resetRoot = ws.activeWorkspaceRootId && folderIdsToDelete.has(ws.activeWorkspaceRootId);

      await this.updateWorkspace({
        activeFileId,
        openFileIds,
        expandedFolderIds,
        ...(resetRoot ? { activeWorkspaceRootId: null, activeWorkspaceName: undefined } : {}),
      });
    });
  },

  async moveItem(
    itemId: string,
    itemType: 'file' | 'folder',
    targetFolderId: string | null
  ): Promise<void> {
    if (itemType === 'file') {
      const file = await db.files.get(itemId);
      if (!file) return;
      if ((file.folderId || null) === (targetFolderId || null)) return;

      let newPath = '/' + file.name;
      if (targetFolderId) {
        const targetFolder = await db.folders.get(targetFolderId);
        if (!targetFolder) return;
        newPath = `${targetFolder.path}/${file.name}`;
      }

      // Check collision
      const existing = await db.files
        .where('projectId')
        .equals(file.projectId)
        .filter((f) => f.id !== itemId && (f.folderId || null) === (targetFolderId || null) && f.name.toLowerCase() === file.name.toLowerCase())
        .toArray();
      if (existing.length > 0) {
        throw new Error(`A file named "${file.name}" already exists in the destination folder.`);
      }

      await db.files.update(itemId, {
        folderId: targetFolderId || null,
        path: newPath,
        updatedAt: Date.now(),
      });

      if (targetFolderId) {
        const ws = await this.getWorkspace();
        const expanded = new Set(ws.expandedFolderIds || []);
        expanded.add(targetFolderId);
        await this.updateWorkspace({ expandedFolderIds: Array.from(expanded) });
      }
    } else {
      if (itemId === targetFolderId) {
        throw new Error('Cannot move a folder into itself.');
      }
      const folder = await db.folders.get(itemId);
      if (!folder) return;
      if ((folder.parentId || null) === (targetFolderId || null)) return;

      // Check circular reference: targetFolderId cannot be a descendant of folder
      if (targetFolderId) {
        const allFolders = await db.folders.where('projectId').equals(folder.projectId).toArray();
        let curr: FolderItem | undefined = allFolders.find((f) => f.id === targetFolderId);
        while (curr) {
          if (curr.id === itemId) {
            throw new Error('Cannot move a folder into one of its subfolders.');
          }
          curr = curr.parentId ? allFolders.find((f) => f.id === curr?.parentId) : undefined;
        }
      }

      // Check collision
      const existing = await db.folders
        .where('projectId')
        .equals(folder.projectId)
        .filter((f) => f.id !== itemId && (f.parentId || null) === (targetFolderId || null) && f.name.toLowerCase() === folder.name.toLowerCase())
        .toArray();
      if (existing.length > 0) {
        throw new Error(`A folder named "${folder.name}" already exists in the destination directory.`);
      }

      const oldPath = folder.path;
      let newPath = '/' + folder.name;
      if (targetFolderId) {
        const targetFolder = await db.folders.get(targetFolderId);
        if (targetFolder) {
          newPath = `${targetFolder.path}/${folder.name}`;
        }
      }

      await db.transaction('rw', [db.folders, db.files, db.workspace], async () => {
        await db.folders.update(itemId, {
          parentId: targetFolderId || null,
          path: newPath,
          updatedAt: Date.now(),
        });

        // Update descendant folders
        const allFolders = await db.folders.where('projectId').equals(folder.projectId).toArray();
        for (const f of allFolders) {
          if (f.path.startsWith(oldPath + '/')) {
            const updatedPath = newPath + f.path.substring(oldPath.length);
            await db.folders.update(f.id, { path: updatedPath, updatedAt: Date.now() });
          }
        }

        // Update descendant files
        const allFiles = await db.files.where('projectId').equals(folder.projectId).toArray();
        for (const f of allFiles) {
          if (f.path.startsWith(oldPath + '/')) {
            const updatedPath = newPath + f.path.substring(oldPath.length);
            await db.files.update(f.id, { path: updatedPath, updatedAt: Date.now() });
          }
        }

        if (targetFolderId) {
          const ws = await this.getWorkspace();
          const expanded = new Set(ws.expandedFolderIds || []);
          expanded.add(targetFolderId);
          expanded.add(itemId);
          await this.updateWorkspace({ expandedFolderIds: Array.from(expanded) });
        }
      });
    }
  },

  async toggleFolderExpanded(folderId: string): Promise<void> {
    const ws = await this.getWorkspace();
    const current = new Set(ws.expandedFolderIds || []);
    if (current.has(folderId)) {
      current.delete(folderId);
    } else {
      current.add(folderId);
    }
    await this.updateWorkspace({ expandedFolderIds: Array.from(current) });
  },

  async collapseAllFolders(): Promise<void> {
    await this.updateWorkspace({ expandedFolderIds: [] });
  },

  async expandAllFolders(projectId: string): Promise<void> {
    const folders = await this.getFolders(projectId);
    await this.updateWorkspace({ expandedFolderIds: folders.map((f) => f.id) });
  },

  async createFile(
    projectId: string,
    name: string,
    folderId: string | null = null,
    content: string = ''
  ): Promise<FileItem> {
    const cleanName = name.trim();
    if (!cleanName) throw new Error('File name cannot be empty.');
    if (/[\\/:*?"<>|]/.test(cleanName)) {
      throw new Error('File name cannot contain characters: \\ / : * ? " < > |');
    }

    // Check sibling collision
    const existing = await db.files
      .where('projectId')
      .equals(projectId)
      .filter((f) => (f.folderId || null) === (folderId || null) && f.name.toLowerCase() === cleanName.toLowerCase())
      .toArray();
    if (existing.length > 0) {
      throw new Error(`A file named "${cleanName}" already exists in this folder.`);
    }

    let filePath = '/' + cleanName;
    if (folderId) {
      const parentFolder = await db.folders.get(folderId);
      if (parentFolder) {
        filePath = `${parentFolder.path}/${cleanName}`;
      }
    }

    const language = detectLanguageFromFilename(cleanName);
    const now = Date.now();
    const fileId = `file-${now}-${Math.random().toString(36).substring(2, 6)}`;

    const file: FileItem = {
      id: fileId,
      projectId,
      folderId: folderId || null,
      name: cleanName,
      path: filePath,
      language,
      content,
      createdAt: now,
      updatedAt: now,
    };

    await db.files.add(file);

    // Open newly created file in workspace and expand parent folder
    const ws = await this.getWorkspace();
    const openFileIds = ws.openFileIds.includes(fileId) ? ws.openFileIds : [...ws.openFileIds, fileId];
    const expanded = new Set(ws.expandedFolderIds || []);
    if (folderId) expanded.add(folderId);

    await this.updateWorkspace({
      activeFileId: fileId,
      openFileIds,
      expandedFolderIds: Array.from(expanded),
    });

    return file;
  },

  async renameFile(fileId: string, newName: string): Promise<void> {
    const file = await this.getFile(fileId);
    if (!file) return;

    const cleanName = newName.trim();
    if (!cleanName) throw new Error('File name cannot be empty.');
    if (/[\\/:*?"<>|]/.test(cleanName)) {
      throw new Error('File name cannot contain characters: \\ / : * ? " < > |');
    }
    if (file.name === cleanName) return;

    // Check sibling collision
    const existing = await db.files
      .where('projectId')
      .equals(file.projectId)
      .filter((f) => f.id !== fileId && (f.folderId || null) === (file.folderId || null) && f.name.toLowerCase() === cleanName.toLowerCase())
      .toArray();
    if (existing.length > 0) {
      throw new Error(`A file named "${cleanName}" already exists in this folder.`);
    }

    const language = detectLanguageFromFilename(cleanName);
    const parentPath = file.path.includes('/')
      ? file.path.substring(0, file.path.lastIndexOf('/'))
      : '';
    const newPath = parentPath ? `${parentPath}/${cleanName}` : `/${cleanName}`;

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

    let copyIndex = 1;
    let newName = `${baseName}_copy${ext}`;
    const existing = await db.files
      .where('projectId')
      .equals(file.projectId)
      .filter((f) => (f.folderId || null) === (file.folderId || null))
      .toArray();

    while (existing.some((f) => f.name.toLowerCase() === newName.toLowerCase())) {
      copyIndex++;
      newName = `${baseName}_copy${copyIndex}${ext}`;
    }

    return await this.createFile(file.projectId, newName, file.folderId || null, file.content);
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

  async openFolderAsWorkspace(projectId: string, folderId: string | null): Promise<void> {
    if (!folderId) {
      await this.updateWorkspace({
        activeWorkspaceRootId: null,
        activeWorkspaceName: undefined,
      });
      return;
    }

    const folder = await db.folders.get(folderId);
    if (!folder || folder.projectId !== projectId) {
      throw new Error('Selected folder does not exist or does not belong to the active project.');
    }

    // Check if current activeFileId is inside the new workspace root
    const allFolders = await db.folders.where('projectId').equals(projectId).toArray();
    const folderIds = new Set<string>([folderId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const f of allFolders) {
        if (f.parentId && folderIds.has(f.parentId) && !folderIds.has(f.id)) {
          folderIds.add(f.id);
          changed = true;
        }
      }
    }

    const allFiles = await db.files.where('projectId').equals(projectId).toArray();
    const workspaceFiles = allFiles.filter(
      (f) => (f.folderId && folderIds.has(f.folderId)) || f.path.startsWith(folder.path + '/')
    );

    const ws = await this.getWorkspace();
    let nextActiveFileId = ws.activeFileId;
    if (!nextActiveFileId || !workspaceFiles.some((f) => f.id === nextActiveFileId)) {
      nextActiveFileId = workspaceFiles.length > 0 ? workspaceFiles[0].id : null;
    }

    // Expand the selected folder
    const expanded = new Set(ws.expandedFolderIds || []);
    expanded.add(folderId);

    await this.updateWorkspace({
      activeWorkspaceRootId: folder.id,
      activeWorkspaceName: folder.name,
      activeFileId: nextActiveFileId,
      expandedFolderIds: Array.from(expanded),
    });
  },

  async closeWorkspaceFolder(): Promise<void> {
    await this.updateWorkspace({
      activeWorkspaceRootId: null,
      activeWorkspaceName: undefined,
    });
  },
};
