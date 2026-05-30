import { ReactNode } from 'react';
import type { SessionUser } from '@/lib/session';
import { TopNav } from '@/components/layout/TopNav';

export function AppShell({
  user,
  title,
  children,
}: {
  user: SessionUser;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.12),_transparent_18%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_24%),linear-gradient(180deg,_#07111f_0%,_#081524_48%,_#091829_100%)] text-slate-100">
      <TopNav user={user} title={title} />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
