'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { setAuthFlash } from '@/modules/auth/flash';

/**
 * Idle limits before an automatic sign-out.
 *
 * An admin session can read every employee's records, so it stays tight. An employee
 * session only reaches that employee's own data, and is usually on a personal phone,
 * so a ten-minute limit there just punished people for switching apps.
 */
const IDLE_LIMIT_MS = {
  admin: 30 * 60 * 1000, // 30 minutes
  employee: 8 * 60 * 60 * 1000, // 8 hours - one working day
} as const;

const WARNING_LEAD_MS = 60 * 1000;

function idleLimitFor(isAdmin: boolean) {
  return isAdmin ? IDLE_LIMIT_MS.admin : IDLE_LIMIT_MS.employee;
}

function formatIdleLimit(limitMs: number) {
  const minutes = Math.round(limitMs / 60000);
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.round(minutes / 60);
  return `${hours} hour${hours === 1 ? '' : 's'}`;
}

export function InactivityGuard({ isAdmin = false }: { isAdmin?: boolean }) {
  const router = useRouter();
  const idleLimit = useMemo(() => idleLimitFor(isAdmin), [isAdmin]);

  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiresAtRef = useRef<number | null>(null);
  const isWarningOpenRef = useRef(false);
  // Seeded by resetInactivityTimer() on mount - Date.now() must not run during render.
  const lastActivityRef = useRef(0);

  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_LEAD_MS / 1000);

  const clearTimers = useCallback(() => {
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }

    if (logoutTimeoutRef.current) {
      clearTimeout(logoutTimeoutRef.current);
      logoutTimeoutRef.current = null;
    }

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const forceLogout = useCallback(async () => {
    clearTimers();
    try {
      await fetch('/api/logout', { method: 'POST' });
    } finally {
      setAuthFlash({ type: 'session-expired' });
      router.replace('/login');
      router.refresh();
    }
  }, [clearTimers, router]);

  const openWarning = useCallback(() => {
    clearTimers();
    isWarningOpenRef.current = true;
    setIsWarningOpen(true);
    setSecondsLeft(WARNING_LEAD_MS / 1000);
    expiresAtRef.current = Date.now() + WARNING_LEAD_MS;

    countdownIntervalRef.current = setInterval(() => {
      if (!expiresAtRef.current) return;

      const nextSeconds = Math.max(0, Math.ceil((expiresAtRef.current - Date.now()) / 1000));
      setSecondsLeft(nextSeconds);
    }, 250);

    logoutTimeoutRef.current = setTimeout(() => {
      void forceLogout();
    }, WARNING_LEAD_MS);
  }, [clearTimers, forceLogout]);

  const resetInactivityTimer = useCallback(() => {
    clearTimers();
    lastActivityRef.current = Date.now();

    warningTimeoutRef.current = setTimeout(() => {
      openWarning();
    }, Math.max(0, idleLimit - WARNING_LEAD_MS));
  }, [clearTimers, idleLimit, openWarning]);

  const acknowledgeWarning = useCallback(() => {
    isWarningOpenRef.current = false;
    setIsWarningOpen(false);
    setSecondsLeft(WARNING_LEAD_MS / 1000);
    expiresAtRef.current = null;
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  useEffect(() => {
    resetInactivityTimer();

    const events: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'pointerdown',
    ];

    const handleActivity = () => {
      if (isWarningOpenRef.current) {
        return;
      }

      resetInactivityTimer();
    };

    /**
     * Phones suspend timers for backgrounded apps, so a setTimeout alone either fires
     * late or fires the moment the app is reopened. On returning to the page we
     * measure the real elapsed time and decide from that instead.
     */
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible' || isWarningOpenRef.current) {
        return;
      }

      const idleFor = Date.now() - lastActivityRef.current;

      if (idleFor >= idleLimit) {
        void forceLogout();
        return;
      }

      clearTimers();
      warningTimeoutRef.current = setTimeout(
        () => openWarning(),
        Math.max(0, idleLimit - WARNING_LEAD_MS - idleFor)
      );
    };

    for (const eventName of events) {
      window.addEventListener(eventName, handleActivity, { passive: true });
    }
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearTimers();
      for (const eventName of events) {
        window.removeEventListener(eventName, handleActivity);
      }
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [clearTimers, forceLogout, idleLimit, openWarning, resetInactivityTimer]);

  if (!isWarningOpen) {
    return null;
  }

  return (
    <div className="app-overlay-scroll bg-slate-950/75 backdrop-blur-sm">
      <div className="app-overlay-panel max-w-md rounded-3xl border border-sky-400/15 bg-slate-950/95 p-4 shadow-[0_28px_80px_rgba(2,8,23,0.65)] ring-1 ring-inset ring-white/5 sm:p-6">
        <div className="inline-flex items-center rounded-full bg-amber-500/12 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-300 ring-1 ring-inset ring-amber-400/20">
          Inactivity Warning
        </div>
        <div className="mt-4 text-lg font-semibold text-slate-50 sm:text-xl">
          You will be logged out soon
        </div>
        <div className="mt-3 text-sm leading-6 text-slate-400">
          You have been inactive for {formatIdleLimit(idleLimit)}. Choose{' '}
          <span className="font-semibold text-sky-300">Stay Logged In</span> within{' '}
          <span className="font-semibold text-sky-300">{secondsLeft}</span> seconds to keep your
          session active.
        </div>
        <div className="mt-5 overflow-hidden rounded-full bg-slate-900/90 ring-1 ring-inset ring-slate-800">
          <div
            className="h-2 bg-gradient-to-r from-amber-400 via-sky-400 to-cyan-300 transition-[width] duration-300"
            style={{
              width: `${(secondsLeft / (WARNING_LEAD_MS / 1000)) * 100}%`,
            }}
          />
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button className="w-full sm:w-auto" variant="secondary" onClick={() => void forceLogout()}>
            Logout Now
          </Button>
          <Button className="w-full sm:w-auto" onClick={acknowledgeWarning}>Stay Logged In</Button>
        </div>
      </div>
    </div>
  );
}
