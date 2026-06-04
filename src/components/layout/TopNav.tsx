'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { triggerGlobalNavigationLoader } from '@/components/layout/navigation-loader';
import { Button } from '@/components/ui/Button';
import type { SessionUser } from '@/lib/session';
import { fetchMyProfile } from '@/modules/employee/api';
import type { EmployeePortalProfile } from '@/modules/employee/types';

export function TopNav({
  user,
  title,
  fullWidth = false,
}: {
  user: SessionUser;
  title: string;
  fullWidth?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isEmployee = !user.isAdmin;
  const isLeavePolicyPage = pathname === '/employee/leave-policy';
  const [employeeProfile, setEmployeeProfile] = useState<EmployeePortalProfile | null>(null);

  useEffect(() => {
    if (!isEmployee) {
      return;
    }

    let cancelled = false;

    const loadEmployeeProfile = async () => {
      try {
        const profile = await fetchMyProfile();
        if (!cancelled) {
          setEmployeeProfile(profile);
        }
      } catch {
        // Keep the most recent visible profile if the background refresh fails.
      }
    };

    void loadEmployeeProfile();
    const intervalId = window.setInterval(() => {
      void loadEmployeeProfile();
    }, 10000);

    const handleFocus = () => {
      void loadEmployeeProfile();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [isEmployee]);

  const displayUser = useMemo(
    () => ({
      ...user,
      name: employeeProfile?.name ?? user.name,
      email: employeeProfile?.email ?? user.email,
      position: employeeProfile?.position ?? null,
    }),
    [employeeProfile, user]
  );

  const onLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  };

  const onPolicyNavigate = () => {
    triggerGlobalNavigationLoader({
      title: isLeavePolicyPage ? 'Loading dashboard' : 'Loading leave policy',
      description: isLeavePolicyPage
        ? 'Bringing your employee workspace back into focus.'
        : 'Preparing the latest leave guidance for a smoother read.',
    });
    router.push(isLeavePolicyPage ? '/employee/dashboard' : '/employee/leave-policy');
  };

  const initials = displayUser.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <header className="sticky top-0 z-10 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl">
      <div
        className={[
          'flex flex-col gap-2 px-3 py-2.5 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0',
          fullWidth ? 'w-full sm:px-4 lg:px-6 xl:px-8' : 'mx-auto max-w-7xl sm:px-6 lg:px-8',
        ].join(' ')}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900/80 ring-1 ring-inset ring-sky-400/15 shadow-[0_10px_24px_rgba(34,211,238,0.18)] sm:h-9 sm:w-9">
            <Image
              src="/ATIconFInal.png"
              alt="Attendance Tracker logo"
              width={32}
              height={32}
              className="h-7 w-7 object-contain sm:h-8 sm:w-8"
            />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-slate-100 sm:text-sm">{title}</div>
            <div className="truncate text-[11px] text-slate-400 sm:text-xs">
              {displayUser.name} · {user.isAdmin ? 'Admin' : 'Employee'}
              {isEmployee && displayUser.position ? ` · ${displayUser.position}` : ''}
            </div>
          </div>
        </div>
        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-3">
          <div className="flex min-w-0 items-center gap-2 rounded-full bg-slate-900/90 px-2 py-1 ring-1 ring-inset ring-slate-700/80 sm:flex">
            <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-cyan-300 text-xs font-semibold text-slate-950">
              {initials || 'U'}
            </div>
            <div className="hidden max-w-[7.5rem] truncate pr-1 text-[11px] font-medium text-slate-300 min-[380px]:block sm:max-w-[12rem] sm:text-xs">
              {displayUser.email}
            </div>
          </div>
          {isEmployee ? (
            <Button
              className="shrink-0 px-2.5 sm:px-3"
              variant="secondary"
              size="sm"
              onClick={onPolicyNavigate}
            >
              {isLeavePolicyPage ? 'Dashboard' : 'Leave Policy'}
            </Button>
          ) : null}
          <Button className="shrink-0 px-2.5 sm:px-3" variant="danger" size="sm" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
