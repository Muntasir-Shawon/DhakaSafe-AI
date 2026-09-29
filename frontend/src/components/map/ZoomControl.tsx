import { useMap } from 'react-leaflet';

const buttonClass =
  'flex h-9 w-9 items-center justify-center rounded-control border border-line bg-surface/95 text-ink-2 shadow-lift backdrop-blur transition-colors hover:text-ink';

/**
 * Zoom buttons for a map.
 *
 * Consumes the React-Leaflet context, so it must be rendered inside a
 * <MapContainer> — host it in a <MapOverlay>, which is the one place in this
 * app that guarantees that. Rendering it outside the container is what caused
 * the `useLeafletContext()` crash in production.
 */
export function ZoomControl() {
  const map = useMap();

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => map.zoomIn()}
        aria-label="Zoom in"
        title="Zoom in"
        className={buttonClass}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => map.zoomOut()}
        aria-label="Zoom out"
        title="Zoom out"
        className={buttonClass}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M5 12h14" />
        </svg>
      </button>
    </div>
  );
}
