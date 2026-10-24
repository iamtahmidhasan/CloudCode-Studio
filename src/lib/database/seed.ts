import { db, DEFAULT_SETTINGS, DEFAULT_WORKSPACE } from './db';
import type { Project, FileItem, ProjectTemplate } from '@/types';

export const SEED_TEMPLATES: Record<
  ProjectTemplate,
  {
    name: string;
    description: string;
    files: Array<{ name: string; path: string; language: FileItem['language']; content: string }>;
  }
> = {
  web: {
    name: 'Web Project',
    description: 'HTML5, CSS, and JavaScript project',
    files: [],
  },
  typescript: {
    name: 'TypeScript Project',
    description: 'TypeScript project',
    files: [],
  },
  python: {
    name: 'Python Project',
    description: 'Python 3 in-browser project',
    files: [],
  },
  cpp: {
    name: 'C++ Project',
    description: 'C++ browser sandbox project',
    files: [],
  },
  empty: {
    name: 'Workspace',
    description: 'Empty workspace project',
    files: [],
  },
};

const LEGACY_SEED_PROJECT_NAMES = new Set([
  'CloudCode Studio',
  'Interactive Web Playground',
  'TypeScript Algorithm Demo',
  'Python Data Science Demo',
  'C++ Algorithm Demo',
]);

const LEGACY_SEED_FOLDER_NAMES = new Set(['project-a', 'project-b', 'templates']);

/**
 * Clean up previously seeded demo data and ensure a clean, blank workspace.
 */
export async function seedInitialDataIfNeeded(): Promise<{ activeProjectId: string; activeFileId: string }> {
  const now = Date.now();

  // 1. Ensure default settings exist
  const existingSettings = await db.settings.get('current');
  if (!existingSettings) {
    await db.settings.put(DEFAULT_SETTINGS);
  }

  // 2. Detect and purge legacy seed projects, folders, and files
  const allProjects = await db.projects.toArray();
  const seedProjectsToDelete: Project[] = [];

  for (const proj of allProjects) {
    const isSeedId =
      proj.id.startsWith('proj-web-') ||
      proj.id.startsWith('proj-typescript-') ||
      proj.id.startsWith('proj-python-') ||
      proj.id.startsWith('proj-cpp-');
    const isSeedName = LEGACY_SEED_PROJECT_NAMES.has(proj.name);

    if (isSeedId || isSeedName) {
      seedProjectsToDelete.push(proj);
    }
  }

  for (const proj of seedProjectsToDelete) {
    await db.projects.delete(proj.id);
    await db.files.where('projectId').equals(proj.id).delete();
    await db.folders.where('projectId').equals(proj.id).delete();
  }

  // Also purge any legacy seed folders or files in remaining projects
  const remainingFolders = await db.folders.toArray();
  for (const folder of remainingFolders) {
    if (
      LEGACY_SEED_FOLDER_NAMES.has(folder.name.toLowerCase()) ||
      folder.path.includes('/Home/Projects/project-') ||
      folder.path.includes('/Home/Templates')
    ) {
      await db.folders.delete(folder.id);
      await db.files.where('folderId').equals(folder.id).delete();
    }
  }

  // 3. Check remaining projects
  const remainingProjects = await db.projects.toArray();

  if (remainingProjects.length === 0) {
    // Create one single clean default workspace project with NO files and NO folders
    const defaultProjectId = `proj-workspace-${now}`;
    const defaultProject: Project = {
      id: defaultProjectId,
      name: 'Workspace',
      description: 'Clean coding workspace',
      template: 'empty',
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
    };

    await db.projects.add(defaultProject);

    await db.workspace.put({
      ...DEFAULT_WORKSPACE,
      activeProjectId: defaultProjectId,
      activeFileId: null,
      openFileIds: [],
      expandedFolderIds: [],
      activeWorkspaceRootId: null,
      activeWorkspaceName: undefined,
      lastUpdatedAt: now,
    });

    return {
      activeProjectId: defaultProjectId,
      activeFileId: '',
    };
  }

  // 4. If user projects remain, ensure active project and workspace references are valid
  const currentWorkspace = await db.workspace.get('current');
  const activeProject =
    remainingProjects.find((p) => p.id === currentWorkspace?.activeProjectId) ||
    remainingProjects.sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)[0];

  const projectFiles = await db.files.where('projectId').equals(activeProject.id).toArray();
  const fileExists = currentWorkspace?.activeFileId
    ? projectFiles.some((f) => f.id === currentWorkspace.activeFileId)
    : false;

  const validOpenFileIds = currentWorkspace?.openFileIds
    ? currentWorkspace.openFileIds.filter((id) => projectFiles.some((f) => f.id === id))
    : [];

  const activeFileId = fileExists ? currentWorkspace!.activeFileId! : (projectFiles[0]?.id || '');

  await db.workspace.put({
    ...(currentWorkspace || DEFAULT_WORKSPACE),
    id: 'current',
    activeProjectId: activeProject.id,
    activeFileId: activeFileId || null,
    openFileIds: validOpenFileIds,
    activeWorkspaceRootId: null,
    activeWorkspaceName: undefined,
    lastUpdatedAt: now,
  });

  return {
    activeProjectId: activeProject.id,
    activeFileId,
  };
}

export async function ensureHomeHierarchyForProject(): Promise<void> {
  // No-op: Seed hierarchy is disabled to keep workspace clean
}
