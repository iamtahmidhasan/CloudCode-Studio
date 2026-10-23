import JSZip from 'jszip';
import { db } from '../database/db';
import { ProjectService } from './project-service';
import type { Project, FileItem } from '@/types';

export interface ProjectExportBundle {
  version: 1;
  project: Project;
  files: FileItem[];
  exportedAt: number;
}

export const ExportImportService = {
  async exportProjectAsJson(projectId: string): Promise<string> {
    const project = await ProjectService.getProject(projectId);
    if (!project) throw new Error('Project not found');

    const files = await ProjectService.getFiles(projectId);

    const bundle: ProjectExportBundle = {
      version: 1,
      project,
      files,
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

    let firstFile: FileItem | null = null;
    const openIds: string[] = [];

    for (let i = 0; i < bundle.files.length; i++) {
      const f = bundle.files[i];
      const newFileId = `file-${now}-${i}`;
      const newFile: FileItem = {
        ...f,
        id: newFileId,
        projectId: newProjectId,
        createdAt: now + i,
        updatedAt: now + i,
      };
      await db.files.add(newFile);
      openIds.push(newFileId);
      if (i === 0) firstFile = newFile;
    }

    if (!firstFile) {
      firstFile = await ProjectService.createFile(newProjectId, 'index.js', '/index.js', '// Imported project\n');
      openIds.push(firstFile.id);
    }

    await ProjectService.updateWorkspace({
      activeProjectId: newProjectId,
      activeFileId: firstFile.id,
      openFileIds: openIds,
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
    let fileIndex = 0;

    for (const [filename, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir || filename.startsWith('__MACOSX/') || filename.startsWith('.')) continue;

      const content = await zipEntry.async('string');
      const cleanPath = filename.startsWith('/') ? filename : `/${filename}`;
      const parts = cleanPath.split('/');
      const name = parts[parts.length - 1];
      const language = ProjectService.createFile.name ? (await import('./project-service')).detectLanguageFromFilename(name) : 'javascript';

      const fileId = `file-${now}-${fileIndex}`;
      const newFile: FileItem = {
        id: fileId,
        projectId: newProjectId,
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
      firstFile = await ProjectService.createFile(newProjectId, 'index.js', '/index.js', '// Empty archive\n');
      openIds.push(firstFile.id);
    }

    await ProjectService.updateWorkspace({
      activeProjectId: newProjectId,
      activeFileId: firstFile.id,
      openFileIds: openIds,
    });

    return { project: importedProject, activeFile: firstFile };
  },
};
