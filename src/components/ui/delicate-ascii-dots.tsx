'use client';

import { useEffect, useRef, useCallback } from 'react';

export interface DelicateAsciiDotsProps {
  backgroundColor?: string;
  textColor?: string;
  gridSize?: number;
  removeWaveLine?: boolean;
  animationSpeed?: number;
  className?: string;
}

interface Wave {
  x: number;
  y: number;
  frequency: number;
  amplitude: number;
  phase: number;
  speed: number;
}

interface GridCell {
  char: string;
  opacity: number;
}

const CHARS =
  '⣧⣩⣪⣫⣬⣭⣮⣯⣱⣲⣳⣴⣵⣶⣷⣹⣺⣻⣼⣽⣾⣿⣧⣩⣪⣫⣬⣭⣮⣯⣱⣲⣳⣴⣵⣶⣷⣹⣺⣻⣼⣽⣾⣿⣧⣩⣪⣫⣬⣭⣮⣯⣱⣲⣳⣴⣵⣶⣷⣹⣺⣻⣼⣽⣾⣿⣧⣩⣪⣫⣬⣭⣮⣯⣱⣲⣳⣴⣵⣶⣷⣹⣺⣻⣼⣽⣾⣿⣧⣩⣪⣫⣬⣭⣮⣯⣱⣲⣳⣴⣵⣶⣷⣹⣺⣻⣼⣽⣾⣿⣧⣩⣪⣫⣬⣭⣮⣯⣱⣲⣳⣴⣵⣶⣷⣹⣺⣻⣼⣽⣾⣿⠁⠂⠄⠈⠐⠠⡀⢀⠃⠅⠘⠨⠊⠋⠌⠍⠎⠏⠑⠒⠓⠔⠕⠖⠗⠙⠚⠛⠜⠝⠞⠟⠡⠢⠣⠤⠥⠦⠧⠩⠪⠫⠬⠭⠮⠯⠱⠲⠳⠴⠵⠶⠷⠹⠺⠻⠼⠽⠾⠿⡁⡂⡃⡄⡅⡆⡇⡉⡊⡋⡌⡍⡎⡏⡑⡒⡓⡔⡕⡖⡗⡙⡚⡛⡜⡝⡞⡟⡡⡢⡣⡤⡥⡦⡧⡩⡪⡫⡬⡭⡮⡯⡱⡲⡳⡴⡵⡶⡷⡹⡺⡻⡼⡽⡾⡿⢁⢂⢃⢄⢅⢆⢇⢉⢊⢋⢌⢍⢎⢏⢑⢒⢓⢔⢕⢖⢗⢙⢚⢛⢜⢝⢞⢟⢡⢢⢣⢤⢥⢦⢧⢩⢪⢫⢬⢭⢮⢯⢱⢲⢳⢴⢵⢶⢷⢹⢺⢻⢼⢽⢾⢿⣀⣁⣂⣃⣄⣅⣆⣇⣉⣊⣋⣌⣍⣎⣏⣑⣒⣓⣔⣕⣖⣗⣙⣚⣛⣜⣝⣞⣟⣡⣢⣣⣤⣥⣦⣧⣩⣪⣫⣬⣭⣮⣯⣱⣲⣳⣴⣵⣶⣷⣹⣺⣻⣼⣽⣾⣿';

// Scale grid density smoothly with high quantity of points
function getEffectiveGridSize(width: number, baseGridSize: number): number {
  if (width === 0) return baseGridSize;
  if (width < 420) return Math.min(48, baseGridSize);
  if (width < 640) return Math.min(60, baseGridSize);
  if (width < 1024) return Math.min(75, baseGridSize);
  return baseGridSize;
}

