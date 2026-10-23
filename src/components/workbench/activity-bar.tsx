'use client';

import React from 'react';
import { Files, Play, Globe, Terminal, Settings, FolderOpen, Keyboard, Download } from 'lucide-react';
import { usePwa } from '@/components/pwa/pwa-installer';

interface ActivityBarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenWindowsExplorer?: () => void;
  activeBottomTab: 'preview' | 'output';
  onSelectBottomTab: (tab: 'preview' | 'output') => void;
  onOpenSettings: () => void;
  onOpenShortcuts?: () => void;
  onRunCode: () => void;
}

export function ActivityBar({
  isSidebarOpen,
  onToggleSidebar,
  onOpenWindowsExplorer,
  activeBottomTab,
  onSelectBottomTab,
  onOpenSettings,
  onOpenShortcuts,
  onRunCode,
}: ActivityBarProps) {
  const { isInstallable, promptInstall } = usePwa();
  return (
    <div 
      className="w-12 h-full bg-[#333333] border-r border-[#252526] flex flex-col justify-between items-center py-2 select-none shrink-0 z-10"
      style={{
        paddingTop: 'calc(0.5rem + env(safe-area-inset-top, 0px))',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
      }}
    >
      {/* Top Icons */}
      <div className="flex flex-col items-center gap-1 w-full">
        {/* Explorer Toggle */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className={`w-12 h-11 flex items-center justify-center transition-colors relative ${
            isSidebarOpen ? 'text-white border-l-2 border-[#007acc]' : 'text-[#858585] hover:text-white border-l-2 border-transparent'
          }`}
          title="Explorer (Ctrl+B)"
        >
          <Files className="w-5 h-5" />
        </button>

        {/* Windows Explorer Full Screen View */}
        {onOpenWindowsExplorer && (
          <button
            type="button"
            onClick={onOpenWindowsExplorer}
            className="w-12 h-11 flex items-center justify-center text-[#858585] hover:text-[#38bdf8] transition-colors relative border-l-2 border-transparent"
            title="Full Screen Windows File Explorer"
          >
            <FolderOpen className="w-5 h-5" />
          </button>
        )}

        {/* Run Code */}
        <button
          type="button"
          onClick={onRunCode}
          className="w-12 h-11 flex items-center justify-center text-[#858585] hover:text-white transition-colors relative border-l-2 border-transparent"
          title="Run Code (Ctrl+Enter)"
        >
          <Play className="w-5 h-5" />
        </button>

        {/* Web Preview */}
        <button
          type="button"
          onClick={() => onSelectBottomTab('preview')}
          className={`w-12 h-11 flex items-center justify-center transition-colors relative ${
            activeBottomTab === 'preview' ? 'text-white border-l-2 border-[#007acc]' : 'text-[#858585] hover:text-white border-l-2 border-transparent'
          }`}
          title="Web Preview"
        >
          <Globe className="w-5 h-5" />
        </button>

        {/* Console Output */}
        <button
          type="button"
          onClick={() => onSelectBottomTab('output')}
          className={`w-12 h-11 flex items-center justify-center transition-colors relative ${
            activeBottomTab === 'output' ? 'text-white border-l-2 border-[#007acc]' : 'text-[#858585] hover:text-white border-l-2 border-transparent'
          }`}
          title="Console Output"
        >
          <Terminal className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom Icons */}
      <div className="flex flex-col items-center gap-1 w-full">
        {isInstallable && (
          <button
            type="button"
            onClick={promptInstall}
            className="w-12 h-11 flex items-center justify-center text-[#38bdf8] hover:text-white hover:bg-[#38bdf8]/15 transition-colors border-l-2 border-transparent animate-pulse"
            title="Install Code App (Desktop PWA)"
          >
            <Download className="w-5 h-5" />
          </button>
        )}
        {onOpenShortcuts && (
          <button
            type="button"
            onClick={onOpenShortcuts}
            className="w-12 h-11 flex items-center justify-center text-[#858585] hover:text-white transition-colors border-l-2 border-transparent"
            title="Keyboard Shortcuts (Ctrl+K Ctrl+S)"
          >
            <Keyboard className="w-5 h-5" />
          </button>
        )}
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-12 h-11 flex items-center justify-center text-[#858585] hover:text-white transition-colors border-l-2 border-transparent"
          title="Editor Settings (Ctrl+,)"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
