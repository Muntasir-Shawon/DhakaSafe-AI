import { TABS, type TabKey } from '../../lib/routing';
import { cx } from '../../lib/cx';

interface TabNavProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  /**
   * `tabs` is the standard list. `pill` is used on the mobile bottom bar where
   * the bar itself provides the boundary and a pill would double it up.
   */
  variant?: 'tabs' | 'bottom';
}

const icons = {
  route: 'M3 17l4-4 3 3 6-6 5 5',
  map: 'M9 4 3 7v13l6-3 6 3 6-3V4l-6 3-6-3z',
  analytics: 'M4 20V9m5 11V4m5 16v-7m5 7V7',
  forecast: 'M3 15.5 8 10l4 3.5L21 5M21 5h-4m4 0v4',
} as const;

/**
 * One tab list, two placements. The desktop header and the mobile bottom bar
 * render the same items from the same array, so navigation can never drift
 * apart between the two layouts.
 */
export function TabNav({ active, onChange, variant = 'tabs' }: TabNavProps) {
  if (variant === 'bottom') {
    return (
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-[850] border-t border-line bg-surface/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="grid grid-cols-4">
          {TABS.map((tab) => {
            const selected = active === tab.key;
            return (
              <li key={tab.key}>
                <button
                  type="button"
                  onClick={() => onChange(tab.key)}
                  aria-current={selected ? 'page' : undefined}
                  className={cx(
                    'flex w-full flex-col items-center justify-center gap-1 px-1 py-2.5 min-h-[54px] transition-colors',
                    selected ? 'text-accent' : 'text-ink-3 hover:text-ink-2',
                  )}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={selected ? 2 : 1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d={icons[tab.key]} />
                  </svg>
                  <span className={cx('text-[11px]', selected ? 'font-semibold' : 'font-medium')}>
                    {tab.shortLabel}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label="Primary" className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {TABS.map((tab) => {
          const selected = active === tab.key;
          return (
            <li key={tab.key}>
              <button
                type="button"
                onClick={() => onChange(tab.key)}
                aria-current={selected ? 'page' : undefined}
                className={cx(
                  'relative px-3 py-2 text-body font-medium transition-colors',
                  selected ? 'text-ink' : 'text-ink-2 hover:text-ink',
                )}
              >
                {tab.label}
                {/* The active indicator is a rule, not a filled pill. */}
                <span
                  aria-hidden="true"
                  className={cx(
                    'absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent transition-opacity duration-200 ease-standard',
                    selected ? 'opacity-100' : 'opacity-0',
                  )}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
