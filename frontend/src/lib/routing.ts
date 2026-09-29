import { useCallback, useEffect, useState } from 'react';

export const TAB_KEYS = ['route', 'map', 'analytics', 'forecast'] as const;
export type TabKey = (typeof TAB_KEYS)[number];

export interface TabDef {
  key: TabKey;
  path: string;
  label: string;
  shortLabel: string;
}

export const TABS: TabDef[] = [
  {
    key: 'route',
    path: '#/route',
    label: 'Safe Route',
    shortLabel: 'Route',
  },
  {
    key: 'map',
    path: '#/map',
    label: 'Dynamic Risk Map',
    shortLabel: 'Map',
  },
  {
    key: 'analytics',
    path: '#/analytics',
    label: 'Crime Analytics',
    shortLabel: 'Analytics',
  },
  {
    key: 'forecast',
    path: '#/forecast',
    label: 'AI Lab & Forecast',
    shortLabel: 'Forecast',
  },
];

const DEFAULT_TAB: TabKey = 'route';

/**
 * Hash-based routing. Preserves the current SPA behaviour while allowing
 * browser back/forward and deep links. No new dependencies.
 */
export function useHashRoute(): [TabKey, (tab: TabKey) => void] {
  const [tab, setTab] = useState<TabKey>(() => {
    if (typeof window === 'undefined') return DEFAULT_TAB;
    const hash = window.location.hash;
    if (!hash) return DEFAULT_TAB;
    const clean = hash.replace('#/', '');
    return (TAB_KEYS as readonly string[]).includes(clean) ? (clean as TabKey) : DEFAULT_TAB;
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '');
      if ((TAB_KEYS as readonly string[]).includes(hash)) {
        setTab(hash as TabKey);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Ensure the URL always reflects the current tab, so the view is shareable.
    if (!window.location.hash) {
      window.history.replaceState(null, '', `#/${DEFAULT_TAB}`);
    }
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const go = useCallback(
    (next: TabKey) => {
      if (next === tab && window.location.hash === `#/${next}`) return;
      window.location.hash = `#/${next}`;
      setTab(next);
    },
    [tab],
  );

  return [tab, go];
}

export function tabFromKey(key: TabKey): TabDef | undefined {
  return TABS.find((t) => t.key === key);
}

export const currentTabIndex = (tab: TabKey): number => TABS.findIndex((t) => t.key === tab);
