import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Clock,
  MapPin,
  Shield,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { AnalyticsSummary, Hotspot } from '../types';
import { api } from '../services/api';

export const AnalyticsView: React.FC = () => {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [aRes, hRes] = await Promise.all([
          api.getAnalytics(),
          api.getHotspots()
        ]);
        setData(aRes);
        setHotspots(hRes.hotspots);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400 text-sm">
        Aggregating city-wide crime data...
      </div>
    );
  }

  const maxHourCount = data ? Math.max(...data.hourly_distribution.map(h => h.count), 1) : 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2">
              <span>Dhaka Crime Analytics & Hotspots</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                Points 30–33
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Aggregated insights across {data?.summary.total_incidents.toLocaleString()} reported street theft incidents ({data?.summary.date_range}).
            </p>
          </div>
          <div className="text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
            Note: Reflects reported incident density (news & police blotters).
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Total Reported Cases</span>
            <span className="text-2xl font-bold text-white">{data?.summary.total_incidents.toLocaleString()}</span>
            <span className="text-[11px] text-emerald-400 block mt-1">Multi-layer validated</span>
          </div>

          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Peak Snatching Hours</span>
            <span className="text-xl font-bold text-amber-400">{data?.summary.peak_risk_window}</span>
            <span className="text-[11px] text-slate-400 block mt-1">Night & evening surge</span>
          </div>

          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Primary Crime Type</span>
            <span className="text-xl font-bold text-red-400">{data?.summary.most_common_crime}</span>
            <span className="text-[11px] text-slate-400 block mt-1">45% of total events</span>
          </div>

          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Highest Density Hub</span>
            <span className="text-xl font-bold text-white">{data?.summary.top_affected_hub}</span>
            <span className="text-[11px] text-slate-400 block mt-1">High transit choke point</span>
          </div>
        </div>
      </div>

      {/* Charts Grid: Hourly Distribution & Crime Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Distribution (Point 31 in doc) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-cyan-400" />
                  <span>Time Analysis: Incidents by Hour</span>
                </h3>
                <p className="text-xs text-slate-400">Distribution of street crimes across the 24-hour cycle</p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Point 31
              </span>
            </div>

            <div className="h-48 flex items-end space-x-1.5 pt-4">
              {data?.hourly_distribution.map(item => {
                const heightPct = Math.max(10, Math.round((item.count / maxHourCount) * 100));
                const isNightPeak = item.hour >= 20 || item.hour <= 2;
                return (
                  <div key={item.hour} className="flex-1 flex flex-col items-center group relative">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-sm transition-all ${
                        isNightPeak
                          ? 'bg-gradient-to-t from-orange-600 to-red-500 group-hover:brightness-125'
                          : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    />
                    <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-950 text-white text-[10px] p-1.5 rounded-md border border-slate-700 whitespace-nowrap z-50">
                      <strong>{item.label}</strong>: {item.count} incidents
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-2 px-1">
              <span>00:00 (Midnight)</span>
              <span>06:00</span>
              <span>12:00 (Noon)</span>
              <span>18:00 (Eve)</span>
              <span>23:00</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span>Orange/Red indicates elevated nighttime risk window</span>
            </div>
          </div>
        </div>

        {/* Crime Type Breakdown (Point 32 in doc) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span>Crime Type Breakdown</span>
              </h3>
              <p className="text-xs text-slate-400">Validated street crime categories in Dhaka metropolitan</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Point 32
            </span>
          </div>

          <div className="space-y-3.5">
            {data?.crime_types.map(ct => (
              <div key={ct.crime_type} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{ct.crime_type}</span>
                  <span className="text-slate-400">
                    {ct.count} incidents ({ct.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${ct.percentage}%` }}
                    className={`h-full rounded-full transition-all ${
                      ct.crime_type === 'Snatching'
                        ? 'bg-red-500'
                        : ct.crime_type === 'Robbery'
                        ? 'bg-orange-500'
                        : ct.crime_type === 'Mugging'
                        ? 'bg-amber-500'
                        : ct.crime_type === 'Theft'
                        ? 'bg-cyan-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Weapons & Escape Vehicles */}
          <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block font-semibold mb-1">Prevalent Weapons</span>
              <ul className="space-y-1 text-slate-300">
                {data?.weapons.slice(0, 3).map((w, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span>{w.weapon}</span>
                    <span className="text-slate-400 font-mono">{w.count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold mb-1">Common Transit</span>
              <ul className="space-y-1 text-slate-300">
                {data?.vehicles.slice(0, 3).map((v, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span>{v.vehicle}</span>
                    <span className="text-slate-400 font-mono">{v.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* DBSCAN Hotspots Table & Top Thanas (Point 33 in doc) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hotspots Cluster Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Layers className="h-4 w-4 text-purple-400" />
                <span>Spatial Hotspot Clusters (DBSCAN / KDE)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Point 33: Statistically concentrated incident clusters derived from geographic density
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
              Point 33
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Hub / Area</th>
                  <th className="py-2.5 px-3">Thana</th>
                  <th className="py-2.5 px-3">Incidents</th>
                  <th className="py-2.5 px-3">Cluster Radius</th>
                  <th className="py-2.5 px-3">Peak Hours</th>
                  <th className="py-2.5 px-3 rounded-r-lg">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {hotspots.map((h, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-semibold text-white">{h.area}</td>
                    <td className="py-2.5 px-3 text-slate-400">{h.thana}</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-400">{h.incident_count}</td>
                    <td className="py-2.5 px-3 text-slate-400">{h.radius_meters}m</td>
                    <td className="py-2.5 px-3 text-slate-300">{h.peak_hours}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-bold px-2 py-0.5 rounded-md text-[10px] ${
                          h.severity === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        }`}
                      >
                        {h.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Thanas Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h3 className="text-base font-bold text-white mb-1">Police Jurisdictions</h3>
          <p className="text-xs text-slate-400 mb-4">Ranked by volume of reported street theft cases</p>

          <div className="space-y-2.5">
            {data?.top_thanas.slice(0, 8).map((t, i) => (
              <div
                key={t.thana}
                className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-slate-500 text-[11px]">#{i + 1}</span>
                  <span className="font-semibold text-slate-200">{t.thana} Thana</span>
                </div>
                <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {t.count} cases
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
