import JSZip from 'jszip';
import { db } from '../database/db';
import { ProjectService, detectLanguageFromFilename } from './project-service';
import type { Project, FileItem, FolderItem } from '@/types';

export interface ProjectExportBundle {
  version: 1 | 2;
  project: Project;
  files: FileItem[];
  folders?: FolderItem[];
  exportedAt: number;
}

export const ExportImportService = {
  async exportProjectAsJson(projectId: string): Promise<string> {
    const project = await ProjectService.getProject(projectId);
    if (!project) throw new Error('Project not found');

    const files = await ProjectService.getFiles(projectId);
    const folders = await ProjectService.getFolders(projectId);

    const bundle: ProjectExportBundle = {
      version: 2,
      project,
      files,
      folders,
      exportedAt: Date.now(),
    };

    return JSON.stringify(bundle, null, 2);
  },

  async downloadProjectJson(projectId: string): Promise<void> {
    const json = await this.exportProjectAsJson(projectId);
    const project = await ProjectService.getProject(projectId);
    const filename = `${(project?.name || 'project').toLowerCase().replace(/\s+/g, '-')}.json`;

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  async downloadProjectZip(projectId: string): Promise<void> {
    const project = await ProjectService.getProject(projectId);
    if (!project) throw new Error('Project not found');

    const files = await ProjectService.getFiles(projectId);
    const zip = new JSZip();

    for (const f of files) {
      // Remove leading slash for ZIP entry
      const relativePath = f.path.startsWith('/') ? f.path.substring(1) : f.path;
      zip.file(relativePath, f.content);
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const filename = `${project.name.toLowerCase().replace(/\s+/g, '-')}.zip`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  async importProjectFromJson(jsonString: string): Promise<{ project: Project; activeFile: FileItem }> {
    const bundle = JSON.parse(jsonString) as ProjectExportBundle;
    if (!bundle.project || !Array.isArray(bundle.files)) {
      throw new Error('Invalid project file format.');
    }

    const now = Date.now();
    const newProjectId = `proj-${now}-${Math.random().toString(36).substring(2, 6)}`;

    const importedProject: Project = {
      ...bundle.project,
      id: newProjectId,
      name: `${bundle.project.name} (Imported)`,
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
    };

    await db.projects.add(importedProject);

    // Map folder IDs
    const folderIdMap = new Map<string, string>();
    const foldersToImport = bundle.folders || [];

    for (const folder of foldersToImport) {
      const newFolderId = `folder-${now}-${Math.random().toString(36).substring(2, 6)}`;
      folderIdMap.set(folder.id, newFolderId);
    }

    for (const folder of foldersToImport) {
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

    let firstFile: FileItem | null = null;
    const openIds: string[] = [];

    for (let i = 0; i < bundle.files.length; i++) {
      const f = bundle.files[i];
      const newFileId = `file-${now}-${i}`;
      const newFolderId = f.folderId ? folderIdMap.get(f.folderId) || null : null;

      const newFile: FileItem = {
        ...f,
        id: newFileId,
        projectId: newProjectId,
        folderId: newFolderId,
        createdAt: now + i,
        updatedAt: now + i,
      };
      await db.files.add(newFile);
      openIds.push(newFileId);
      if (i === 0) firstFile = newFile;
    }

    if (!firstFile) {
      firstFile = await ProjectService.createFile(newProjectId, 'index.js', null, '// Imported project\n');
      openIds.push(firstFile.id);
    }

    await ProjectService.updateWorkspace({
      activeProjectId: newProjectId,
      activeFileId: firstFile.id,
      openFileIds: openIds,
      expandedFolderIds: Array.from(folderIdMap.values()),
    });

    return { project: importedProject, activeFile: firstFile };
  },

  async importProjectFromZip(file: File): Promise<{ project: Project; activeFile: FileItem }> {
    const zip = await JSZip.loadAsync(file);
    const now = Date.now();
    const newProjectId = `proj-${now}-${Math.random().toString(36).substring(2, 6)}`;
    const projectName = file.name.replace(/\.zip$/i, '') || 'Imported Project';

    const importedProject: Project = {
      id: newProjectId,
      name: projectName,
      description: 'Imported from ZIP archive',
      template: 'empty',
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
    };

    await db.projects.add(importedProject);

    let firstFile: FileItem | null = null;
    const openIds: string[] = [];
    const folderMap = new Map<string, string>(); // path -> folderId
    let fileIndex = 0;

    for (const [filename, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir || filename.startsWith('__MACOSX/') || filename.startsWith('.')) continue;

      const content = await zipEntry.async('string');
      const cleanPath = filename.startsWith('/') ? filename : `/${filename}`;
      const parts = cleanPath.split('/').filter(Boolean);
      const name = parts[parts.length - 1];
      const language = detectLanguageFromFilename(name);

      let folderId: string | null = null;
      if (parts.length > 1) {
        const folderParts = parts.slice(0, -1);
        let currentPath = '';
        let parentId: string | null = null;

        for (const part of folderParts) {
          currentPath += '/' + part;
          let existingFolderId = folderMap.get(currentPath);
          if (!existingFolderId) {
            existingFolderId = `folder-${now}-${Math.random().toString(36).substring(2, 6)}`;
            folderMap.set(currentPath, existingFolderId);
            await db.folders.add({
              id: existingFolderId,
              projectId: newProjectId,
              parentId,
              name: part,
              path: currentPath,
              createdAt: now + fileIndex,
              updatedAt: now + fileIndex,
            });
          }
          parentId = existingFolderId;
        }
        folderId = parentId;
      }

      const fileId = `file-${now}-${fileIndex}`;
      const newFile: FileItem = {
        id: fileId,
        projectId: newProjectId,
        folderId,
        name,
        path: cleanPath,
        language,
        content,
        createdAt: now + fileIndex,
        updatedAt: now + fileIndex,
      };

      await db.files.add(newFile);
      openIds.push(fileId);
      if (!firstFile) firstFile = newFile;
      fileIndex++;
    }

    if (!firstFile) {
      firstFile = await ProjectService.createFile(newProjectId, 'index.js', null, '// Empty archive\n');
      openIds.push(firstFile.id);
    }

    await ProjectService.updateWorkspace({
      activeProjectId: newProjectId,
      activeFileId: firstFile.id,
      openFileIds: openIds,
      expandedFolderIds: Array.from(folderMap.values()),
    });

    return { project: importedProject, activeFile: firstFile };
  },
};
