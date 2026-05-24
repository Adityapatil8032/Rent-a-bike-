import type { ReactNode } from 'react';
import Navigation from './Navigation';

export default function CustomerShell({
  children,
  withNav = true,
  bleed = false,
}: {
  children: ReactNode;
  withNav?: boolean;
  bleed?: boolean;
}) {
  return (
    <div className="min-h-screen bg-app-bg px-3 py-3 text-slate-950 sm:px-6 sm:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-24px)] w-full max-w-[420px] flex-col overflow-hidden rounded-[34px] border border-white/90 bg-[#FCFDFC] shadow-device">
        <main className={`flex-1 ${bleed ? '' : 'px-4 pt-5'} ${withNav ? 'pb-24' : 'pb-6'}`}>{children}</main>
        {withNav && <Navigation />}
      </div>
    </div>
  );
}
