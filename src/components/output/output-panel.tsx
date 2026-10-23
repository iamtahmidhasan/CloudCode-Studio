'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { ConsoleMessage } from '@/types';
import { Trash2, Terminal, AlertTriangle, AlertCircle, Info, Search, CheckCircle2 } from 'lucide-react';

interface OutputPanelProps {
  messages: ConsoleMessage[];
  onClear: () => void;
  executionTime?: number | null;
  hasBorderTop?: boolean;
}

export function OutputPanel({
  messages,
  onClear,
  executionTime,
  hasBorderTop = false,
}: OutputPanelProps) {
  const [filterLevel, setFilterLevel] = useState<'all' | 'log' | 'warn' | 'error'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const filteredMessages = messages.filter((msg) => {
    if (filterLevel !== 'all' && msg.type !== filterLevel) {
      if (filterLevel === 'log' && !['log', 'info', 'system'].includes(msg.type)) return false;
      if (filterLevel === 'warn' && msg.type !== 'warn') return false;
      if (filterLevel === 'error' && msg.type !== 'error') return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return msg.args.some((a) => a.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className={`flex flex-col h-full w-full bg-[#1e1e1e] text-xs font-mono select-none overflow-hidden ${hasBorderTop ? 'border-t border-[#3c3c3c]' : ''}`}>
      {/* Console Header Bar */}
      <div className="flex items-center justify-between px-3 h-8 bg-[#252526] border-b border-[#3c3c3c] text-[#858585] shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-medium text-[#cccccc]">
            <Terminal className="w-3.5 h-3.5 text-[#007acc]" />
            <span>Console Output</span>
          </div>
          <span className="px-1.5 py-0.2 bg-[#1e1e1e] rounded text-[10px] text-[#858585]">
            {messages.length}
          </span>
          {executionTime !== null && executionTime !== undefined && (
            <span className="text-[11px] text-emerald-400 font-sans">({executionTime}ms)</span>
          )}
        </div>

        {/* Filter & Search Controls */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex items-center">
            <Search className="w-3 h-3 absolute left-1.5 text-[#6e6e6e]" />
            <input
              type="text"
              placeholder="Filter output..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-6 pr-2 py-0.5 bg-[#1e1e1e] border border-[#3c3c3c] rounded text-[11px] text-[#cccccc] focus:outline-none focus:border-[#007acc] w-28 sm:w-36"
            />
          </div>

          {/* Level Filter Tabs */}
          <div className="flex items-center bg-[#1e1e1e] rounded border border-[#3c3c3c] p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setFilterLevel('all')}
              className={`px-1.5 py-0.5 rounded ${filterLevel === 'all' ? 'bg-[#04395e] text-white' : 'text-[#858585] hover:text-white'}`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterLevel('log')}
              className={`px-1.5 py-0.5 rounded ${filterLevel === 'log' ? 'bg-[#04395e] text-white' : 'text-[#858585] hover:text-white'}`}
            >
              Logs
            </button>
            <button
              type="button"
              onClick={() => setFilterLevel('warn')}
              className={`px-1.5 py-0.5 rounded ${filterLevel === 'warn' ? 'bg-[#04395e] text-white' : 'text-[#858585] hover:text-white'}`}
            >
              Warnings
            </button>
            <button
              type="button"
              onClick={() => setFilterLevel('error')}
              className={`px-1.5 py-0.5 rounded ${filterLevel === 'error' ? 'bg-[#04395e] text-white' : 'text-[#858585] hover:text-white'}`}
            >
              Errors
            </button>
          </div>

          {/* Clear Button */}
          <button
            type="button"
            onClick={onClear}
            className="p-1 rounded hover:bg-[#3c3c3c] text-[#858585] hover:text-white transition-colors"
            title="Clear Console"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1 select-text">
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#666666] text-center select-none py-8">
            <Terminal className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-xs">No console messages</p>
            <p className="text-[10px] text-[#555555] mt-1">Run code to see standard output, warnings, or errors</p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const timeStr = new Date(msg.timestamp).toLocaleTimeString();
            let icon = null;
            let textClass = 'text-[#cccccc]';
            let bgClass = '';

            if (msg.type === 'error') {
              icon = <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />;
              textClass = 'text-red-300';
              bgClass = 'bg-red-950/20 border-l-2 border-red-500 pl-1.5 py-0.5';
            } else if (msg.type === 'warn') {
              icon = <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />;
              textClass = 'text-amber-300';
              bgClass = 'bg-amber-950/20 border-l-2 border-amber-500 pl-1.5 py-0.5';
            } else if (msg.type === 'info') {
              icon = <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />;
              textClass = 'text-sky-300';
            } else if (msg.type === 'system') {
              icon = <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />;
              textClass = 'text-purple-300 italic';
            }

            return (
              <div key={msg.id} className={`flex items-start gap-2 text-xs font-mono leading-relaxed ${bgClass}`}>
                {icon}
                <span className="text-[10px] text-[#555555] shrink-0 mt-0.5 select-none">{timeStr}</span>
                <div className={`flex-1 break-words whitespace-pre-wrap ${textClass}`}>
                  {msg.args.join(' ')}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
