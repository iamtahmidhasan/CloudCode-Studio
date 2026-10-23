'use client';

import React from 'react';
import type { SupportedLanguage, ExecutionStatus } from '@/types';
import { Layers, Loader2, Check, AlertCircle } from 'lucide-react';

interface StatusBarProps {
  projectName?: string;
  language?: SupportedLanguage;
  cursorLine: number;
  cursorCol: number;
  executionStatus: ExecutionStatus;
  tabSize?: number;
  theme?: string;
  onLanguageClick?: () => void;
  onThemeClick?: () => void;
}

export function StatusBar({
  projectName,
  language,
  cursorLine,
  cursorCol,
  executionStatus,
  tabSize = 2,
  theme,
  onLanguageClick,
  onThemeClick,
}: StatusBarProps) {
  const getLanguageLabel = (lang?: SupportedLanguage) => {
    switch (lang) {
      case 'typescript':
        return 'TypeScript';
      case 'javascript':
        return 'JavaScript';
      case 'html':
        return 'HTML';
      case 'css':
        return 'CSS';
      case 'python':
        return 'Python 3';
      case 'cpp':
        return 'C++';
      default:
        return 'Plain Text';
    }
  };

  return (
    <footer 
      className="bg-[#007acc] text-white flex items-center justify-between px-2 text-[11px] font-sans select-none shrink-0 z-10 overflow-hidden"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        height: 'calc(24px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* Left items */}
      <div className="flex items-center gap-3">
        {/* Project Name */}
        <div className="flex items-center gap-1 hover:bg-black/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors">
          <Layers className="w-3 h-3" />
          <span className="font-semibold truncate max-w-[120px] sm:max-w-[200px]">{projectName || 'Project'}</span>
        </div>

        {/* Execution Status Badge */}
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/15">
          {executionStatus === 'running' && (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-amber-200" />
              <span>Running...</span>
            </>
          )}
          {executionStatus === 'success' && (
            <>
              <Check className="w-3 h-3 text-emerald-300" />
              <span>Ready</span>
            </>
          )}
          {executionStatus === 'error' && (
            <>
              <AlertCircle className="w-3 h-3 text-red-300" />
              <span>Error</span>
            </>
          )}
          {executionStatus === 'idle' && <span>Ready</span>}
        </div>
      </div>

      {/* Right items */}
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline-block hover:bg-black/10 px-1.5 py-0.5 rounded cursor-pointer">
          Ln {cursorLine}, Col {cursorCol}
        </span>
        <span className="hidden md:inline-block hover:bg-black/10 px-1.5 py-0.5 rounded cursor-pointer">
          Spaces: {tabSize}
        </span>
        <span className="hidden sm:inline-block hover:bg-black/10 px-1.5 py-0.5 rounded cursor-pointer">
          UTF-8
        </span>
        <button
          type="button"
          onClick={onLanguageClick}
          className="hover:bg-black/10 px-1.5 py-0.5 rounded cursor-pointer font-medium"
        >
          {getLanguageLabel(language)}
        </button>
        <button
          type="button"
          onClick={onThemeClick}
          className="hidden sm:inline-block hover:bg-black/10 px-1.5 py-0.5 rounded cursor-pointer font-medium"
        >
          {theme === 'vscode-light-plus' ? 'Light+' : 'Dark+'}
        </button>
      </div>
    </footer>
  );
}
