import { useCallback, useEffect, useState } from 'react';
import { AnalyticsSummary, Hotspot } from '../types';
import { api } from '../services/api';
import { Surface, SectionHeading } from './ui/Surface';
import { BarChart } from './ui/BarChart';
import { Disclosure } from './ui/Disclosure';
import { ErrorState, SkeletonBlock } from './ui/StateViews';
import { cx } from '../lib/cx';
import { formatCount } from '../lib/format';

const PEAK_START = 20;
const PEAK_END = 2;

export const AnalyticsView: React.FC = () => {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [aRes, hRes] = await Promise.all([api.getAnalytics(), api.getHotspots()]);
      setData(aRes);
      setHotspots(hRes.hotspots);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('The analytics service did not respond. Retry in a moment.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <SkeletonBlock />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-10 pt-10 sm:px-6 lg:px-8">
        <ErrorState description={error ?? undefined} onRetry={load} />
      </div>
    );
  }

  const { summary } = data;
  const topCrime = data.crime_types[0];
  const maxThana = Math.max(...data.top_thanas.map((t) => t.count), 1);

  const kpis = [
    { label: 'Reported cases', value: formatCount(summary.total_incidents), note: summary.date_range },
    { label: 'Busiest window', value: summary.peak_risk_window, note: 'Most reported incidents' },
    { label: 'Most common offence', value: summary.most_common_crime, note: topCrime ? `${topCrime.percentage}% of reports` : undefined },
    { label: 'Densest area', value: summary.top_affected_hub, note: 'By reported volume' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <SectionHeading
        as="h1"
        title="Crime analytics"
        hint={`Aggregated from ${formatCount(summary.total_incidents)} reported street theft incidents, ${summary.date_range}.`}
      />

      {/* A KPI row, not four hero cards. */}
      <Surface tone="panel" className="mt-5">
        <dl className="grid divide-y divide-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
          {kpis.map((kpi, i) => (
            <div
              key={kpi.label}
              className={cx('px-4 py-4', i > 0 && 'lg:border-l lg:border-line', i === 2 && 'sm:border-l sm:border-line lg:border-l')}
            >
              <dt className="text-meta text-ink-3">{kpi.label}</dt>
              <dd className="mt-1 text-section font-semibold text-ink">{kpi.value}</dd>
              {kpi.note ? <p className="mt-0.5 text-meta text-ink-3">{kpi.note}</p> : null}
            </div>
          ))}
        </dl>
      </Surface>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Surface tone="panel" className="p-5">
          <SectionHeading title="When is risk highest?" hint="Reported incidents by hour of the day." />
          <BarChart
            className="mt-4"
            data={data.hourly_distribution.map((h) => {
              const isPeak = h.hour >= PEAK_START || h.hour <= PEAK_END;
              return {
                key: h.hour,
                label: h.label,
                value: h.count,
                context: isPeak ? 'Late-night window' : undefined,
              };
            })}
            question="When is risk highest?"
            unit=" incidents"
          />
          <p className="mt-3 border-t border-line pt-3 text-meta text-ink-3">
            Warm bars fall between {PEAK_START}:00 and 02:00, the window with the most reported
            incidents.
          </p>
        </Surface>

        <Surface tone="panel" className="p-5">
          <SectionHeading title="What type of crime dominates?" hint="Share of all reported cases." />
          <ul className="mt-4 space-y-3">
            {data.crime_types.map((ct, i) => (
              <li key={ct.crime_type} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-3 text-body">
                  <span className={cx('text-ink', i === 0 && 'font-medium')}>{ct.crime_type}</span>
                  <span className="shrink-0 text-meta text-ink-3 tabular">
                    {formatCount(ct.count)} · {ct.percentage}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
                  <div
                    className={cx(
                      'h-full rounded-full transition-[width] duration-500 ease-standard',
                      i === 0 ? 'bg-warn' : 'bg-line-strong',
                    )}
                    style={{ width: `${ct.percentage}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Surface>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Surface tone="panel" className="p-5 lg:col-span-3">
          <SectionHeading
            title="Which areas cluster risk?"
            hint="Statistically dense incident clusters found by the hotspot model."
          />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-body">
              <caption className="visually-hidden">
                Reported incidents by hotspot area, with cluster radius, peak hours and severity
              </caption>
              <thead>
                <tr className="border-b border-line text-meta text-ink-3">
                  <th scope="col" className="py-2 pr-3 font-medium">Area</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Thana</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">Cases</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">Radius</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Peak</th>
                  <th scope="col" className="py-2 font-medium">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {hotspots.map((h, i) => (
                  <tr key={`${h.area}-${i}`} className="transition-colors hover:bg-surface-2/40">
                    <th scope="row" className="py-2.5 pr-3 font-normal text-ink">
                      {h.area}
                    </th>
                    <td className="py-2.5 pr-3 text-ink-2">{h.thana}</td>
                    <td className="py-2.5 pr-3 text-right text-ink tabular">{formatCount(h.incident_count)}</td>
                    <td className="py-2.5 pr-3 text-right text-ink-3 tabular">{h.radius_meters} m</td>
                    <td className="py-2.5 pr-3 text-ink-2">{h.peak_hours}</td>
                    <td
                      className={cx(
                        'py-2.5 text-meta font-medium',
                        h.severity === 'CRITICAL' ? 'text-danger' : 'text-warn',
                      )}
                    >
                      {h.severity === 'CRITICAL' ? 'Critical' : 'Elevated'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>

        <Surface tone="panel" className="p-5 lg:col-span-2">
          <SectionHeading
            title="Where are cases reported?"
            hint="Ranked by reported volume, by police jurisdiction."
          />
          <ol className="mt-4 space-y-2.5">
            {data.top_thanas.slice(0, 8).map((t, i) => (
              <li key={t.thana} className="space-y-1">
                <div className="flex items-baseline justify-between gap-3 text-body">
                  <span className={cx('truncate text-ink-2', i === 0 && 'font-medium text-ink')}>
                    {t.thana}
                  </span>
                  <span className="shrink-0 text-meta text-ink-3 tabular">{formatCount(t.count)}</span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-surface-3">
                  <div
                    className={cx(
                      'h-full rounded-full',
                      i === 0 ? 'bg-accent' : 'bg-line-strong',
                    )}
                    style={{ width: `${(t.count / maxThana) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ol>

          <Disclosure summary="Reported details" className="mt-5" detail="Weapons and vehicles">
            <div className="grid grid-cols-2 gap-4">
              <RankedList title="Weapons" rows={data.weapons} />
              <RankedList title="Vehicles" rows={data.vehicles} />
            </div>
          </Disclosure>
        </Surface>
      </div>

      <p className="mt-6 text-meta leading-relaxed text-ink-3">
        These figures reflect reported incident density from news reports and police blotters.
        Unreported theft is not reflected here, so a low count does not mean a road is risk-free.
      </p>
    </div>
  );
};

function RankedList({
  title,
  rows,
}: {
  title: string;
  rows: { weapon?: string; vehicle?: string; count: number }[];
}) {
  return (
    <div>
      <h4 className="text-meta font-medium text-ink-3">{title}</h4>
      <ul className="mt-1.5 space-y-1 text-meta">
        {rows.slice(0, 4).map((row, i) => (
          <li key={i} className="flex items-baseline justify-between gap-2">
            <span className="truncate text-ink-2">{row.weapon ?? row.vehicle}</span>
            <span className="shrink-0 text-ink-3 tabular">{formatCount(row.count)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
