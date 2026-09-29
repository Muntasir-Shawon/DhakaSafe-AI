import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  MapContainer,
  Polyline,
  Marker,
  Popup,
} from 'react-leaflet';
import L from 'leaflet';
import {
  CloudRain,
  Sun,
  Clock,
  LocateFixed,
  Search,
} from 'lucide-react';
import { IntersectionNode, RouteOption, RouteResponse, ShapFactor, RouteSegmentDetail } from '../types';
import { api } from '../services/api';
import { ShapModal } from './ShapModal';
import { MapAutoBounds } from './map/MapAutoBounds';
import { MapOverlay } from './map/MapOverlay';
import { ZoomControl } from './map/ZoomControl';
import { MapChrome, ThemeLayers, type MapTheme } from './map/MapChrome';
import { RiskLegend } from './map/RiskLegend';
import { Button } from './ui/Button';
import { Field, Select } from './ui/Field';
import { Surface } from './ui/Surface';
import { RiskPill } from './ui/RiskPill';
import { RiskMeter } from './ui/RiskMeter';
import { Disclosure } from './ui/Disclosure';
import { Sheet } from './ui/Sheet';
import { ErrorState, SkeletonBlock } from './ui/StateViews';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { cx } from '../lib/cx';
import { getRiskLevel, describeLighting, riskHex } from '../lib/risk';
import { DAYS, formatDuration, formatDistance, formatMeters, hour12, hour24, daypartOf, dayNote } from '../lib/format';

