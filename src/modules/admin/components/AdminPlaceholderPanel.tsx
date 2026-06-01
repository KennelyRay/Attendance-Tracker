'use client';

import { Card, CardBody, CardHeader } from '@/components/ui/Card';

export function AdminPlaceholderPanel({
  title,
  subtitle,
  description,
  highlights,
}: {
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title={title} subtitle={subtitle} />
        <CardBody>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 px-5 py-5 ring-1 ring-inset ring-white/5">
              <div className="text-sm font-semibold uppercase tracking-wide text-sky-300">
                Workspace Overview
              </div>
              <div className="mt-3 text-sm leading-7 text-slate-300">{description}</div>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 px-5 py-5 ring-1 ring-inset ring-white/5">
              <div className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                Planned Capabilities
              </div>
              <div className="mt-3 space-y-3">
                {highlights.map((item) => (
                  <div
                    key={item}
                    className="rounded-xl bg-slate-950/80 px-4 py-3 text-sm text-slate-400 ring-1 ring-inset ring-slate-800"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
