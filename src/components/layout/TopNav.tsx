'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import type { SessionUser } from '@/lib/session';

export function TopNav({
  user,
  title,
}: {
  user: SessionUser;
  title: string;
}) {
  const router = useRouter();

  const onLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  };

  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <header className="sticky top-0 z-10 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900/80 ring-1 ring-inset ring-sky-400/15 shadow-[0_10px_24px_rgba(34,211,238,0.18)]">
            <Image
              src="/ATIconFInal.png"
              alt="Attendance Tracker logo"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-100">{title}</div>
            <div className="text-xs text-slate-400">
              {user.name} · {user.isAdmin ? 'Admin' : 'Employee'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full bg-slate-900/90 px-2 py-1 ring-1 ring-inset ring-slate-700/80 sm:flex">
            <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-cyan-300 text-xs font-semibold text-slate-950">
              {initials || 'U'}
            </div>
            <div className="pr-1 text-xs font-medium text-slate-300">
              {user.email}
            </div>
          </div>
          <Button variant="danger" size="sm" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
