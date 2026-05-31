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
          <div className="animate-ambient-loader-orb absolute -left-8 top-6 h-24 w-24 rounded-full bg-sky-400/12 blur-2xl" />
          <div className="animate-ambient-loader-orb-delayed absolute -right-8 bottom-4 h-28 w-28 rounded-full bg-blue-500/12 blur-3xl" />
          <div className="absolute inset-x-6 top-1/2 h-px -translate-y-1/2 overflow-hidden rounded-full bg-slate-800/80">
            <div className="animate-ambient-loader-sweep h-full w-28 rounded-full bg-gradient-to-r from-transparent via-sky-300/90 to-transparent shadow-[0_0_18px_rgba(125,211,252,0.9)]" />
          </div>
        </div>

        <div className="relative flex flex-col items-center text-center">
          <div className="mb-5 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-300 shadow-[0_0_18px_rgba(125,211,252,0.75)] animate-ambient-loader-pulse" />
            <span className="h-2.5 w-2.5 rounded-full bg-sky-400/80 shadow-[0_0_18px_rgba(56,189,248,0.55)] animate-ambient-loader-pulse [animation-delay:180ms]" />
            <span className="h-2.5 w-2.5 rounded-full bg-blue-400/70 shadow-[0_0_18px_rgba(96,165,250,0.5)] animate-ambient-loader-pulse [animation-delay:360ms]" />
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
