'use client';

import React, { useState } from 'react';
import { RotateCw, Smartphone, Tablet, Monitor, Maximize2, ExternalLink } from 'lucide-react';

interface WebPreviewPaneProps {
  previewDoc: string;
  onRefresh?: () => void;
  isDragging?: boolean;
  hasBorderTop?: boolean;
}

export function WebPreviewPane({
  previewDoc,
  onRefresh,
  isDragging = false,
  hasBorderTop = false,
}: WebPreviewPaneProps) {
  const [deviceMode, setDeviceMode] = useState<'responsive' | 'mobile' | 'tablet' | 'desktop'>('responsive');

  const openInNewTab = () => {
    if (!previewDoc) return;
    const blob = new Blob([previewDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const getDeviceWidth = () => {
    switch (deviceMode) {
      case 'mobile':
        return '375px';
      case 'tablet':
        return '768px';
      case 'desktop':
        return '1024px';
      case 'responsive':
      default:
        return '100%';
    }
  };

  return (
    <div className={`flex flex-col h-full w-full bg-[#1e1e1e] overflow-hidden ${hasBorderTop ? 'border-t border-[#3c3c3c]' : ''}`}>
      {/* Preview Toolbar */}
      <div className="flex items-center justify-between px-3 h-8 bg-[#252526] border-b border-[#3c3c3c] text-xs text-[#858585] select-none shrink-0">
        <div className="flex items-center gap-1.5 font-medium text-[#cccccc]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Web Preview Sandbox</span>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center gap-1 bg-[#1e1e1e] p-0.5 rounded border border-[#3c3c3c]">
          <button
            type="button"
            onClick={() => setDeviceMode('responsive')}
            className={`p-1 rounded ${deviceMode === 'responsive' ? 'bg-[#04395e] text-white' : 'text-[#858585] hover:text-white'}`}
            title="Responsive (100%)"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode('mobile')}
            className={`p-1 rounded ${deviceMode === 'mobile' ? 'bg-[#04395e] text-white' : 'text-[#858585] hover:text-white'}`}
            title="Mobile (375px)"
          >
            <Smartphone className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode('tablet')}
            className={`p-1 rounded ${deviceMode === 'tablet' ? 'bg-[#04395e] text-white' : 'text-[#858585] hover:text-white'}`}
            title="Tablet (768px)"
          >
            <Tablet className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode('desktop')}
            className={`p-1 rounded ${deviceMode === 'desktop' ? 'bg-[#04395e] text-white' : 'text-[#858585] hover:text-white'}`}
            title="Desktop (1024px)"
          >
            <Monitor className="w-3 h-3" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="p-1 rounded hover:bg-[#3c3c3c] text-[#cccccc] hover:text-white"
              title="Reload Preview"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={openInNewTab}
            className="p-1 rounded hover:bg-[#3c3c3c] text-[#cccccc] hover:text-white"
            title="Open in New Tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 w-full h-full bg-[#141414] overflow-auto flex items-center justify-center p-2">
        {previewDoc ? (
          <div
            style={{ width: getDeviceWidth() }}
            className="h-full bg-white rounded shadow-2xl transition-all duration-200 overflow-hidden relative border border-[#3c3c3c]"
          >
            <iframe
              title="Live Code Preview"
              srcDoc={previewDoc}
              sandbox="allow-scripts"
              className={`w-full h-full border-0 ${isDragging ? 'pointer-events-none' : ''}`}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-[#858585] text-center p-6">
            <div className="text-3xl mb-2 opacity-40">🌐</div>
            <p className="text-sm font-medium text-[#cccccc]">No Preview Generated</p>
            <p className="text-xs text-[#6e6e6e] mt-1">
              Click &quot;Run&quot; in the editor or breadcrumb to render the HTML/CSS/JS preview.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
