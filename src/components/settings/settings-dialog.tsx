'use client';

import React, { useState } from 'react';
import type { EditorSettings } from '@/types';
import { db } from '@/lib/database/db';
import { seedInitialDataIfNeeded } from '@/lib/database/seed';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Trash2, Sun, Moon, Type, Layout, Code, RefreshCw, Download, CheckCircle, Smartphone } from 'lucide-react';
import { usePwa } from '@/components/pwa/pwa-installer';
import Image from 'next/image';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EditorSettings;
  onUpdateSettings: (settings: Partial<EditorSettings>) => void;
}

export function SettingsDialog({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}: SettingsDialogProps) {
  const [confirmClearData, setConfirmClearData] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { isInstallable, isInstalled, promptInstall, resetInstalledState } = usePwa();

  const handleResetData = async () => {
    setIsResetting(true);
    try {
      await db.delete();
      await db.open();
      await seedInitialDataIfNeeded();
      window.location.reload();
    } catch (err: unknown) {
      alert(`Reset failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#252526] text-[#cccccc] border-[#3c3c3c] sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-base font-semibold flex items-center gap-2">
            <span>Editor Settings</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-[#858585]">
            Configure editor appearance, formatting, and browser persistence preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2 text-xs">
          {/* Theme */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-white flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-[#007acc]" />
              <span>Theme</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'vscode-dark-plus' })}
                className={`flex items-center gap-2 p-2 rounded border text-left cursor-pointer transition-colors ${
                  settings.theme === 'vscode-dark-plus'
                    ? 'border-[#007acc] bg-[#1e1e1e] text-white font-medium shadow-sm'
                    : 'border-[#3c3c3c] bg-[#1e1e1e]/50 text-[#858585] hover:text-white'
                }`}
              >
                <Moon className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold">VS Code Dark+</div>
                  <div className="text-[10px] text-[#6e6e6e]">Default Dark</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'vscode-light-plus' })}
                className={`flex items-center gap-2 p-2 rounded border text-left cursor-pointer transition-colors ${
                  settings.theme === 'vscode-light-plus'
                    ? 'border-[#007acc] bg-[#1e1e1e] text-white font-medium shadow-sm'
                    : 'border-[#3c3c3c] bg-[#1e1e1e]/50 text-[#858585] hover:text-white'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold">VS Code Light+</div>
                  <div className="text-[10px] text-[#6e6e6e]">Light Theme</div>
                </div>
              </button>
            </div>
          </div>

          {/* Font Size */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-white flex items-center gap-1.5">
                <Type className="w-4 h-4 text-[#007acc]" />
                <span>Font Size</span>
              </label>
              <span className="text-[#007acc] font-mono font-bold">{settings.fontSize}px</span>
            </div>
            <input
              type="range"
              min={11}
              max={24}
              step={1}
              value={settings.fontSize}
              onChange={(e) => onUpdateSettings({ fontSize: Number(e.target.value) })}
              className="w-full accent-[#007acc] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#6e6e6e]">
              <span>Small (11px)</span>
              <span>Default (14px)</span>
              <span>Large (24px)</span>
            </div>
          </div>

          {/* Tab Size */}
          <div className="flex justify-between items-center py-1 border-b border-[#3c3c3c]">
            <div>
              <div className="font-medium text-white flex items-center gap-1.5">
                <Code className="w-4 h-4 text-[#007acc]" />
                <span>Tab Size</span>
              </div>
              <div className="text-[10px] text-[#858585]">Number of spaces per indentation level</div>
            </div>
            <div className="flex items-center gap-1 bg-[#1e1e1e] p-0.5 rounded border border-[#3c3c3c]">
              <button
                type="button"
                onClick={() => onUpdateSettings({ tabSize: 2 })}
                className={`px-2 py-1 rounded ${settings.tabSize === 2 ? 'bg-[#007acc] text-white font-bold' : 'text-[#858585] hover:text-white'}`}
              >
                2
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ tabSize: 4 })}
                className={`px-2 py-1 rounded ${settings.tabSize === 4 ? 'bg-[#007acc] text-white font-bold' : 'text-[#858585] hover:text-white'}`}
              >
                4
              </button>
            </div>
          </div>

          {/* Word Wrap */}
          <div className="flex justify-between items-center py-1 border-b border-[#3c3c3c]">
            <div>
              <div className="font-medium text-white">Word Wrap</div>
              <div className="text-[10px] text-[#858585]">Wrap long lines to viewport width</div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSettings({ wordWrap: settings.wordWrap === 'on' ? 'off' : 'on' })}
              className={`px-3 py-1 rounded border text-xs font-medium transition-colors ${
                settings.wordWrap === 'on'
                  ? 'bg-[#007acc] border-[#007acc] text-white'
                  : 'bg-[#1e1e1e] border-[#3c3c3c] text-[#858585]'
              }`}
            >
              {settings.wordWrap === 'on' ? 'On' : 'Off'}
            </button>
          </div>

          {/* Minimap */}
          <div className="flex justify-between items-center py-1 border-b border-[#3c3c3c]">
            <div>
              <div className="font-medium text-white flex items-center gap-1.5">
                <Layout className="w-4 h-4 text-[#007acc]" />
                <span>Minimap</span>
              </div>
              <div className="text-[10px] text-[#858585]">Show miniature code overview (Desktop)</div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSettings({ minimapEnabled: !settings.minimapEnabled })}
              className={`px-3 py-1 rounded border text-xs font-medium transition-colors ${
                settings.minimapEnabled
                  ? 'bg-[#007acc] border-[#007acc] text-white'
                  : 'bg-[#1e1e1e] border-[#3c3c3c] text-[#858585]'
              }`}
            >
              {settings.minimapEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Autosave */}
          <div className="flex justify-between items-center py-1 border-b border-[#3c3c3c]">
            <div>
              <div className="font-medium text-white">Auto Save</div>
              <div className="text-[10px] text-[#858585]">Automatically save changes to IndexedDB</div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSettings({ autoSaveEnabled: !settings.autoSaveEnabled })}
              className={`px-3 py-1 rounded border text-xs font-medium transition-colors ${
                settings.autoSaveEnabled
                  ? 'bg-[#007acc] border-[#007acc] text-white'
                  : 'bg-[#1e1e1e] border-[#3c3c3c] text-[#858585]'
              }`}
            >
              {settings.autoSaveEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Progressive Web App (PWA) Card */}
          <div className="pt-2 flex flex-col gap-2 border-t border-[#3c3c3c]">
            <div className="font-semibold text-white flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-[#007acc]" />
                <span>Progressive Web App (PWA)</span>
              </div>
              {isInstalled && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded">
                  <CheckCircle className="w-3 h-3" />
                  <span>Installed</span>
                </span>
              )}
            </div>

            <div className="p-3 bg-[#1e1e1e] border border-[#3c3c3c] rounded flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-[#252526] flex items-center justify-center border border-[#3c3c3c]">
                <Image
                  src="/logo/logo.png"
                  alt="Code Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white">Code</div>
                <div className="text-[10px] text-[#858585]">
                  Install as a standalone desktop or mobile application with offline support.
                </div>
              </div>
              {isInstallable && (
                <button
                  type="button"
                  onClick={promptInstall}
                  className="px-2.5 py-1.5 rounded bg-[#007acc] hover:bg-[#0062a3] text-white text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install</span>
                </button>
              )}
              {isInstalled && (
                <button
                  type="button"
                  onClick={() => {
                    resetInstalledState();
                    onClose();
                  }}
                  className="px-2 py-1 rounded bg-[#333333] hover:bg-[#444444] text-[#cccccc] hover:text-white text-[11px] font-medium shrink-0 transition-colors"
                  title="Reset PWA installed state to test the home install gate page"
                >
                  Test Install Gate
                </button>
              )}
            </div>
          </div>

          {/* Clear Local Data (Req 6) */}
          <div className="pt-2 flex flex-col gap-2">
            <div className="font-semibold text-red-400 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4" />
              <span>Reset Local Database</span>
            </div>
            <p className="text-[11px] text-[#858585]">
              Deletes all locally saved IndexedDB projects, restores starter templates, and clears settings.
            </p>

            {confirmClearData ? (
              <div className="p-2.5 bg-red-950/40 border border-red-800 rounded flex flex-col gap-2">
                <span className="text-red-200 font-semibold">Are you sure? This cannot be undone.</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmClearData(false)}
                    className="flex-1 px-2 py-1 rounded bg-[#333333] hover:bg-[#444444] text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleResetData}
                    disabled={isResetting}
                    className="flex-1 px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center justify-center gap-1"
                  >
                    {isResetting && <RefreshCw className="w-3 h-3 animate-spin" />}
                    <span>Confirm Reset</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClearData(true)}
                className="px-3 py-1.5 rounded bg-red-950/40 border border-red-800 text-red-300 hover:bg-red-900/60 transition-colors text-left font-medium"
              >
                Clear All Local Data & Restart
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
