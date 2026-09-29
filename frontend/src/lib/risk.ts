import {
  CircleCheck,
  CircleAlert,
  TriangleAlert,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react';

/**
 * The single source of truth for risk presentation.
 *
 * Thresholds mirror the backend exactly (risk_predictor.py: 35 / 60 / 80).
 * The backend also sends a `risk_color` field, but the interface renders
 * these tokens instead so the whole product speaks one visual language.
 * The wire format is untouched.
 */

export type RiskBand = 'low' | 'moderate' | 'high' | 'severe';

export interface RiskLevel {
  band: RiskBand;
  /** Plain-language name. Never an abbreviation. */
  label: string;
  /** Human-readable score range, e.g. "0 – 34". */
  range: string;
  /** Solid colour for Leaflet strokes and dots. */
  hex: string;
  text: string;
  wash: string;
  border: string;
  bar: string;
  Icon: LucideIcon;
  /** One calm sentence a traveller can act on. */
  guidance: string;
}

const LEVELS: Record<RiskBand, RiskLevel> = {
  low: {
    band: 'low',
    label: 'Low',
    range: '0 – 34',
    hex: '#4fb286',
    text: 'text-safe',
    wash: 'bg-safe-wash',
    border: 'border-safe/30',
    bar: 'bg-safe',
    Icon: CircleCheck,
    guidance: 'Fewer reported incidents on this stretch for the time you picked.',
  },
  moderate: {
    band: 'moderate',
    label: 'Moderate',
    range: '35 – 59',
    hex: '#d9a441',
    text: 'text-caution',
    wash: 'bg-caution-wash',
    border: 'border-caution/30',
    bar: 'bg-caution',
    Icon: CircleAlert,
    guidance: 'Take the usual care you would at dusk on this road.',
  },
  high: {
    band: 'high',
    label: 'High',
    range: '60 – 79',
    hex: '#d9773f',
    text: 'text-warn',
    wash: 'bg-warn-wash',
    border: 'border-warn/30',
    bar: 'bg-warn',
    Icon: TriangleAlert,
    guidance: 'Prefer a lit main road, avoid stopping here, and keep to populated stretches.',
  },
  severe: {
    band: 'severe',
    label: 'Very high',
    range: '80 – 100',
    hex: '#e2725b',
    text: 'text-danger',
    wash: 'bg-danger-wash',
    border: 'border-danger/30',
    bar: 'bg-danger',
    Icon: ShieldAlert,
    guidance: 'Consider a different road. If you must pass, stay in motion and keep your belongings close.',
  },
};

/** Ordered low → severe. Used for legends and scale pickers. */
export const RISK_SCALE: RiskBand[] = ['low', 'moderate', 'high', 'severe'];

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return LEVELS.severe;
  if (score >= 60) return LEVELS.high;
  if (score >= 35) return LEVELS.moderate;
  return LEVELS.low;
}

export const riskHex = (score: number): string => getRiskLevel(score).hex;

export function getRiskLevelByBand(band: RiskBand): RiskLevel {
  return LEVELS[band];
}

/**
 * Normalises the API's `risk_level` string ("LOW", "VERY HIGH") onto a band,
 * so a server-provided label can never disagree with a server-provided score.
 */
export function bandFromLevel(level: string | undefined | null): RiskBand {
  const key = (level ?? '').trim().toLowerCase().replace(/\s+/g, '-');
  if (key in LEVELS) return key as RiskBand;
  return 'moderate';
}

export function getRiskLevelByName(level: string | undefined | null): RiskLevel {
  return LEVELS[bandFromLevel(level)];
}

/** "14 / 100" — used in meters, readouts and accessible names. */
export const riskScoreLabel = (score: number): string => `${score} / 100`;

/** Screen-reader phrasing, so the number is never read without its meaning. */
export function riskAriaLabel(score: number): string {
  const { label } = getRiskLevel(score);
  return `Safety risk ${score} out of 100, ${label.toLowerCase()}`;
}

/* ---------------------------------------------------------------------------
   Domain vocabulary: raw API values → words a traveller understands.
   Values confirmed against backend/app/data_pipeline/dataset_generator.py
   (lighting: Low | Medium | High, road_type: tertiary | secondary | primary | trunk).
   ------------------------------------------------------------------------ */

const LIGHTING_WORDS: Record<string, string> = {
  high: 'Good lighting',
  medium: 'Some lighting',
  low: 'Poor lighting',
};

/** "High" → "Good lighting". Unknown values pass through untouched. */
export function describeLighting(condition: string | undefined | null): string {
  const key = (condition ?? '').trim().toLowerCase();
  return LIGHTING_WORDS[key] ?? (condition ? `${condition} lighting` : 'Lighting unknown');
}

const ROAD_TYPE_WORDS: Record<string, string> = {
  trunk: 'Trunk road',
  primary: 'Main road',
  secondary: 'Wide road',
  tertiary: 'Local road',
};

/** "tertiary" → "Local road". */
export function describeRoadType(type: string | undefined | null): string {
  const key = (type ?? '').trim().toLowerCase();
  return ROAD_TYPE_WORDS[key] ?? (type ?? 'Road');
}
