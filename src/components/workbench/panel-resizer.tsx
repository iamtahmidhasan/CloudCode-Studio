'use client';

import React, { useState, useRef, useCallback } from 'react';

export interface ResizeEvent {
  deltaX: number;
  deltaY: number;
  clientX: number;
  clientY: number;
}

interface PanelResizerProps {
  orientation: 'horizontal' | 'vertical';
  onResize: (e: ResizeEvent) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  className?: string;
  ariaLabel?: string;
}

export function PanelResizer({
  orientation,
  onResize,
  onDragStart,
  onDragEnd,
  className = '',
  ariaLabel = 'Resize panel',
}: PanelResizerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return; // Only primary mouse button or touch
      e.preventDefault();
      e.stopPropagation();

      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Pointer capture fallback if not supported
      }

      lastPosRef.current = { x: e.clientX, y: e.clientY };
      setIsDragging(true);
      onDragStart?.();
    },
    [onDragStart]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging || !lastPosRef.current) return;
      e.preventDefault();

      const deltaX = e.clientX - lastPosRef.current.x;
      const deltaY = e.clientY - lastPosRef.current.y;
      lastPosRef.current = { x: e.clientX, y: e.clientY };

      onResize({
        deltaX,
        deltaY,
        clientX: e.clientX,
        clientY: e.clientY,
      });
    },
    [isDragging, onResize]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // ignore
      }
      setIsDragging(false);
      lastPosRef.current = null;
      onDragEnd?.();
    },
    [isDragging, onDragEnd]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const step = 20;
      let deltaX = 0;
      let deltaY = 0;

      if (orientation === 'horizontal') {
        if (e.key === 'ArrowUp') {
          deltaY = -step;
        } else if (e.key === 'ArrowDown') {
          deltaY = step;
        } else {
          return;
        }
      } else {
        if (e.key === 'ArrowLeft') {
          deltaX = -step;
        } else if (e.key === 'ArrowRight') {
          deltaX = step;
        } else {
          return;
        }
      }

      e.preventDefault();
      onDragStart?.();
      onResize({
        deltaX,
        deltaY,
        clientX: 0,
        clientY: 0,
      });
      onDragEnd?.();
    },
    [orientation, onResize, onDragStart, onDragEnd]
  );

  const isHoriz = orientation === 'horizontal';

  return (
    <>
      {/* Global transparent drag overlay when dragging to prevent iframe mouse swallow */}
      {isDragging && (
        <div
          className={`fixed inset-0 z-50 select-none ${
            isHoriz ? 'cursor-row-resize' : 'cursor-col-resize'
          }`}
          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        />
      )}

      <div
        role="separator"
        aria-orientation={orientation}
        aria-label={ariaLabel}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onLostPointerCapture={handlePointerUp}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onKeyDown={handleKeyDown}
        className={`group relative z-30 transition-colors select-none ${
          isHoriz
            ? 'h-2 w-full cursor-row-resize -my-1 py-1'
            : 'w-2 h-full cursor-col-resize -mx-1 px-1'
        } ${className}`}
        style={{
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        {/* Visible Divider Line */}
        <div
          className={`transition-colors duration-150 ${
            isHoriz ? 'w-full h-[2px]' : 'h-full w-[2px]'
          } ${
            isDragging || isHovered
              ? 'bg-[#007acc] shadow-[0_0_6px_rgba(0,122,204,0.6)]'
              : 'bg-[#3c3c3c] group-hover:bg-[#007acc]'
          }`}
        />

        {/* Center Grip Pill / Indicator */}
        <div
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-150 flex items-center justify-center ${
            isHoriz ? 'w-8 h-1.5' : 'w-1.5 h-8'
          } ${
            isDragging || isHovered
              ? 'bg-[#007acc] opacity-100 scale-110 shadow-sm'
              : 'bg-[#555555] opacity-0 group-hover:opacity-100'
          }`}
        >
          <div
            className={`rounded-full bg-white/70 ${
              isHoriz ? 'w-3 h-0.5' : 'w-0.5 h-3'
            }`}
          />
        </div>
      </div>
    </>
  );
}
