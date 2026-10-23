'use client';

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Search,
  Keyboard,
  X,
  Info,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export interface ShortcutItem {
  id: string;
  category: 'Workbench' | 'Editor' | 'Navigation' | 'Execution';
  action: string;
  keys: string[];
  description: string;
  browserNote?: string;
}

const SHORTCUTS: ShortcutItem[] = [
  // Workbench
  {
    id: 'toggle-sidebar',
    category: 'Workbench',
    action: 'Toggle Primary Sidebar',
    keys: ['Ctrl', 'B'],
    description: 'Show or hide the file explorer sidebar (intercepts browser bookmarks bar)',
  },
  {
    id: 'toggle-panel',
    category: 'Workbench',
    action: 'Toggle Terminal / Output Panel',
    keys: ['Ctrl', '`'],
    description: 'Show or hide the bottom dock panel (also supports Ctrl+J)',
  },
  {
    id: 'quick-open',
    category: 'Workbench',
    action: 'Quick Open / File Explorer',
    keys: ['Ctrl', 'P'],
    description: 'Open full screen Windows File Explorer (intercepts browser print dialog)',
  },
  {
    id: 'command-palette',
    category: 'Workbench',
    action: 'Show Command Palette',
    keys: ['Ctrl', 'Shift', 'P'],
    description: 'Open Monaco VS Code command palette (or press F1)',
  },
  {
    id: 'open-settings',
    category: 'Workbench',
    action: 'Open Settings',
    keys: ['Ctrl', ','],
    description: 'Open editor appearance, font, and runtime preferences',
  },
  {
    id: 'close-tab',
    category: 'Workbench',
    action: 'Close Active Editor Tab',
    keys: ['Alt', 'W'],
    description: 'Close the current active file tab safely without closing your browser',
    browserNote: 'In desktop VS Code this is Ctrl+W, but browsers reserve Ctrl+W to close browser tabs.',
  },
  {
    id: 'keyboard-shortcuts',
    category: 'Workbench',
    action: 'Open Keyboard Shortcuts',
    keys: ['Ctrl', 'K', 'Ctrl', 'S'],
    description: 'Open this interactive keyboard shortcuts reference',
  },

  // Execution
  {
    id: 'run-code',
    category: 'Execution',
    action: 'Run Code / Execute',
    keys: ['Ctrl', 'Enter'],
    description: 'Execute active file and switch to web preview or console output',
  },

  // Editor
  {
    id: 'emmet-html-boilerplate',
    category: 'Editor',
    action: 'HTML5 Boilerplate (Emmet)',
    keys: ['!', 'Enter'],
    description: 'Type ! or html:5 and press Enter or Tab to expand full HTML5 boilerplate with <!DOCTYPE html>, head, and body',
  },
  {
    id: 'save-file',
    category: 'Editor',
    action: 'Save Active File',
    keys: ['Ctrl', 'S'],
    description: 'Persist changes immediately (intercepts browser "Save Webpage As" dialog)',
  },
  {
    id: 'find-in-file',
    category: 'Editor',
    action: 'Find in File',
    keys: ['Ctrl', 'F'],
    description: 'Open Monaco in-editor search bar',
  },
  {
    id: 'replace-in-file',
    category: 'Editor',
    action: 'Replace in File',
    keys: ['Ctrl', 'H'],
    description: 'Open Monaco find and replace bar',
  },
  {
    id: 'toggle-line-comment',
    category: 'Editor',
    action: 'Toggle Line Comment',
    keys: ['Ctrl', '/'],
    description: 'Comment or uncomment current line or selection',
  },
  {
    id: 'toggle-block-comment',
    category: 'Editor',
    action: 'Toggle Block Comment',
    keys: ['Shift', 'Alt', 'A'],
    description: 'Add or remove multi-line block comment /* ... */',
  },
  {
    id: 'move-line-up',
    category: 'Editor',
    action: 'Move Line Up',
    keys: ['Alt', '↑'],
    description: 'Shift current line or selection up',
  },
  {
    id: 'move-line-down',
    category: 'Editor',
    action: 'Move Line Down',
    keys: ['Alt', '↓'],
    description: 'Shift current line or selection down',
  },
  {
    id: 'duplicate-line-down',
    category: 'Editor',
    action: 'Duplicate Line Down',
    keys: ['Shift', 'Alt', '↓'],
    description: 'Duplicate current line or selection downward',
  },
  {
    id: 'duplicate-line-up',
    category: 'Editor',
    action: 'Duplicate Line Up',
    keys: ['Shift', 'Alt', '↑'],
    description: 'Duplicate current line or selection upward',
  },
  {
    id: 'delete-line',
    category: 'Editor',
    action: 'Delete Line',
    keys: ['Ctrl', 'Shift', 'K'],
    description: 'Delete current line immediately without copying',
  },
  {
    id: 'format-document',
    category: 'Editor',
    action: 'Format Document',
    keys: ['Shift', 'Alt', 'F'],
    description: 'Beautify and auto-format code according to syntax rules',
  },
  {
    id: 'multi-cursor-next',
    category: 'Editor',
    action: 'Add Next Occurrence (Multi-cursor)',
    keys: ['Ctrl', 'D'],
    description: 'Select next instance of current word with an additional cursor',
  },
  {
    id: 'insert-cursor-click',
    category: 'Editor',
    action: 'Add Multiple Cursors',
    keys: ['Alt', 'Click'],
    description: 'Click anywhere to place additional simultaneous typing cursors',
  },
  {
    id: 'trigger-suggest',
    category: 'Editor',
    action: 'Trigger Autocomplete / IntelliSense',
    keys: ['Ctrl', 'Space'],
    description: 'Show code completion proposals and snippets',
  },
  {
    id: 'go-to-line',
    category: 'Navigation',
    action: 'Go to Line...',
    keys: ['Ctrl', 'G'],
    description: 'Navigate to a specific line number',
  },
];

