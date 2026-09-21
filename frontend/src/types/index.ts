export interface IntersectionNode {
  id: string;
  name: string;
  area: string;
  thana: string;
  lat: number;
  lon: number;
}

export interface RoadSegment {
  road_id: string;
  road_name: string;
  area: string;
  thana: string;
  road_type: string;
  length_meters: number;
  typical_travel_time_min: number;
  lighting_condition: string;
  bus_stops_count: number;
  police_stations_nearby: number;
  coordinates: [number, number][];
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY HIGH';
  risk_color: string;
  confidence: number;
  historical_incidents: number;
}

export interface RouteSegmentDetail {
  road_id: string;
  road_name: string;
  from_node: string;
  to_node: string;
  travel_time_min: number;
  length_meters: number;
  risk_score: number;
  risk_level: string;
  risk_color: string;
  lighting_condition: string;
  coordinates: [number, number][];
}

export interface RouteOption {
  id: string;
  label: 'Fastest' | 'Balanced' | 'Safest';
  name: string;
  description: string;
  color: string;
  is_recommended: boolean;
  total_time_min: number;
  total_distance_km: number;
  average_risk_score: number;
  max_risk_score: number;
  overall_risk_level: string;
  risk_reduction_pct: number;
  extra_time_min: number;
  node_count: number;
  segments_count: number;
  path_coordinates: [number, number][];
  segments: RouteSegmentDetail[];
}

export interface RouteResponse {
  origin_node: string;
  destination_node: string;
  origin_name: string;
  destination_name: string;
  hour: number;
  day_of_week: string;
  rain: boolean;
  routes: RouteOption[];
}

export interface CrimeIncident {
  incident_id: string;
  date: string;
  time: string;
  year: number;
  month: number;
  day_of_week: string;
  hour: number;
  crime_type: string;
  location_text: string;
  road_id: string;
  road_name: string;
  area: string;
  thana: string;
  latitude: number;
  longitude: number;
  source: string;
  source_url: string;
  source_type: string;
  victim_type: string;
  weapon: string;
  suspect_count: number;
  vehicle_used: string;
  description: string;
  location_precision: string;
  verification_status: string;
  confidence: number;
}

export interface Hotspot {
  area: string;
  center_lat: number;
  center_lon: number;
  radius_meters: number;
  incident_count: number;
  severity: string;
  color: string;
  primary_crime: string;
  common_weapons: string[];
  peak_hours: string;
  thana: string;
}

export interface ShapFactor {
  factor: string;
  impact: string;
  val: number;
  direction: 'positive' | 'negative';
  category: string;
  detail: string;
}

export interface RoadTimelinePoint {
  hour: number;
  time_label: string;
  risk_score: number;
  risk_level: string;
  confidence: number;
}

export interface AreaForecast {
  area: string;
  predicted_risk_score: number;
  risk_level: string;
  risk_color: string;
  road_segments_evaluated: number;
}

export interface AnalyticsSummary {
  summary: {
    total_incidents: number;
    date_range: string;
    peak_risk_window: string;
    most_common_crime: string;
    top_affected_hub: string;
  };
  hourly_distribution: { hour: number; label: string; count: number }[];
  crime_types: { crime_type: string; count: number; percentage: number }[];
  top_areas: { area: string; count: number }[];
  top_thanas: { thana: string; count: number }[];
  weapons: { weapon: string; count: number }[];
  vehicles: { vehicle: string; count: number }[];
  day_distribution: { day: string; count: number }[];
}

export interface NlpExtractionResult {
  raw_text: string;
  crime_type: string;
  location: string;
  thana: string;
  time: string;
  suspect_count: number;
  vehicle_used: string;
  weapon: string;
  victim_type: string;
  location_precision: string;
  extraction_confidence: number;
  is_usable_for_road_prediction: boolean;
}
