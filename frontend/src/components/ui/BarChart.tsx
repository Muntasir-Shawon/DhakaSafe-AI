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
  /** Height of the plot area, e.g. `h-24`. */
  plotClassName?: string;
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
  plotClassName,
  max,
}: BarChartProps) {
  const [active, setActive] = useState<string | null>(null);
  const ceiling = max ?? Math.max(...data.map((d) => d.value), 1);
  const activeDatum = data.find((d) => String(d.key) === active);

  return (
    <figure className={cx('space-y-3', className)}>
      <figcaption className="visually-hidden">{question}</figcaption>

      {/*
        The plot has a definite height, and each bar is positioned against the
        bottom of its column. A percentage height needs a definite parent to
        resolve against: the columns used to be auto-height, which collapsed
        every bar to zero. The row also scrolls sideways when the columns no
        longer fit — 24 bars in a phone-width card are ~7px each, which is too
        thin to read or tap, and scrolling keeps all 24 values on screen.
      */}
      <div className="overflow-x-auto overflow-y-hidden py-1">
        <div
          className={cx(
            'relative flex min-w-max items-stretch gap-1.5',
            plotClassName ?? 'h-40',
          )}
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
                  'absolute bottom-0 left-0 w-full rounded-t-sm transition-all duration-200 ease-standard',
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
                  className="group relative h-full min-w-[18px] flex-1"
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
                className="group relative h-full min-w-[18px] flex-1 cursor-pointer rounded-sm"
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
