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

const API_BASE_URL = 'http://127.0.0.1:8000/api';

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
    return fetchJson(`${API_BASE_URL}/nodes`);
  },

  // Calculate routes (Fastest, Balanced, Safest)
  async getRoutes(
    originNode: string,
    destNode: string,
    hour: number = 22,
    dayOfWeek: string = 'Friday',
    rain: number = 0
  ): Promise<RouteResponse> {
    return fetchJson(`${API_BASE_URL}/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin_node: originNode,
        destination_node: destNode,
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
    return fetchJson(`${API_BASE_URL}/roads?hour=${hour}&day_of_week=${encodeURIComponent(dayOfWeek)}&rain=${rain}`);
  },

  // Road timeline (24-hour diurnal curve)
  async getRoadTimeline(
    roadId: string,
    dayOfWeek: string = 'Friday',
    rain: number = 0
  ): Promise<{ road_id: string; road_name: string; area: string; thana: string; timeline: RoadTimelinePoint[] }> {
    return fetchJson(`${API_BASE_URL}/road/${roadId}/timeline?day_of_week=${encodeURIComponent(dayOfWeek)}&rain=${rain}`);
  },

  // Explain risk prediction with SHAP
  async explainRisk(
    roadId: string,
    hour: number = 22,
    dayOfWeek: string = 'Friday',
    rain: number = 0
  ): Promise<{ prediction: RoadSegment; explanation_factors: ShapFactor[]; summary: string }> {
    return fetchJson(`${API_BASE_URL}/predict-risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        road_id: roadId,
        hour,
        day_of_week: dayOfWeek,
        rain
      })
    });
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
    return fetchJson(`${API_BASE_URL}/hotspots`);
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
