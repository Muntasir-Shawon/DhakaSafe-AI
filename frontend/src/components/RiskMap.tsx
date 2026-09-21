import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Circle, Popup, Marker } from 'react-leaflet';
import L from 'leaflet';
import {
  Clock,
  Play,
  Pause,
  CloudRain,
  Sun,
  Layers,
  Sparkles,
  AlertTriangle,
  Info,
  Calendar,
  X,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { RoadSegment, Hotspot, RoadTimelinePoint, ShapFactor } from '../types';
import { api } from '../services/api';
import { ShapModal } from './ShapModal';

export const RiskMap: React.FC = () => {
  const [hour, setHour] = useState<number>(22);
  const [dayOfWeek, setDayOfWeek] = useState<string>('Friday');
  const [isRaining, setIsRaining] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const [roads, setRoads] = useState<RoadSegment[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [showHotspots, setShowHotspots] = useState<boolean>(true);
  const [showRoads, setShowRoads] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  // Inspector state
  const [inspectedRoad, setInspectedRoad] = useState<RoadSegment | null>(null);
  const [roadTimeline, setRoadTimeline] = useState<RoadTimelinePoint[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState<boolean>(false);

  // SHAP modal state
  const [isShapOpen, setIsShapOpen] = useState<boolean>(false);
  const [shapFactors, setShapFactors] = useState<ShapFactor[]>([]);

  // Fetch roads with dynamic risk
  const fetchRoads = async (h = hour, dow = dayOfWeek, rain = isRaining) => {
    try {
      const res = await api.getRoadsWithRisk(h, dow, rain ? 1 : 0);
      setRoads(res.roads);
    } catch (err) {
      console.error('Failed to fetch roads:', err);
    }
  };

  // Fetch hotspots once
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

  // Fetch on hour/day/rain change
  useEffect(() => {
    fetchRoads(hour, dayOfWeek, isRaining);
  }, [hour, dayOfWeek, isRaining]);

  // Auto-play time slider simulation (Dynamic Risk demonstration)
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setHour(prev => (prev + 1) % 24);
      }, 1400);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Handle clicking a road segment
  const handleRoadClick = async (road: RoadSegment) => {
    setInspectedRoad(road);
    setLoadingTimeline(true);
    try {
      const res = await api.getRoadTimeline(road.road_id, dayOfWeek, isRaining ? 1 : 0);
      setRoadTimeline(res.timeline);
    } catch (err) {
      console.error('Failed to fetch timeline:', err);
    } finally {
      setLoadingTimeline(false);
    }
  };

  // Inspect SHAP
  const handleOpenShap = async () => {
    if (!inspectedRoad) return;
    setIsShapOpen(true);
    try {
      const res = await api.explainRisk(inspectedRoad.road_id, hour, dayOfWeek, isRaining ? 1 : 0);
      setShapFactors(res.explanation_factors);
    } catch (err) {
      console.error('Failed to explain risk:', err);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return '#ef4444'; // Red
    if (score >= 60) return '#f97316'; // Orange
    if (score >= 35) return '#eab308'; // Yellow
    return '#10b981'; // Green
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header and Spatio-Temporal Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2">
              <span>Spatio-Temporal Dynamic Risk Map</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                Point 6: Dynamic Scrubber
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Risk is not static. Scrub through hours to observe how street theft probabilities evolve across Dhaka.
            </p>
          </div>

          {/* Layer and Weather Toggles */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowHotspots(!showHotspots)}
              className={`text-xs px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 transition ${
                showHotspots
                  ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Hotspot Clusters</span>
            </button>

            <button
              onClick={() => setIsRaining(!isRaining)}
              className={`text-xs px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 transition ${
                isRaining
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {isRaining ? <CloudRain className="h-3.5 w-3.5 text-blue-400" /> : <Sun className="h-3.5 w-3.5 text-amber-400" />}
              <span>{isRaining ? 'Rain Active (+Risk)' : 'Clear Sky'}</span>
            </button>
          </div>
        </div>

        {/* 24-Hour Slider Bar */}
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="h-8 w-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition shadow-md shadow-emerald-600/30"
                title={isPlaying ? 'Pause timeline animation' : 'Play 24-hour simulation'}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
              </button>

              <div>
                <span className="text-white font-bold text-base sm:text-lg">
                  {String(hour).padStart(2, '0')}:00{' '}
                  <span className="text-xs font-normal text-slate-400">
                    ({hour >= 12 ? (hour === 12 ? 12 : hour - 12) + ' PM' : (hour === 0 ? 12 : hour) + ' AM'})
                  </span>
                </span>
                <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                  {hour >= 21 || hour <= 4 ? '🌙 Late Night (Peak Risk)' : [8, 9, 18, 19].includes(hour) ? '🚗 Rush Hour' : '☀️ Daytime'}
                </span>
              </div>
            </div>

            {/* Day of Week */}
            <div className="flex items-center space-x-1 text-xs">
              <Calendar className="h-3.5 w-3.5 text-purple-400" />
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                  <option key={d} value={d}>
                    {d} {d === 'Friday' ? '(Weekend Peak)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <input
            type="range"
            min="0"
            max="23"
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />

          <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 px-0.5">
            <span>00:00 (Midnight)</span>
            <span>06:00 (Dawn)</span>
            <span>12:00 (Noon)</span>
            <span>18:00 (Evening)</span>
            <span>23:00 (Night)</span>
          </div>
        </div>

        {/* Risk Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-800 text-xs">
          <div className="flex items-center space-x-4">
            <span className="text-slate-400 font-medium">Risk Legend:</span>
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-300">Low (0–34)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-300">Medium (35–59)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
              <span className="text-slate-300">High (60–79)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span className="text-slate-300">Very High (80–100)</span>
            </div>
          </div>

          <div className="text-slate-400 text-[11px]">
            Showing <span className="text-white font-semibold">{roads.length}</span> road segments across Dhaka
          </div>
        </div>
      </div>

      {/* Main Map & Road Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaflet Map */}
        <div className={`bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative h-[520px] ${inspectedRoad ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <MapContainer
            center={[23.77, 90.39]}
            zoom={12}
            style={{ height: '100%', width: '100%', backgroundColor: '#0f172a' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {/* Hotspots Layer */}
            {showHotspots && hotspots.map((h, i) => (
              <Circle
                key={`hotspot-${i}`}
                center={[h.center_lat, h.center_lon]}
                radius={h.radius_meters}
                pathOptions={{
                  color: h.color,
                  fillColor: h.color,
                  fillOpacity: 0.15,
                  weight: 1.5,
                  dashArray: '4, 4'
                }}
              >
                <Popup>
                  <div className="p-1 space-y-1 text-xs">
                    <div className="font-bold text-slate-900">{h.area} Crime Cluster</div>
                    <div className="text-slate-600">Reported Incidents: <strong>{h.incident_count}</strong></div>
                    <div className="text-slate-600">Primary: {h.primary_crime}</div>
                    <div className="text-red-600 font-semibold">Severity: {h.severity}</div>
                  </div>
                </Popup>
              </Circle>
            ))}

            {/* Road Segments */}
            {showRoads && roads.map(road => {
              const isSelected = inspectedRoad?.road_id === road.road_id;
              return (
                <Polyline
                  key={road.road_id}
                  positions={road.coordinates}
                  eventHandlers={{
                    click: () => handleRoadClick(road)
                  }}
                  pathOptions={{
                    color: isSelected ? '#38bdf8' : road.risk_color,
                    weight: isSelected ? 8 : 5,
                    opacity: isSelected ? 1.0 : 0.85
                  }}
                >
                  <Popup>
                    <div className="p-1 space-y-1 text-xs">
                      <div className="font-bold text-slate-900">{road.road_name}</div>
                      <div className="text-slate-600">{road.area} ({road.thana})</div>
                      <div className="font-semibold text-orange-600">
                        Predicted Risk: {road.risk_score}/100 ({road.risk_level})
                      </div>
                      <div className="text-emerald-700">Confidence: {road.confidence}%</div>
                    </div>
                  </Popup>
                </Polyline>
              );
            })}
          </MapContainer>

          <div className="absolute top-4 left-4 z-[400] bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 shadow-lg text-xs flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-300">Live Spatial Inference</span>
          </div>
        </div>

        {/* Road Inspector Drawer (Point 5 & 44 in document) */}
        {inspectedRoad && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col justify-between h-[520px] overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Road Inspector
                  </span>
                  <h3 className="font-bold text-white text-base leading-snug">
                    {inspectedRoad.road_name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {inspectedRoad.area} • Thana: {inspectedRoad.thana}
                  </p>
                </div>
                <button
                  onClick={() => setInspectedRoad(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Road Risk Score Badge */}
              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Predicted Theft Risk</span>
                  <span className="text-2xl font-black text-white">
                    {inspectedRoad.risk_score} <span className="text-sm font-normal text-slate-400">/ 100</span>
                  </span>
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 border ${
                      inspectedRoad.risk_score >= 80
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : inspectedRoad.risk_score >= 60
                        ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                        : inspectedRoad.risk_score >= 35
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {inspectedRoad.risk_level} RISK
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Data Confidence</span>
                  <span className="text-sm font-bold text-emerald-400">{inspectedRoad.confidence}%</span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    {inspectedRoad.historical_incidents} incidents recorded
                  </span>
                </div>
              </div>

              {/* Environmental Specs */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Street Lighting</span>
                  <span className="font-semibold text-white">{inspectedRoad.lighting_condition}</span>
                </div>
                <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Transit Stops</span>
                  <span className="font-semibold text-white">{inspectedRoad.bus_stops_count} Bus Stops</span>
                </div>
                <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Length</span>
                  <span className="font-semibold text-white">{inspectedRoad.length_meters}m</span>
                </div>
                <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Police Posts</span>
                  <span className="font-semibold text-white">{inspectedRoad.police_stations_nearby} Nearby</span>
                </div>
              </div>

              {/* 24-Hour Diurnal Timeline (Point 44 in document) */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center space-x-1.5">
                  <Clock className="h-3.5 w-3.5 text-cyan-400" />
                  <span>24-Hour Diurnal Risk Timeline</span>
                </h4>

                {loadingTimeline ? (
                  <div className="text-xs text-slate-400 py-4 text-center">Loading timeline curve...</div>
                ) : (
                  <div className="h-24 flex items-end space-x-1 bg-slate-800/40 p-2 rounded-xl border border-slate-800">
                    {roadTimeline.map((pt, i) => {
                      const heightPct = Math.max(12, pt.risk_score);
                      const isCurrent = pt.hour === hour;
                      return (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center group relative cursor-pointer"
                          onClick={() => setHour(pt.hour)}
                        >
                          <div
                            style={{ height: `${heightPct}%`, backgroundColor: getRiskColor(pt.risk_score) }}
                            className={`w-full rounded-t-sm transition-all ${isCurrent ? 'ring-2 ring-white' : 'opacity-80 hover:opacity-100'}`}
                          />
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-950 text-white text-[10px] p-1 rounded border border-slate-700 whitespace-nowrap z-50">
                            {pt.time_label}: Risk {pt.risk_score}/100
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>00:00</span>
                  <span>06:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                  <span>23:00</span>
                </div>
              </div>
            </div>

            {/* Explain with SHAP Action Button */}
            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={handleOpenShap}
                className="w-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 hover:border-purple-500/60 font-medium text-xs py-2.5 rounded-xl flex items-center justify-center space-x-2 transition shadow-lg shadow-purple-600/10"
              >
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span>Explain Why AI Gave This Risk (SHAP)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SHAP Modal */}
      {inspectedRoad && (
        <ShapModal
          isOpen={isShapOpen}
          onClose={() => setIsShapOpen(false)}
          roadName={inspectedRoad.road_name}
          area={inspectedRoad.area}
          riskScore={inspectedRoad.risk_score}
          riskLevel={inspectedRoad.risk_level}
          confidence={inspectedRoad.confidence}
          factors={shapFactors}
        />
      )}
    </div>
  );
};
