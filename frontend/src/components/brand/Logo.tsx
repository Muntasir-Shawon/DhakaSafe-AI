import { cx } from '../../lib/cx';

interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * DhakaSafe mark: a shield containing a path that bends and rises to a
 * waypoint. Protection plus movement, drawn in three strokes. Monochrome, so
 * it sits on any surface without a tile or a glow behind it.
 */
export function Logo({ size = 28, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="DhakaSafe"
      className={cx('shrink-0', className)}
    >
      {/* Shield silhouette */}
      <path
        d="M16 2.75 4.75 6.5v9.1c0 6.6 4.5 12.2 11.25 14.15C22.75 27.8 27.25 22.2 27.25 15.6V6.5L16 2.75Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
        opacity="0.55"
      />
      {/* Route: enters low-left, bends at an intersection, exits high-right */}
      <path
        d="M10.4 24.2c0-3.6 1.5-5.1 3.4-6.1 1.8-1 3.4-1.8 3.4-4.4 0-1.6-.7-2.6-1.7-3.5"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        d="M18.4 24.2c0-4.2 1.4-5.9 3-7.1"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        opacity="0.45"
      />
      {/* Waypoint */}
      <circle cx="20.6" cy="12.9" r="1.85" fill="currentColor" />
    </svg>
  );
}

/** Logo plus wordmark. One lockup so the pairing is never re-invented. */
export function BrandLockup({
  size = 'md',
  onClick,
  className,
}: {
  size?: 'sm' | 'md';
  onClick?: () => void;
  className?: string;
}) {
  const mark = size === 'sm' ? 22 : 26;
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      {...(onClick ? { type: 'button' as const, onClick, 'aria-label': 'DhakaSafe, go to Safe Route' } : {})}
      className={cx(
        'flex items-center gap-2.5 text-accent',
        onClick && 'rounded-control transition-opacity hover:opacity-80',
        className,
      )}
    >
      <Logo size={mark} />
      <span
        className={cx(
          'font-semibold tracking-tight text-ink',
          size === 'sm' ? 'text-body' : 'text-section',
        )}
      >
        DhakaSafe
      </span>
    </Wrapper>
  );
}
