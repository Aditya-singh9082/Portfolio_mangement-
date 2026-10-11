import { ShieldAlert, TrendingUp, BarChart3, PieChart, AlertTriangle, CheckCircle2, Layers, RefreshCw, Radio } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  dataAsOf: string;
  isFallback: boolean;
  onRefreshMarketData?: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  dataAsOf,
  isFallback,
  onRefreshMarketData,
  isRefreshing = false
}) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'builder', label: 'Portfolio Builder', icon: Layers },
    { id: 'risk', label: 'Risk Analysis & Frontier', icon: ShieldAlert },
    { id: 'performance', label: 'Performance & Simulation', icon: TrendingUp },
    { id: 'allocation', label: 'Allocation & Correlations', icon: PieChart },
    { id: 'stress', label: 'Stress Lab', icon: AlertTriangle },
    { id: 'validation', label: 'Dynamic Backtest', icon: CheckCircle2 },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0B0F19]/90 backdrop-blur-md border-b border-[#1F293D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Title */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">QUANTUM RISK</span>
                <span className="badge-tag bg-cyan-950 text-cyan-400 border border-cyan-800">NSE Large-Cap</span>
              </div>
              <p className="text-xs text-gray-400 hidden sm:block">AI & ML Portfolio Risk Engine | Live Market Intelligence</p>
            </div>
          </div>

          {/* Right Status Meta & Live Sync */}
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <div className="flex items-center justify-end space-x-1.5 text-xs text-gray-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Data Feed: <span className="text-gray-200 font-mono font-medium">{dataAsOf || '2026-10-09'}</span></span>
              </div>
              <div className="text-[11px] text-gray-500">Benchmark: <span className="text-cyan-400 font-mono">^NSEI (NIFTY 50)</span></div>
            </div>

            {onRefreshMarketData && (
              <button
                onClick={onRefreshMarketData}
                disabled={isRefreshing}
                title="Fetch latest closing prices from Yahoo Finance"
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition shadow-sm ${
                  isRefreshing
                    ? 'bg-slate-800 text-gray-400 border-gray-700 cursor-not-allowed'
                    : 'bg-[#1E293B] hover:bg-[#2A3B52] text-cyan-400 border-cyan-700/60 hover:border-cyan-500'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
                <span>{isRefreshing ? 'Syncing...' : 'Sync Market Data'}</span>
              </button>
            )}

            {isFallback && (
              <span className="badge-tag bg-amber-950/70 text-amber-400 border border-amber-800/80">
                Verified Fallback Dataset
              </span>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 overflow-x-auto py-2 scrollbar-none border-t border-[#1F293D]/60">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-[#1E293B] text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#162032]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-gray-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
