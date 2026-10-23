'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, DEFAULT_SETTINGS, DEFAULT_WORKSPACE } from '@/lib/database/db';
import { seedInitialDataIfNeeded } from '@/lib/database/seed';
import { ProjectService } from '@/lib/persistence/project-service';
import { filterWorkspaceItems } from '@/lib/explorer/tree-utils';

export function useWorkspace() {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize and seed if first run
  useEffect(() => {
    let mounted = true;
    seedInitialDataIfNeeded().then(() => {
      if (mounted) setIsInitialized(true);
    });
    return () => {
      mounted = false;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Reactive Dexie queries
  const rawProjects = useLiveQuery(() => db.projects.orderBy('lastOpenedAt').reverse().toArray());
  const projects = useMemo(() => rawProjects ?? [], [rawProjects]);

  const rawWorkspace = useLiveQuery(() => db.workspace.get('current'));
  const workspace = useMemo(
    () => (rawWorkspace ? { ...DEFAULT_WORKSPACE, ...rawWorkspace } : DEFAULT_WORKSPACE),
    [rawWorkspace]
  );

  const rawSettings = useLiveQuery(() => db.settings.get('current'));
  const settings = useMemo(
    () => (rawSettings ? { ...DEFAULT_SETTINGS, ...rawSettings } : DEFAULT_SETTINGS),
    [rawSettings]
  );

  const activeProjectId = workspace.activeProjectId;
  const rawFiles = useLiveQuery(
    () => (activeProjectId ? db.files.where('projectId').equals(activeProjectId).toArray() : []),
    [activeProjectId]
  );
  const files = useMemo(() => rawFiles ?? [], [rawFiles]);

  const rawFolders = useLiveQuery(
    () => (activeProjectId ? db.folders.where('projectId').equals(activeProjectId).toArray() : []),
    [activeProjectId]
  );
  const folders = useMemo(() => rawFolders ?? [], [rawFolders]);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) || projects[0],
    [projects, activeProjectId]
  );

  // Workspace Root Boundary State
  const activeWorkspaceRootId = workspace.activeWorkspaceRootId || null;
  const activeWorkspaceFolder = useMemo(
    () => (activeWorkspaceRootId ? folders.find((f) => f.id === activeWorkspaceRootId) : undefined),
    [folders, activeWorkspaceRootId]
  );
  const activeWorkspaceName =
    activeWorkspaceFolder?.name || workspace.activeWorkspaceName || activeProject?.name || 'Workspace';

  // Auto-recovery: if activeWorkspaceRootId is set but folder is not found in folders, reset to project root
  useEffect(() => {
    if (isInitialized && activeWorkspaceRootId && folders.length > 0 && !activeWorkspaceFolder) {
      ProjectService.closeWorkspaceFolder();
    }
  }, [isInitialized, activeWorkspaceRootId, folders, activeWorkspaceFolder]);

  // Compute workspace items filtered by active workspace root
  const { workspaceFolders, workspaceFiles, rootFolder } = useMemo(() => {
    return filterWorkspaceItems(folders, files, activeWorkspaceRootId);
  }, [folders, files, activeWorkspaceRootId]);

  const activeFile = useMemo(
    () => files.find((f) => f.id === workspace.activeFileId) || files[0],
    [files, workspace.activeFileId]
  );
  const openFiles = useMemo(
    () => files.filter((f) => workspace.openFileIds.includes(f.id)),
    [files, workspace.openFileIds]
  );

  // Debounced auto-save handler
  const updateFileContent = useCallback((fileId: string, content: string) => {
    setIsSaving(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      await ProjectService.updateFileContent(fileId, content);
      setIsSaving(false);
    }, 600);
  }, []);

  const saveNow = useCallback(async (fileId: string, content: string) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setIsSaving(true);
    await ProjectService.updateFileContent(fileId, content);
    setIsSaving(false);
  }, []);

  return {
    isInitialized,
    isSaving,
    projects,
    files,
    folders,
    workspaceFiles,
    workspaceFolders,
    activeWorkspaceRootId,
    activeWorkspaceName,
    activeWorkspaceFolder,
    rootFolder,
    openFiles,
    activeProject,
    activeFile,
    workspace,
    settings,

    // Actions
    switchProject: ProjectService.switchProject.bind(ProjectService),
    createProject: ProjectService.createProject.bind(ProjectService),
    renameProject: ProjectService.renameProject.bind(ProjectService),
    deleteProject: ProjectService.deleteProject.bind(ProjectService),
    duplicateProject: ProjectService.duplicateProject.bind(ProjectService),

    openFolderAsWorkspace: (folderId: string | null) =>
      activeProjectId ? ProjectService.openFolderAsWorkspace(activeProjectId, folderId) : null,
    closeWorkspaceFolder: () => ProjectService.closeWorkspaceFolder(),

    createFile: (name: string, folderId?: string | null, content?: string) =>
      activeProjectId ? ProjectService.createFile(activeProjectId, name, folderId, content) : null,
    renameFile: ProjectService.renameFile.bind(ProjectService),
    deleteFile: ProjectService.deleteFile.bind(ProjectService),
    duplicateFile: ProjectService.duplicateFile.bind(ProjectService),
    updateFileContent,
    saveNow,

    createFolder: (name: string, parentId?: string | null) =>
      activeProjectId ? ProjectService.createFolder(activeProjectId, name, parentId) : null,
    renameFolder: ProjectService.renameFolder.bind(ProjectService),
    deleteFolder: ProjectService.deleteFolder.bind(ProjectService),
    moveItem: ProjectService.moveItem.bind(ProjectService),
    toggleFolderExpanded: ProjectService.toggleFolderExpanded.bind(ProjectService),
    collapseAllFolders: ProjectService.collapseAllFolders.bind(ProjectService),
    expandAllFolders: () => (activeProjectId ? ProjectService.expandAllFolders(activeProjectId) : null),

    openFileInTab: ProjectService.openFileInTab.bind(ProjectService),
    closeFileTab: ProjectService.closeFileTab.bind(ProjectService),

    updateWorkspace: ProjectService.updateWorkspace.bind(ProjectService),
    updateSettings: ProjectService.updateSettings.bind(ProjectService),
  };
}
