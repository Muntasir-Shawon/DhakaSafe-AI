import { getRiskLevel, riskAriaLabel } from '../../lib/risk';
import { cx } from '../../lib/cx';

interface RiskPillProps {
  score: number;
  /** `full` shows the score, `label` shows only the word. */
  variant?: 'full' | 'label';
  className?: string;
}

/**
 * Risk is communicated three ways at once: colour, icon and word.
 * Colour alone is never the only indicator.
 */
export function RiskPill({ score, variant = 'full', className }: RiskPillProps) {
  const { label, text, wash, border, Icon } = getRiskLevel(score);

  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-meta font-semibold tabular',
        text,
        wash,
        border,
        className,
      )}
      aria-label={riskAriaLabel(score)}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {variant === 'full' ? (
        <span>
          {score}
          <span className="font-normal opacity-70"> / 100</span>
        </span>
      ) : (
        <span>{label}</span>
      )}
    </span>
  );
}
