'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const WorkbenchRoot = dynamic(
  () => import('@/components/workbench/workbench-root').then((m) => m.WorkbenchRoot),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-screen items-center justify-center bg-[#1e1e1e] text-[#cccccc]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#007acc]" />
          <span className="text-xs font-mono tracking-wider">LOADING CLOUDCODE STUDIO...</span>
        </div>
      </div>
    ),
  }
);

export default function HomePage() {
  return <WorkbenchRoot />;
}
