'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePwa } from '@/components/pwa/pwa-installer';
import { DelicateAsciiDots } from '@/components/ui/delicate-ascii-dots';
import { Download, ArrowRight, X } from 'lucide-react';

export function PwaInstallLanding() {
  const { isInstallable, promptInstall, setAsInstalled } = usePwa();
  const [isInstalling, setIsInstalling] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [installStatusMsg, setInstallStatusMsg] = useState<string | null>(null);

  // Close help dialog with Escape key
  useEffect(() => {
    if (!showHelp) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowHelp(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showHelp]);

  const handleInstallClick = async () => {
    setIsInstalling(true);
    setInstallStatusMsg(null);

    try {
      if (isInstallable) {
        const installed = await promptInstall();
        if (installed) {
          return;
        } else {
          setInstallStatusMsg('Install prompt dismissed.');
        }
      } else {
        // Native programmatic prompt unavailable on this platform/browser
        setShowHelp(true);
      }
    } catch {
      setShowHelp(true);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <main className="relative h-screen w-screen bg-black text-[#cccccc] overflow-hidden flex flex-col items-center justify-center select-none">
      {/* Interactive ASCII Wave Canvas Background */}
      <DelicateAsciiDots
        backgroundColor="#000000"
        textColor="85, 85, 85"
        gridSize={85}
        removeWaveLine={false}
        animationSpeed={0.7}
        className="w-full h-full absolute inset-0 overflow-hidden pointer-events-auto"
      />

      {/* Subtle vignette radial mask to keep typography laser-sharp */}
      <div 
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_25%,rgba(0,0,0,0.75)_80%,rgba(0,0,0,0.95)_100%)]" 
        aria-hidden="true"
      />

      {/* Top minimal status bar */}
      <header className="absolute top-0 left-0 right-0 z-20 px-6 py-6 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-500">
            PWA Standalone Engine
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowHelp(true)}
          className="pointer-events-auto text-[10px] font-mono uppercase tracking-wider text-neutral-500 hover:text-neutral-200 transition-colors flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:border-white/20 backdrop-blur-sm cursor-pointer"
        >
          <span>Guide</span>
        </button>
      </header>

      {/* Center Minimal Composition */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pointer-events-none max-w-sm">
        {/* App Logo */}
        <div className="relative mb-5 group pointer-events-auto">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/15 bg-neutral-950/80 shadow-[0_0_40px_rgba(0,0,0,0.8)] backdrop-blur-md p-1 transition-transform duration-300 hover:scale-105">
            <Image
              src="/logo/logo.png"
              alt="Code Logo"
              width={80}
              height={80}
              className="w-full h-full object-cover rounded-[12px]"
              priority
            />
          </div>
        </div>

        {/* Title & Monospace Tagline */}
        <h1 className="text-4xl sm:text-5xl font-light tracking-tight text-white mb-1.5 font-sans">
          Code
        </h1>
        <p className="text-[11px] font-mono tracking-[0.25em] text-neutral-400 uppercase mb-8">
          Studio &amp; Web IDE
        </p>

        {/* Minimal Install Button */}
        <div className="pointer-events-auto flex flex-col items-center gap-3 w-full">
          <button
            type="button"
            id="install-pwa-button"
            onClick={handleInstallClick}
            disabled={isInstalling}
            className="group relative inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full text-xs font-mono uppercase tracking-widest text-white bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/35 backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.12)] active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#007acc] group-hover:bg-[#0098ff] group-hover:shadow-[0_0_8px_#0098ff] transition-all" />
            {isInstalling ? (
              <span>Installing...</span>
            ) : (
              <span>Install Code</span>
            )}
            <Download className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white group-hover:translate-y-0.5 transition-all" />
          </button>

          {installStatusMsg && (
            <p className="text-[10px] font-mono text-amber-400/90 mt-1 animate-in fade-in">
              {installStatusMsg}
            </p>
          )}

          {/* Discreet secondary fallback */}
          <button
            type="button"
            onClick={() => setAsInstalled()}
            className="text-[11px] font-mono text-neutral-400 hover:text-neutral-200 transition-colors pt-3 flex items-center gap-1 opacity-70 hover:opacity-100 cursor-pointer"
          >
            <span>or open in browser</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* Minimal Footer */}
      <footer className="absolute bottom-0 left-0 right-0 z-20 px-6 py-6 flex items-center justify-between text-[10px] font-mono text-neutral-600 pointer-events-none">
        <span>INTERACTIVE ASCII CANVAS</span>
        <span>CODE V1.0</span>
      </footer>

      {/* Minimal & Creative Floating Installation Dialog */}
      {showHelp && (
        <div 
          onClick={() => setShowHelp(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 pointer-events-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[340px] bg-[#0c0c0c]/90 border border-white/10 rounded-2xl p-5 shadow-[0_0_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl text-left overflow-hidden animate-in zoom-in-95 duration-200"
          >
            {/* Ambient top hairline glow */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#007acc]/70 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#007acc] shadow-[0_0_6px_#0098ff]" />
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400">
                  Quick Install
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="w-5 h-5 rounded-full hover:bg-white/10 text-neutral-500 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Creative Step Cards */}
            <div className="space-y-2 mb-4 font-mono">
              {/* Chrome / Edge Row */}
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-[#007acc]/10 border border-[#007acc]/20 flex items-center justify-center text-[#0098ff] text-sm shrink-0 font-sans">
                  ⊕
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-white font-medium">Chrome &amp; Edge</div>
                  <div className="text-[10px] text-neutral-500 truncate">Click ⊕ in the URL bar</div>
                </div>
              </div>

              {/* Safari / iOS / macOS Row */}
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-xs shrink-0 font-sans">
                  ↑
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-white font-medium">Safari &amp; iOS</div>
                  <div className="text-[10px] text-neutral-500 truncate">Share → Add to Dock / Home</div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={() => {
                setAsInstalled();
                setShowHelp(false);
              }}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-mono tracking-wider text-white bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 backdrop-blur-md transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer active:scale-[0.98]"
            >
              <span>Launch Studio</span>
              <ArrowRight className="w-3 h-3 text-neutral-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
