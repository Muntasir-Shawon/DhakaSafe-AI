import { useState, type ReactNode } from 'react';
import { TileLayer } from 'react-leaflet';
import { Layers, Map as MapIcon, Satellite, Moon } from 'lucide-react';
import { cx } from '../../lib/cx';

export type MapTheme = 'streets' | 'satellite' | 'dark';

const THEMES: { id: MapTheme; label: string; Icon: typeof MapIcon }[] = [
  { id: 'streets', label: 'Standard', Icon: MapIcon },
  { id: 'satellite', label: 'Satellite', Icon: Satellite },
  { id: 'dark', label: 'Night', Icon: Moon },
];

export function ThemeLayers({ theme }: { theme: MapTheme }) {
  if (theme === 'streets') {
    return (
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
    );
  }
  if (theme === 'satellite') {
    return (
      <TileLayer
        attribution="&copy; Esri, Maxar, Earthstar Geographics"
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        maxZoom={19}
      />
    );
  }
  return (
    <>
      <TileLayer
        attribution="&copy; Esri"
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        maxZoom={16}
      />
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
        maxZoom={16}
        opacity={0.8}
      />
    </>
  );
}

interface MapChromeProps {
  theme: MapTheme;
  onThemeChange: (theme: MapTheme) => void;
  /** Extra controls, rendered above the theme switcher. */
  children?: ReactNode;
  className?: string;
}

/**
 * Compact floating map controls. Replaces the emoji-laden three-button
 * switcher that was duplicated across both map views.
 */
export function MapChrome({ theme, onThemeChange, children, className }: MapChromeProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cx(
        'pointer-events-auto absolute right-3 top-3 z-[var(--z-map-chrome)] flex flex-col items-end gap-2',
        className,
      )}
    >
      {children}

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Map style"
          title="Map style"
          className="flex h-9 w-9 items-center justify-center rounded-control border border-line bg-surface/95 text-ink-2 shadow-lift backdrop-blur transition-colors hover:text-ink"
        >
          <Layers className="h-4 w-4" aria-hidden="true" />
        </button>

        {open && (
          <div
            role="menu"
            aria-label="Map style"
            className="absolute right-0 top-11 w-36 overflow-hidden rounded-control border border-line bg-surface p-1 shadow-lift animate-rise"
          >
            {THEMES.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                role="menuitemradio"
                aria-checked={theme === id}
                onClick={() => {
                  onThemeChange(id);
                  setOpen(false);
                }}
                className={cx(
                  'flex w-full items-center gap-2 rounded-[6px] px-2.5 py-2 text-left text-meta transition-colors',
                  theme === id
                    ? 'bg-surface-2 text-ink'
                    : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
