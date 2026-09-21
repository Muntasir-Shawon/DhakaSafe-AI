import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Navigation,
  Clock,
  Shield,
  ArrowRight,
  TrendingDown,
  CloudRain,
  Sun,
  Calendar,
  AlertTriangle,
  Sparkles,
  Info,
  CheckCircle,
  MapPin
} from 'lucide-react';
import { IntersectionNode, RouteOption, RouteResponse, ShapFactor, RouteSegmentDetail } from '../types';
import { api } from '../services/api';
import { ShapModal } from './ShapModal';

// Fix leaflet marker icon paths in React
const startIcon = new L.DivIcon({
  className: 'custom-start-marker',
  html: `<div style="background-color: #10b981; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(16,185,129,0.7);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

const destIcon = new L.DivIcon({
  className: 'custom-dest-marker',
  html: `<div style="background-color: #ef4444; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(239,68,68,0.7);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

// Helper component to auto-pan and fit bounds
function MapAutoBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 0) {
      const bounds = L.latLngBounds(coords.map(c => [c[0], c[1]]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [coords, map]);
  return null;
}

export const RouteFinder: React.FC = () => {
  const [nodes, setNodes] = useState<IntersectionNode[]>([]);
  const [originNode, setOriginNode] = useState<string>('NODE_DHANMONDI_27');
  const [destNode, setDestNode] = useState<string>('NODE_GULSHAN_2');
  const [hour, setHour] = useState<number>(23); // Default 11 PM
  const [dayOfWeek, setDayOfWeek] = useState<string>('Friday');
  const [isRaining, setIsRaining] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('balanced');
  const [mapTheme, setMapTheme] = useState<'streets' | 'satellite' | 'dark'>('streets');

  // Explainability Modal State
  const [selectedSegment, setSelectedSegment] = useState<RouteSegmentDetail | null>(null);
  const [shapFactors, setShapFactors] = useState<ShapFactor[]>([]);
  const [isShapModalOpen, setIsShapModalOpen] = useState<boolean>(false);
  const [loadingShap, setLoadingShap] = useState<boolean>(false);

  // Load available nodes on mount
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

  // Compute route handler
  const handleFindRoutes = async (origin = originNode, dest = destNode) => {
    if (!origin || !dest) return;
    setLoading(true);
    try {
      const data = await api.getRoutes(origin, dest, hour, dayOfWeek, isRaining ? 1 : 0);
      setRouteData(data);
      // Default to balanced route if available
      const hasBalanced = data.routes.some(r => r.id === 'balanced');
      setSelectedRouteId(hasBalanced ? 'balanced' : data.routes[0]?.id || 'fastest');
    } catch (err) {
      console.error('Failed to compute route:', err);
    } finally {
      setLoading(false);
    }
  };

  // Run on mount
  useEffect(() => {
    handleFindRoutes('NODE_DHANMONDI_27', 'NODE_GULSHAN_2');
  }, [hour, dayOfWeek, isRaining]);

  const activeRoute = routeData?.routes.find(r => r.id === selectedRouteId) || routeData?.routes[0];

  // Inspect SHAP factors for a segment
  const handleInspectSegment = async (seg: RouteSegmentDetail) => {
    setSelectedSegment(seg);
    setIsShapModalOpen(true);
    setLoadingShap(true);
    try {
      const res = await api.explainRisk(seg.road_id, hour, dayOfWeek, isRaining ? 1 : 0);
      setShapFactors(res.explanation_factors);
    } catch (err) {
      console.error('Failed to fetch SHAP factors:', err);
    } finally {
      setLoadingShap(false);
    }
  };

  const getRiskBadgeColor = (risk: number) => {
    if (risk >= 80) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (risk >= 60) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    if (risk >= 35) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner / Commute Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2">
              <span>Risk-Aware Route Navigator</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                AI + Graph Dijkstra
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Navigation that optimizes for travel time while proactively circumventing high-theft corridors.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Popular:</span>
            <button
              onClick={() => {
                setOriginNode('NODE_DHANMONDI_27');
                setDestNode('NODE_GULSHAN_2');
                handleFindRoutes('NODE_DHANMONDI_27', 'NODE_GULSHAN_2');
              }}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-700 transition"
            >
              Dhanmondi 27 → Gulshan 2
            </button>
            <button
              onClick={() => {
                setOriginNode('NODE_MIRPUR_10');
                setDestNode('NODE_FARMGATE');
                handleFindRoutes('NODE_MIRPUR_10', 'NODE_FARMGATE');
              }}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-700 transition"
            >
              Mirpur 10 → Farmgate
            </button>
            <button
              onClick={() => {
                setOriginNode('NODE_UTTARA_HOUSE');
                setDestNode('NODE_MOHAKHALI');
                handleFindRoutes('NODE_UTTARA_HOUSE', 'NODE_MOHAKHALI');
              }}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-700 transition"
            >
              Uttara → Mohakhali
            </button>
          </div>
        </div>

        {/* Input Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-800/80">
          {/* Origin */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 flex items-center space-x-1">
              <MapPin className="h-3.5 w-3.5 text-emerald-400" />
              <span>From (Origin)</span>
            </label>
            <select
              value={originNode}
              onChange={(e) => setOriginNode(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
            >
              {nodes.map(n => (
                <option key={n.id} value={n.id}>
                  {n.area} - {n.name}
                </option>
              ))}
            </select>
          </div>

          {/* Destination */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 flex items-center space-x-1">
              <MapPin className="h-3.5 w-3.5 text-red-400" />
              <span>To (Destination)</span>
            </label>
            <select
              value={destNode}
              onChange={(e) => setDestNode(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
            >
              {nodes.map(n => (
                <option key={n.id} value={n.id}>
                  {n.area} - {n.name}
                </option>
              ))}
            </select>
          </div>

          {/* Departure Time */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 flex items-center space-x-1">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span>Time of Travel ({String(hour).padStart(2, '0')}:00)</span>
            </label>
            <select
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
            >
              {[...Array(24)].map((_, h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, '0')}:00 {h >= 21 || h <= 4 ? '🌙 (Night High Risk)' : [8, 9, 18, 19].includes(h) ? '🚗 (Rush Hour)' : '☀️ (Day)'}
                </option>
              ))}
            </select>
          </div>

          {/* Day of Week */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 flex items-center space-x-1">
              <Calendar className="h-3.5 w-3.5 text-purple-400" />
              <span>Day</span>
            </label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition"
            >
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                <option key={d} value={d}>
                  {d} {d === 'Friday' ? '(Weekend Spike)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Rain & Submit Button */}
          <div className="flex items-end space-x-2">
            <button
              type="button"
              onClick={() => setIsRaining(!isRaining)}
              className={`p-2.5 rounded-xl border flex items-center justify-center transition ${
                isRaining
                  ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title={isRaining ? 'Weather: Rain active (+risk)' : 'Weather: Clear'}
            >
              {isRaining ? <CloudRain className="h-5 w-5 text-blue-400" /> : <Sun className="h-5 w-5 text-amber-400" />}
            </button>

            <button
              onClick={() => handleFindRoutes()}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-xl py-2 px-3 text-sm flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Navigation className="h-4 w-4" />
                  <span>Navigate</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Route Alternatives Cards (Fastest, Balanced, Safest) */}
      {routeData && routeData.routes && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {routeData.routes.map(route => {
            const isSelected = route.id === selectedRouteId;
            return (
              <div
                key={route.id}
                onClick={() => setSelectedRouteId(route.id)}
                className={`relative rounded-2xl p-4 cursor-pointer border transition-all ${
                  isSelected
                    ? 'bg-slate-900 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                }`}
              >
                {route.is_recommended && (
                  <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md">
                    RECOMMENDED
                  </div>
                )}

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: route.color }}
                    />
                    <h3 className="font-bold text-white text-base">{route.name}</h3>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getRiskBadgeColor(route.average_risk_score)}`}>
                    Risk {route.average_risk_score}/100
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-3 bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-400 block">Est. Travel Time</span>
                    <span className="text-white font-bold text-sm">{route.total_time_min} mins</span>
                    {route.extra_time_min > 0 && (
                      <span className="text-amber-400 text-[11px] block">(+{route.extra_time_min} min detour)</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block">Distance</span>
                    <span className="text-white font-bold text-sm">{route.total_distance_km} km</span>
                  </div>
                </div>

                {/* Risk Reduction Badge */}
                {route.risk_reduction_pct > 0 ? (
                  <div className="flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
                    <TrendingDown className="h-4 w-4 shrink-0" />
                    <span className="font-semibold">
                      {route.risk_reduction_pct}% lower predicted theft risk
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 bg-slate-800/40 px-2.5 py-1.5 rounded-lg border border-slate-800">
                    Direct route with standard baseline risk
                  </div>
                )}

                <p className="text-xs text-slate-400 mt-2.5 line-clamp-2">
                  {route.description}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Interactive Map & Turn-by-Turn Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View */}
        <div
          className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative h-[480px]"
          style={{ minHeight: '480px' }}
        >
          {activeRoute && activeRoute.path_coordinates.length > 0 ? (
            <MapContainer
              center={[23.77, 90.39]}
              zoom={13}
              style={{ height: '100%', width: '100%', backgroundColor: '#0f172a' }}
              zoomControl={true}
            >
              {mapTheme === 'streets' && (
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maxZoom={19}
                />
              )}
              {mapTheme === 'satellite' && (
                <TileLayer
                  attribution='&copy; Esri, Maxar, Earthstar Geographics'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={19}
                />
              )}
              {mapTheme === 'dark' && (
                <>
                  <TileLayer
                    attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                    maxZoom={16}
                  />
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
                    maxZoom={16}
                    opacity={0.8}
                  />
                </>
              )}

              <MapAutoBounds coords={activeRoute.path_coordinates} />

              {/* Start Marker */}
              {activeRoute.path_coordinates[0] && (
                <Marker position={activeRoute.path_coordinates[0]} icon={startIcon}>
                  <Popup>
                    <div className="text-xs font-bold text-slate-800">
                      Origin: {routeData?.origin_name}
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Destination Marker */}
              {activeRoute.path_coordinates[activeRoute.path_coordinates.length - 1] && (
                <Marker position={activeRoute.path_coordinates[activeRoute.path_coordinates.length - 1]} icon={destIcon}>
                  <Popup>
                    <div className="text-xs font-bold text-slate-800">
                      Destination: {routeData?.destination_name}
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Route Segments with Casing and Risk Colors */}
              {activeRoute.segments.map((seg, idx) => (
                <React.Fragment key={`${seg.road_id}-${idx}`}>
                  {/* High contrast dark casing line */}
                  <Polyline
                    positions={seg.coordinates}
                    pathOptions={{
                      color: '#090d16',
                      weight: 9,
                      opacity: 0.95
                    }}
                  />
                  {/* Colored Risk Line */}
                  <Polyline
                    positions={seg.coordinates}
                    pathOptions={{
                      color: seg.risk_color || activeRoute.color,
                      weight: 6,
                      opacity: 1.0
                    }}
                  >
                    <Popup>
                      <div className="p-1 space-y-1 text-xs">
                        <div className="font-bold text-slate-900">{seg.road_name}</div>
                        <div className="text-slate-600">Travel: {seg.travel_time_min} mins ({seg.length_meters}m)</div>
                        <div className="font-semibold text-orange-600">Predicted Risk: {seg.risk_score}/100</div>
                      </div>
                    </Popup>
                  </Polyline>
                </React.Fragment>
              ))}
            </MapContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              Calculating optimal route...
            </div>
          )}

          {/* Map Overlay Badge */}
          <div className="absolute top-4 left-4 z-[400] bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 shadow-lg text-xs">
            <span className="text-slate-400">Viewing Route: </span>
            <span className="text-white font-bold">{activeRoute?.name}</span>
          </div>

          {/* Map Theme Toggle Switcher */}
          <div className="absolute top-4 right-4 z-[400] bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700 shadow-lg flex space-x-1 text-xs">
            <button
              onClick={() => setMapTheme('streets')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                mapTheme === 'streets'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🗺️ Color Map
            </button>
            <button
              onClick={() => setMapTheme('satellite')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                mapTheme === 'satellite'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🛰️ Satellite
            </button>
            <button
              onClick={() => setMapTheme('dark')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                mapTheme === 'dark'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🌙 Dark
            </button>
          </div>
        </div>

        {/* Segment Details & SHAP Explainability Inspector */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-[480px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div>
              <h3 className="font-bold text-white text-sm">Route Segments</h3>
              <p className="text-xs text-slate-400">{activeRoute?.segments_count} road segments traversed</p>
            </div>
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700">
              Click to Inspect SHAP
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {activeRoute?.segments.map((seg, idx) => (
              <div
                key={idx}
                onClick={() => handleInspectSegment(seg)}
                className="bg-slate-800/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl p-3 cursor-pointer transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-white text-xs sm:text-sm">
                      {seg.road_name}
                    </h4>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{seg.length_meters}m</span>
                      <span>•</span>
                      <span>{seg.travel_time_min} mins</span>
                      <span>•</span>
                      <span>Lighting: {seg.lighting_condition}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${getRiskBadgeColor(seg.risk_score)}`}>
                      {seg.risk_score}/100
                    </span>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Factor breakdown:</span>
                  <span className="text-purple-400 hover:text-purple-300 font-medium flex items-center space-x-1">
                    <Sparkles className="h-3 w-3" />
                    <span>Explain AI Factors</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SHAP Modal */}
      {selectedSegment && (
        <ShapModal
          isOpen={isShapModalOpen}
          onClose={() => setIsShapModalOpen(false)}
          roadName={selectedSegment.road_name}
          area={activeRoute?.label || 'Route Segment'}
          riskScore={selectedSegment.risk_score}
          riskLevel={selectedSegment.risk_level}
          confidence={88}
          factors={shapFactors}
        />
      )}
    </div>
  );
};
