'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { login } from '@/modules/auth/api';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const lineClass =
    'animate-lightning-scan absolute h-px w-[30rem] bg-[linear-gradient(90deg,transparent,rgba(224,242,254,0.06)_12%,rgba(224,242,254,0.78)_42%,rgba(56,189,248,0.9)_50%,rgba(224,242,254,0.78)_58%,transparent_88%)] shadow-[0_0_14px_rgba(186,230,253,0.72),0_0_34px_rgba(56,189,248,0.56)]';
  const wideLineClass =
    'animate-lightning-scan absolute h-px w-[118vw] bg-[linear-gradient(90deg,transparent,rgba(224,242,254,0.04)_12%,rgba(224,242,254,0.68)_40%,rgba(56,189,248,0.92)_50%,rgba(224,242,254,0.68)_60%,transparent_88%)] shadow-[0_0_16px_rgba(186,230,253,0.78),0_0_40px_rgba(56,189,248,0.6)]';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const user = await login(email, password);
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
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,_#050c18_0%,_#081524_36%,_#0a1d33_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="animate-float-slow absolute -left-28 top-8 h-[28rem] w-[28rem] rounded-full bg-sky-400/20 blur-[120px]" />
        <div className="animate-float-medium absolute left-1/4 top-1/3 h-72 w-72 rounded-full bg-cyan-300/16 blur-[110px]" />
        <div className="animate-float-medium absolute right-8 top-16 h-[26rem] w-[26rem] rounded-full bg-cyan-300/16 blur-[120px]" />
        <div className="animate-pulse-glow absolute bottom-6 right-1/3 h-72 w-72 rounded-full bg-blue-400/14 blur-[110px]" />
        <div className="animate-pulse-glow absolute -right-16 top-1/3 h-80 w-80 rounded-full bg-sky-500/14 blur-[130px]" />
        <div className="absolute left-[8%] top-[14%] h-56 w-[32rem] -rotate-12 bg-[linear-gradient(90deg,transparent,rgba(125,211,252,0.22),transparent)] blur-3xl" />
        <div className="absolute left-[38%] top-[34%] h-56 w-[26rem] rotate-[10deg] bg-[linear-gradient(90deg,transparent,rgba(56,189,248,0.16),transparent)] blur-3xl" />
        <div className="absolute right-[6%] top-[18%] h-52 w-[24rem] rotate-[20deg] bg-[linear-gradient(90deg,transparent,rgba(186,230,253,0.18),transparent)] blur-3xl" />

        <div className={[wideLineClass, 'left-[-10%] top-[13%] -rotate-[15deg]'].join(' ')} />
        <div className={[lineClass, 'left-[2%] top-[14%] -rotate-[15deg]'].join(' ')} />
        <div
          className={[lineClass, 'left-[32%] top-[32%] -rotate-[15deg]'].join(' ')}
          style={{ animationDelay: '1.1s' }}
        />
        <div
          className={[lineClass, 'right-[-4%] top-[18%] -rotate-[15deg]'].join(' ')}
          style={{ animationDelay: '2.1s' }}
        />
        <div
          className={[lineClass, 'left-[10%] top-[24%] -rotate-[15deg]'].join(' ')}
          style={{ animationDelay: '1.6s' }}
        />
        <div
          className={[lineClass, 'left-[46%] top-[42%] -rotate-[15deg]'].join(' ')}
          style={{ animationDelay: '2.4s' }}
        />
        <div
          className={[lineClass, 'right-[10%] bottom-[22%] -rotate-[15deg]'].join(' ')}
          style={{ animationDelay: '3.2s' }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-200/30 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,_rgba(125,211,252,0.2),_transparent_22%),radial-gradient(circle_at_78%_24%,_rgba(34,211,238,0.16),_transparent_20%),radial-gradient(circle_at_50%_78%,_rgba(59,130,246,0.12),_transparent_28%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,#7dd3fc_1px,transparent_1px),linear-gradient(to_bottom,#7dd3fc_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-between gap-10">
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
                <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-slate-950/78 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="relative h-14 w-14">
                      <div className="absolute inset-0 rounded-full bg-sky-400/15 blur-md" />
                      <div className="absolute inset-[6px] rounded-full border-2 border-sky-300/20 border-t-sky-300 animate-spin" />
                      <div className="absolute inset-[16px] rounded-full bg-sky-300/90 shadow-[0_0_18px_rgba(125,211,252,0.9)]" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-100">Signing you in</div>
                      <div className="mt-1 text-xs text-slate-400">
                        Preparing your dashboard...
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            <div className="flex items-center justify-center border-b border-slate-800/80 px-5 py-6">
              <Image
                src="/ATIconFInal.png"
                alt="Attendance Tracker logo"
                width={84}
                height={84}
                priority
                className="h-21 w-21 object-contain drop-shadow-[0_0_28px_rgba(56,189,248,0.38)]"
              />
            </div>
            <CardBody>
              <form onSubmit={submit} className="space-y-3.5">
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
                      <div className="text-xs font-medium text-slate-500">
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

                <div className="text-center text-xs font-medium text-slate-400">
                  Need an account? Contact your Manager
                </div>

                <div className="pt-2 text-center text-xs leading-5 text-slate-500">
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
