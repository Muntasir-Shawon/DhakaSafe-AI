import { useCallback, useEffect, useState } from 'react';
import { MapContainer, Polyline, Circle, Popup } from 'react-leaflet';
import {
  Play,
  Pause,
  CloudRain,
  Sun,
  Layers,
  LocateFixed,
  X,
} from 'lucide-react';
import { RoadSegment, Hotspot, RoadTimelinePoint, ShapFactor } from '../types';
import { api } from '../services/api';
import { ShapModal } from './ShapModal';
import { MapAutoBounds } from './map/MapAutoBounds';
import { MapChrome, ThemeLayers, type MapTheme } from './map/MapChrome';
import { MapOverlay } from './map/MapOverlay';
import { ZoomControl } from './map/ZoomControl';
import { RiskLegend } from './map/RiskLegend';
import { Field, Select } from './ui/Field';
import { Surface } from './ui/Surface';
import { RiskMeter } from './ui/RiskMeter';
import { BarChart } from './ui/BarChart';
import { Button } from './ui/Button';
import { Sheet } from './ui/Sheet';
import { ErrorState, SkeletonBlock } from './ui/StateViews';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { cx } from '../lib/cx';
import { getRiskLevel, riskHex, describeLighting, describeRoadType } from '../lib/risk';
import { DAYS, daypartOf, dayNote, formatCount, formatMeters, hour12, hour24 } from '../lib/format';

const CASING = '#0b1220';
const SELECTED = '#2dd4bf';

const allRoads = (roads: RoadSegment[]): [number, number][] =>
  roads.flatMap((r) => r.coordinates);

