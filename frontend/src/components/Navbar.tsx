import { BrandLockup } from './brand/Logo';
import { TabNav } from './nav/TabNav';
import { TABS, type TabKey } from '../lib/routing';
import { cx } from '../lib/cx';

interface NavbarProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  onOpenEthics: () => void;
  isBackendHealthy: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenEthics,
  isBackendHealthy,
}) => {
  const current = TABS.find((t) => t.key === activeTab);

  return (
    <header className="sticky top-0 z-[870] border-b border-line bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <BrandLockup onClick={() => setActiveTab('route')} />
          <span
            aria-hidden="true"
            className="hidden h-5 w-px bg-line sm:block"
          />
          <p className="hidden truncate text-meta text-ink-3 sm:block">
            {current?.label ?? 'Safe Route'}
          </p>
        </div>

        <TabNav active={activeTab} onChange={setActiveTab} />

        <div className="flex items-center gap-2">
          {/* Status is text plus a dot. The dot is decorative; the words carry it. */}
          <span className="hidden items-center gap-1.5 text-meta text-ink-3 xl:flex">
            <span
              aria-hidden="true"
              className={cx(
                'h-1.5 w-1.5 rounded-full',
                isBackendHealthy ? 'bg-safe' : 'bg-caution',
              )}
            />
            {isBackendHealthy ? 'Model online' : 'Reconnecting'}
          </span>

          <button
            type="button"
            onClick={onOpenEthics}
            className="rounded-control px-2.5 py-1.5 text-meta font-medium text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink-2"
          >
            About the data
          </button>
        </div>
      </div>
    </header>
  );
};