interface KeyboardShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsDialog({ isOpen, onClose }: KeyboardShortcutsDialogProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Workbench', 'Editor', 'Navigation', 'Execution'];

  const filteredShortcuts = useMemo(() => {
    return SHORTCUTS.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        item.action.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.keys.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [search, selectedCategory]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#252526] text-[#cccccc] border-[#3c3c3c] sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-[#333333] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#007acc]/15 flex items-center justify-center text-[#007acc]">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-white text-base font-semibold">
                Keyboard Shortcuts Reference
              </DialogTitle>
              <DialogDescription className="text-xs text-[#858585]">
                VS Code default keybindings &amp; web browser bridge mappings
              </DialogDescription>
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-3 relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-[#858585]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shortcuts by command or key (e.g. Save, Ctrl+B, format, line)..."
              className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded pl-9 pr-8 py-1.5 text-xs text-[#cccccc] placeholder-[#6e6e6e] focus:outline-none focus:border-[#007acc]"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 text-[#858585] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto scrollbar-none pb-0.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-[#007acc] text-white font-medium shadow-sm'
                    : 'bg-[#1e1e1e] text-[#858585] hover:text-[#cccccc] hover:bg-[#333333]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </DialogHeader>

        {/* Informational Callout */}
        <div className="px-4 sm:px-5 py-2.5 bg-[#1e1e1e]/80 border-b border-[#333333] shrink-0 text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#007acc] shrink-0 mt-0.5" />
          <div className="text-[11px] text-[#9d9d9d] leading-relaxed">
            <strong className="text-[#cccccc]">Why do some shortcuts differ in a web browser?</strong> Web browsers reserve certain system keys (like <kbd className="px-1 py-0.5 bg-[#2d2d2d] rounded text-[#cccccc] font-mono">Ctrl+W</kbd> to close the browser tab) for OS security. Our Web IDE intercepts keys like <kbd className="px-1 py-0.5 bg-[#2d2d2d] rounded text-[#cccccc] font-mono">Ctrl+S</kbd>, <kbd className="px-1 py-0.5 bg-[#2d2d2d] rounded text-[#cccccc] font-mono">Ctrl+P</kbd>, <kbd className="px-1 py-0.5 bg-[#2d2d2d] rounded text-[#cccccc] font-mono">Ctrl+B</kbd> and maps close tab to <kbd className="px-1 py-0.5 bg-[#2d2d2d] rounded text-[#007acc] font-mono">Alt+W</kbd>.
          </div>
        </div>

        {/* Shortcuts Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2">
          {filteredShortcuts.length === 0 ? (
            <div className="text-center py-10 text-[#858585]">
              <Keyboard className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No shortcuts match &quot;{search}&quot;</p>
            </div>
          ) : (
            filteredShortcuts.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded bg-[#1e1e1e]/60 hover:bg-[#1e1e1e] border border-[#333333]/60 transition-colors gap-2"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-white truncate">
                      {item.action}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#333333] text-[#858585] uppercase tracking-wider shrink-0">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#858585] mt-0.5 truncate sm:whitespace-normal">
                    {item.description}
                  </p>
                  {item.browserNote && (
                    <p className="text-[10px] text-amber-400/90 mt-0.5 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>{item.browserNote}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0 self-start sm:self-center">
                  {item.keys.map((k, idx) => (
                    <React.Fragment key={idx}>
                      <kbd className="px-2 py-1 bg-[#2d2d2d] border border-[#3c3c3c] rounded text-xs font-mono text-[#cccccc] shadow-sm min-w-[24px] text-center">
                        {k}
                      </kbd>
                      {idx < item.keys.length - 1 && item.keys.length > 2 && idx === 1 ? (
                        <span className="text-[#6e6e6e] text-xs mx-0.5">then</span>
                      ) : idx < item.keys.length - 1 ? (
                        <span className="text-[#6e6e6e] text-xs">+</span>
                      ) : null}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#1e1e1e] border-t border-[#333333] shrink-0 flex items-center justify-between text-[11px] text-[#858585]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>All Monaco core shortcuts (multi-cursor, find, comments, formatting) are active</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-[#333333] hover:bg-[#3c3c3c] text-[#cccccc] hover:text-white rounded text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
