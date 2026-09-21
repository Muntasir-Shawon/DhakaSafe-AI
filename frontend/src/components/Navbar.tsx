import React from 'react';
import { Shield, Navigation, Map, BarChart3, Sparkles, AlertTriangle, ExternalLink } from 'lucide-react';

interface NavbarProps {
  activeTab: 'routes' | 'map' | 'analytics' | 'forecast';
  setActiveTab: (tab: 'routes' | 'map' | 'analytics' | 'forecast') => void;
  onOpenEthics: () => void;
  isBackendHealthy: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenEthics,
  isBackendHealthy
}) => {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('routes')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xl tracking-tight text-white">DhakaSafe</span>
                <span className="bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  AI
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Street Theft Risk Prediction & Safe Route Navigation
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('routes')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'routes'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Navigation className="h-4 w-4" />
              <span className="hidden md:inline">Safe Route</span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'map'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Map className="h-4 w-4" />
              <span className="hidden md:inline">Dynamic Risk Map</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'analytics'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden md:inline">Crime Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('forecast')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'forecast'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden md:inline">AI Lab & Forecast</span>
            </button>
          </nav>

          {/* Status & Ethics Button */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center space-x-2 text-xs bg-slate-800/80 px-2.5 py-1.5 rounded-full border border-slate-700">
              <span className={`h-2 w-2 rounded-full ${isBackendHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-slate-300">{isBackendHealthy ? 'ML Engine Online' : 'Connecting...'}</span>
            </div>

            <button
              onClick={onOpenEthics}
              className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-amber-300 bg-slate-800/60 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/80 transition-colors"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">Responsible AI</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
