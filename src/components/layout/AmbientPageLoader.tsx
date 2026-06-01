type AmbientPageLoaderProps = {
  title?: string;
  description?: string;
};

export function AmbientPageLoader({
  title = 'Loading page',
  description = 'Bringing the next view into focus.',
}: AmbientPageLoaderProps) {
  return (
    <div className="flex min-h-[46vh] items-center justify-center">
      <div className="relative w-full max-w-xl overflow-hidden rounded-[28px] border border-sky-400/12 bg-slate-950/45 px-6 py-10 shadow-[0_20px_70px_rgba(2,8,23,0.45)] ring-1 ring-inset ring-slate-800/80 backdrop-blur-xl sm:px-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/10 blur-3xl" />
        </div>

        <div className="relative flex flex-col items-center text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-900/80 ring-1 ring-inset ring-sky-400/15">
            <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-sky-400/25 border-t-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.2)]" />
          </div>

          <div className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-300/80">
            Syncing View
          </div>
          <div className="mt-3 text-xl font-semibold text-slate-100 sm:text-2xl">{title}</div>
          <div className="mt-2 max-w-md text-sm leading-6 text-slate-400">{description}</div>
        </div>
      </div>
    </div>
  );
}