export const RiskMap: React.FC = () => {
  const isMobile = useMediaQuery('(max-width: 1023px)');

  const [hour, setHour] = useState<number>(22);
  const [dayOfWeek, setDayOfWeek] = useState<string>('Friday');
  const [isRaining, setIsRaining] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [mapTheme, setMapTheme] = useState<MapTheme>('streets');

  const [roads, setRoads] = useState<RoadSegment[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [showHotspots, setShowHotspots] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fitToken, setFitToken] = useState<number>(0);

  const [inspectedRoad, setInspectedRoad] = useState<RoadSegment | null>(null);
  const [roadTimeline, setRoadTimeline] = useState<RoadTimelinePoint[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState<boolean>(false);

  const [isShapOpen, setIsShapOpen] = useState<boolean>(false);
  const [shapFactors, setShapFactors] = useState<ShapFactor[]>([]);
  const [loadingShap, setLoadingShap] = useState<boolean>(false);
  const [shapConfidence, setShapConfidence] = useState<number | null>(null);

  useEffect(() => {
    async function loadHotspots() {
      try {
        const res = await api.getHotspots();
        setHotspots(res.hotspots);
      } catch (err) {
        console.error('Failed to fetch hotspots:', err);
      }
    }
    loadHotspots();
  }, []);

  const fetchRoads = useCallback(async (h: number, dow: string, rain: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getRoadsWithRisk(h, dow, rain);
      setRoads(res.roads);
    } catch (err) {
      console.error('Failed to fetch roads:', err);
      setError('Risk data for this time could not be loaded. Try another hour, or retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoads(hour, dayOfWeek, isRaining ? 1 : 0);
  }, [hour, dayOfWeek, isRaining, fetchRoads]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => setHour((prev) => (prev + 1) % 24), 1400);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const handleRoadClick = async (road: RoadSegment) => {
    setInspectedRoad(road);
    setLoadingTimeline(true);
    try {
      const res = await api.getRoadTimeline(road.road_id, dayOfWeek, isRaining ? 1 : 0);
      setRoadTimeline(res.timeline);
    } catch (err) {
      console.error('Failed to fetch timeline:', err);
      setRoadTimeline([]);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const handleOpenShap = async () => {
    if (!inspectedRoad) return;
    setIsShapOpen(true);
    setLoadingShap(true);
    setShapConfidence(null);
    try {
      const res = await api.explainRisk(inspectedRoad.road_id, hour, dayOfWeek, isRaining ? 1 : 0);
      setShapFactors(res.explanation_factors);
      setShapConfidence(res.prediction?.confidence ?? null);
    } catch (err) {
      console.error('Failed to explain risk:', err);
    } finally {
      setLoadingShap(false);
    }
  };

  const inspector = inspectedRoad && (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-meta text-ink-3">{inspectedRoad.area} · {inspectedRoad.thana}</p>
          <h3 className="text-section font-semibold tracking-tight text-ink">
            {inspectedRoad.road_name}
          </h3>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setInspectedRoad(null)}
          aria-label="Close road details"
          className="shrink-0"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <RiskMeter score={inspectedRoad.risk_score} />

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-y border-line py-3 text-meta">
        <div>
          <dt className="text-ink-3">Street lighting</dt>
          <dd className="mt-0.5 text-body text-ink">{describeLighting(inspectedRoad.lighting_condition)}</dd>
        </div>
        <div>
          <dt className="text-ink-3">Road type</dt>
          <dd className="mt-0.5 text-body text-ink">{describeRoadType(inspectedRoad.road_type)}</dd>
        </div>
        <div>
          <dt className="text-ink-3">Bus stops</dt>
          <dd className="mt-0.5 text-body text-ink tabular">{inspectedRoad.bus_stops_count}</dd>
        </div>
        <div>
          <dt className="text-ink-3">Police posts</dt>
          <dd className="mt-0.5 text-body text-ink tabular">{inspectedRoad.police_stations_nearby}</dd>
        </div>
        <div>
          <dt className="text-ink-3">Length</dt>
          <dd className="mt-0.5 text-body text-ink tabular">{formatMeters(inspectedRoad.length_meters)}</dd>
        </div>
        <div>
          <dt className="text-ink-3">Reported incidents</dt>
          <dd className="mt-0.5 text-body text-ink tabular">
            {formatCount(inspectedRoad.historical_incidents)}
          </dd>
        </div>
      </dl>

      <section className="space-y-2">
        <h4 className="text-meta font-medium text-ink-2">Risk across the day</h4>
        {loadingTimeline ? (
          <SkeletonBlock className="space-y-2" />
        ) : roadTimeline.length > 0 ? (
          <BarChart
            data={roadTimeline.map((pt) => ({
              key: pt.hour,
              label: hour12(pt.hour),
              value: pt.risk_score,
              context: pt.risk_level,
            }))}
            question="How does risk change over 24 hours on this road?"
            unit=" risk"
            onSelect={(d) => setHour(Number(d.key))}
            plotClassName="h-24"
          />
        ) : (
          <p className="text-meta text-ink-3">The hourly pattern for this road is not available.</p>
        )}
      </section>

      <Button
        variant="secondary"
        className="w-full"
        onClick={handleOpenShap}
        leftIcon={<LocateFixed className="h-4 w-4" aria-hidden="true" />}
      >
        Why this score?
      </Button>
    </div>
  );

  const mapPanel = (
    <div className="isolate z-[var(--z-map)] relative h-full min-h-[420px] overflow-hidden rounded-card border border-line">
      <MapContainer
        center={[23.77, 90.39]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <ThemeLayers theme={mapTheme} />
        <MapAutoBounds
          coords={allRoads(roads)}
          key={fitToken}
          padding={40}
        />

        {showHotspots &&
          hotspots.map((h, i) => (
            <Circle
              key={`hotspot-${i}`}
              center={[h.center_lat, h.center_lon]}
              radius={h.radius_meters}
              pathOptions={{
                color: '#d9773f',
                fillColor: '#d9773f',
                fillOpacity: 0.09,
                weight: 1.25,
                dashArray: '3,6',
              }}
            >
              <Popup>
                <div className="space-y-0.5">
                  <p className="text-body font-medium text-ink">{h.area}</p>
                  <p className="text-meta text-ink-2 tabular">
                    {formatCount(h.incident_count)} reported incidents
                  </p>
                  <p className="text-meta text-ink-2">Mainly {h.primary_crime}</p>
                </div>
              </Popup>
            </Circle>
          ))}

        {roads.map((road) => {
          const selected = inspectedRoad?.road_id === road.road_id;
          return (
            <g key={road.road_id}>
              <Polyline
                positions={road.coordinates}
                pathOptions={{
                  color: selected ? SELECTED : CASING,
                  weight: selected ? 9 : 5,
                  opacity: selected ? 1 : 0.75,
                }}
              />
              <Polyline
                positions={road.coordinates}
                eventHandlers={{ click: () => handleRoadClick(road) }}
                pathOptions={{
                  color: selected ? SELECTED : riskHex(road.risk_score),
                  weight: selected ? 5.5 : 3.5,
                  opacity: 1,
                }}
              >
                <Popup>
                  <div className="space-y-0.5">
                    <p className="text-body font-medium text-ink">{road.road_name}</p>
                    <p className="text-meta text-ink-2">
                      {road.area} · {road.thana}
                    </p>
                    <p className={cx('text-meta font-medium', getRiskLevel(road.risk_score).text)}>
                      Risk {road.risk_score}/100 · {getRiskLevel(road.risk_score).label}
                    </p>
                  </div>
                </Popup>
              </Polyline>
            </g>
          );
        })}

        {/* Zoom lives inside the container, hosted by MapOverlay, so the map
            context is always available. The card below is full width on
            phones, so on small screens the controls start underneath it. */}
        <MapOverlay className="left-3 top-[84px] sm:top-3">
          <ZoomControl />
        </MapOverlay>
      </MapContainer>

      <MapChrome
        theme={mapTheme}
        onThemeChange={setMapTheme}
        className="top-[84px] sm:top-3"
      >
        <LocateButton
          onLocate={() => {
            setInspectedRoad(null);
            setFitToken((t) => t + 1);
          }}
        />
        <button
          type="button"
          onClick={() => setShowHotspots((v) => !v)}
          aria-pressed={showHotspots}
          title={showHotspots ? 'Hide hotspot clusters' : 'Show hotspot clusters'}
          className={cx(
            'flex h-9 w-9 items-center justify-center rounded-control border shadow-lift backdrop-blur transition-colors',
            showHotspots
              ? 'border-warn/40 bg-warn-wash text-warn'
              : 'border-line bg-surface/95 text-ink-2 hover:text-ink',
          )}
        >
          <Layers className="h-4 w-4" aria-hidden="true" />
          <span className="visually-hidden">Hotspot clusters</span>
        </button>
      </MapChrome>

      {/* Time is the primary control on this page, so it floats over the map. */}
      <div className="pointer-events-auto absolute inset-x-3 top-3 z-[var(--z-map-chrome)] sm:left-1/2 sm:right-auto sm:w-[420px] sm:-translate-x-1/2">
        <div className="rounded-card border border-line bg-surface/95 p-3 shadow-lift backdrop-blur">
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant={isPlaying ? 'secondary' : 'primary'}
              onClick={() => setIsPlaying((v) => !v)}
              aria-label={isPlaying ? 'Pause the day cycle' : 'Play the day cycle'}
              className="h-9 w-9 shrink-0 px-0"
            >
              {isPlaying ? (
                <Pause className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </Button>

            <div className="min-w-0 flex-1">
              <p className="text-body font-semibold text-ink tabular">
                {hour12(hour)}
                <span className="ml-2 text-meta font-normal text-ink-3">{daypartOf(hour).label}</span>
              </p>
              <input
                type="range"
                min={0}
                max={23}
                value={hour}
                onChange={(e) => setHour(Number(e.target.value))}
                aria-label="Hour of day"
                aria-valuetext={hour24(hour)}
                className="mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-3 accent-[#14b8a6]"
              />
            </div>
          </div>
        </div>
      </div>

      {isMobile && !inspectedRoad && (
        <button
          type="button"
          onClick={() => setFitToken((t) => t + 1)}
          className="absolute inset-x-3 bottom-[var(--map-action-inset)] z-[var(--z-map-chrome)] flex min-h-[48px] items-center justify-center rounded-control border border-line-strong bg-surface/95 text-body font-medium text-ink shadow-lift backdrop-blur"
        >
          Fit all {roads.length} roads
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 pb-8 pt-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-display font-semibold tracking-tight text-ink">Risk around this time</h1>
          <p className="mt-1 text-body text-ink-2">
            Every road in the network, scored for the hour and day you choose.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="w-40">
            <Field label="Day" hint={dayNote(dayOfWeek) || undefined}>
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
            onClick={() => setIsRaining((v) => !v)}
            aria-pressed={isRaining}
            className={cx(
              'flex h-10 items-center gap-2 rounded-control border px-3 text-body transition-colors',
              isRaining
                ? 'border-info/40 bg-info-wash text-info'
                : 'border-line bg-surface-2 text-ink-2 hover:border-line-strong',
            )}
          >
            {isRaining ? (
              <CloudRain className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Sun className="h-4 w-4" aria-hidden="true" />
            )}
            {isRaining ? 'Raining' : 'Clear'}
          </button>
        </div>
      </div>

      {error && <ErrorState className="mt-4" description={error} onRetry={() => fetchRoads(hour, dayOfWeek, isRaining ? 1 : 0)} />}

      {isMobile ? (
        <div className="mt-4">
          <div className="h-[62dvh] min-h-[440px]">{mapPanel}</div>

          {/* The legend is a key for the map colours, so it sits under the map at
              every size rather than being a desktop-only extra. */}
          <div className="mt-3">
            <RiskLegend />
          </div>

          <Sheet
            isOpen={Boolean(inspectedRoad)}
            onClose={() => setInspectedRoad(null)}
            title={inspectedRoad?.road_name ?? 'Road'}
            description={inspectedRoad ? `${inspectedRoad.area} · ${inspectedRoad.thana}` : undefined}
          >
            {inspector}
          </Sheet>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className={cx('lg:col-span-3', inspectedRoad && 'lg:col-span-2')}>
            <div className="h-[calc(100dvh-16rem)] min-h-[560px]">{mapPanel}</div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <RiskLegend />
              <p className="text-meta text-ink-3 tabular">
                {loading ? 'Scoring roads…' : `${roads.length} roads`}
              </p>
            </div>
          </div>

          <div className="lg:col-span-2">
            {inspectedRoad ? (
              <Surface tone="panel" className="p-5">
                {inspector}
              </Surface>
            ) : (
              <Surface tone="panel" className="p-5">
                <h2 className="text-section font-semibold tracking-tight text-ink">Pick a road</h2>
                <p className="mt-1 text-body text-ink-2">
                  Select any line on the map to see its risk for {hour12(hour)} on {dayOfWeek}
                  {isRaining ? ', in rain' : ''}.
                </p>
                <dl className="mt-4 space-y-2.5 border-t border-line pt-4 text-meta">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-ink-3">Roads scored</dt>
                    <dd className="tabular text-body text-ink">{roads.length}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-ink-3">Hotspot clusters</dt>
                    <dd className="tabular text-body text-ink">
                      {showHotspots ? hotspots.length : 0}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-ink-3">Weather</dt>
                    <dd className="text-body text-ink">{isRaining ? 'Rain' : 'Clear'}</dd>
                  </div>
                </dl>
              </Surface>
            )}
          </div>
        </div>
      )}

      {inspectedRoad && (
        <ShapModal
          isOpen={isShapOpen}
          onClose={() => setIsShapOpen(false)}
          roadName={inspectedRoad.road_name}
          area={inspectedRoad.area}
          riskScore={inspectedRoad.risk_score}
          riskLevel={inspectedRoad.risk_level}
          confidence={shapConfidence ?? 0}
          confidenceKnown={shapConfidence !== null}
          isLoading={loadingShap}
          factors={shapFactors}
        />
      )}
    </div>
  );
};

function LocateButton({ onLocate }: { onLocate: () => void }) {
  return (
    <button
      type="button"
      onClick={onLocate}
      aria-label="Fit everything on screen"
      title="Fit everything on screen"
      className="flex h-9 w-9 items-center justify-center rounded-control border border-line bg-surface/95 text-ink-2 shadow-lift backdrop-blur transition-colors hover:text-ink"
    >
      <LocateFixed className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
