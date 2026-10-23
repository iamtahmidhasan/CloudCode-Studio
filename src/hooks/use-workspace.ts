'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, DEFAULT_SETTINGS, DEFAULT_WORKSPACE } from '@/lib/database/db';
import { seedInitialDataIfNeeded } from '@/lib/database/seed';
import { ProjectService } from '@/lib/persistence/project-service';

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
  const projects = useLiveQuery(() => db.projects.orderBy('lastOpenedAt').reverse().toArray()) || [];
  const rawWorkspace = useLiveQuery(() => db.workspace.get('current'));
  const workspace = rawWorkspace ? { ...DEFAULT_WORKSPACE, ...rawWorkspace } : DEFAULT_WORKSPACE;
  const rawSettings = useLiveQuery(() => db.settings.get('current'));
  const settings = rawSettings ? { ...DEFAULT_SETTINGS, ...rawSettings } : DEFAULT_SETTINGS;

  const activeProjectId = workspace.activeProjectId;
  const files = useLiveQuery(
    () => (activeProjectId ? db.files.where('projectId').equals(activeProjectId).toArray() : []),
    [activeProjectId]
  ) || [];

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];
  const activeFile = files.find((f) => f.id === workspace.activeFileId) || files[0];
  const openFiles = files.filter((f) => workspace.openFileIds.includes(f.id));

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

    createFile: (name: string, path?: string, content?: string) =>
      activeProjectId ? ProjectService.createFile(activeProjectId, name, path, content) : null,
    renameFile: ProjectService.renameFile.bind(ProjectService),
    deleteFile: ProjectService.deleteFile.bind(ProjectService),
    duplicateFile: ProjectService.duplicateFile.bind(ProjectService),
    updateFileContent,
    saveNow,

    openFileInTab: ProjectService.openFileInTab.bind(ProjectService),
    closeFileTab: ProjectService.closeFileTab.bind(ProjectService),

    updateWorkspace: ProjectService.updateWorkspace.bind(ProjectService),
    updateSettings: ProjectService.updateSettings.bind(ProjectService),
  };
}
