import {
  IntersectionNode,
  RoadSegment,
  RouteResponse,
  CrimeIncident,
  Hotspot,
  ShapFactor,
  RoadTimelinePoint,
  AreaForecast,
  AnalyticsSummary,
  NlpExtractionResult
} from '../types';
import {
  getClientSideRoadsWithRisk,
  getClientSideHotspots,
  getClientSideRoadTimeline,
  getClientSideShapFactors
} from '../lib/riskFallback';
import roadNetworkData from '../data/dhaka_road_network.json';

function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL as string;
  }
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://127.0.0.1:8000/api';
    }
  }
  return 'https://dhakasafe-ai-backend.onrender.com/api';
}

const API_BASE_URL = getApiBaseUrl();

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API error ${res.status}: ${errorText}`);
  }
  return res.json();
}

export const api = {
  // Navigation nodes
  async getNodes(): Promise<{ nodes: IntersectionNode[]; total: number }> {
    try {
      const data = await fetchJson<{ nodes: IntersectionNode[]; total: number }>(`${API_BASE_URL}/nodes`);
      if (data && data.nodes && data.nodes.length > 0) return data;
    } catch (err) {
      console.warn('Backend /nodes endpoint unavailable, using bundled road network nodes:', err);
    }
    const nodes = Object.values(roadNetworkData.nodes) as unknown as IntersectionNode[];
    return { nodes, total: nodes.length };
  },

  // Calculate routes (Fastest, Balanced, Safest)
  async getRoutes(
    originNode?: string,
    destNode?: string,
    hour: number = 22,
    dayOfWeek: string = 'Friday',
    rain: number = 0,
    originLat?: number,
    originLon?: number,
    destLat?: number,
    destLon?: number
  ): Promise<RouteResponse> {
    return fetchJson(`${API_BASE_URL}/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin_node: originNode,
        destination_node: destNode,
        origin_lat: originLat,
        origin_lon: originLon,
        dest_lat: destLat,
        dest_lon: destLon,
        hour,
        day_of_week: dayOfWeek,
        rain
      })
    });
  },

  // Dynamic road risk map
  async getRoadsWithRisk(
    hour: number = 22,
    dayOfWeek: string = 'Friday',
    rain: number = 0
  ): Promise<{ hour: number; day_of_week: string; rain: boolean; total_roads: number; roads: RoadSegment[] }> {
    try {
      const data = await fetchJson<{ hour: number; day_of_week: string; rain: boolean; total_roads: number; roads: RoadSegment[] }>(
        `${API_BASE_URL}/roads?hour=${hour}&day_of_week=${encodeURIComponent(dayOfWeek)}&rain=${rain}`
      );
      if (data && data.roads && data.roads.length > 0) return data;
    } catch (err) {
      console.warn('Backend /roads endpoint unavailable, calculating client-side road risk map:', err);
    }
    return getClientSideRoadsWithRisk(hour, dayOfWeek, rain);
  },

  // Road timeline (24-hour diurnal curve)
  async getRoadTimeline(
    roadId: string,
    dayOfWeek: string = 'Friday',
    rain: number = 0
  ): Promise<{ road_id: string; road_name: string; area: string; thana: string; timeline: RoadTimelinePoint[] }> {
    try {
      const data = await fetchJson<{ road_id: string; road_name: string; area: string; thana: string; timeline: RoadTimelinePoint[] }>(
        `${API_BASE_URL}/road/${roadId}/timeline?day_of_week=${encodeURIComponent(dayOfWeek)}&rain=${rain}`
      );
      if (data && data.timeline && data.timeline.length > 0) return data;
    } catch (err) {
      console.warn('Backend timeline endpoint unavailable, using client-side road timeline:', err);
    }
    return getClientSideRoadTimeline(roadId, dayOfWeek, rain);
  },

  // Explain risk prediction with SHAP
  async explainRisk(
    roadId: string,
    hour: number = 22,
    dayOfWeek: string = 'Friday',
    rain: number = 0
  ): Promise<{ prediction: RoadSegment; explanation_factors: ShapFactor[]; summary: string }> {
    try {
      const data = await fetchJson<{ prediction: RoadSegment; explanation_factors: ShapFactor[]; summary: string }>(
        `${API_BASE_URL}/predict-risk`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            road_id: roadId,
            hour,
            day_of_week: dayOfWeek,
            rain
          })
        }
      );
      if (data && data.explanation_factors && data.explanation_factors.length > 0) return data;
    } catch (err) {
      console.warn('Backend predict-risk endpoint unavailable, using client-side SHAP factors:', err);
    }
    return getClientSideShapFactors(roadId, hour, dayOfWeek, rain);
  },

  // Forecast for Dhaka neighborhoods
  async getForecast(
    hour: number = 23,
    dayOfWeek: string = 'Friday',
    rain: number = 0
  ): Promise<{ day_of_week: string; hour: number; time_str: string; rain: boolean; forecasts: AreaForecast[] }> {
    return fetchJson(`${API_BASE_URL}/forecast?hour=${hour}&day_of_week=${encodeURIComponent(dayOfWeek)}&rain=${rain}`);
  },

  // Incidents
  async getIncidents(
    page: number = 1,
    pageSize: number = 25,
    crimeType?: string,
    area?: string,
    search?: string
  ): Promise<{ total: number; page: number; page_size: number; total_pages: number; incidents: CrimeIncident[] }> {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize)
    });
    if (crimeType && crimeType !== 'All') params.append('crime_type', crimeType);
    if (area && area !== 'All') params.append('area', area);
    if (search) params.append('search', search);
    return fetchJson(`${API_BASE_URL}/incidents?${params.toString()}`);
  },

  // Hotspots (DBSCAN clusters)
  async getHotspots(): Promise<{ hotspots: Hotspot[] }> {
    try {
      const data = await fetchJson<{ hotspots: Hotspot[] }>(`${API_BASE_URL}/hotspots`);
      if (data && data.hotspots && data.hotspots.length > 0) return data;
    } catch (err) {
      console.warn('Backend /hotspots endpoint unavailable, using bundled hotspots:', err);
    }
    return { hotspots: getClientSideHotspots() };
  },

  // Analytics summary
  async getAnalytics(): Promise<AnalyticsSummary> {
    return fetchJson(`${API_BASE_URL}/analytics`);
  },

  // NLP Extractor
  async extractNlp(text: string): Promise<NlpExtractionResult> {
    return fetchJson(`${API_BASE_URL}/nlp/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
  }
};
