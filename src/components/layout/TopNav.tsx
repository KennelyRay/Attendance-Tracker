'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { triggerGlobalNavigationLoader } from '@/components/layout/navigation-loader';
import { Button } from '@/components/ui/Button';
import { InstallAppButton } from '@/components/pwa/InstallAppButton';
import { AccountSheet } from '@/components/layout/AccountSheet';
import type { SessionUser } from '@/lib/session';
import { consumeAuthFlash, setAuthFlash } from '@/modules/auth/flash';
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
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

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

  useEffect(() => {
    // Read after the first render because sessionStorage does not exist on the server;
    // see the matching note in LoginForm.
    const flash = consumeAuthFlash();
    if (flash?.type !== 'login-success') {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only data, read post-render
    setAuthNotice(
      user.isAdmin
        ? 'Login successful. Admin controls are ready.'
        : 'Login successful. Your employee workspace is ready.'
    );

    const timeoutId = window.setTimeout(() => {
      setAuthNotice(null);
    }, 4000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [user.isAdmin]);

  const displayUser = useMemo(
    () => ({
      ...user,
      name: employeeProfile?.name ?? user.name,
      email: employeeProfile?.email ?? user.email,
      company: employeeProfile?.company ?? null,
      position: employeeProfile?.position ?? null,
    }),
    [employeeProfile, user]
  );

  const onLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    setAuthFlash({ type: 'logout-success' });
    router.push('/login');
  };

  const onPolicyNavigate = () => {
    setIsAccountOpen(false);
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
    <header className="app-safe-top sticky top-0 z-10 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl">
      {/* Phone: one compact row. Everything secondary moves into the account sheet. */}
      <div className="flex h-14 items-center gap-3 px-3 sm:hidden">
        <Image
          src="/hris-logo.svg"
          alt=""
          width={32}
          height={32}
          priority
          unoptimized
          className="h-8 w-8 shrink-0 rounded-[0.6rem] ring-1 ring-inset ring-sky-400/20"
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold leading-tight text-slate-50">
            {title}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsAccountOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={isAccountOpen}
          aria-label="Account and settings"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-cyan-300 text-[13px] font-semibold text-slate-950 ring-1 ring-inset ring-white/20 transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
        >
          {initials || 'U'}
        </button>
      </div>

      {/* Tablet and up: unchanged. */}
      <div
        className={[
          'hidden gap-2 px-3 py-2 sm:flex sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0',
          fullWidth ? 'w-full sm:px-4 lg:px-6 xl:px-8' : 'mx-auto max-w-7xl sm:px-6 lg:px-8',
        ].join(' ')}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="shrink-0 rounded-[0.7rem] ring-1 ring-inset ring-slate-700 sm:rounded-xl">
            <Image
              src="/hris-logo.svg"
              alt="HRIS logo"
              width={36}
              height={36}
              priority
              unoptimized
              className="h-8 w-8 sm:h-9 sm:w-9"
            />
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <div className="truncate text-[13px] font-semibold text-slate-100 sm:text-sm">{title}</div>
              <span className="hidden rounded-full bg-slate-900/90 px-2 py-0.5 text-[10px] font-medium text-slate-400 ring-1 ring-inset ring-slate-700/80 min-[400px]:inline-flex">
                {user.isAdmin ? 'Admin' : 'Employee'}
              </span>
            </div>
            <div className="truncate text-[11px] text-slate-400 sm:text-xs">
              {displayUser.name}
              {isEmployee && displayUser.company ? ` · ${displayUser.company}` : ''}
            </div>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:flex-nowrap sm:justify-end sm:gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-slate-900/90 px-2 py-1 ring-1 ring-inset ring-slate-700/80 sm:max-w-none sm:flex-none">
            <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-cyan-300 text-xs font-semibold text-slate-950">
              {initials || 'U'}
            </div>
            <div className="hidden min-w-0 max-w-[8.5rem] pr-1 min-[380px]:block sm:max-w-[13rem]">
              <div className="truncate text-[11px] font-medium text-slate-300 sm:text-xs">
                {displayUser.email}
              </div>
              {isEmployee && displayUser.position ? (
                <div className="truncate text-[10px] text-slate-500 sm:text-[11px]">
                  {displayUser.position}
                </div>
              ) : null}
            </div>
          </div>
          {isEmployee ? (
            <Button
              className="shrink-0 px-2.5 sm:px-3"
              variant="secondary"
              size="sm"
              onClick={onPolicyNavigate}
            >
              <span className="sm:hidden">{isLeavePolicyPage ? 'Home' : 'Policy'}</span>
              <span className="hidden sm:inline">{isLeavePolicyPage ? 'Dashboard' : 'Leave Policy'}</span>
            </Button>
          ) : null}
          <InstallAppButton className="px-2.5 sm:px-3" />
          <Button className="shrink-0 px-2.5 sm:px-3" variant="danger" size="sm" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </div>
      <AccountSheet
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        labelledBy="account-sheet-name"
      >
        <div className="flex items-center gap-3 pb-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-cyan-300 text-base font-semibold text-slate-950">
            {initials || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div id="account-sheet-name" className="truncate text-base font-semibold text-slate-50">
              {displayUser.name}
            </div>
            <div className="truncate text-[13px] text-slate-400">{displayUser.email}</div>
          </div>
          <span className="shrink-0 rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-slate-400 ring-1 ring-inset ring-slate-700">
            {user.isAdmin ? 'Admin' : 'Employee'}
          </span>
        </div>

        {isEmployee && (displayUser.company || displayUser.position) ? (
          <dl className="mb-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-slate-800/60 text-left">
            <div className="bg-slate-900/80 px-3 py-2.5">
              <dt className="text-[11px] uppercase tracking-wide text-slate-500">Company</dt>
              <dd className="mt-0.5 truncate text-[13px] text-slate-200">
                {displayUser.company || '—'}
              </dd>
            </div>
            <div className="bg-slate-900/80 px-3 py-2.5">
              <dt className="text-[11px] uppercase tracking-wide text-slate-500">Position</dt>
              <dd className="mt-0.5 truncate text-[13px] text-slate-200">
                {displayUser.position || '—'}
              </dd>
            </div>
          </dl>
        ) : null}

        <div className="flex flex-col gap-2">
          {isEmployee ? (
            <Button variant="secondary" className="h-12 w-full justify-start px-4" onClick={onPolicyNavigate}>
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4 text-sky-300">
                <path
                  d="M6 4.5h8c.83 0 1.5.67 1.5 1.5v10L10 13.2 4.5 16V6c0-.83.67-1.5 1.5-1.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              {isLeavePolicyPage ? 'Back to dashboard' : 'Leave policy'}
            </Button>
          ) : null}

          <InstallAppButton className="h-12 w-full justify-start px-4" />

          <Button
            variant="danger"
            className="h-12 w-full justify-start px-4"
            onClick={() => {
              setIsAccountOpen(false);
              void onLogout();
            }}
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
              <path
                d="M12.5 13.5V15a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 15V5A1.5 1.5 0 0 1 5 3.5h6A1.5 1.5 0 0 1 12.5 5v1.5M9 10h7.5m0 0-2.5-2.5M16.5 10 14 12.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Log out
          </Button>
        </div>
      </AccountSheet>

      {authNotice ? (
        <div
          className={[
            'border-t border-emerald-400/10 bg-emerald-500/8 px-3 py-2.5 text-sm text-emerald-300',
            fullWidth ? 'sm:px-4 lg:px-6 xl:px-8' : 'sm:px-6 lg:px-8',
          ].join(' ')}
        >
          <div className={fullWidth ? 'w-full' : 'mx-auto max-w-7xl'}>{authNotice}</div>
        </div>
      ) : null}
    </header>
  );
}
