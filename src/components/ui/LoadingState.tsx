/**
 * The loading state for a data view.
 *
 * It names what is being fetched rather than showing a bare shimmer. A skeleton with
 * no label reads as a frozen page, and to a screen reader it reads as nothing at all,
 * which is why the status is announced politely.
 */
export function LoadingState({
  label,
  rows = 3,
  className = '',
}: {
  label: string;
  rows?: number;
  className?: string;
}) {
  return (
    <div role="status" aria-live="polite" className={['space-y-3', className].join(' ')}>
      <p className="text-sm text-slate-400">{label}</p>
      <div aria-hidden="true" className="space-y-2.5">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="app-skeleton h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
