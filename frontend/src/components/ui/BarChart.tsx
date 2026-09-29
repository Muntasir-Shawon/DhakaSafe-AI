import { useState } from 'react';
import { cx } from '../../lib/cx';
import { getRiskLevel } from '../../lib/risk';

export interface BarDatum {
  key: string | number;
  label: string;
  value: number;
  /** Renders as a caption in the tooltip and the screen-reader summary. */
  context?: string;
}

interface BarChartProps {
  data: BarDatum[];
  /** Question the chart answers, shown as the accessible name. */
  question: string;
  /** Values at or above this are highlighted with the risk colour. */
  highlightFrom?: number;
  unit?: string;
  onSelect?: (datum: BarDatum) => void;
  className?: string;
  barClassName?: string;
  max?: number;
}

/**
 * Replaces three hand-rolled bar charts. Bars are real buttons, so the chart is
 * keyboard navigable and exposes its own numbers to assistive technology.
 */
export function BarChart({
  data,
  question,
  highlightFrom,
  unit = '',
  onSelect,
  className,
  barClassName,
  max,
}: BarChartProps) {
  const [active, setActive] = useState<string | null>(null);
  const ceiling = max ?? Math.max(...data.map((d) => d.value), 1);
  const activeDatum = data.find((d) => String(d.key) === active);

  return (
    <figure className={cx('space-y-3', className)}>
      <figcaption className="visually-hidden">{question}</figcaption>

      <div
        className="flex h-40 items-end gap-1.5"
        role="list"
        aria-label={question}
        onMouseLeave={() => setActive(null)}
      >
        {data.map((d) => {
          const pct = Math.max(3, Math.round((d.value / ceiling) * 100));
          const isHot = highlightFrom !== undefined && d.value >= highlightFrom;
          const hot = isHot ? getRiskLevel(d.value) : null;
          const isActive = active === String(d.key);
          const interactive = Boolean(onSelect);

          const bar = (
            <div
              className={cx(
                'w-full rounded-t-sm transition-all duration-200 ease-standard',
                hot ? hot.bar : 'bg-line-strong',
                !isHot && 'hover:bg-ink-3/60',
                isActive && 'opacity-100',
                !isActive && 'opacity-85',
                barClassName,
              )}
              style={{ height: `${pct}%` }}
            />
          );

          if (!interactive) {
            return (
              <div
                key={d.key}
                role="listitem"
                className="group relative flex-1"
                onMouseEnter={() => setActive(String(d.key))}
                onFocus={() => setActive(String(d.key))}
                tabIndex={0}
                aria-label={`${d.label}: ${d.value}${unit}`}
              >
                {bar}
              </div>
            );
          }

          return (
            <button
              key={d.key}
              type="button"
              role="listitem"
              className="group relative flex-1 cursor-pointer rounded-sm"
              onMouseEnter={() => setActive(String(d.key))}
              onFocus={() => setActive(String(d.key))}
              onBlur={() => setActive(null)}
              onClick={() => onSelect?.(d)}
              aria-label={`${d.label}: ${d.value}${unit}`}
            >
              {bar}
            </button>
          );
        })}
      </div>

      {/* Axis labels: show a readable subset rather than 24 cramped ticks. */}
      <div className="flex justify-between text-meta text-ink-3 tabular">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(data.length / 2)]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>

      {/* Always-visible readout so the information is never hover-only. */}
      <p className="text-meta text-ink-2 tabular" role="status" aria-live="polite">
        {activeDatum
          ? `${activeDatum.label} · ${activeDatum.value}${unit}${activeDatum.context ? ` · ${activeDatum.context}` : ''}`
          : question}
      </p>
    </figure>
  );
}
