'use client';

import React, { useState } from 'react';
import type { Project, FileItem, ProjectTemplate } from '@/types';
import {
  Folder,
  FilePlus,
  FolderPlus,
  Download,
  Upload,
  Trash2,
  Copy,
  Edit2,
  ChevronDown,
  Layers,
  Check,
  X,
  FileText,
} from 'lucide-react';
import { getFileIcon } from '../editor/editor-tabs';
import { ExportImportService } from '@/lib/persistence/export-import';

interface FileExplorerProps {
  projects: Project[];
  activeProject: Project | undefined;
  files: FileItem[];
  activeFileId: string | null;
  onSelectFile: (fileId: string) => void;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (name: string, template: ProjectTemplate) => void;
  onDeleteProject: (projectId: string) => void;
  onCreateFile: (name: string) => void;
  onRenameFile: (fileId: string, newName: string) => void;
  onDeleteFile: (fileId: string) => void;
  onDuplicateFile: (fileId: string) => void;
}

export function FileExplorer({
  projects,
  activeProject,
  files,
  activeFileId,
  onSelectFile,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onCreateFile,
  onRenameFile,
  onDeleteFile,
  onDuplicateFile,
}: FileExplorerProps) {
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectTemplate, setNewProjectTemplate] = useState<ProjectTemplate>('web');

  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [deleteConfirmProject, setDeleteConfirmProject] = useState<Project | null>(null);

  const handleCreateFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFileName.trim()) {
      onCreateFile(newFileName.trim());
      setNewFileName('');
      setIsCreatingFile(false);
    }
  };

  const handleRenameSubmit = (fileId: string) => {
    if (renameValue.trim()) {
      onRenameFile(fileId, renameValue.trim());
      setRenamingFileId(null);
      setRenameValue('');
    }
  };

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim(), newProjectTemplate);
      setNewProjectName('');
      setIsCreatingProject(false);
    }
  };

  const handleExportJson = () => {
    if (activeProject) {
      ExportImportService.downloadProjectJson(activeProject.id);
    }
  };

  const handleExportZip = () => {
    if (activeProject) {
      ExportImportService.downloadProjectZip(activeProject.id);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.name.endsWith('.json')) {
        const text = await file.text();
        const res = await ExportImportService.importProjectFromJson(text);
        onSelectProject(res.project.id);
      } else if (file.name.endsWith('.zip')) {
        const res = await ExportImportService.importProjectFromZip(file);
        onSelectProject(res.project.id);
      }
    } catch (err: unknown) {
      alert(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-[#252526] text-[#cccccc] text-xs select-none border-r border-[#3c3c3c]">
      {/* Explorer Header / Project Switcher */}
      <div className="p-2 border-b border-[#3c3c3c] flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="font-bold tracking-wider text-[11px] text-[#858585] uppercase">Explorer</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsCreatingFile(true)}
              className="p-1 rounded hover:bg-[#3c3c3c] text-[#cccccc] hover:text-white"
              title="New File"
            >
              <FilePlus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingProject(true)}
              className="p-1 rounded hover:bg-[#3c3c3c] text-[#cccccc] hover:text-white"
              title="New Project"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="p-1 rounded hover:bg-[#3c3c3c] text-[#cccccc] hover:text-white"
              title="Download Project JSON"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleExportZip}
              className="p-1 rounded hover:bg-[#3c3c3c] text-[#cccccc] hover:text-white"
              title="Download Project ZIP"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <label className="p-1 rounded hover:bg-[#3c3c3c] text-[#cccccc] hover:text-white cursor-pointer" title="Import Project (JSON or ZIP)">
              <Upload className="w-3.5 h-3.5" />
              <input type="file" accept=".json,.zip" onChange={handleImportFile} className="hidden" />
            </label>
          </div>
        </div>

        {/* Project Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded bg-[#1e1e1e] hover:bg-[#2a2d2e] border border-[#3c3c3c] text-left"
          >
            <div className="flex items-center gap-1.5 overflow-hidden">
              <Folder className="w-3.5 h-3.5 text-[#007acc] shrink-0" />
              <span className="truncate font-medium">{activeProject?.name || 'Select Project'}</span>
            </div>
            <ChevronDown className="w-3 h-3 text-[#858585] shrink-0" />
          </button>

          {isProjectDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1e1e1e] border border-[#3c3c3c] rounded shadow-xl z-50 max-h-60 overflow-y-auto">
              <div className="p-1">
                <div className="text-[10px] text-[#858585] px-2 py-1 uppercase font-semibold">Your Projects</div>
                {projects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectProject(p.id);
                      setIsProjectDropdownOpen(false);
                    }}
                    className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer ${
                      p.id === activeProject?.id ? 'bg-[#04395e] text-white' : 'hover:bg-[#2a2d2e] text-[#cccccc]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Layers className="w-3.5 h-3.5 text-[#007acc] shrink-0" />
                      <span className="truncate">{p.name}</span>
                    </div>
                    {projects.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmProject(p);
                        }}
                        className="p-1 hover:text-red-400 opacity-60 hover:opacity-100"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Project Modal Inline */}
      {isCreatingProject && (
        <form onSubmit={handleCreateProjectSubmit} className="p-2 border-b border-[#3c3c3c] bg-[#1e1e1e] flex flex-col gap-2">
          <div className="font-semibold text-white">Create New Project</div>
          <input
            type="text"
            placeholder="Project name..."
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            className="w-full px-2 py-1 bg-[#252526] border border-[#3c3c3c] rounded text-white focus:outline-none focus:border-[#007acc]"
            autoFocus
          />
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-[#858585]">Template:</span>
            <select
              value={newProjectTemplate}
              onChange={(e) => setNewProjectTemplate(e.target.value as ProjectTemplate)}
              className="w-full px-2 py-1 bg-[#252526] border border-[#3c3c3c] rounded text-white text-xs focus:outline-none focus:border-[#007acc]"
            >
              <option value="web">Web (HTML + CSS + JS)</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python 3 (Pyodide)</option>
              <option value="cpp">C++ (WebAssembly)</option>
              <option value="empty">Empty Project</option>
            </select>
          </div>
          <div className="flex justify-end gap-1.5 mt-1">
            <button
              type="button"
              onClick={() => setIsCreatingProject(false)}
              className="px-2 py-1 rounded bg-[#333333] hover:bg-[#3c3c3c] text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-2 py-1 rounded bg-[#007acc] hover:bg-[#1177bb] text-white font-medium"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {/* Delete Project Confirmation Dialog */}
      {deleteConfirmProject && (
        <div className="p-2.5 bg-red-950/40 border-b border-red-800 flex flex-col gap-2">
          <span className="font-semibold text-red-200">Delete Project?</span>
          <p className="text-[11px] text-red-300">
            Are you sure you want to delete &quot;{deleteConfirmProject.name}&quot;? All its files will be permanently removed.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteConfirmProject(null)}
              className="px-2 py-1 rounded bg-[#333333] hover:bg-[#444444] text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onDeleteProject(deleteConfirmProject.id);
                setDeleteConfirmProject(null);
              }}
              className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Inline Create File Input */}
      {isCreatingFile && (
        <form onSubmit={handleCreateFileSubmit} className="p-2 border-b border-[#3c3c3c] bg-[#1e1e1e] flex items-center gap-1">
          <FileText className="w-3.5 h-3.5 text-[#007acc] shrink-0" />
          <input
            type="text"
            placeholder="filename.ext (e.g. app.js)"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            className="flex-1 px-1.5 py-0.5 bg-[#252526] border border-[#007acc] rounded text-white text-xs focus:outline-none"
            autoFocus
          />
          <button type="submit" className="p-1 hover:text-green-400">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => setIsCreatingFile(false)} className="p-1 hover:text-red-400">
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      )}

      {/* File List */}
      <div className="flex-1 overflow-y-auto py-1">
        <div className="px-2 py-1 text-[11px] uppercase font-bold text-[#858585] flex items-center justify-between">
          <span>Files</span>
          <span className="text-[10px] text-[#666666]">{files.length}</span>
        </div>

        {files.map((file) => {
          const isActive = file.id === activeFileId;
          const isRenaming = renamingFileId === file.id;

          return (
            <div
              key={file.id}
              onClick={() => onSelectFile(file.id)}
              className={`group flex items-center justify-between px-3 py-1.5 cursor-pointer transition-colors ${
                isActive
                  ? 'bg-[#37373d] text-white font-medium border-l-2 border-[#007acc]'
                  : 'hover:bg-[#2a2d2e] text-[#cccccc] border-l-2 border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 truncate flex-1 mr-1">
                {getFileIcon(file.name, file.language)}
                {isRenaming ? (
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => handleRenameSubmit(file.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameSubmit(file.id);
                      if (e.key === 'Escape') setRenamingFileId(null);
                    }}
                    autoFocus
                    className="flex-1 px-1 py-0.5 bg-[#1e1e1e] border border-[#007acc] rounded text-white text-xs focus:outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="truncate">{file.name}</span>
                )}
              </div>

              {!isRenaming && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenamingFileId(file.id);
                      setRenameValue(file.name);
                    }}
                    className="p-1 rounded hover:bg-[#3c3c3c] text-[#858585] hover:text-white"
                    title="Rename"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateFile(file.id);
                    }}
                    className="p-1 rounded hover:bg-[#3c3c3c] text-[#858585] hover:text-white"
                    title="Duplicate"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  {files.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFile(file.id);
                      }}
                      className="p-1 rounded hover:bg-[#3c3c3c] text-[#858585] hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
