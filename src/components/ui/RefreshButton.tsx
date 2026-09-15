'use client';

import { Button } from '@/components/ui/Button';

/**
 * The refresh affordance used across every panel.
 *
 * On a phone it is an icon-only square that sits quietly beside a heading, rather
 * than a full-width text button competing with the content for attention. From `sm:`
 * up it expands to icon plus label, which is what a pointer-driven layout wants.
 */
export function RefreshButton({
  onClick,
  isLoading = false,
  label = 'Refresh',
  className = '',
}: {
  onClick: () => void;
  isLoading?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={onClick}
      disabled={isLoading}
      aria-label={label}
      title={label}
      className={[
        'h-10 w-10 shrink-0 gap-2 p-0 sm:h-9 sm:w-auto sm:px-3',
        className,
      ].join(' ')}
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
        className={['h-4 w-4 shrink-0', isLoading ? 'animate-spin' : ''].join(' ')}
      >
        <path
          d="M16.5 10a6.5 6.5 0 1 1-1.9-4.6M16.5 4v3.5H13"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="hidden sm:inline">{isLoading ? 'Refreshing…' : label}</span>
    </Button>
  );
}
