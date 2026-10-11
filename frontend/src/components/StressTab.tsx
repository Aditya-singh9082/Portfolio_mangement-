import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Flame,
  Activity,
  RotateCcw,
  Sliders,
  DollarSign,
  Info
} from 'lucide-react';
import { PortfolioAnalyzeResponse, StressTestResponse } from '../types';
import { runStressTest, formatINR } from '../lib/api';

interface StressTabProps {
  data: PortfolioAnalyzeResponse;
}

export const StressTab: React.FC<StressTabProps> = ({ data }) => {
  const [selectedScenario, setSelectedScenario] = useState<string>('covid_crash');
  const [customShock, setCustomShock] = useState<number>(-15.0);
  const [result, setResult] = useState<StressTestResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const p = data.portfolio;
  const tickers = Object.keys(p.weights);
  const weights = tickers.map(t => p.weights[t]);

  const executeStress = async (scenario: string, shockVal?: number) => {
    setIsLoading(true);
    try {
      const res = await runStressTest({
        tickers,
        weights,
        investment_amount: p.investment_amount,
        scenario,
        custom_shock_pct: scenario === 'custom' ? (shockVal !== undefined ? shockVal : customShock) : undefined
      });
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    executeStress(selectedScenario);
  }, [selectedScenario]);

  const scenarios = [
    { id: 'covid_crash', name: 'COVID-19 Crash (Historical Replay)', tag: '22 Days Replay', icon: Flame },
    { id: 'banking_crisis', name: 'Indian Banking Crisis Shock', tag: 'Banks -20%', icon: AlertTriangle },
    { id: 'broad_market', name: 'Broad Market Flash Crash', tag: '-10% Uniform', icon: Activity },
    { id: 'rate_hike', name: '2022 Global Rate-Hike Selloff', tag: '114 Days Replay', icon: RotateCcw },
    { id: 'correction', name: '2024-25 Market Correction', tag: 'Correction Replay', icon: Activity },
    { id: 'custom', name: 'Custom Adjustable Shock', tag: 'Interactive Slider', icon: Sliders },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Stress Lab — Crisis Simulation Engine</h2>
          </div>
          <p className="text-xs text-gray-400">
            Replays extreme historical stress events and simulates hypothetical macro shocks on current weights.
          </p>
        </div>
      </div>

      {/* Scenario Selection Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {scenarios.map((scen) => {
          const Icon = scen.icon;
          const isSelected = selectedScenario === scen.id;
          return (
            <button
              key={scen.id}
              onClick={() => setSelectedScenario(scen.id)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#1E293B] border-rose-500 shadow-md shadow-rose-950/20'
                  : 'bg-[#111827] border-[#1F293D] hover:border-gray-700'
              }`}
            >
              <div>
                <Icon className={`w-4 h-4 mb-2 ${isSelected ? 'text-rose-400' : 'text-gray-400'}`} />
                <div className="text-xs font-semibold text-white leading-tight">{scen.name}</div>
              </div>
              <span className="badge-tag bg-slate-900 text-slate-400 text-[9px] mt-2 py-0 px-1">
                {scen.tag}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom Slider (if custom scenario selected) */}
      {selectedScenario === 'custom' && (
        <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-300 block mb-1">
              Adjust Market Shock Magnitude: <span className="font-mono text-rose-400">{customShock}%</span>
            </label>
            <input
              type="range"
              min="-40"
              max="-1"
              step="1"
              value={customShock}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setCustomShock(val);
                executeStress('custom', val);
              }}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>
          <div className="text-right sm:border-l border-gray-800 sm:pl-4">
            <span className="text-[11px] text-gray-400">Simulated Drawdown</span>
            <div className="text-lg font-bold font-mono text-rose-400">{customShock}%</div>
          </div>
        </div>
      )}

      {/* Stress Result Cards */}
      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#111827] border border-rose-900/50 rounded-xl p-5 shadow-sm">
              <span className="text-xs text-gray-400 block mb-1">Estimated Capital Loss (INR)</span>
              <div className="text-2xl font-bold font-mono text-rose-400">
                {formatINR(result.estimated_pnl_inr)}
              </div>
              <span className="text-xs font-mono font-medium text-rose-300 mt-1 block">
                Portfolio Impact: {result.estimated_pnl_pct}%
              </span>
            </div>

            <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-sm">
              <span className="text-xs text-gray-400 block mb-1">Post-Shock Portfolio Valuation</span>
              <div className="text-2xl font-bold font-mono text-white">
                {formatINR(result.portfolio_value_after)}
              </div>
              <span className="text-xs font-mono text-gray-500 mt-1 block">
                Pre-Shock Capital: {formatINR(result.portfolio_value_before)}
              </span>
            </div>

            <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-sm">
              <span className="text-xs text-gray-400 block mb-1">Scenario Horizon & Duration</span>
              <div className="text-2xl font-bold font-mono text-cyan-400">
                {result.duration_trading_days} Trading Days
              </div>
              <span className="text-xs text-gray-400 mt-1 block">
                Type: {result.scenario_type.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Asset Impact Table */}
          <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-sm space-y-4">
            <div className="border-b border-gray-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Asset-by-Asset Shock Transmission</h3>
                <p className="text-xs text-gray-400">{result.scenario_description}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#162032] text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
                  <tr>
                    <th className="py-2.5 px-3">Asset</th>
                    <th className="py-2.5 px-3">Sector</th>
                    <th className="py-2.5 px-3 text-right">Individual Shock %</th>
                    <th className="py-2.5 px-3 text-right">Estimated INR PnL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 font-mono">
                  {result.asset_impacts.map((a) => (
                    <tr key={a.ticker} className="hover:bg-[#162032]/60 transition">
                      <td className="py-2 px-3 font-semibold text-white font-sans">{a.display_name} ({a.ticker.replace('.NS', '')})</td>
                      <td className="py-2 px-3 text-gray-400 font-sans">{a.sector}</td>
                      <td className={`py-2 px-3 text-right font-bold ${a.shock_pct < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {a.shock_pct}%
                      </td>
                      <td className="py-2 px-3 text-right text-rose-300 font-bold">
                        {formatINR(a.loss_inr)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Assumptions List */}
            <div className="bg-[#162032] p-3 rounded-lg border border-gray-800 text-xs text-gray-400 space-y-1">
              <span className="font-semibold text-gray-300 block mb-1">Scenario Assumptions & Disclosures:</span>
              {result.assumptions.map((ass, i) => (
                <div key={i} className="flex items-start space-x-2">
                  <span className="text-rose-400 font-mono">•</span>
                  <span>{ass}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
