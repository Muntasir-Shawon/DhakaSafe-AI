import type { ReactNode } from 'react';
import { RotateCw, CircleAlert, Inbox } from 'lucide-react';
import { Button } from './Button';
import { cx } from '../../lib/cx';

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cx('animate-skeleton rounded-control bg-surface-2', className)} />;
}

/**
 * Loading placeholder. A skeleton matches the shape of the content it replaces
 * so the layout does not jump when data arrives.
 */
export function SkeletonList({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cx('space-y-2', className)} role="status" aria-live="polite">
      <span className="visually-hidden">Loading</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-control border border-line bg-surface p-3">
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-2.5 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cx('space-y-3', className)}>
      <span className="visually-hidden">Loading</span>
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('flex flex-col items-center justify-center gap-3 px-6 py-12 text-center', className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 border border-line text-ink-3">
        <Inbox className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-body font-medium text-ink">{title}</p>
        {description ? <p className="text-meta text-ink-2 max-w-sm">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

/**
 * The app previously swallowed every failure into `console.error` and rendered
 * an empty page. Anything that can fail now offers a way forward.
 */
export function ErrorState({
  title = 'Could not load this',
  description,
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cx(
        'flex flex-col items-center justify-center gap-3 rounded-card border border-danger/25 bg-danger-wash px-6 py-10 text-center',
        className,
      )}
    >
      <CircleAlert className="h-5 w-5 text-danger" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-body font-medium text-ink">{title}</p>
        {description ? <p className="text-meta text-ink-2 max-w-sm">{description}</p> : null}
      </div>
      {onRetry && (
        <Button size="sm" leftIcon={<RotateCw className="h-3.5 w-3.5" aria-hidden="true" />} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
