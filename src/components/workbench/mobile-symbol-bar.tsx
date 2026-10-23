'use client';

import React from 'react';
import { Undo, Redo } from 'lucide-react';

interface MobileSymbolBarProps {
  onInsertSymbol: (symbol: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

const COMMON_SYMBOLS = [
  '{', '}', '(', ')', '[', ']', ';', ':', '=', '=>', '"', "'", '<', '>', '/', '\\', '$', '?', '!', '&', '|',
];

export function MobileSymbolBar({ onInsertSymbol, onUndo, onRedo }: MobileSymbolBarProps) {
  return (
    <div className="flex items-center gap-1 px-2 h-9 bg-[#1e1e1e] border-t border-[#3c3c3c] overflow-x-auto no-scrollbar shrink-0 select-none z-10">
      {/* Undo & Redo */}
      {onUndo && (
        <button
          type="button"
          onClick={onUndo}
          className="px-2 h-7 rounded bg-[#2d2d2d] hover:bg-[#3c3c3c] text-[#cccccc] text-xs font-mono shrink-0 flex items-center justify-center min-w-[32px]"
          title="Undo"
        >
          <Undo className="w-3.5 h-3.5" />
        </button>
      )}
      {onRedo && (
        <button
          type="button"
          onClick={onRedo}
          className="px-2 h-7 rounded bg-[#2d2d2d] hover:bg-[#3c3c3c] text-[#cccccc] text-xs font-mono shrink-0 flex items-center justify-center min-w-[32px]"
          title="Redo"
        >
          <Redo className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Tab (Indent 2 spaces) */}
      <button
        type="button"
        onClick={() => onInsertSymbol('  ')}
        className="px-2 h-7 rounded bg-[#2d2d2d] hover:bg-[#3c3c3c] text-[#cccccc] text-xs font-mono shrink-0 font-semibold"
      >
        Tab
      </button>

      {/* Symbols */}
      {COMMON_SYMBOLS.map((symbol) => (
        <button
          key={symbol}
          type="button"
          onClick={() => onInsertSymbol(symbol)}
          className="px-2.5 h-7 rounded bg-[#2d2d2d] active:bg-[#007acc] active:text-white text-[#cccccc] text-xs font-mono shrink-0 transition-colors"
        >
          {symbol}
        </button>
      ))}
    </div>
  );
}
