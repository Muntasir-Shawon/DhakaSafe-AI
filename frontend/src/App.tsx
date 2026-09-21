import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { RouteFinder } from './components/RouteFinder';
import { RiskMap } from './components/RiskMap';
import { AnalyticsView } from './components/AnalyticsView';
import { ForecastExplainabilityView } from './components/ForecastExplainabilityView';
import { EthicalNoticeModal } from './components/EthicalNoticeModal';
import { Shield, ExternalLink, Heart, AlertTriangle } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'routes' | 'map' | 'analytics' | 'forecast'>('routes');
  const [isEthicsOpen, setIsEthicsOpen] = useState<boolean>(false);
  const [isHealthy, setIsHealthy] = useState<boolean>(true);

  // Check backend health
  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/health');
        if (res.ok) {
          setIsHealthy(true);
        } else {
          setIsHealthy(false);
        }
      } catch (err) {
        setIsHealthy(false);
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenEthics={() => setIsEthicsOpen(true)}
        isBackendHealthy={isHealthy}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'routes' && <RouteFinder />}
        {activeTab === 'map' && <RiskMap />}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'forecast' && <ForecastExplainabilityView />}
      </main>

      {/* Footer with Ethical Disclaimer */}
      <footer className="bg-slate-900/60 border-t border-slate-800/80 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center space-x-3">
            <div className="h-6 w-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div>
              <span className="font-semibold text-white">DhakaSafe AI</span> — Spatio-Temporal Street Theft Risk Prediction & Safe Route Recommendation
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsEthicsOpen(true)}
              className="text-amber-400 hover:text-amber-300 underline flex items-center space-x-1"
            >
              <AlertTriangle className="h-3 w-3" />
              <span>Ethical AI Policy</span>
            </button>
            <span>•</span>
            <span>Reported Crime ≠ Actual Crime Limitation</span>
            <span>•</span>
            <span className="font-mono text-slate-500">v1.0.0</span>
          </div>
        </div>
      </footer>

      {/* Ethical Notice Modal */}
      <EthicalNoticeModal
        isOpen={isEthicsOpen}
        onClose={() => setIsEthicsOpen(false)}
      />
    </div>
  );
}

export default App;
