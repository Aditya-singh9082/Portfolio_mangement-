import React from 'react';
import {
  PieChart,
  Sliders,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Info
} from 'lucide-react';
import { PortfolioAnalyzeResponse } from '../types';
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

  // Build comparison data for chart
  const comparisonData = Object.keys(rec.weights).map((ticker) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">Allocation Lab & Markowitz Optimization</h2>
          <p className="text-xs text-gray-400">
            Mean-variance optimization under long-only constraints (w &ge; 0, &sum;w = 100%).
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="badge-tag bg-emerald-950 text-emerald-400 border border-emerald-800">
            Target: {rec.target_profile} Profile
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
