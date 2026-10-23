'use client';

import dynamic from 'next/dynamic';
import { usePwa } from '@/components/pwa/pwa-installer';
import { PwaInstallLanding } from '@/components/home/pwa-install-landing';
import { Loader2 } from 'lucide-react';

const WorkbenchRoot = dynamic(
  () => import('@/components/workbench/workbench-root').then((m) => m.WorkbenchRoot),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-screen items-center justify-center bg-[#1e1e1e] text-[#cccccc]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#007acc]" />
          <span className="text-xs font-mono tracking-wider">LOADING CODE...</span>
        </div>
      </div>
    ),
  }
);

export default function HomePage() {
  const { isInstalled, isMounted } = usePwa();

  // Until mounted on client, render a seamless dark loader to avoid hydration flash
  if (!isMounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#181818] text-[#cccccc]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#007acc]" />
          <span className="text-xs font-mono tracking-wider">INITIALIZING CODE...</span>
        </div>
      </div>
    );
  }

  // When installed, show the IDE and never show the home install landing page
  if (isInstalled) {
    return <WorkbenchRoot />;
  }

  // Without install, show the home front page component with the install button
  return <PwaInstallLanding />;
}

