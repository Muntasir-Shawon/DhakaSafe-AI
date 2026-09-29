import { useCallback, useEffect, useState } from 'react';
import { CloudRain, Sun, FlaskConical, ScanSearch, CircleCheck } from 'lucide-react';
import { AreaForecast, NlpExtractionResult } from '../types';
import { api } from '../services/api';
import { Surface, SectionHeading } from './ui/Surface';
import { Field, Select } from './ui/Field';
import { Button } from './ui/Button';
import { RiskPill } from './ui/RiskPill';
import { BarChart } from './ui/BarChart';
import { Disclosure } from './ui/Disclosure';
import { ErrorState, SkeletonBlock } from './ui/StateViews';
import { cx } from '../lib/cx';
import { DAYS, daypartOf, formatCount, hour12 } from '../lib/format';

const SAMPLES = [
  { label: 'Farmgate robbery', text: 'A pedestrian was robbed by two motorcycle riders near Farmgate at around 11pm.' },
  { label: 'ধানমন্ডি ২৭ ছিনতাই', text: 'ধানমন্ডি ২৭ নম্বরে রাতে মোটরসাইকেল আরোহী ছিনতাইকারী এক পথচারীর ব্যাগ ও মোবাইল ছিনিয়ে নেয়।' },
  { label: 'মিরপুর ১০ ছিনতাই', text: 'মিরপুর ১০ গোলচত্বরে রাতে ছুরির মুখে এক যাত্রীর টাকা ও মোবাইল ফোন লুট করেছে তিন ছিনতাইকারী।' },
];

const SCHEMA_FIELDS: { key: keyof NlpExtractionResult; label: string; accent?: boolean }[] = [
  { key: 'crime_type', label: 'Crime type', accent: true },
  { key: 'location', label: 'Location', accent: true },
  { key: 'thana', label: 'Thana' },
  { key: 'time', label: 'Time' },
  { key: 'suspect_count', label: 'Suspects' },
  { key: 'vehicle_used', label: 'Vehicle' },
  { key: 'weapon', label: 'Weapon' },
  { key: 'victim_type', label: 'Victim category' },
  { key: 'location_precision', label: 'Location precision' },
];

/**
 * Where the technical vocabulary is allowed to exist. Presented as a research
 * and forecasting tool, not a sci-fi console.
 */
