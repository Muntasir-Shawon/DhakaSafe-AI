import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';

type Tone = 'neutral' | 'accent' | 'safe' | 'caution' | 'warn' | 'danger' | 'info';

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-ink-2 border-line',
  accent: 'bg-accent-wash text-accent border-accent/30',
  safe: 'bg-safe-wash text-safe border-safe/30',
  caution: 'bg-caution-wash text-caution border-caution/30',
  warn: 'bg-warn-wash text-warn border-warn/30',
  danger: 'bg-danger-wash text-danger border-danger/30',
  info: 'bg-info-wash text-info border-info/30',
};

interface BadgeProps {
  tone?: Tone;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * For short metadata only. Real risk levels use RiskPill, which carries an
 * icon and a word so colour is never the only signal.
 */
export function Badge({ tone = 'neutral', icon, className, children }: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-meta font-medium whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
