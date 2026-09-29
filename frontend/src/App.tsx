import { lazy, Suspense, useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { EthicalNoticeModal } from './components/EthicalNoticeModal';
import { BrandLockup } from './components/brand/Logo';
import { TabNav } from './components/nav/TabNav';
import { SkeletonBlock } from './components/ui/StateViews';
import { useHashRoute } from './lib/routing';

// Split per view. Leaflet (~150 KB) only downloads when a map is opened.
const RouteFinder = lazy(() =>
  import('./components/RouteFinder').then((m) => ({ default: m.RouteFinder })),
);
const RiskMap = lazy(() =>
  import('./components/RiskMap').then((m) => ({ default: m.RiskMap })),
);
const AnalyticsView = lazy(() =>
  import('./components/AnalyticsView').then((m) => ({ default: m.AnalyticsView })),
);
const ForecastExplainabilityView = lazy(() =>
  import('./components/ForecastExplainabilityView').then((m) => ({
    default: m.ForecastExplainabilityView,
  })),
);

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://127.0.0.1:8000/api';

export function App() {
  const [activeTab, setActiveTab] = useHashRoute();
  const [isEthicsOpen, setIsEthicsOpen] = useState<boolean>(false);
  const [isHealthy, setIsHealthy] = useState<boolean>(true);

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch(`${API_BASE_URL}/health`);
        setIsHealthy(res.ok);
      } catch {
        setIsHealthy(false);
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenEthics={() => setIsEthicsOpen(true)}
        isBackendHealthy={isHealthy}
      />

      <main className="flex-1 pb-[calc(54px+env(safe-area-inset-bottom))] lg:pb-0">
        <Suspense
          fallback={
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
              <SkeletonBlock />
            </div>
          }
        >
          {activeTab === 'route' && <RouteFinder />}
          {activeTab === 'map' && <RiskMap />}
          {activeTab === 'analytics' && <AnalyticsView />}
          {activeTab === 'forecast' && <ForecastExplainabilityView />}
        </Suspense>
      </main>

      <footer className="mt-12 border-t border-line py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 text-meta text-ink-3 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-2.5">
            <BrandLockup size="sm" />
            <span aria-hidden="true">·</span>
            <span className="text-ink-3">
              Street theft risk and safe route guidance across Dhaka
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <button
              type="button"
              onClick={() => setIsEthicsOpen(true)}
              className="underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink-2"
            >
              Reported crime is not the same as actual crime
            </button>
            <span className="tabular">v1.0.0</span>
          </div>
        </div>
      </footer>

      <TabNav active={activeTab} onChange={setActiveTab} variant="bottom" />

      <EthicalNoticeModal isOpen={isEthicsOpen} onClose={() => setIsEthicsOpen(false)} />
    </div>
  );
}

export default App;