export const DelicateAsciiDots = ({
  backgroundColor = '#000000',
  textColor = '90, 90, 90',
  gridSize = 85,
  removeWaveLine = true,
  animationSpeed = 0.75,
  className,
}: DelicateAsciiDotsProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, isDown: false });
  const timeRef = useRef<number>(0);
  const animationFrameId = useRef<number | null>(null);
  const clickWaves = useRef<
    Array<{ x: number; y: number; time: number; intensity: number }>
  >([]);
  const dimensionsRef = useRef({ width: 0, height: 0 });

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const containerRect = container.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;

    dimensionsRef.current = { width, height };

    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mouseRef.current = {
      x: x,
      y: y,
      isDown: mouseRef.current.isDown,
    };
  }, []);

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      mouseRef.current.isDown = true;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const { width, height } = dimensionsRef.current;
      const effectiveGrid = getEffectiveGridSize(width, gridSize);
      const cellWidth = width / effectiveGrid;
      const cellHeight = height / effectiveGrid;

      const gridX = x / cellWidth;
      const gridY = y / cellHeight;

      clickWaves.current.push({
        x: gridX,
        y: gridY,
        time: Date.now(),
        intensity: 2,
      });

      const now = Date.now();
      clickWaves.current = clickWaves.current.filter(
        (wave) => now - wave.time < 4000
      );
    },
    [gridSize]
  );

  const handleMouseUp = useCallback(() => {
    mouseRef.current.isDown = false;
  }, []);

  useEffect(() => {
    const { width: currentWidth } = dimensionsRef.current;
    const initialGrid = getEffectiveGridSize(currentWidth, gridSize);

    const waves: Wave[] = [];
    const numWaves = 6;

    for (let i = 0; i < numWaves; i++) {
      waves.push({
        x: initialGrid * (0.2 + Math.random() * 0.6),
        y: initialGrid * (0.2 + Math.random() * 0.6),
        frequency: 0.2 + Math.random() * 0.3,
        amplitude: 0.5 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.5,
      });
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    resizeCanvas();

    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);

    function getClickWaveInfluence(
      x: number,
      y: number,
      currentTime: number,
      effectiveGrid: number
    ): number {
      let totalInfluence = 0;

      clickWaves.current.forEach((wave) => {
        const age = currentTime - wave.time;
        const maxAge = 4000;
        if (age < maxAge) {
          const dx = x - wave.x;
          const dy = y - wave.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const waveRadius = (age / maxAge) * effectiveGrid * 0.8;
          const waveWidth = effectiveGrid * 0.15;

          if (Math.abs(distance - waveRadius) < waveWidth) {
            const waveStrength = (1 - age / maxAge) * wave.intensity;
            const proximityToWave =
              1 - Math.abs(distance - waveRadius) / waveWidth;
            totalInfluence +=
              waveStrength *
              proximityToWave *
              Math.sin((distance - waveRadius) * 0.5);
          }
        }
      });

      return totalInfluence;
    }

    function animate() {
      const activeCanvas = canvasRef.current;
      if (!activeCanvas) return;

      const ctx = activeCanvas.getContext('2d');
      if (!ctx) return;

      const currentTime = Date.now();
      timeRef.current += animationSpeed * 0.016;

      const { width, height } = dimensionsRef.current;
      if (width === 0 || height === 0) return;

      const effectiveGrid = getEffectiveGridSize(width, gridSize);

      // Clear canvas
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      const newGrid: (GridCell | null)[][] = Array(effectiveGrid)
        .fill(0)
        .map(() => Array(effectiveGrid).fill(null));

      const cellWidth = width / effectiveGrid;
      const cellHeight = height / effectiveGrid;

      const mouseGridX = mouseRef.current.x / cellWidth;
      const mouseGridY = mouseRef.current.y / cellHeight;

      const mouseWave: Wave = {
        x: mouseGridX,
        y: mouseGridY,
        frequency: 0.3,
        amplitude: 1,
        phase: timeRef.current * 2,
        speed: 1,
      };

      // Lower threshold allows richer, more continuous ASCII dot presence across screen
      const isSmallScreen = width < 640;
      const presenceThreshold = isSmallScreen ? 0.2 : 0.16;

      for (let y = 0; y < effectiveGrid; y++) {
        for (let x = 0; x < effectiveGrid; x++) {
          let totalWave = 0;
          const allWaves = waves.concat([mouseWave]);

          allWaves.forEach((wave) => {
            const dx = x - wave.x;
            const dy = y - wave.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const falloff = 1 / (1 + dist * 0.1);
            const value =
              Math.sin(
                dist * wave.frequency - timeRef.current * wave.speed + wave.phase
              ) *
              wave.amplitude *
              falloff;

            totalWave += value;
          });

          const clickInfluence = getClickWaveInfluence(x, y, currentTime, effectiveGrid);
          totalWave += clickInfluence;

          const mouseDistance = Math.sqrt(
            (x - mouseGridX) ** 2 + (y - mouseGridY) ** 2
          );
          if (mouseDistance < effectiveGrid * 0.3) {
            const mouseEffect = (1 - mouseDistance / (effectiveGrid * 0.3)) * 0.8;
            totalWave += mouseEffect * Math.sin(timeRef.current * 3);
          }

          const normalizedWave = (totalWave + 2) / 4;
          if (Math.abs(totalWave) > presenceThreshold) {
            const charIndex = Math.min(
              CHARS.length - 1,
              Math.max(0, Math.floor(normalizedWave * (CHARS.length - 1)))
            );
            const opacity = Math.min(
              0.9,
              Math.max(0.25, 0.25 + normalizedWave * 0.55)
            );

            newGrid[y][x] = {
              char: CHARS[charIndex] || CHARS[0],
              opacity: opacity,
            };
          }
        }
      }

      const fontSize = Math.min(cellWidth, cellHeight) * 0.82;
      ctx.font = `${fontSize}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let y = 0; y < effectiveGrid; y++) {
        for (let x = 0; x < effectiveGrid; x++) {
          const cell = newGrid[y][x];
          if (cell && cell.char && CHARS.includes(cell.char)) {
            ctx.fillStyle = `rgba(${textColor}, ${cell.opacity})`;
            ctx.fillText(
              cell.char,
              x * cellWidth + cellWidth / 2,
              y * cellHeight + cellHeight / 2
            );
          }
        }
      }

      if (!removeWaveLine) {
        clickWaves.current.forEach((wave) => {
          const age = currentTime - wave.time;
          const maxAge = 4000;
          if (age < maxAge) {
            const progress = age / maxAge;
            const radius = progress * Math.min(width, height) * 0.5;
            const alpha = (1 - progress) * 0.25 * wave.intensity;

            ctx.beginPath();
            ctx.strokeStyle = `rgba(${textColor}, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.arc(
              wave.x * cellWidth,
              wave.y * cellHeight,
              radius,
              0,
              2 * Math.PI
            );
            ctx.stroke();
          }
        });
      }

      animationFrameId.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);

      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      timeRef.current = 0;
      clickWaves.current = [];
    };
  }, [
    backgroundColor,
    textColor,
    gridSize,
    animationSpeed,
    removeWaveLine,
    resizeCanvas,
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
  ]);

  return (
    <div
      ref={containerRef}
      className={
        className ??
        'w-full h-full absolute inset-0 overflow-hidden'
      }
      style={{ backgroundColor }}
    >
      <canvas ref={canvasRef} className='block w-full h-full' />
    </div>
  );
};

export default DelicateAsciiDots;
