import { getRiskLevel, riskAriaLabel } from '../../lib/risk';
import { cx } from '../../lib/cx';

interface RiskMeterProps {
  score: number;
  /** Renders the guidance sentence underneath. */
  showGuidance?: boolean;
  /** Renders the full "Safety risk 14 / 100" header. */
  showHeading?: boolean;
  className?: string;
  compact?: boolean;
}

/**
 * The main risk readout: a number, a word, and one calm sentence explaining
 * what it means. No ML terminology outside the analytics and lab views.
 */
export function RiskMeter({
  score,
  showGuidance = true,
  showHeading = true,
  compact = false,
  className,
}: RiskMeterProps) {
  const { label, bar, text, Icon, guidance } = getRiskLevel(score);

  return (
    <div className={cx('space-y-2', className)}>
      {showHeading && (
        <div className="flex items-end justify-between gap-3">
          <span className="text-meta font-medium uppercase tracking-wider text-ink-3">
            Safety risk
          </span>
          <span className="flex items-baseline gap-1.5">
            <span className={cx('text-stat font-semibold tabular', text)}>{score}</span>
            <span className="text-meta text-ink-3">/ 100</span>
          </span>
        </div>
      )}

      <div
        role="meter"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={riskAriaLabel(score)}
        className={cx(
          'relative w-full overflow-hidden rounded-full bg-surface-3',
          compact ? 'h-1.5' : 'h-2',
        )}
      >
        <div
          className={cx('h-full rounded-full transition-[width] duration-500 ease-standard', bar)}
          style={{ width: `${Math.max(2, Math.min(100, score))}%` }}
        />
      </div>

      <div className="flex items-center gap-1.5">
        <Icon className={cx('h-4 w-4 shrink-0', text)} aria-hidden="true" />
        <span className={cx('text-body font-semibold', text)}>{label}</span>
        {showGuidance && <span className="text-meta text-ink-2">risk</span>}
      </div>

      {showGuidance && <p className="text-meta text-ink-2 leading-relaxed">{guidance}</p>}
    </div>
  );
}
