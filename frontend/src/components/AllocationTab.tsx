import React from 'react';
import {
  PieChart,
  Sliders,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Info,
  Grid,
  Layers,
  Scale
} from 'lucide-react';
import { PortfolioAnalyzeResponse } from '../types';
import { formatINR } from '../lib/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

interface AllocationTabProps {
  data: PortfolioAnalyzeResponse;
}

export const AllocationTab: React.FC<AllocationTabProps> = ({ data }) => {
  const rec = data.recommendation;
  const currentWeights = data.portfolio.weights;
  const corr = data.correlation_matrix || {};
  const tickers = Object.keys(rec.weights);

  // Build comparison data for chart
  const comparisonData = tickers.map((ticker) => {
    const curr = (currentWeights[ticker] || 0) * 100;
    const recom = (rec.weights[ticker] || 0) * 100;
    const delta = recom - curr;
    return {
      ticker: ticker.replace('.NS', ''),
      fullTicker: ticker,
      current: Number(curr.toFixed(2)),
      recommended: Number(recom.toFixed(2)),
      delta: Number(delta.toFixed(2))
    };
  });

  // Helper for correlation color
  const getCorrColor = (val: number) => {
    if (val >= 0.7) return 'bg-rose-950/80 text-rose-300 font-bold';
    if (val >= 0.4) return 'bg-amber-950/60 text-amber-300';
    if (val >= 0.1) return 'bg-slate-800 text-slate-300';
    if (val >= -0.1) return 'bg-cyan-950/60 text-cyan-300';
    return 'bg-emerald-950/80 text-emerald-300 font-bold';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">Allocation Lab, Correlations & Strategy Comparison</h2>
          <p className="text-xs text-gray-400">
            Markowitz mean-variance optimization, asset correlation matrix, and 4-way strategy comparison.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="badge-tag bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold">
            Optimized Target: {rec.target_profile.toUpperCase()} Profile
          </span>
        </div>
      </div>

      {/* Recommended Portfolio KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-4">
          <div className="text-xs text-gray-400 mb-1">Recommended Sharpe Ratio</div>
          <div className="text-2xl font-bold font-mono text-cyan-400">{rec.sharpe_ratio}</div>
          <div className="text-[11px] text-gray-500 mt-1">Vs Current: {data.risk.sharpe_ratio}</div>
        </div>

        <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-4">
          <div className="text-xs text-gray-400 mb-1">Expected Annual Return</div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{rec.expected_return_pct}%</div>
          <div className="text-[11px] text-gray-500 mt-1">Annualized CAGR expectation</div>
        </div>

        <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-4">
          <div className="text-xs text-gray-400 mb-1">Expected Volatility</div>
          <div className="text-2xl font-bold font-mono text-amber-400">{rec.expected_risk_pct}%</div>
          <div className="text-[11px] text-gray-500 mt-1">Vs Current: {data.risk.annualized_volatility_pct}%</div>
        </div>
      </div>

      {/* Strategy Comparison Table (PS Requirement 5) */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              <span>Portfolio Strategy Comparison (Side-by-Side)</span>
            </h3>
            <p className="text-xs text-gray-400">
              Comparing your original allocation, the system's recommended optimal weights, equal weight (1/N), and NIFTY 50 benchmark
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#162032] text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
              <tr>
                <th className="py-2.5 px-3">Strategy</th>
                <th className="py-2.5 px-3 text-right">Cumulative Return</th>
                <th className="py-2.5 px-3 text-right">Annual Volatility</th>
                <th className="py-2.5 px-3 text-right">Sharpe Ratio</th>
                <th className="py-2.5 px-3 text-right">Max Drawdown</th>
                <th className="py-2.5 px-3 text-right">1D 95% VaR (INR)</th>
                <th className="py-2.5 px-3 text-right">1D 95% CVaR (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 font-mono">
              {data.strategies.map((strat, idx) => {
                const isRec = strat.name.includes("Recommended");
                const isUser = strat.name.includes("Current");
                return (
                  <tr
                    key={idx}
                    className={`transition ${
                      isRec
                        ? 'bg-emerald-950/20 hover:bg-emerald-950/30'
                        : isUser
                        ? 'bg-slate-900/60 hover:bg-slate-900'
                        : 'hover:bg-[#162032]/60'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-semibold text-white font-sans flex items-center space-x-2">
                      <span>{strat.name}</span>
                      {isRec && <span className="badge-tag bg-emerald-950 text-emerald-400 border border-emerald-800 text-[9px]">Target</span>}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold ${strat.total_return_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {strat.total_return_pct > 0 ? '+' : ''}{strat.total_return_pct}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-amber-400">{strat.annualized_vol_pct}%</td>
                    <td className="py-2.5 px-3 text-right text-cyan-400 font-bold">{strat.sharpe_ratio}</td>
                    <td className="py-2.5 px-3 text-right text-rose-400">{strat.max_drawdown_pct}%</td>
                    <td className="py-2.5 px-3 text-right text-gray-300">{formatINR(strat.var_95_1d_inr)}</td>
                    <td className="py-2.5 px-3 text-right text-gray-400">{formatINR(strat.cvar_95_1d_inr)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Asset Correlation Matrix Heatmap (PS Module 2) */}
      {Object.keys(corr).length > 0 && (
        <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                <Grid className="w-4 h-4 text-cyan-400" />
                <span>Pairwise Asset Correlation Heatmap</span>
              </h3>
              <p className="text-xs text-gray-400">
                Pearson correlation coefficients (&rho;) between daily returns of selected assets
              </p>
            </div>
            <div className="flex items-center space-x-2 text-[10px]">
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300">&rho; &lt; 0.2 (High Diversification)</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">&rho; ~0.4 (Moderate)</span>
              <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300">&rho; &gt; 0.7 (High Co-movement)</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs text-gray-300">
              <thead className="bg-[#162032] text-gray-400 text-[11px] font-mono border-b border-gray-800">
                <tr>
                  <th className="py-2 px-3 text-left">Asset</th>
                  {tickers.map(t => (
                    <th key={t} className="py-2 px-2 text-center">{t.replace('.NS', '')}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 font-mono text-[11px]">
                {tickers.map(t1 => (
                  <tr key={t1} className="hover:bg-[#162032]/40 transition">
                    <td className="py-2 px-3 text-left font-semibold text-white font-sans">{t1.replace('.NS', '')}</td>
                    {tickers.map(t2 => {
                      const val = corr[t1] ? corr[t1][t2] : (t1 === t2 ? 1.0 : 0.0);
                      const displayVal = typeof val === 'number' ? val.toFixed(2) : '-';
                      return (
                        <td key={t2} className={`py-2 px-2 ${getCorrColor(Number(val))}`}>
                          {displayVal}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recommendation Explanations */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Optimization Rationale & Trade-off Explanation</span>
        </h3>
        <div className="space-y-2">
          {rec.explanation.map((exp, idx) => (
            <div key={idx} className="bg-[#162032] p-3 rounded-lg border border-gray-800 text-xs text-gray-300 flex items-start space-x-2.5">
              <span className="text-emerald-400 font-bold shrink-0 mt-0.5">#{idx + 1}</span>
              <p className="leading-relaxed">{exp}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Weight Rebalance Chart */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-sm space-y-4">
        <div className="border-b border-gray-800 pb-3">
          <h3 className="text-sm font-semibold text-white">Current Allocation vs Recommended Optimal Weights</h3>
          <p className="text-xs text-gray-400">Visualizing asset-by-asset rebalancing adjustments</p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData}>
              <XAxis dataKey="ticker" stroke="#4B5563" fontSize={11} />
              <YAxis stroke="#4B5563" fontSize={11} unit="%" />
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.5rem', fontSize: '12px' }}
                formatter={(val: any, name: any) => [`${val}%`, name === 'current' ? 'Current Weight' : 'Recommended Weight']}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="current" name="Current Weight %" fill="#64748B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="recommended" name="Recommended Weight %" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rebalance Table */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-sm space-y-4">
        <div className="border-b border-gray-800 pb-3">
          <h3 className="text-sm font-semibold text-white">Actionable Rebalance Plan</h3>
          <p className="text-xs text-gray-400">Exact weight adjustment required to achieve the optimal frontier allocation</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#162032] text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
              <tr>
                <th className="py-2.5 px-3">Asset</th>
                <th className="py-2.5 px-3 text-right">Current Weight</th>
                <th className="py-2.5 px-3 text-right">Recommended Weight</th>
                <th className="py-2.5 px-3 text-right">Delta Adjustment</th>
                <th className="py-2.5 px-3 text-center">Suggested Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 font-mono">
              {comparisonData.map((row) => {
                const isTrim = row.delta < -0.5;
                const isAdd = row.delta > 0.5;
                return (
                  <tr key={row.fullTicker} className="hover:bg-[#162032]/60 transition">
                    <td className="py-2 px-3 font-semibold text-white font-sans">{row.ticker}</td>
                    <td className="py-2 px-3 text-right text-gray-400">{row.current}%</td>
                    <td className="py-2 px-3 text-right text-emerald-400 font-bold">{row.recommended}%</td>
                    <td className={`py-2 px-3 text-right font-bold ${row.delta > 0 ? 'text-emerald-400' : row.delta < 0 ? 'text-rose-400' : 'text-gray-400'}`}>
                      {row.delta > 0 ? `+${row.delta}%` : `${row.delta}%`}
                    </td>
                    <td className="py-2 px-3 text-center font-sans">
                      <span
                        className={`badge-tag text-[10px] ${
                          isTrim
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : isAdd
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {isTrim ? 'TRIM WEIGHT' : isAdd ? 'INCREASE WEIGHT' : 'HOLD STEADY'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
