'use client';

import React from 'react';
import { Files, Play, Globe, Terminal, Settings } from 'lucide-react';

interface ActivityBarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  activeBottomTab: 'preview' | 'output';
  onSelectBottomTab: (tab: 'preview' | 'output') => void;
  onOpenSettings: () => void;
  onRunCode: () => void;
}

export function ActivityBar({
  isSidebarOpen,
  onToggleSidebar,
  activeBottomTab,
  onSelectBottomTab,
  onOpenSettings,
  onRunCode,
}: ActivityBarProps) {
  return (
    <div className="w-12 h-full bg-[#333333] border-r border-[#252526] flex flex-col justify-between items-center py-2 select-none shrink-0 z-10">
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
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-12 h-11 flex items-center justify-center text-[#858585] hover:text-white transition-colors border-l-2 border-transparent"
          title="Editor Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
