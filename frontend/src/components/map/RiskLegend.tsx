import { RISK_SCALE, getRiskLevelByBand } from '../../lib/risk';
import { cx } from '../../lib/cx';

interface RiskLegendProps {
  className?: string;
  /** `inline` for a horizontal strip, `stack` for a vertical list. */
  layout?: 'inline' | 'stack';
}

/**
 * The legend pairs each colour with its icon, word and range, so the map's
 * colours are never the only way to read risk.
 */
export function RiskLegend({ className, layout = 'inline' }: RiskLegendProps) {
  return (
    <ul
      className={cx(
        layout === 'inline' ? 'flex flex-wrap items-center gap-x-4 gap-y-1.5' : 'space-y-1.5',
        className,
      )}
    >
      {RISK_SCALE.map((band) => {
        const { label, hex, range, Icon } = getRiskLevelByBand(band);
        return (
          <li key={band} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: hex }}
            />
            <Icon className="h-3 w-3 shrink-0 text-ink-3" aria-hidden="true" />
            <span className="text-meta text-ink-2">
              {label}
              <span className="text-ink-3"> {range}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
