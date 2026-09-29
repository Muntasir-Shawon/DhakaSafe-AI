import { useEffect, useRef, type ReactNode } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { cx } from '../../lib/cx';

interface MapOverlayProps {
  children: ReactNode;
  /** Placement within the map, e.g. `left-3 top-3`. */
  className?: string;
}

/**
 * Hosts React controls on top of a map.
 *
 * React-Leaflet's context only reaches descendants of <MapContainer>, so any
 * control that needs `useMap()` has to be rendered inside one — this component
 * makes that requirement structural by consuming the context itself.
 *
 * The controls render in place rather than through a portal: Leaflet forces
 * `position: relative` on the container it initialises, so absolute children
 * are anchored to the map box. `z-[1000]` is Leaflet's own control layer, which
 * keeps buttons above markers and popups.
 */
export function MapOverlay({ children, className }: MapOverlayProps) {
  const map = useMap();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Controls live inside the map node, which listens for drags and
    // double-clicks; without this a press on a button also pans or zooms.
    if (ref.current) L.DomEvent.disableClickPropagation(ref.current);
  }, [map]);

  return (
    <div ref={ref} className={cx('pointer-events-auto absolute z-[1000]', className)}>
      {children}
    </div>
  );
}
