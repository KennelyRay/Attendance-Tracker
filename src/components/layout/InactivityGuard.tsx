'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

const WARNING_AFTER_MS = 10 * 60 * 1000;
const LOGOUT_DELAY_MS = 10 * 1000;

export function InactivityGuard() {
  const router = useRouter();
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiresAtRef = useRef<number | null>(null);
  const isWarningOpenRef = useRef(false);
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(LOGOUT_DELAY_MS / 1000);

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
      router.replace('/login');
      router.refresh();
    }
  }, [clearTimers, router]);

  const openWarning = useCallback(() => {
    clearTimers();
    isWarningOpenRef.current = true;
    setIsWarningOpen(true);
    setSecondsLeft(LOGOUT_DELAY_MS / 1000);
    expiresAtRef.current = Date.now() + LOGOUT_DELAY_MS;

    countdownIntervalRef.current = setInterval(() => {
      if (!expiresAtRef.current) return;

      const nextSeconds = Math.max(0, Math.ceil((expiresAtRef.current - Date.now()) / 1000));
      setSecondsLeft(nextSeconds);
    }, 250);

    logoutTimeoutRef.current = setTimeout(() => {
      void forceLogout();
    }, LOGOUT_DELAY_MS);
  }, [clearTimers, forceLogout]);

  const scheduleWarning = useCallback(() => {
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    warningTimeoutRef.current = setTimeout(() => {
      openWarning();
    }, WARNING_AFTER_MS);
  }, [openWarning]);

  const resetInactivityTimer = useCallback(() => {
    if (logoutTimeoutRef.current) {
      clearTimeout(logoutTimeoutRef.current);
      logoutTimeoutRef.current = null;
    }

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    scheduleWarning();
  }, [scheduleWarning]);

  const acknowledgeWarning = useCallback(() => {
    isWarningOpenRef.current = false;
    setIsWarningOpen(false);
    setSecondsLeft(LOGOUT_DELAY_MS / 1000);
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

    for (const eventName of events) {
      window.addEventListener(eventName, handleActivity, { passive: true });
    }

    return () => {
      clearTimers();
      for (const eventName of events) {
        window.removeEventListener(eventName, handleActivity);
      }
    };
  }, [clearTimers, resetInactivityTimer]);

  if (!isWarningOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-sky-400/15 bg-slate-950/95 p-4 shadow-[0_28px_80px_rgba(2,8,23,0.65)] ring-1 ring-inset ring-white/5 sm:p-6">
        <div className="inline-flex items-center rounded-full bg-amber-500/12 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-300 ring-1 ring-inset ring-amber-400/20">
          Inactivity Warning
        </div>
        <div className="mt-4 text-lg font-semibold text-slate-50 sm:text-xl">
          You will be logged out soon
        </div>
        <div className="mt-3 text-sm leading-6 text-slate-400">
          You have been inactive for 10 minutes. Please click{' '}
          <span className="font-semibold text-sky-300">Stay Logged In</span> within{' '}
          <span className="font-semibold text-sky-300">{secondsLeft}</span> seconds to keep your
          session active.
        </div>
        <div className="mt-5 overflow-hidden rounded-full bg-slate-900/90 ring-1 ring-inset ring-slate-800">
          <div
            className="h-2 bg-gradient-to-r from-amber-400 via-sky-400 to-cyan-300 transition-[width] duration-300"
            style={{
              width: `${(secondsLeft / (LOGOUT_DELAY_MS / 1000)) * 100}%`,
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