// Markers: flat discs with a ring. No glow, no drop shadow bloom.
const startIcon = new L.DivIcon({
  className: '',
  html: '<div style="background:#14b8a6;width:14px;height:14px;border-radius:9999px;border:2.5px solid #0f172a;box-shadow:0 0 0 1.5px #14b8a6"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const destIcon = new L.DivIcon({
  className: '',
  html: '<div style="background:#e2725b;width:14px;height:14px;border-radius:9999px;border:2.5px solid #0f172a;box-shadow:0 0 0 1.5px #e2725b"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const CASING = '#0b1220';
const ALT_ROUTE = '#4a5f78';

function LocateButton({ onLocate }: { onLocate: () => void }) {
  return (
    <button
      type="button"
      onClick={onLocate}
      aria-label="Fit route on screen"
      title="Fit route on screen"
      className="flex h-9 w-9 items-center justify-center rounded-control border border-line bg-surface/95 text-ink-2 shadow-lift backdrop-blur transition-colors hover:text-ink"
    >
      <LocateFixed className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

export const RouteFinder: React.FC = () => {
  const isMobile = useMediaQuery('(max-width: 1023px)');

  const [nodes, setNodes] = useState<IntersectionNode[]>([]);
  const [originNode, setOriginNode] = useState<string>('NODE_DHANMONDI_27');
  const [destNode, setDestNode] = useState<string>('NODE_GULSHAN_2');
  const [hour, setHour] = useState<number>(23);
  const [dayOfWeek, setDayOfWeek] = useState<string>('Friday');
  const [isRaining, setIsRaining] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('balanced');
  const [mapTheme, setMapTheme] = useState<MapTheme>('streets');
  const [fitToken, setFitToken] = useState<number>(0);

  const [selectedSegment, setSelectedSegment] = useState<RouteSegmentDetail | null>(null);
  // Keyed by road id, so a highlight survives re-selecting the same road.
  const [highlightedRoadId, setHighlightedRoadId] = useState<string | null>(null);
  const [shapFactors, setShapFactors] = useState<ShapFactor[]>([]);
  const [segmentConfidence, setSegmentConfidence] = useState<number | null>(null);
  const [isShapModalOpen, setIsShapModalOpen] = useState<boolean>(false);
  const [loadingShap, setLoadingShap] = useState<boolean>(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    async function loadNodes() {
      try {
        const res = await api.getNodes();
        setNodes(res.nodes);
      } catch (err) {
        console.error('Failed to load nodes:', err);
      }
    }
    loadNodes();
  }, []);

  // Origin and destination are arguments, not closure reads, so that changing
  // the search fields does not silently recompute before the user asks.
  const handleFindRoutes = useCallback(
    async (origin: string, dest: string) => {
      if (!origin || !dest) return;
      setLoading(true);
      setError(null);
      try {
        const data = await api.getRoutes(origin, dest, hour, dayOfWeek, isRaining ? 1 : 0);
        setRouteData(data);
        const hasBalanced = data.routes.some((r) => r.id === 'balanced');
        setSelectedRouteId(hasBalanced ? 'balanced' : data.routes[0]?.id || 'fastest');
      } catch (err) {
        console.error('Failed to compute route:', err);
        setError(
          'We could not calculate a route for this pair. Try a different start or destination.',
        );
      } finally {
        setLoading(false);
      }
    },
    [hour, dayOfWeek, isRaining],
  );

  // Travel conditions re-score the network, so results are refetched when they change.
  useEffect(() => {
    handleFindRoutes('NODE_DHANMONDI_27', 'NODE_GULSHAN_2');
  }, [handleFindRoutes]);

  const activeRoute = routeData?.routes.find((r) => r.id === selectedRouteId) || routeData?.routes[0];
  const altRoutes = useMemo(
    () => (routeData?.routes ?? []).filter((r) => r.id !== activeRoute?.id),
    [routeData, activeRoute],
  );

  // Fit to every option, so switching routes never leaves the map off-screen.
  const allRouteCoords = useMemo(
    () => (routeData?.routes ?? []).flatMap((r) => r.path_coordinates),
    [routeData],
  );

  const handleInspectSegment = async (seg: RouteSegmentDetail) => {
    setSelectedSegment(seg);
    setHighlightedRoadId(seg.road_id);
    setIsShapModalOpen(true);
    setLoadingShap(true);
    setSegmentConfidence(null);
    try {
      const res = await api.explainRisk(seg.road_id, hour, dayOfWeek, isRaining ? 1 : 0);
      setShapFactors(res.explanation_factors);
      // Use the confidence the API actually returned, not a placeholder.
      setSegmentConfidence(res.prediction?.confidence ?? null);
    } catch (err) {
      console.error('Failed to fetch SHAP factors:', err);
    } finally {
      setLoadingShap(false);
    }
  };

  const originName = nodes.find((n) => n.id === originNode)?.name ?? routeData?.origin_name ?? 'Origin';
  const destName = nodes.find((n) => n.id === destNode)?.name ?? routeData?.destination_name ?? 'Destination';
  const conditionsSummary = `${daypartOf(hour).label}, ${hour12(hour)}${isRaining ? ', rain' : ''}`;

  const routeSummary = activeRoute && (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-section font-semibold text-ink tracking-tight">{activeRoute.name}</h2>
          {activeRoute.is_recommended && (
            <span className="rounded-full bg-accent-wash px-2 py-0.5 text-meta font-medium text-accent">
              Suggested
            </span>
          )}
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-meta text-ink-2 tabular">
          <span>{formatDuration(activeRoute.total_time_min)}</span>
          <span aria-hidden="true">·</span>
          <span>{formatDistance(activeRoute.total_distance_km)}</span>
          <span aria-hidden="true">·</span>
          <span>{activeRoute.segments_count} segments</span>
        </p>
      </div>

      <RiskMeter score={activeRoute.average_risk_score} />

      {activeRoute.risk_reduction_pct > 0 ? (
        <p className="rounded-control border border-accent/25 bg-accent-wash px-3 py-2 text-meta text-ink-2">
          <span className="font-semibold text-accent">
            {activeRoute.risk_reduction_pct}% lower predicted risk
          </span>{' '}
          than the fastest route.
        </p>
      ) : (
        <p className="text-meta text-ink-3">Baseline risk for the direct route.</p>
      )}

      <RouteOptionList
        routes={routeData?.routes ?? []}
        selectedId={activeRoute.id}
        onSelect={(id) => {
          setSelectedRouteId(id);
          setFitToken((t) => t + 1);
        }}
      />

      <Disclosure summary="Route details" detail={`${activeRoute.segments_count} road segments`}>
        <ul className="space-y-1.5">
          {activeRoute.segments.map((seg, idx) => {
            const level = getRiskLevel(seg.risk_score);
            return (
              <li key={`${seg.road_id}-${idx}`}>
                <button
                  type="button"
                  onClick={() => handleInspectSegment(seg)}
                  className="w-full rounded-control border border-line bg-surface-2/40 p-3 text-left transition-colors hover:border-line-strong hover:bg-surface-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-body font-medium text-ink">{seg.road_name}</p>
                      <p className="mt-0.5 text-meta text-ink-3 tabular">
                        {formatMeters(seg.length_meters)} · {formatDuration(seg.travel_time_min)} ·{' '}
                        {describeLighting(seg.lighting_condition)}
                      </p>
                    </div>
                    <RiskPill score={seg.risk_score} variant="label" className={cx('shrink-0', level.text)} />
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </Disclosure>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 pb-8 pt-6 sm:px-6 lg:px-8">
      <h1 className="text-display font-semibold tracking-tight text-ink">Where are you going?</h1>
      <p className="mt-1 text-body text-ink-2">
        We compare the time and the risk, then let you choose.
      </p>

      {/* Search bar: the single most important control on the page. */}
      <Surface tone="panel" className="mt-5 p-4" raised>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="From">
            {(id) => (
              <Select id={id} value={originNode} onChange={(e) => setOriginNode(e.target.value)}>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.area} — {n.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label="To">
            {(id) => (
              <Select id={id} value={destNode} onChange={(e) => setDestNode(e.target.value)}>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.area} — {n.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Button
            variant="primary"
            size="lg"
            onClick={() => handleFindRoutes(originNode, destNode)}
            isLoading={loading}
            leftIcon={loading ? undefined : <Search className="h-4 w-4" aria-hidden="true" />}
            className="w-full sm:w-auto"
          >
            Find safe route
          </Button>
        </div>

        {/* Travel conditions are secondary: collapsed until asked for. */}
        <details className="group mt-3 border-t border-line pt-3">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-meta font-medium text-ink-2 transition-colors hover:text-ink">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Travel conditions</span>
            <span className="text-ink-3">— {conditionsSummary}</span>
            <svg
              viewBox="0 0 24 24"
              className="ml-auto h-3.5 w-3.5 transition-transform group-open:rotate-180"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </summary>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Field label="Leaving at" hint={`${daypartOf(hour).label}, ${hour24(hour)}`}>
              {(id) => (
                <Select id={id} value={hour} onChange={(e) => setHour(Number(e.target.value))}>
                  {[...Array(24)].map((_, h) => (
                    <option key={h} value={h}>
                      {hour12(h)} — {daypartOf(h).label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <Field label="Day" hint={dayNote(dayOfWeek) || undefined}>
              {(id) => (
                <Select id={id} value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}>
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                      {dayNote(d) ? ` (${dayNote(d)})` : ''}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <Field label="Weather" hint="Rain raises expected risk at night.">
              {() => (
                <button
                  type="button"
                  onClick={() => setIsRaining(!isRaining)}
                  aria-pressed={isRaining}
                  className={cx(
                    'flex h-10 w-full items-center gap-2 rounded-control border px-3 text-body transition-colors',
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
              )}
            </Field>
          </div>
        </details>
      </Surface>

      {error && (
        <ErrorState
          className="mt-4"
          description={error}
          onRetry={() => handleFindRoutes(originNode, destNode)}
        />
      )}

      {/* Desktop: map leads, panel beside it. Mobile: sheet over the map. */}
      {isMobile ? (
        <div className="mt-4">
          <div className="isolate z-[var(--z-map)] relative h-[58dvh] min-h-[380px] overflow-hidden rounded-card border border-line">
            {activeRoute ? (
              <MapContainer
                center={[23.77, 90.39]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <ThemeLayers theme={mapTheme} />
                <MapAutoBounds
                  coords={allRouteCoords}
                  key={fitToken}
                  padding={36}
                />

                {/* Alternatives first, so the selected route sits on top. */}
                {altRoutes.map((route) => (
                  <Polyline
                    key={`alt-${route.id}`}
                    positions={route.path_coordinates}
                    interactive={false}
                    pathOptions={{ color: ALT_ROUTE, weight: 3, opacity: 0.5, dashArray: '2,5' }}
                  />
                ))}

                <Marker position={activeRoute.path_coordinates[0]} icon={startIcon} />
                <Marker
                  position={activeRoute.path_coordinates[activeRoute.path_coordinates.length - 1]}
                  icon={destIcon}
                />
                {activeRoute.segments.map((seg, idx) => (
                  <Polyline
                    key={`${seg.road_id}-${idx}`}
                    positions={seg.coordinates}
                    pathOptions={{ color: CASING, weight: 9, opacity: 0.9 }}
                  />
                ))}
                {activeRoute.segments.map((seg, idx) => {
                  const highlighted = highlightedRoadId === seg.road_id;
                  return (
                    <Polyline
                      key={`${seg.road_id}-${idx}-c`}
                      positions={seg.coordinates}
                      eventHandlers={{ click: () => setHighlightedRoadId(seg.road_id) }}
                      pathOptions={{
                        color: highlighted ? '#2dd4bf' : riskHex(seg.risk_score),
                        weight: highlighted ? 8 : 5,
                        opacity: 0.95,
                      }}
                    />
                  );
                })}

                <MapOverlay className="left-3 top-3">
                  <ZoomControl />
                </MapOverlay>
              </MapContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <SkeletonBlock className="w-full px-6" />
              </div>
            )}

            <MapChrome theme={mapTheme} onThemeChange={setMapTheme} />

            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="absolute inset-x-3 bottom-[var(--map-action-inset)] z-[var(--z-map-chrome)] flex min-h-[52px] items-center justify-between gap-3 rounded-control border border-line-strong bg-surface/95 px-4 text-left shadow-lift backdrop-blur"
            >
              <span className="min-w-0">
                <span className="block truncate text-body font-semibold text-ink">
                  {activeRoute?.name ?? 'Route'}
                </span>
                <span className="block text-meta text-ink-2 tabular">
                  {activeRoute
                    ? `${formatDuration(activeRoute.total_time_min)} · ${formatDistance(activeRoute.total_distance_km)}`
                    : 'Calculating…'}
                </span>
              </span>
              {activeRoute && <RiskPill score={activeRoute.average_risk_score} />}
            </button>
          </div>

          {/* The legend is a key for the map colours, so it sits under the map at
              every size rather than being a desktop-only extra. */}
          <div className="mt-3">
            <RiskLegend />
          </div>

          <Sheet
            isOpen={sheetOpen}
            onClose={() => setSheetOpen(false)}
            title="Route"
            description={`${originName} to ${destName}`}
            footer={
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => {
                  setSheetOpen(false);
                  setFitToken((t) => t + 1);
                }}
              >
                Show on map
              </Button>
            }
          >
            {routeSummary}
          </Sheet>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="isolate z-[var(--z-map)] relative h-[calc(100dvh-16rem)] min-h-[560px] overflow-hidden rounded-card border border-line">
              {activeRoute ? (
                <MapContainer
                  center={[23.77, 90.39]}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                >
                  <ThemeLayers theme={mapTheme} />
                  <MapAutoBounds coords={allRouteCoords} key={fitToken} padding={40} />

                  {/* Alternatives first, so the selected route sits on top. */}
                  {altRoutes.map((route) => (
                    <Polyline
                      key={`alt-${route.id}`}
                      positions={route.path_coordinates}
                      interactive={false}
                      pathOptions={{ color: ALT_ROUTE, weight: 3, opacity: 0.5, dashArray: '2,5' }}
                    />
                  ))}

                  <Marker position={activeRoute.path_coordinates[0]} icon={startIcon}>
                    <Popup>
                      <p className="text-meta text-ink-2">Starting point</p>
                      <p className="text-body font-medium text-ink">{originName}</p>
                    </Popup>
                  </Marker>
                  <Marker
                    position={activeRoute.path_coordinates[activeRoute.path_coordinates.length - 1]}
                    icon={destIcon}
                  >
                    <Popup>
                      <p className="text-meta text-ink-2">Destination</p>
                      <p className="text-body font-medium text-ink">{destName}</p>
                    </Popup>
                  </Marker>

                  {activeRoute.segments.map((seg, idx) => (
                    <Polyline
                      key={`${seg.road_id}-${idx}`}
                      positions={seg.coordinates}
                      pathOptions={{ color: CASING, weight: 9, opacity: 0.9 }}
                    />
                  ))}
                  {activeRoute.segments.map((seg, idx) => {
                    const highlighted = highlightedRoadId === seg.road_id;
                    return (
                      <Polyline
                        key={`${seg.road_id}-${idx}-c`}
                        positions={seg.coordinates}
                        eventHandlers={{ click: () => setHighlightedRoadId(seg.road_id) }}
                        pathOptions={{
                          color: highlighted ? '#2dd4bf' : riskHex(seg.risk_score),
                          weight: highlighted ? 8 : 5.5,
                          opacity: 1,
                        }}
                      >
                        <Popup>
                          <div className="space-y-0.5">
                            <p className="text-body font-medium text-ink">{seg.road_name}</p>
                            <p className="text-meta text-ink-2 tabular">
                              {formatDuration(seg.travel_time_min)} · {formatMeters(seg.length_meters)}
                            </p>
                            <p className={cx('text-meta font-medium', getRiskLevel(seg.risk_score).text)}>
                              Risk {seg.risk_score}/100 · {getRiskLevel(seg.risk_score).label}
                            </p>
                          </div>
                        </Popup>
                      </Polyline>
                    );
                  })}

                  <MapOverlay className="left-3 top-3">
                    <ZoomControl />
                  </MapOverlay>
                </MapContainer>
              ) : (
                <div className="flex h-full items-center justify-center px-6">
                  <SkeletonBlock className="w-full" />
                </div>
              )}

              <MapChrome theme={mapTheme} onThemeChange={setMapTheme}>
                <LocateButton onLocate={() => setFitToken((t) => t + 1)} />
              </MapChrome>

              {/* Route name overlay: a label, not a badge. */}
              {activeRoute && (
                <div className="pointer-events-none absolute left-1/2 top-3 z-[var(--z-map-chrome)] -translate-x-1/2">
                  <div className="rounded-control border border-line bg-surface/95 px-3 py-1.5 text-center shadow-lift backdrop-blur">
                    <p className="text-meta font-medium text-ink">{activeRoute.name}</p>
                    <p className="text-meta text-ink-3 tabular">
                      {formatDuration(activeRoute.total_time_min)} ·{' '}
                      {formatDistance(activeRoute.total_distance_km)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <RiskLegend />
            </div>
          </div>

          <div className="lg:col-span-2">
            <Surface tone="panel" className="h-full p-5">
              {routeSummary ?? <SkeletonBlock />}
            </Surface>
          </div>
        </div>
      )}

      {selectedSegment && (
        <ShapModal
          isOpen={isShapModalOpen}
          onClose={() => setIsShapModalOpen(false)}
          roadName={selectedSegment.road_name}
          area={activeRoute?.label || 'Route segment'}
          riskScore={selectedSegment.risk_score}
          riskLevel={selectedSegment.risk_level}
          confidence={segmentConfidence ?? 0}
          confidenceKnown={segmentConfidence !== null}
          isLoading={loadingShap}
          factors={shapFactors}
        />
      )}
    </div>
  );
};

/* ---------------------------------------------------------------------------
   Route comparison: a compact list, not three dashboard cards.
   ------------------------------------------------------------------------- */

function RouteOptionList({
  routes,
  selectedId,
  onSelect,
}: {
  routes: RouteOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  if (routes.length === 0) return null;

  return (
    <fieldset className="space-y-2">
      <legend className="text-meta font-medium text-ink-2">Compare routes</legend>
      {routes.map((route) => {
        const selected = route.id === selectedId;
        return (
          <button
            key={route.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onSelect(route.id)}
            className={cx(
              'w-full rounded-card border p-3 text-left transition-colors',
              selected
                ? 'border-accent/45 bg-surface-2/70 shadow-soft'
                : 'border-line bg-surface-2/30 hover:border-line-strong hover:bg-surface-2/50',
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-body font-semibold text-ink">{route.label}</span>
              {selected ? (
                <span className="rounded-full bg-accent px-2 py-0.5 text-meta font-medium text-accent-ink">
                  Selected
                </span>
              ) : route.is_recommended ? (
                <span className="text-meta text-ink-3">Suggested</span>
              ) : null}
            </div>

            <p className="mt-1 text-meta text-ink-2 tabular">
              {formatDuration(route.total_time_min)} · {formatDistance(route.total_distance_km)}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <RiskPill score={route.average_risk_score} />
              {route.risk_reduction_pct > 0 && (
                <span className="text-meta text-ink-3 tabular">
                  {route.risk_reduction_pct}% lower predicted risk
                </span>
              )}
              {route.extra_time_min > 0 && (
                <span className="text-meta text-caution tabular">
                  +{route.extra_time_min} min
                </span>
              )}
            </div>
          </button>
        );
      })}
    </fieldset>
  );
}
