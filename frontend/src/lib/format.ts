export const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

/**
 * The model treats Friday and Saturday as weekend days
 * (backend/app/ml/risk_predictor.py:74), so the copy has to agree.
 */
export const WEEKEND_DAYS = new Set(['Friday', 'Saturday']);

/** "23:00" */
export const hour24 = (hour: number): string => `${String(hour).padStart(2, '0')}:00`;

/** "11 PM" */
export const hour12 = (hour: number): string => {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const base = hour % 12 === 0 ? 12 : hour % 12;
  return `${base} ${suffix}`;
};

export type Daypart = {
  id: 'night' | 'rush' | 'day';
  label: string;
};

/** Named the way a person would describe the street, not the model. */
export function daypartOf(hour: number): Daypart {
  if (hour >= 21 || hour <= 4) return { id: 'night', label: 'Late night' };
  if ([8, 9, 18, 19].includes(hour)) return { id: 'rush', label: 'Rush hour' };
  return { id: 'day', label: 'Daytime' };
}

/** "14 min" · "1 hr 5 min" */
export function formatDuration(minutes: number): string {
  const mins = Math.max(0, Math.round(minutes));
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

/** "6.8 km" — one decimal is the precision the network actually supports. */
export function formatDistance(km: number): string {
  return `${km.toFixed(1)} km`;
}

/** "950 m" below a kilometre, "1.2 km" above. */
export function formatMeters(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

/** "reported 1,204 times" — used for counts with real magnitude. */
export const formatCount = (n: number): string => n.toLocaleString('en-US');

/** Full sentence for a journey, e.g. "Dhanmondi 27 to Gulshan 2". */
export const journeyLabel = (from: string, to: string): string => `${from} to ${to}`;

/** Optional afternoon-evening qualifier for day pickers. */
export const dayNote = (day: string): string => (WEEKEND_DAYS.has(day) ? 'Weekend pattern' : '');
