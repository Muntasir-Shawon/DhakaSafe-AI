import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export type Bounds = [number, number][];

interface MapAutoBoundsProps {
  coords: Bounds | null | undefined;
  /** Extra breathing room, in pixels, around the fitted area. */
  padding?: number;
  /** Skips fitting entirely — used when the user has already panned away. */
  enabled?: boolean;
}

/**
 * Fits the viewport to a set of coordinates whenever they change, animating the
 * transition instead of jumping. Leaflet needs a real DOM size on first paint,
 * so fitting is deferred a frame.
 */
export function MapAutoBounds({ coords, padding = 56, enabled = true }: MapAutoBoundsProps) {
  const map = useMap();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready || !enabled || !coords || coords.length === 0) return;
    try {
      const bounds = L.latLngBounds(coords.map(([lat, lon]) => [lat, lon] as [number, number]));
      map.fitBounds(bounds, { padding: [padding, padding], maxZoom: 15, animate: true });
    } catch {
      /* A malformed coordinate should not take the map down. */
    }
  }, [coords, map, padding, enabled, ready]);

  return null;
}
