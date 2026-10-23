'use client';

import React from 'react';
import type { MobileTab } from '@/types';
import { Code, Folder, Globe, Terminal } from 'lucide-react';

interface MobileNavProps {
  activeTab: MobileTab;
  onSelectTab: (tab: MobileTab) => void;
  outputCount?: number;
}

export function MobileNav({ activeTab, onSelectTab, outputCount = 0 }: MobileNavProps) {
  return (
    <nav className="bg-[#252526] border-t border-[#3c3c3c] flex items-center justify-around select-none shrink-0 z-20 pb-[env(safe-area-inset-bottom,0px)] h-[calc(3.5rem+env(safe-area-inset-bottom,0px))]">
      {/* Code Editor Tab */}
      <button
        type="button"
        onClick={() => onSelectTab('code')}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 min-h-[48px] transition-colors ${
          activeTab === 'code' ? 'text-[#007acc] font-semibold' : 'text-[#858585] hover:text-[#cccccc]'
        }`}
      >
        <Code className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">Code</span>
      </button>

      {/* Files Tab */}
      <button
        type="button"
        onClick={() => onSelectTab('files')}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 min-h-[48px] transition-colors ${
          activeTab === 'files' ? 'text-[#007acc] font-semibold' : 'text-[#858585] hover:text-[#cccccc]'
        }`}
      >
        <Folder className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">Files</span>
      </button>

      {/* Preview Tab */}
      <button
        type="button"
        onClick={() => onSelectTab('preview')}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 min-h-[48px] transition-colors ${
          activeTab === 'preview' ? 'text-[#007acc] font-semibold' : 'text-[#858585] hover:text-[#cccccc]'
        }`}
      >
        <Globe className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">Preview</span>
      </button>

      {/* Output / Console Tab */}
      <button
        type="button"
        onClick={() => onSelectTab('output')}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 min-h-[48px] relative transition-colors ${
          activeTab === 'output' ? 'text-[#007acc] font-semibold' : 'text-[#858585] hover:text-[#cccccc]'
        }`}
      >
        <div className="relative">
          <Terminal className="w-5 h-5 mb-0.5" />
          {outputCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-[#007acc] text-white text-[9px] px-1 rounded-full font-bold">
              {outputCount > 99 ? '99+' : outputCount}
            </span>
          )}
        </div>
        <span className="text-[10px]">Output</span>
      </button>
    </nav>
  );
}
