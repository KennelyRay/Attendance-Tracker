'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
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
  const lineClass =
    'animate-lightning-scan absolute h-px w-[18rem] sm:w-[24rem] lg:w-[30rem] bg-[linear-gradient(90deg,transparent,rgba(224,242,254,0.06)_12%,rgba(224,242,254,0.78)_42%,rgba(56,189,248,0.9)_50%,rgba(224,242,254,0.78)_58%,transparent_88%)] shadow-[0_0_14px_rgba(186,230,253,0.72),0_0_34px_rgba(56,189,248,0.56)]';
  const wideLineClass =
    'animate-lightning-scan absolute h-px w-[140vw] sm:w-[118vw] bg-[linear-gradient(90deg,transparent,rgba(224,242,254,0.04)_12%,rgba(224,242,254,0.68)_40%,rgba(56,189,248,0.92)_50%,rgba(224,242,254,0.68)_60%,transparent_88%)] shadow-[0_0_16px_rgba(186,230,253,0.78),0_0_40px_rgba(56,189,248,0.6)]';

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
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,_#050c18_0%,_#081524_36%,_#0a1d33_100%)] px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="animate-float-slow absolute -left-24 top-8 h-56 w-56 rounded-full bg-sky-400/16 blur-[85px] sm:-left-28 sm:h-[28rem] sm:w-[28rem] sm:bg-sky-400/20 sm:blur-[120px]" />
        <div className="animate-float-medium absolute left-1/4 top-1/3 hidden h-56 w-56 rounded-full bg-cyan-300/16 blur-[90px] sm:block sm:h-72 sm:w-72 sm:blur-[110px]" />
        <div className="animate-float-medium absolute right-4 top-14 h-48 w-48 rounded-full bg-cyan-300/12 blur-[78px] sm:right-8 sm:h-[26rem] sm:w-[26rem] sm:bg-cyan-300/16 sm:blur-[120px]" />
        <div className="animate-pulse-glow absolute bottom-8 right-1/4 h-44 w-44 rounded-full bg-blue-400/10 blur-[72px] sm:h-72 sm:w-72 sm:bg-blue-400/14 sm:blur-[110px]" />
        <div className="animate-pulse-glow absolute -right-12 top-1/3 hidden h-64 w-64 rounded-full bg-sky-500/14 blur-[100px] sm:block sm:h-80 sm:w-80 sm:blur-[130px]" />
        <div className="absolute left-[8%] top-[14%] h-40 w-[18rem] -rotate-12 bg-[linear-gradient(90deg,transparent,rgba(125,211,252,0.22),transparent)] blur-3xl sm:h-56 sm:w-[32rem]" />
        <div className="absolute left-[38%] top-[34%] hidden h-40 w-[16rem] rotate-[10deg] bg-[linear-gradient(90deg,transparent,rgba(56,189,248,0.16),transparent)] blur-3xl sm:block sm:h-56 sm:w-[26rem]" />
        <div className="absolute right-[6%] top-[18%] hidden h-36 w-[14rem] rotate-[20deg] bg-[linear-gradient(90deg,transparent,rgba(186,230,253,0.18),transparent)] blur-3xl sm:block sm:h-52 sm:w-[24rem]" />

        <div className={['hidden sm:block', wideLineClass, 'left-[-10%] top-[13%] -rotate-[15deg]'].join(' ')} />
        <div className={['hidden sm:block', lineClass, 'left-[2%] top-[14%] -rotate-[15deg]'].join(' ')} />
        <div
          className={['hidden sm:block', lineClass, 'left-[32%] top-[32%] -rotate-[15deg]'].join(' ')}
          style={{ animationDelay: '1.1s' }}
        />
        <div
          className={['hidden sm:block', lineClass, 'right-[-4%] top-[18%] -rotate-[15deg]'].join(' ')}
          style={{ animationDelay: '2.1s' }}
        />
        <div
          className={['hidden sm:block', lineClass, 'left-[10%] top-[24%] -rotate-[15deg]'].join(' ')}
          style={{ animationDelay: '1.6s' }}
        />
        <div
          className={['hidden sm:block', lineClass, 'left-[46%] top-[42%] -rotate-[15deg]'].join(' ')}
          style={{ animationDelay: '2.4s' }}
        />
        <div
          className={['hidden sm:block', lineClass, 'right-[10%] bottom-[22%] -rotate-[15deg]'].join(' ')}
          style={{ animationDelay: '3.2s' }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-200/30 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,_rgba(125,211,252,0.2),_transparent_22%),radial-gradient(circle_at_78%_24%,_rgba(34,211,238,0.16),_transparent_20%),radial-gradient(circle_at_50%_78%,_rgba(59,130,246,0.12),_transparent_28%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,#7dd3fc_1px,transparent_1px),linear-gradient(to_bottom,#7dd3fc_1px,transparent_1px)] [background-size:44px_44px] sm:[background-size:72px_72px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-1rem)] max-w-7xl items-center justify-between gap-4 sm:min-h-[calc(100vh-4rem)] sm:gap-10">
        <div className="hidden max-w-xl lg:block">
          <div className="max-w-lg">
            <div className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300/75">
              Workforce Portal
            </div>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight text-slate-50">
              Attendance Tracker
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-slate-300">
              Manage attendance, absences, and leave records in one streamlined workspace built
              for employees and managers.
            </p>
          </div>
        </div>
        <div className="w-full max-w-sm sm:max-w-md">
          <div className="relative">
            <Card>
              {isLoading ? (
                <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-slate-950/82 p-4 backdrop-blur-sm">
                  <div className="w-full max-w-[16rem] rounded-2xl border border-sky-400/12 bg-slate-950/85 px-4 py-5 text-center ring-1 ring-inset ring-white/5 sm:max-w-[18rem] sm:px-5">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/85 ring-1 ring-inset ring-sky-400/15 sm:h-14 sm:w-14">
                      <div className="relative h-7 w-7 sm:h-8 sm:w-8">
                        <div className="absolute inset-0 rounded-full border-2 border-sky-300/20 border-t-sky-300 animate-spin" />
                        <div className="animate-ambient-loader-pulse absolute inset-[7px] rounded-full bg-sky-300/85 shadow-[0_0_16px_rgba(125,211,252,0.85)]" />
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
            <div className="flex items-center justify-center border-b border-slate-800/80 px-4 py-4 sm:px-5 sm:py-6">
              <Image
                src="/ATIconFInal.png"
                alt="Attendance Tracker logo"
                width={84}
                height={84}
                priority
                className="h-16 w-16 object-contain drop-shadow-[0_0_28px_rgba(56,189,248,0.38)] sm:h-20 sm:w-20"
              />
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
      </div>
    </div>
  );
}
