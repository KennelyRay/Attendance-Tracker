'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { m } from 'framer-motion';
import { panelGroup, panelItem } from '@/components/motion/motion-tokens';
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
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  useEffect(() => {
    const flash = consumeAuthFlash();
    if (!flash) {
      return;
    }

    if (flash.type === 'logout-success') {
      setSuccessNotice('Logged out successfully. You can sign in again at any time.');
    } else if (flash.type === 'session-expired') {
      setSuccessNotice('Session ended successfully. Please sign in again to continue.');
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessNotice(null);

    try {
      const user = await login(email, password);
      setAuthFlash({ type: 'login-success' });
      if (user.isAdmin) {
        router.push('/admin/dashboard');
      } else {
        router.push('/employee/dashboard');
      }
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setIsLoading(false);
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

      <m.div variants={panelGroup} initial="hidden" animate="shown" className="relative z-10 mx-auto flex min-h-[calc(100dvh-1rem)] max-w-7xl items-center justify-between gap-4 sm:min-h-[calc(100dvh-4rem)] sm:gap-10">
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
            <m.h1 variants={panelItem} className="mt-8 text-4xl font-semibold leading-[1.12] tracking-tight text-slate-50 xl:text-[2.75rem]">
              Attendance, leave, and employee records in one place.
            </m.h1>
            <m.p variants={panelItem} className="mt-5 max-w-md text-base leading-7 text-slate-300">
              File a leave request, work through the review queue, or check a balance. Leave
              types follow Philippine statutory entitlements, so the rules are applied the same
              way every time.
            </m.p>
          </div>
        </div>
        {/* The form stays at rest: it is the action on this page, so it must be usable
            the moment it arrives, never waiting on hydration or an entrance sequence. */}
        <div className="w-full max-w-sm sm:max-w-md">
          <div className="relative">
            <Card>
              {isLoading ? (
                <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-slate-950/82 p-4 backdrop-blur-sm">
                  <div className="w-full max-w-[16rem] rounded-2xl border border-sky-400/12 bg-slate-950/85 px-4 py-5 text-center ring-1 ring-inset ring-white/5 sm:max-w-[18rem] sm:px-5">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/85 ring-1 ring-inset ring-sky-400/15 sm:h-14 sm:w-14">
                      <div className="relative h-7 w-7 sm:h-8 sm:w-8">
                        <div className="absolute inset-0 rounded-full border-2 border-sky-300/20 border-t-sky-300 animate-spin" />
                        <div className="animate-ambient-loader-pulse absolute inset-[7px] rounded-full bg-sky-300" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-sm font-semibold text-slate-100">Signing you in</div>
                      <div className="mt-1 text-xs leading-5 text-slate-400">
                        Preparing your dashboard for a smoother mobile handoff.
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-1.5">
                      <span className="animate-ambient-loader-pulse h-2 w-2 rounded-full bg-sky-300/85" />
                      <span
                        className="animate-ambient-loader-pulse h-2 w-2 rounded-full bg-sky-300/70"
                        style={{ animationDelay: '0.18s' }}
                      />
                      <span
                        className="animate-ambient-loader-pulse h-2 w-2 rounded-full bg-sky-300/55"
                        style={{ animationDelay: '0.36s' }}
                      />
                    </div>
                  </div>
                </div>
              ) : null}
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
              <form onSubmit={submit} className="space-y-3">
                {successNotice ? (
                  <div className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
                    {successNotice}
                  </div>
                ) : null}
                {error ? (
                  <div className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300 ring-1 ring-inset ring-rose-400/20">
                    {error}
                  </div>
                ) : null}

                <div className="space-y-2.5">
                  <div>
                    <div className="text-sm font-medium text-slate-300">Email</div>
                    <div className="mt-1">
                      <Input
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
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-slate-300">Password</div>
                      <div className="hidden text-xs font-medium text-slate-500 min-[380px]:block">
                        Protected access
                      </div>
                    </div>
                    <div className="mt-1">
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Your password"
                        required
                        autoComplete="current-password"
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" className="mt-2 w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in…' : 'Sign in'}
                </Button>

                <div className="px-1 text-center text-[11px] font-medium text-slate-400 sm:text-xs">
                  Need an account? Contact your Manager
                </div>

                <div className="pt-1 text-center text-[11px] leading-5 text-slate-500 sm:pt-2 sm:text-xs">
                  Only authorized personnel can access this system.
                </div>
              </form>
            </CardBody>
            </Card>
          </div>
        </div>
      </m.div>
    </div>
  );
}
