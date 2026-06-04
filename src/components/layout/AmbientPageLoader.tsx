type AmbientPageLoaderProps = {
  title?: string;
  description?: string;
};

export function AmbientPageLoader({
  title = 'Loading page',
  description = 'Bringing the next view into focus.',
}: AmbientPageLoaderProps) {
  return (
    <div className="flex min-h-[38vh] items-center justify-center px-1 sm:min-h-[46vh]">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[24px] border border-sky-400/12 bg-slate-950/55 px-4 py-6 shadow-[0_20px_70px_rgba(2,8,23,0.45)] ring-1 ring-inset ring-slate-800/80 backdrop-blur-xl sm:rounded-[28px] sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/10 blur-3xl sm:h-40 sm:w-40" />
        </div>

        <div className="relative flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] bg-slate-900/85 ring-1 ring-inset ring-sky-400/15 sm:mb-5 sm:h-16 sm:w-16 sm:rounded-full">
            <div className="relative h-8 w-8 sm:h-10 sm:w-10">
              <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-sky-400/25 border-t-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.2)]" />
              <span className="animate-ambient-loader-pulse absolute inset-[9px] rounded-full bg-sky-300/85 shadow-[0_0_14px_rgba(56,189,248,0.4)] sm:inset-[12px]" />
            </div>
          </div>

          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-300/80 sm:text-sm sm:tracking-[0.28em]">
            Syncing View
          </div>
          <div className="mt-2.5 text-lg font-semibold text-slate-100 sm:mt-3 sm:text-2xl">{title}</div>
          <div className="mt-2 max-w-md text-sm leading-6 text-slate-400">{description}</div>
          <div className="mt-4 flex items-center gap-2 sm:mt-5">
            <span className="animate-ambient-loader-pulse h-2 w-2 rounded-full bg-sky-300/90" />
            <span
              className="animate-ambient-loader-pulse h-2 w-2 rounded-full bg-sky-300/70"
              style={{ animationDelay: '0.18s' }}
            />
            <span
              className="animate-ambient-loader-pulse h-2 w-2 rounded-full bg-sky-300/50"
              style={{ animationDelay: '0.36s' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