export const ForecastExplainabilityView: React.FC = () => {
  const [hour, setHour] = useState<number>(23);
  const [dayOfWeek, setDayOfWeek] = useState<string>('Friday');
  const [rain, setRain] = useState<boolean>(false);
  const [forecasts, setForecasts] = useState<AreaForecast[]>([]);
  const [loadingForecast, setLoadingForecast] = useState<boolean>(false);
  const [forecastError, setForecastError] = useState<string | null>(null);

  const [nlpText, setNlpText] = useState<string>(SAMPLES[0].text);
  const [nlpResult, setNlpResult] = useState<NlpExtractionResult | null>(null);
  const [loadingNlp, setLoadingNlp] = useState<boolean>(false);
  const [nlpError, setNlpError] = useState<string | null>(null);

  const fetchForecast = useCallback(async (h: number, dow: string, isRaining: boolean) => {
    setLoadingForecast(true);
    setForecastError(null);
    try {
      const res = await api.getForecast(h, dow, isRaining ? 1 : 0);
      setForecasts(res.forecasts);
    } catch (err) {
      console.error('Failed to get forecast:', err);
      setForecastError('The forecast service did not respond for this combination.');
    } finally {
      setLoadingForecast(false);
    }
  }, []);

  useEffect(() => {
    fetchForecast(hour, dayOfWeek, rain);
  }, [hour, dayOfWeek, rain, fetchForecast]);

  const handleExtractNlp = async () => {
    if (!nlpText.trim()) return;
    setLoadingNlp(true);
    setNlpError(null);
    try {
      const res = await api.extractNlp(nlpText);
      setNlpResult(res);
    } catch (err) {
      console.error('Failed to extract NLP:', err);
      setNlpError('The text could not be processed. Check the connection and retry.');
    } finally {
      setLoadingNlp(false);
    }
  };

  const rankedForecasts = [...forecasts].sort((a, b) => b.predicted_risk_score - a.predicted_risk_score);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <SectionHeading
        title="AI lab & forecast"
        hint="Research tools: area-level risk forecasting and text-to-record extraction."
      />

      <Surface tone="panel" className="mt-5 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            title="Area risk forecast"
            hint={`Predicted theft risk per neighbourhood, ${daypartOf(hour).label.toLowerCase()} on ${dayOfWeek}${rain ? ' in rain' : ''}.`}
          />
          <div className="flex flex-wrap items-end gap-2">
            <div className="w-32">
              <Field label="Hour">
                {(id) => (
                  <Select id={id} value={hour} onChange={(e) => setHour(Number(e.target.value))}>
                    {[...Array(24)].map((_, h) => (
                      <option key={h} value={h}>
                        {hour12(h)}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
            <div className="w-36">
              <Field label="Day">
                {(id) => (
                  <Select id={id} value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}>
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
            <button
              type="button"
              onClick={() => setRain((v) => !v)}
              aria-pressed={rain}
              className={cx(
                'flex h-10 w-10 items-center justify-center rounded-control border transition-colors',
                rain
                  ? 'border-info/40 bg-info-wash text-info'
                  : 'border-line bg-surface-2 text-ink-2 hover:border-line-strong',
              )}
            >
              {rain ? (
                <CloudRain className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Sun className="h-4 w-4" aria-hidden="true" />
              )}
              <span className="visually-hidden">{rain ? 'Rain on' : 'Rain off'}</span>
            </button>
          </div>
        </div>

        {forecastError ? (
          <ErrorState
            className="mt-4"
            description={forecastError}
            onRetry={() => fetchForecast(hour, dayOfWeek, rain)}
          />
        ) : loadingForecast && forecasts.length === 0 ? (
          <SkeletonBlock className="mt-5" />
        ) : (
          <>
            <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {rankedForecasts.map((fc) => (
                <li key={fc.area} className="rounded-control border border-line bg-surface-2/40 p-3">
                  <p className="truncate text-body font-medium text-ink">{fc.area}</p>
                  <p className="mt-1.5 text-stat font-semibold text-ink tabular">
                    {fc.predicted_risk_score}
                    <span className="text-meta font-normal text-ink-3"> / 100</span>
                  </p>
                  <RiskPill score={fc.predicted_risk_score} variant="label" className="mt-2" />
                </li>
              ))}
            </ul>

            <div className="mt-5 grid grid-cols-1 gap-5 border-t border-line pt-5 lg:grid-cols-2">
              <BarChart
                data={rankedForecasts.map((f) => ({
                  key: f.area,
                  label: f.area,
                  value: f.predicted_risk_score,
                }))}
                question="Which areas are predicted highest?"
                unit=" risk"
                className="[&>div:first-child]:h-28"
              />
              <Disclosure
                summary="How is this forecast produced?"
                detail="Method and inputs"
                defaultOpen={false}
              >
                <ul className="space-y-2 text-meta leading-relaxed text-ink-2">
                  <li>
                    Each road segment in the network is scored independently for the chosen hour,
                    day and weather.
                  </li>
                  <li>
                    Segment scores are then aggregated to the neighbourhood level, so an area
                    figure is an average of the streets inside it — not a separate measurement.
                  </li>
                  <li>
                    Areas with few scored roads are less reliable. Compare areas only with areas
                    of similar density.
                  </li>
                </ul>
              </Disclosure>
            </div>
          </>
        )}
      </Surface>

      <Surface tone="panel" className="mt-4 p-5">
        <SectionHeading
          title="Text to incident record"
          hint="Turns an unstructured news line or police statement into a structured record. Handles English and Bangla."
        />

        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-meta text-ink-3">Examples:</span>
            {SAMPLES.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => setNlpText(s.text)}
                className={cx(
                  'rounded-control border border-line bg-surface-2 px-2.5 py-1.5 text-meta text-ink-2 transition-colors hover:border-line-strong hover:text-ink',
                  /[\u0980-\u09FF]/.test(s.label) && 'font-bangla',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          <Field label="Report text" hint="Paste a headline, blotters entry, or a news line.">
            {(id, describedBy) => (
              <textarea
                id={id}
                aria-describedby={describedBy}
                value={nlpText}
                onChange={(e) => setNlpText(e.target.value)}
                rows={3}
                className={cx(
                  'w-full resize-y rounded-control border border-line bg-surface-2 p-3 text-body text-ink placeholder:text-ink-3 focus-visible:border-accent',
                  /[\u0980-\u09FF]/.test(nlpText) && 'font-bangla',
                )}
              />
            )}
          </Field>

          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={handleExtractNlp}
              isLoading={loadingNlp}
              leftIcon={loadingNlp ? undefined : <ScanSearch className="h-4 w-4" aria-hidden="true" />}
            >
              Extract record
            </Button>
          </div>
        </div>

        {nlpError && <ErrorState className="mt-4" description={nlpError} onRetry={handleExtractNlp} />}

        {nlpResult && (
          <div className="mt-5 border-t border-line pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-section font-semibold tracking-tight text-ink">
                Extracted record
              </h3>
              <span className="flex items-center gap-1.5 text-meta text-ink-2 tabular">
                <CircleCheck className="h-3.5 w-3.5 text-safe" aria-hidden="true" />
                {Math.round(nlpResult.extraction_confidence * 100)}% extraction confidence
              </span>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              {SCHEMA_FIELDS.map(({ key, label, accent }) => {
                const raw = nlpResult[key];
                const value = typeof raw === 'number' ? formatCount(raw) : String(raw ?? '—');
                return (
                  <div key={key} className="min-w-0">
                    <dt className="text-meta text-ink-3">{label}</dt>
                    <dd
                      className={cx(
                        'mt-0.5 truncate text-body',
                        accent ? 'font-medium text-accent' : 'text-ink',
                      )}
                    >
                      {value}
                    </dd>
                  </div>
                );
              })}
            </dl>

            <p className="mt-4 border-t border-line pt-3 text-meta text-ink-3">
              {nlpResult.is_usable_for_road_prediction
                ? 'Precise enough to be attached to a specific road segment in the risk model.'
                : 'Location is only area-level, so this record can inform an area forecast but not a single road.'}
            </p>
          </div>
        )}
      </Surface>

      <p className="mt-6 flex items-start gap-2 text-meta leading-relaxed text-ink-3">
        <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Forecasts are model outputs, not guarantees. A low score does not mean a street is safe; it
        means fewer incidents were reported there.
      </p>
    </div>
  );
};
