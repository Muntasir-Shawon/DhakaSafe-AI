import type { HTMLAttributes } from 'react';
import { cx } from '../../lib/cx';

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  /** `panel` for a large contained region, `card` for a single item, `inset` for a nested well. */
  tone?: 'panel' | 'card' | 'inset';
  /** Adds the soft lift used to mark a selected state. */
  raised?: boolean;
}

const toneClasses = {
  panel: 'bg-surface border border-line',
  card: 'bg-surface border border-line rounded-card',
  inset: 'bg-surface-2/60 border border-line rounded-control',
} as const;

/**
 * The one card primitive. Everything boxed in the app is a Surface, so
 * radius, border contrast and padding stay consistent without repetition.
 */
export function Surface({
  tone = 'card',
  raised = false,
  className,
  children,
  ...props
}: SurfaceProps) {
  return (
    <div
      className={cx(
        toneClasses[tone],
        raised && 'shadow-lift',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** A titled block inside a Surface. Use for sections, not for every sentence. */
export function SectionHeading({
  title,
  hint,
  className,
  ...props
}: { title: React.ReactNode; hint?: React.ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx('space-y-0.5', className)} {...props}>
      <h2 className="text-section font-semibold text-ink tracking-tight">{title}</h2>
      {hint ? <p className="text-meta text-ink-2">{hint}</p> : null}
    </div>
  );
}
