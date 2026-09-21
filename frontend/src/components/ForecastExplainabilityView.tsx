import React, { useState } from 'react';
import {
  Sparkles,
  Clock,
  Calendar,
  CloudRain,
  Sun,
  Send,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Search,
  ExternalLink
} from 'lucide-react';
import { AreaForecast, NlpExtractionResult } from '../types';
import { api } from '../services/api';

export const ForecastExplainabilityView: React.FC = () => {
  // Forecast state
  const [hour, setHour] = useState<number>(23);
  const [dayOfWeek, setDayOfWeek] = useState<string>('Friday');
  const [rain, setRain] = useState<boolean>(false);
  const [forecasts, setForecasts] = useState<AreaForecast[]>([]);
  const [loadingForecast, setLoadingForecast] = useState<boolean>(false);

  // NLP test state
  const [nlpText, setNlpText] = useState<string>(
    'A pedestrian was robbed by two motorcycle riders near Farmgate at around 11pm.'
  );
  const [nlpResult, setNlpResult] = useState<NlpExtractionResult | null>(null);
  const [loadingNlp, setLoadingNlp] = useState<boolean>(false);

  // Handle Fetch Forecast
  const handleFetchForecast = async () => {
    setLoadingForecast(true);
    try {
      const res = await api.getForecast(hour, dayOfWeek, rain ? 1 : 0);
      setForecasts(res.forecasts);
    } catch (err) {
      console.error('Failed to get forecast:', err);
    } finally {
      setLoadingForecast(false);
    }
  };

  // Run initial forecast
  React.useEffect(() => {
    handleFetchForecast();
  }, [hour, dayOfWeek, rain]);

  // Handle NLP Extraction
  const handleExtractNlp = async () => {
    if (!nlpText.trim()) return;
    setLoadingNlp(true);
    try {
      const res = await api.extractNlp(nlpText);
      setNlpResult(res);
    } catch (err) {
      console.error('Failed to extract NLP:', err);
    } finally {
      setLoadingNlp(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. Neighborhood Risk Forecast (Point 43 in document) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white">Area Risk Forecast</h2>
              <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-semibold">
                Point 43: 'What will the risk be tonight?'
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              The AI model aggregates road segment risk predictions for Dhaka neighborhoods at your specified time.
            </p>
          </div>

          {/* Temporal Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
            >
              {[...Array(24)].map((_, h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, '0')}:00 {h >= 21 || h <= 4 ? '(Night)' : ''}
                </option>
              ))}
            </select>

            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
            >
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <button
              onClick={() => setRain(!rain)}
              className={`p-2 rounded-xl border transition ${
                rain ? 'bg-blue-600/30 border-blue-500 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {rain ? <CloudRain className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Forecast Cards Grid (Matches Point 43 Mockup in PDF) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {forecasts.map(fc => (
            <div
              key={fc.area}
              className="bg-slate-800/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 transition"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-white text-xs sm:text-sm">{fc.area}</span>
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: fc.risk_color }}
                />
              </div>

              <div className="text-2xl font-black text-white">
                {fc.predicted_risk_score}
                <span className="text-xs font-normal text-slate-400"> / 100</span>
              </div>

              <span
                className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mt-2 border ${
                  fc.predicted_risk_score >= 75
                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                    : fc.predicted_risk_score >= 55
                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                    : fc.predicted_risk_score >= 35
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {fc.risk_level} RISK
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Interactive NLP News Extractor (Points 11-12 in document) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white">NLP News Extraction Pipeline</h2>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                Points 11–12
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Converts unstructured news headlines and police reports into structured geospatial incident records (English & Bangla).
            </p>
          </div>
        </div>

        {/* Sample Snippet Buttons */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs text-slate-400">Try Sample:</span>
          <button
            onClick={() => {
              setNlpText('A pedestrian was robbed by two motorcycle riders near Farmgate at around 11pm.');
            }}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 transition"
          >
            English: Farmgate robbery
          </button>
          <button
            onClick={() => {
              setNlpText('ধানমন্ডি ২৭ নম্বরে রাতে মোটরসাইকেল আরোহী ছিনতাইকারী এক পথচারীর ব্যাগ ও মোবাইল ছিনিয়ে নেয়।');
            }}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 transition"
          >
            বাংলা: ধানমন্ডি ২৭ ছিনতাই
          </button>
          <button
            onClick={() => {
              setNlpText('মিরপুর ১০ গোলচত্বরে রাতে ছুরির মুখে এক যাত্রীর টাকা ও মোবাইল ফোন লুট করেছে তিন ছিনতাইকারী।');
            }}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 transition"
          >
            বাংলা: মিরপুর ১০ ছিনতাই
          </button>
        </div>

        {/* Text Input Area */}
        <div className="space-y-3">
          <textarea
            value={nlpText}
            onChange={(e) => setNlpText(e.target.value)}
            rows={3}
            placeholder="Paste news headline or police statement in English or Bangla..."
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
          />

          <div className="flex justify-end">
            <button
              onClick={handleExtractNlp}
              disabled={loadingNlp}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl flex items-center space-x-1.5 transition shadow-lg shadow-emerald-600/20"
            >
              {loadingNlp ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Run NLP Extraction</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Extraction Output Card */}
        {nlpResult && (
          <div className="mt-5 pt-5 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-sm flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Extracted Incident Schema</span>
              </h4>
              <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                Confidence: {Math.round(nlpResult.extraction_confidence * 100)}%
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 block mb-0.5">Crime Type</span>
                <span className="font-bold text-white text-sm">{nlpResult.crime_type}</span>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 block mb-0.5">Location & Thana</span>
                <span className="font-bold text-emerald-400 text-sm">{nlpResult.location}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Thana: {nlpResult.thana}</span>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 block mb-0.5">Extracted Time</span>
                <span className="font-bold text-cyan-400 text-sm">{nlpResult.time}</span>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 block mb-0.5">Location Precision</span>
                <span className="font-bold text-purple-400 text-sm">{nlpResult.location_precision}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {nlpResult.is_usable_for_road_prediction ? 'Road-level usable' : 'Area-level only'}
                </span>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 block mb-0.5">Suspect Count</span>
                <span className="font-bold text-white text-sm">{nlpResult.suspect_count} perpetrators</span>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 block mb-0.5">Vehicle Used</span>
                <span className="font-bold text-white text-sm">{nlpResult.vehicle_used}</span>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 block mb-0.5">Weapon</span>
                <span className="font-bold text-white text-sm">{nlpResult.weapon}</span>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 block mb-0.5">Victim Category</span>
                <span className="font-bold text-white text-sm">{nlpResult.victim_type}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
