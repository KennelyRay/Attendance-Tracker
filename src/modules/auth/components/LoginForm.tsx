'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, m, useAnimationControls } from 'framer-motion';
import { arrive, depart, panelGroup, panelItem } from '@/components/motion/motion-tokens';
import { SegmentedProgress } from '@/components/motion/SegmentedProgress';
import { useRouter } from 'next/navigation';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { login } from '@/modules/auth/api';
import { consumeAuthFlash, setAuthFlash } from '@/modules/auth/flash';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'signed-in'>('idle');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  // Imperative, so a second failed attempt replays the shake. Driving it from state and
  // a `key` would remount the card and throw away the caret and focus mid-correction.
  const cardControls = useAnimationControls();

  const isBusy = status !== 'idle';

  useEffect(() => {
    // The flash lives in sessionStorage, which the server cannot read, so it is picked up
    // after the first render rather than during it; reading it in render would make the
    // server and client HTML disagree. This is React's two-pass pattern for client-only data.
    const flash = consumeAuthFlash();
    if (!flash) {
      return;
    }

    if (flash.type === 'logout-success') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- see note above
      setSuccessNotice('Logged out successfully. You can sign in again at any time.');
    } else if (flash.type === 'session-expired') {
      setSuccessNotice('Session ended successfully. Please sign in again to continue.');
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setError(null);
    setSuccessNotice(null);

    try {
      const user = await login(email, password);
      setAuthFlash({ type: 'login-success' });
      // Navigation starts immediately. The signed-in state fills the wait the router
      // already costs; it never adds one.
      setStatus('signed-in');
      router.push(user.isAdmin ? '/admin/dashboard' : '/employee/dashboard');
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setStatus('idle');
      // A rejected sign-in is the one moment the card itself should react. Framer drops
      // this transform entirely under prefers-reduced-motion; the message carries it then.
      void cardControls.start({ x: [0, -9, 7, -4, 0], transition: { duration: 0.34 } });
    }
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#15120f] px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
      {/* One treatment, one job: a soft lift behind the sign-in card so the eye lands
          on the form. The previous layer held five floating orbs, seven glowing sweeps,
          a dot grid and three more radial washes, none of which carried information. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(90rem_50rem_at_72%_38%,rgba(229,138,98,0.10),transparent_62%)]"
      />

      <m.div
        variants={panelGroup}
        initial="hidden"
        animate="shown"
        className="relative z-10 mx-auto flex min-h-[calc(100dvh-1rem)] max-w-7xl items-center justify-between gap-4 sm:min-h-[calc(100dvh-4rem)] sm:gap-10"
      >
        <div className="hidden max-w-xl lg:block">
          <div className="max-w-lg">
            <m.div variants={panelItem} className="flex items-center gap-3">
              <Image
                src="/hris-logo.svg"
                alt=""
                width={44}
                height={44}
                priority
                unoptimized
                className="h-11 w-11 rounded-xl"
              />
              <span className="text-lg font-semibold tracking-tight text-slate-100">HRIS</span>
            </m.div>
            <m.h1
              variants={panelItem}
              className="mt-8 text-4xl font-semibold leading-[1.12] tracking-tight text-slate-50 xl:text-[2.75rem]"
            >
              Attendance, leave, and employee records in one place.
            </m.h1>
            <m.p variants={panelItem} className="mt-5 max-w-md text-base leading-7 text-slate-300">
              File a leave request, work through the review queue, or check a balance. Leave
              types follow Philippine statutory entitlements, so the rules are applied the same
              way every time.
            </m.p>

            <m.div variants={panelItem} className="mt-10">
              <SegmentedProgress />
            </m.div>
          </div>
        </div>

        {/* The form stays at rest: it is the action on this page, so it must be usable
            the moment it arrives, never waiting on hydration or an entrance sequence.
            The card moves only to answer something the person did. */}
        <div className="w-full max-w-sm sm:max-w-md">
          <m.div className="relative" animate={cardControls}>
            <Card variant="surface">
              {/* A sign-in request is short and its length is unknown, so the bar reports
                  "working", not a fake percentage. It exists only while the request is open. */}
              <AnimatePresence>
                {status === 'submitting' ? (
                  <m.div
                    key="progress"
                    aria-hidden="true"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: depart }}
                    className="absolute inset-x-0 top-0 z-20 h-0.5 overflow-hidden rounded-t-2xl bg-slate-800"
                  >
                    <m.span
                      className="block h-full w-1/3 rounded-full bg-sky-400"
                      animate={{ x: ['-110%', '330%'] }}
                      transition={{ duration: 1.1, ease: 'easeInOut', repeat: Infinity }}
                    />
                  </m.div>
                ) : null}
              </AnimatePresence>

              {/* The mark carries the identity; the wordmark used gradient-clipped text,
                  a glow and 0.28em tracking, which is three effects doing one job badly. */}
              <div className="flex flex-col items-center gap-3 border-b border-slate-800/80 px-5 py-7 lg:hidden">
                <Image
                  src="/hris-logo.svg"
                  alt=""
                  width={48}
                  height={48}
                  priority
                  unoptimized
                  className="h-12 w-12 rounded-xl"
                />
                <div className="text-center">
                  <div className="text-xl font-semibold tracking-tight text-slate-50">HRIS</div>
                  <div className="mt-1 text-sm text-slate-400">Attendance, leave, and records</div>
                </div>
              </div>
              <div className="hidden border-b border-slate-800/80 px-6 py-6 lg:block">
                <h2 className="text-lg font-semibold tracking-tight text-slate-50">Sign in</h2>
                <p className="mt-1 text-sm text-slate-400">Use your work email address.</p>
              </div>

              <CardBody>
                <form onSubmit={submit} aria-busy={isBusy} className="space-y-3">
                  <AnimatePresence initial={false}>
                    {successNotice ? (
                      <m.div
                        key="notice"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0, transition: arrive }}
                        exit={{ opacity: 0, transition: depart }}
                        className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 ring-1 ring-inset ring-emerald-400/20"
                      >
                        {successNotice}
                      </m.div>
                    ) : null}
                    {error ? (
                      <m.div
                        key="error"
                        role="alert"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0, transition: arrive }}
                        exit={{ opacity: 0, transition: depart }}
                        className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300 ring-1 ring-inset ring-rose-400/20"
                      >
                        {error}
                      </m.div>
                    ) : null}
                  </AnimatePresence>

                  <div className="space-y-2.5">
                    <div>
                      <label htmlFor="login-email" className="text-sm font-medium text-slate-300">
                        Email
                      </label>
                      <div className="mt-1">
                        <Input
                          id="login-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@company.com"
                          required
                          autoComplete="email"
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="login-password"
                        className="text-sm font-medium text-slate-300"
                      >
                        Password
                      </label>
                      <div className="relative mt-1">
                        <Input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Your password"
                          required
                          autoComplete="current-password"
                          className="pr-16"
                        />
                        {/* After the field in the DOM, so tab order runs email, password,
                            then this. Typing a password blind on a phone keyboard is where
                            sign-in attempts get lost. */}
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          aria-pressed={showPassword}
                          className="absolute inset-y-0 right-0 grid w-16 place-items-center rounded-r-xl text-xs font-medium text-slate-400 transition-colors hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="mt-2 w-full" disabled={isBusy}>
                    {/* The label swaps without a crossfade: a crossfade would hold the old
                        word on screen while the request is already running, and feedback on
                        a press has to be immediate. The spinner carries the motion. */}
                    {status === 'idle' ? (
                      'Sign in'
                    ) : status === 'submitting' ? (
                      <span className="inline-flex items-center gap-2">
                        <m.span
                          aria-hidden="true"
                          className="h-3.5 w-3.5 rounded-full border-2 border-slate-950/30 border-t-slate-950"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, ease: 'linear', repeat: Infinity }}
                        />
                        Signing in…
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
                          <path
                            d="m4.5 10.5 3.5 3.5 7.5-8"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Opening your dashboard
                      </span>
                    )}
                  </Button>

                  {/* One live region for the whole sequence, so a screen reader hears the
                      same states the button shows. */}
                  <p className="sr-only" role="status" aria-live="polite">
                    {status === 'submitting'
                      ? 'Signing in'
                      : status === 'signed-in'
                        ? 'Signed in. Opening your dashboard.'
                        : ''}
                  </p>

                  <div className="px-1 text-center text-[11px] font-medium text-slate-400 sm:text-xs">
                    Need an account? Contact your Manager
                  </div>

                  <div className="pt-1 text-center text-[11px] leading-5 text-slate-500 sm:pt-2 sm:text-xs">
                    Only authorized personnel can access this system.
                  </div>
                </form>
              </CardBody>
            </Card>
          </m.div>
        </div>
      </m.div>
    </div>
  );
}
