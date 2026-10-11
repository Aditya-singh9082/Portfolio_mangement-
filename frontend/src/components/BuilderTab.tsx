import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  RefreshCw,
  Sliders,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { AssetInfo, PortfolioAnalyzeRequest } from '../types';
import { formatINR } from '../lib/api';

interface BuilderTabProps {
  availableAssets: AssetInfo[];
  currentRequest: PortfolioAnalyzeRequest;
  onAnalyze: (req: PortfolioAnalyzeRequest) => void;
  onLoadDemo: () => void;
  isLoading: boolean;
}

export const BuilderTab: React.FC<BuilderTabProps> = ({
  availableAssets,
  currentRequest,
  onAnalyze,
  onLoadDemo,
  isLoading
}) => {
  const [tickers, setTickers] = useState<string[]>(currentRequest.tickers);
  const [weights, setWeights] = useState<number[]>(currentRequest.weights);
  const [investmentAmount, setInvestmentAmount] = useState<number>(currentRequest.investment_amount);
  const [riskPreference, setRiskPreference] = useState<'conservative' | 'moderate' | 'aggressive'>(
    currentRequest.risk_preference
  );
  const [startDate, setStartDate] = useState<string>(currentRequest.start_date || '2023-01-01');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const totalWeight = weights.reduce((acc, curr) => acc + curr, 0);

  // Auto-normalize weights so sum = 1.0 (100%)
  const handleNormalize = () => {
    if (totalWeight <= 0) return;
    const norm = weights.map(w => Number((w / totalWeight).toFixed(4)));
    setWeights(norm);
  };

  // Set equal weights (1/N)
  const handleEqualize = () => {
    if (tickers.length === 0) return;
    const eq = Number((1 / tickers.length).toFixed(4));
    setWeights(new Array(tickers.length).fill(eq));
  };

  // Add stock to portfolio
  const handleAddTicker = (tickerToAdd: string) => {
    if (tickers.includes(tickerToAdd)) return;
    const newTickers = [...tickers, tickerToAdd];
    const newWeights = [...weights, 0.1]; // initial default 10%
    setTickers(newTickers);
    // Normalize after add
    const sum = newWeights.reduce((a, b) => a + b, 0);
    setWeights(newWeights.map(w => Number((w / sum).toFixed(4))));
  };

  // Remove stock
  const handleRemoveTicker = (idx: number) => {
    if (tickers.length <= 2) {
      setErrorMsg("Portfolio requires at least 2 stocks for diversification analysis.");
      return;
    }
    setErrorMsg(null);
    const newTickers = tickers.filter((_, i) => i !== idx);
    const filteredWeights = weights.filter((_, i) => i !== idx);
    const sum = filteredWeights.reduce((a, b) => a + b, 0);
    setTickers(newTickers);
    setWeights(filteredWeights.map(w => Number((w / sum).toFixed(4))));
  };

  // Update single weight
  const handleWeightChange = (idx: number, newVal: number) => {
    const updated = [...weights];
    updated[idx] = Math.max(0, newVal);
    setWeights(updated);
  };

  // Submit analysis
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (tickers.length < 2) {
      setErrorMsg("Select at least 2 assets to run portfolio risk calculation.");
      return;
    }
    if (investmentAmount <= 0) {
      setErrorMsg("Investment capital must be greater than ₹0.");
      return;
    }

    // Auto-normalize on submit if close to 100%
    const sum = weights.reduce((a, b) => a + b, 0);
    const finalWeights = weights.map(w => Number((w / sum).toFixed(4)));

    onAnalyze({
      tickers,
      weights: finalWeights,
      investment_amount: investmentAmount,
      risk_preference: riskPreference,
      start_date: startDate,
      end_date: null,
      benchmark_ticker: '^NSEI'
    });
  };

  const unusedAssets = availableAssets.filter(a => !tickers.includes(a.ticker));

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111827] border border-[#1F293D] rounded-xl p-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">Portfolio Allocation Builder</h2>
          <p className="text-xs text-gray-400">Configure custom NSE tickers, investment capital, and risk tolerances.</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onLoadDemo}
            className="px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#283548] text-cyan-300 text-xs font-semibold border border-cyan-800 transition-colors flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Load Default 15-Stock Book</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-950/70 border border-rose-800 rounded-lg p-3 text-xs text-rose-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Holdings & Weights */}
        <div className="lg:col-span-2 bg-[#111827] border border-[#1F293D] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Active Constituents ({tickers.length})</h3>
              <span className="text-xs text-gray-400">
                Sum of Weights:{' '}
                <span className={`font-mono font-bold ${Math.abs(totalWeight - 1.0) < 0.01 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {(totalWeight * 100).toFixed(1)}%
                </span>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleEqualize}
                className="px-2.5 py-1 text-xs rounded bg-[#162032] hover:bg-[#1E293B] text-gray-300 border border-gray-700 transition"
              >
                Equalize (1/N)
              </button>
              <button
                type="button"
                onClick={handleNormalize}
                className="px-2.5 py-1 text-xs rounded bg-[#162032] hover:bg-[#1E293B] text-gray-300 border border-gray-700 transition"
              >
                Normalize to 100%
              </button>
            </div>
          </div>

          {/* Holdings List */}
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {tickers.map((t, idx) => {
              const assetInfo = availableAssets.find(a => a.ticker === t);
              const weightVal = weights[idx] ?? 0;
              const rupeeAllocation = weightVal * investmentAmount;

              return (
                <div key={t} className="bg-[#162032] border border-[#1F293D] rounded-lg p-3 flex items-center justify-between gap-4">
                  <div className="min-w-[140px]">
                    <div className="font-semibold text-white text-xs">{assetInfo?.display_name || t}</div>
                    <div className="text-[11px] text-gray-400 font-mono flex items-center space-x-2">
                      <span>{t}</span>
                      <span className="badge-tag bg-slate-800 text-slate-300 text-[9px] py-0 px-1">{assetInfo?.sector || 'Equity'}</span>
                    </div>
                  </div>

                  {/* Weight Slider & Input */}
                  <div className="flex-1 max-w-xs flex items-center space-x-3">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={weightVal}
                      onChange={(e) => handleWeightChange(idx, parseFloat(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <div className="w-16 text-right">
                      <span className="text-xs font-mono font-bold text-white">{(weightVal * 100).toFixed(1)}%</span>
                      <div className="text-[10px] text-gray-500 font-mono">{formatINR(rupeeAllocation)}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveTicker(idx)}
                    className="p-1.5 rounded text-gray-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                    title="Remove stock"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add More Assets Dropdown */}
          {unusedAssets.length > 0 && (
            <div className="pt-2 border-t border-gray-800 flex items-center space-x-2">
              <span className="text-xs text-gray-400">Add Stock:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddTicker(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="bg-[#162032] border border-gray-700 text-gray-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
                defaultValue=""
              >
                <option value="" disabled>Select from NSE universe...</option>
                {unusedAssets.map(a => (
                  <option key={a.ticker} value={a.ticker}>
                    {a.display_name} ({a.ticker}) — ₹{a.last_price}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right Column: Parameters & Controls */}
        <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white border-b border-gray-800 pb-2">Analysis Parameters</h3>

            {/* Investment Amount */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Portfolio Capital (INR)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 font-mono text-xs">₹</span>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#162032] border border-gray-700 text-white rounded-lg pl-7 pr-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="text-[11px] text-gray-500 mt-1 font-mono">
                Formatted: {formatINR(investmentAmount)}
              </div>
            </div>

            {/* Risk Preference Profile */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Target Risk Preference
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['conservative', 'moderate', 'aggressive'] as const).map((pref) => (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => setRiskPreference(pref)}
                    className={`py-2 text-xs rounded-lg font-medium capitalize transition-all border ${
                      riskPreference === pref
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-600 shadow-sm'
                        : 'bg-[#162032] text-gray-400 border-gray-700 hover:text-gray-200'
                    }`}
                  >
                    {pref}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-gray-500 mt-1.5">
                {riskPreference === 'conservative'
                  ? 'Focuses on Minimum-Variance allocation to reduce downside risk.'
                  : riskPreference === 'aggressive'
                  ? 'Targets Maximum Sharpe ratio allocation to optimize return efficiency.'
                  : 'Blended risk-adjusted target balancing variance and growth.'}
              </p>
            </div>

            {/* Historical Analysis Start Date */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Historical Start Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  min="2018-01-01"
                  max="2026-05-01"
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#162032] border border-gray-700 text-white rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <span className="text-[11px] text-gray-500">History available from 2018-01-01 (COVID-19 included).</span>
            </div>

            {/* Benchmark Tag */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Benchmark Index
              </label>
              <div className="bg-[#162032] border border-gray-700 rounded-lg px-3 py-2 text-xs text-cyan-400 font-mono flex items-center justify-between">
                <span>^NSEI (NIFTY 50)</span>
                <span className="badge-tag bg-cyan-950 text-cyan-300 text-[10px]">Active</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running Quantitative Engine...</span>
              </>
            ) : (
              <>
                <Sliders className="w-4 h-4" />
                <span>Run Portfolio Risk Engine</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
