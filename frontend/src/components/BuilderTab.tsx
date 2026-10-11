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
  AlertCircle,
  Search,
  Check
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
  const [benchmarkTicker, setBenchmarkTicker] = useState<string>(currentRequest.benchmark_ticker || '^NSEI');
  const [customTickerInput, setCustomTickerInput] = useState<string>('');
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
    const clean = tickerToAdd.trim().toUpperCase();
    if (!clean) return;

    const knownGlobal = [
      'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'SPY', 'QQQ', 'GLD',
      'BTC-USD', 'ETH-USD', 'AMD', 'NFLX', 'BRK-B', 'JPM', 'V', 'INTC', 'DIS'
    ];
    let finalTicker = clean;
    if (availableAssets.some(a => a.ticker.toUpperCase() === clean)) {
      finalTicker = clean;
    } else if (clean.includes('.') || clean.startsWith('^') || clean.includes('-') || knownGlobal.includes(clean)) {
      finalTicker = clean;
    } else {
      // Default to Indian NSE .NS ticker
      finalTicker = `${clean}.NS`;
    }

    if (tickers.includes(finalTicker)) {
      setErrorMsg(`${finalTicker} is already in the portfolio.`);
      return;
    }
    setErrorMsg(null);
    const newTickers = [...tickers, finalTicker];
    const newWeights = [...weights, 0.1]; // default 10%
    setTickers(newTickers);
    // Normalize after add
    const sum = newWeights.reduce((a, b) => a + b, 0);
    setWeights(newWeights.map(w => Number((w / sum).toFixed(4))));
    setCustomTickerInput('');
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

  // Date range presets
  const applyDatePreset = (presetYears: number) => {
    const now = new Date();
    if (presetYears === 0) {
      setStartDate('2018-01-01');
    } else {
      const past = new Date(now.setFullYear(now.getFullYear() - presetYears));
      setStartDate(past.toISOString().split('T')[0]);
    }
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

    // Auto-normalize if not summing to 1.0
    let finalWeights = weights;
    const sumW = weights.reduce((a, b) => a + b, 0);
    if (Math.abs(sumW - 1.0) > 0.001) {
      if (sumW <= 0) {
        setErrorMsg("Sum of weights must be greater than 0.");
        return;
      }
      finalWeights = weights.map(w => Number((w / sumW).toFixed(4)));
      setWeights(finalWeights);
    }

    onAnalyze({
      tickers,
      weights: finalWeights,
      investment_amount: investmentAmount,
      risk_preference: riskPreference,
      start_date: startDate,
      end_date: null,
      benchmark_ticker: benchmarkTicker
    });
  };

  const unusedAssets = availableAssets.filter(a => !tickers.includes(a.ticker));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">Interactive Portfolio Construction Studio</h2>
          <p className="text-xs text-gray-400">
            Select or enter multiple NSE/global assets, specify capital allocations, and test risk-return dynamics.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onLoadDemo}
            className="px-3.5 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#2A374F] text-cyan-400 text-xs font-semibold border border-cyan-800/60 shadow-sm transition flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Load Default 15-Stock Portfolio</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-950/60 border border-rose-800 rounded-xl p-3 text-xs text-rose-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Form Grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Holdings List */}
        <div className="lg:col-span-2 bg-[#111827] border border-[#1F293D] rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Constituent Asset Holdings</h3>
              <p className="text-xs text-gray-400">Adjust individual asset weights (0% to 100%)</p>
            </div>

            <div className="flex items-center space-x-2">
              <span className={`text-xs font-mono font-bold ${Math.abs(totalWeight - 1.0) < 0.005 ? 'text-emerald-400' : 'text-amber-400'}`}>
                Sum: {(totalWeight * 100).toFixed(1)}%
              </span>
              <button
                type="button"
                onClick={handleNormalize}
                className="px-2.5 py-1 bg-[#1E293B] hover:bg-slate-700 text-gray-300 rounded text-[11px] font-medium border border-gray-700 transition"
              >
                Auto-Scale 100%
              </button>
              <button
                type="button"
                onClick={handleEqualize}
                className="px-2.5 py-1 bg-[#1E293B] hover:bg-slate-700 text-gray-300 rounded text-[11px] font-medium border border-gray-700 transition"
              >
                Equalize (1/N)
              </button>
            </div>
          </div>

          {/* Holdings Rows */}
          <div className="space-y-3">
            {tickers.map((ticker, idx) => {
              const assetInfo = availableAssets.find(a => a.ticker === ticker);
              const displayName = assetInfo ? assetInfo.display_name : ticker.replace('.NS', '');
              const sector = assetInfo ? assetInfo.sector : 'Equity';
              const lastPrice = assetInfo ? assetInfo.last_price : 0;
              const weightVal = weights[idx] || 0;
              const rupeeAllocation = weightVal * investmentAmount;

              return (
                <div
                  key={ticker}
                  className="bg-[#162032] border border-gray-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-gray-700 transition"
                >
                  <div className="sm:w-1/3">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-white text-xs">{displayName}</span>
                      <span className="text-[10px] text-gray-400 font-mono">({ticker})</span>
                    </div>
                    <div className="text-[11px] text-gray-400 flex items-center space-x-2 mt-0.5">
                      <span>{sector}</span>
                      {lastPrice > 0 && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-gray-300">₹{lastPrice.toLocaleString('en-IN')}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Weight Slider & Rupee Value */}
                  <div className="sm:w-1/2 flex items-center space-x-3">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={weightVal}
                      onChange={(e) => handleWeightChange(idx, parseFloat(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <div className="w-20 text-right">
                      <span className="text-xs font-mono font-bold text-white">{(weightVal * 100).toFixed(1)}%</span>
                      <div className="text-[10px] text-gray-500 font-mono">{formatINR(rupeeAllocation)}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveTicker(idx)}
                    className="p-1.5 rounded text-gray-500 hover:text-rose-400 hover:bg-rose-950/40 transition self-end sm:self-center"
                    title="Remove stock"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add Stock Controls (Universe dropdown + Custom ticker entry) */}
          <div className="pt-3 border-t border-gray-800 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Dropdown for preloaded stocks */}
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Add from Curated Universe (Indian & Global):</label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddTicker(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full bg-[#162032] border border-gray-700 text-gray-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                  defaultValue=""
                >
                  <option value="" disabled>Select Indian NSE, US Tech, ETF, or Gold...</option>
                  <optgroup label="🇮🇳 Indian NSE Large-Caps">
                    {unusedAssets.filter(a => a.ticker.endsWith('.NS') || a.currency === 'INR').map(a => (
                      <option key={a.ticker} value={a.ticker}>
                        {a.display_name} ({a.ticker}) {a.last_price > 0 ? `— ₹${a.last_price}` : ''}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🌐 Global & US Equities, Commodities">
                    {unusedAssets.filter(a => !a.ticker.endsWith('.NS') && a.currency !== 'INR').map(a => (
                      <option key={a.ticker} value={a.ticker}>
                        {a.display_name} ({a.ticker}) {a.last_price > 0 ? `— $${a.last_price}` : ''}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Custom ticker input */}
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Or Enter Any Ticker (e.g. TATAMOTORS.NS, NVDA, GLD):</label>
                <div className="flex space-x-1.5">
                  <input
                    type="text"
                    value={customTickerInput}
                    onChange={(e) => setCustomTickerInput(e.target.value)}
                    placeholder="e.g. TITAN.NS, AAPL, GLD, BTC-USD"
                    className="w-full bg-[#162032] border border-gray-700 text-white rounded-lg px-3 py-1.5 text-xs font-mono uppercase focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTicker(customTickerInput)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Parameters & Controls */}
        <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 space-y-5 flex flex-col justify-between shadow-sm">
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
                Capital Sizing: {formatINR(investmentAmount)}
              </div>
            </div>

            {/* Risk Preference Profile */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Preferred Risk Tolerance Level
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
              <p className="text-[11px] text-gray-400 mt-1.5">
                {riskPreference === 'conservative'
                  ? 'Minimum-Variance optimization prioritizing capital preservation and low drawdown.'
                  : riskPreference === 'aggressive'
                  ? 'Maximum-Sharpe optimization maximizing return efficiency per unit risk.'
                  : 'Balanced 50/50 risk-parity blend balancing growth and volatility.'}
              </p>
            </div>

            {/* Benchmark Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Market Benchmark
              </label>
              <select
                value={benchmarkTicker}
                onChange={(e) => setBenchmarkTicker(e.target.value)}
                className="w-full bg-[#162032] border border-gray-700 text-cyan-400 font-mono text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
              >
                <option value="^NSEI">^NSEI (NIFTY 50 Index)</option>
                <option value="^BSESN">^BSESN (S&P BSE SENSEX)</option>
                <option value="^NDX">^NDX (NASDAQ-100)</option>
                <option value="^GSPC">^GSPC (S&P 500)</option>
              </select>
            </div>

            {/* Historical Analysis Start Date & Quick Presets */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Simulation Start Date
              </label>
              <input
                type="date"
                value={startDate}
                min="2018-01-01"
                max="2026-09-01"
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#162032] border border-gray-700 text-white rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
              <div className="flex gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => applyDatePreset(1)}
                  className="px-2 py-0.5 bg-[#162032] hover:bg-slate-700 border border-gray-700 rounded text-[10px] text-gray-300"
                >
                  1 Year
                </button>
                <button
                  type="button"
                  onClick={() => applyDatePreset(3)}
                  className="px-2 py-0.5 bg-[#162032] hover:bg-slate-700 border border-gray-700 rounded text-[10px] text-gray-300"
                >
                  3 Years
                </button>
                <button
                  type="button"
                  onClick={() => applyDatePreset(5)}
                  className="px-2 py-0.5 bg-[#162032] hover:bg-slate-700 border border-gray-700 rounded text-[10px] text-gray-300"
                >
                  5 Years
                </button>
                <button
                  type="button"
                  onClick={() => applyDatePreset(0)}
                  className="px-2 py-0.5 bg-[#162032] hover:bg-slate-700 border border-gray-700 rounded text-[10px] text-gray-300"
                >
                  Max (2018)
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-4"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running Quantitative Risk Engine...</span>
              </>
            ) : (
              <>
                <Sliders className="w-4 h-4" />
                <span>Run Portfolio Risk Analysis</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
