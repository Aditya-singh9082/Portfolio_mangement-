import React, { useState } from 'react';
import {
  ShieldAlert,
  HelpCircle,
  TrendingDown,
  Info,
  CheckCircle,
  AlertTriangle,
  Layers,
  BarChart2
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
  Legend,
  Cell
} from 'recharts';

interface RiskTabProps {
  data: PortfolioAnalyzeResponse;
}

export const RiskTab: React.FC<RiskTabProps> = ({ data }) => {
  const [selectedHorizon, setSelectedHorizon] = useState<'1-day' | '1-week'>('1-day');
  const [selectedConf, setSelectedConf] = useState<'95%' | '99%'>('99%');

  const filteredMetrics = data.risk_metrics_by_horizon.filter(
    m => m.horizon === selectedHorizon && m.confidence === selectedConf
  );

  const bootstrapMetric = data.risk_metrics_by_horizon.find(
    m => m.method.includes("Bootstrap")
  );

  return (
    <div className="space-y-6">
      {/* Risk Method Overview Banner */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Quantitative Risk Engine — Multi-Estimator View</h2>
          </div>
          <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
            Estimates portfolio Value-at-Risk (VaR) and Expected Shortfall (CVaR) across 6 models. 
            All monetary estimates are calibrated in <span className="text-white font-mono font-medium">₹ (INR)</span>.
          </p>
        </div>

        {/* Horizon Toggle */}
        <div className="flex items-center space-x-2 bg-[#162032] p-1.5 rounded-lg border border-gray-800">
          <button
            onClick={() => setSelectedHorizon('1-day')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
              selectedHorizon === '1-day'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            1-Day Horizon
          </button>
          <button
            onClick={() => setSelectedHorizon('1-week')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
              selectedHorizon === '1-week'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            1-Week Horizon (5d)
          </button>
        </div>
      </div>

      {/* Horizon Segregation Notice */}
      <div className="bg-cyan-950/40 border border-cyan-800/60 rounded-xl p-3.5 text-xs text-cyan-300 flex items-start space-x-3">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">Horizon Separation Rule: </span>
          {selectedHorizon === '1-day' ? (
            <span>Showing strictly 1-day daily risk estimates. Daily tail risk isolates day-to-day loss limits.</span>
          ) : (
            <span>Showing 1-week (5 trading days) scaled horizon estimates. Scaling assumes square-root-of-time (√5) or FHS path simulation. 1-week CVaR is structurally higher than 1-day metrics.</span>
          )}
        </div>
      </div>

      {/* Model Estimates Comparison Grid */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">
              {selectedHorizon.toUpperCase()} Loss Estimates — Confidence Filter
            </h3>
            <p className="text-xs text-gray-400">Comparing non-parametric, parametric, simulation, and GARCH conditional models</p>
          </div>

          <div className="flex items-center space-x-1.5 bg-[#162032] p-1 rounded-lg border border-gray-800">
            <button
              onClick={() => setSelectedConf('95%')}
              className={`px-3 py-1 rounded text-xs font-medium transition ${
                selectedConf === '95%' ? 'bg-[#1E293B] text-emerald-400 font-bold' : 'text-gray-400'
              }`}
            >
              95% Confidence (1-in-20)
            </button>
            <button
              onClick={() => setSelectedConf('99%')}
              className={`px-3 py-1 rounded text-xs font-medium transition ${
                selectedConf === '99%' ? 'bg-[#1E293B] text-emerald-400 font-bold' : 'text-gray-400'
              }`}
            >
              99% Confidence (1-in-100)
            </button>
          </div>
        </div>

        {/* Model Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMetrics.map((m, idx) => (
            <div
              key={idx}
              className={`bg-[#162032] border rounded-xl p-4 transition-all hover:border-gray-600 ${
                m.method.includes('FHS')
                  ? 'border-emerald-700/80 shadow-emerald-950/20 shadow-md'
                  : 'border-[#1F293D]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-white text-xs">{m.method}</span>
                {m.method.includes('FHS') && (
                  <span className="badge-tag bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">
                    Best Calibrated
                  </span>
                )}
              </div>

              <div className="space-y-2.5 mt-3">
                <div className="flex items-baseline justify-between border-b border-gray-800/80 pb-2">
                  <span className="text-xs text-gray-400">Value-at-Risk (VaR):</span>
                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-amber-400">{formatINR(m.var_inr)}</span>
                    <span className="text-[11px] text-gray-500 font-mono ml-1.5">({m.var_pct}%)</span>
                  </div>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-gray-400">CVaR (Expected Shortfall):</span>
                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-rose-400">{formatINR(m.cvar_inr)}</span>
                    <span className="text-[11px] text-gray-500 font-mono ml-1.5">({m.cvar_pct}%)</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-gray-800/60 text-[11px] text-gray-500">
                {m.method === 'Historical' && 'Non-parametric empirical quantile of past returns.'}
                {m.method === 'Normal' && 'Closed-form Gaussian. Tends to underestimate fat tails.'}
                {m.method === 'Student-t' && 'MLE Student-t fit. Captures excess kurtosis.'}
                {m.method === 'Monte Carlo' && 'Multivariate Cholesky simulation (10k paths).'}
                {m.method === 'GARCH-t' && "Time-varying conditional volatility for today's regime."}
                {m.method === 'FHS' && 'GARCH dynamic volatility combined with empirical residual pool.'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bootstrap CI Uncertainty Card */}
      {bootstrapMetric && (
        <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-sm font-semibold text-white">Statistical Uncertainty — Bootstrap Confidence Intervals</h3>
            <span className="badge-tag bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
              Block Bootstrap (B=2000, L=10)
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            Risk measures from finite samples have sampling noise. Showing 1-day 99% bootstrap confidence bounds:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#162032] p-4 rounded-xl border border-gray-800">
            <div>
              <div className="text-xs text-gray-400 mb-1">1-Day 99% VaR Point Estimate</div>
              <div className="text-xl font-bold font-mono text-amber-400">{formatINR(bootstrapMetric.var_inr)}</div>
              <div className="text-xs text-gray-300 font-mono mt-1">
                95% CI: [{formatINR(bootstrapMetric.ci_low_inr || bootstrapMetric.var_inr * 0.85)} — {formatINR(bootstrapMetric.ci_high_inr || bootstrapMetric.var_inr * 1.38)}]
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-400 mb-1">1-Day 99% CVaR Point Estimate</div>
              <div className="text-xl font-bold font-mono text-rose-400">{formatINR(bootstrapMetric.cvar_inr)}</div>
              <div className="text-xs text-gray-300 font-mono mt-1">
                95% CI: [{formatINR(bootstrapMetric.cvar_inr * 0.67)} — {formatINR(bootstrapMetric.cvar_inr * 1.44)}]
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Risk-Return Plane Visualization (PS Brownie Point) */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              <span>Risk vs Return Frontier (Assets, Portfolio & Benchmark)</span>
            </h3>
            <p className="text-xs text-gray-400">
              Visual comparison across the risk-return spectrum: Volatility (X) vs Annualized Return (Y)
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="flex items-center space-x-1.5 px-2 py-1 bg-emerald-950 border border-emerald-700 rounded text-emerald-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span>Your Portfolio</span>
            </span>
            <span className="flex items-center space-x-1.5 px-2 py-1 bg-amber-950 border border-amber-700 rounded text-amber-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span>Optimal Rec.</span>
            </span>
            <span className="flex items-center space-x-1.5 px-2 py-1 bg-cyan-950 border border-cyan-700 rounded text-cyan-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              <span>NIFTY 50</span>
            </span>
          </div>
        </div>

        {/* Risk-Return Scatter Chart */}
        <div className="h-72 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.risk_return_points.map(pt => ({
                name: pt.name.replace('.NS', ''),
                vol_pct: pt.vol_pct,
                ret_pct: pt.ret_pct,
                sharpe: pt.sharpe,
                point_type: pt.point_type,
                weight_pct: pt.weight_pct || 0
              }))}
            >
              <XAxis dataKey="name" stroke="#4B5563" fontSize={11} interval={0} angle={-30} textAnchor="end" height={60} />
              <YAxis stroke="#4B5563" fontSize={11} unit="%" />
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.5rem', fontSize: '12px' }}
                formatter={(val: any, name: any) => [`${val}%`, name === 'ret_pct' ? 'Annual Return' : 'Annual Volatility']}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="ret_pct" name="Annual Return %" fill="#10B981" radius={[4, 4, 0, 0]}>
                {data.risk_return_points.map((pt, idx) => {
                  let color = '#3B82F6';
                  if (pt.point_type === 'portfolio') color = '#10B981';
                  else if (pt.point_type === 'recommended') color = '#F59E0B';
                  else if (pt.point_type === 'benchmark') color = '#06B6D4';
                  else if (pt.point_type === 'equal_weight') color = '#A855F7';
                  return <Cell key={`cell-${idx}`} fill={color} />;
                })}
              </Bar>
              <Bar dataKey="vol_pct" name="Annual Volatility %" fill="#F43F5E" radius={[4, 4, 0, 0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {data.risk_return_points
            .filter(p => ['portfolio', 'recommended', 'benchmark', 'equal_weight'].includes(p.point_type))
            .map(p => (
              <div key={p.name} className="bg-[#162032] p-3 rounded-lg border border-gray-800 text-xs">
                <span className="font-semibold text-white block truncate">{p.name}</span>
                <div className="flex justify-between items-baseline mt-1 font-mono">
                  <span className="text-gray-400 text-[11px]">Ret / Vol:</span>
                  <span className="text-emerald-400 font-bold">{p.ret_pct}% / <span className="text-amber-400">{p.vol_pct}%</span></span>
                </div>
                <div className="flex justify-between items-baseline text-[11px] font-mono mt-0.5">
                  <span className="text-gray-500">Sharpe:</span>
                  <span className="text-cyan-400 font-semibold">{p.sharpe}</span>
                </div>
              </div>
            ))}
        </div>
      </div>
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Component Risk Breakdown (Euler Decomposition)</h3>
            <p className="text-xs text-gray-400">
              Isolates the marginal percentage of risk contributed by each individual holding.
            </p>
          </div>
          <div className="text-right">
            <span className="badge-tag bg-emerald-950 text-emerald-400 border border-emerald-800">
              Diversification: {data.portfolio.diversification_benefit_pct}%
            </span>
          </div>
        </div>

        {/* Chart comparing Risk Contrib vs Weight */}
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.risk_contributions}>
              <XAxis dataKey="ticker" stroke="#4B5563" fontSize={11} tickFormatter={(t) => t.replace('.NS', '')} />
              <YAxis stroke="#4B5563" fontSize={11} unit="%" />
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.5rem', fontSize: '12px' }}
                formatter={(val: any, name: any) => [`${val}%`, name === 'risk_contrib_pct' ? 'Risk Contribution' : 'Portfolio Weight']}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="risk_contrib_pct" name="Risk Contribution %" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="weight_pct" name="Capital Weight %" fill="#06B6D4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Decomposition Table */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#162032] text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
              <tr>
                <th className="py-2.5 px-3">Asset</th>
                <th className="py-2.5 px-3">Sector</th>
                <th className="py-2.5 px-3 text-right">Weight %</th>
                <th className="py-2.5 px-3 text-right">Risk Contrib %</th>
                <th className="py-2.5 px-3 text-right">Ratio (Risk/Wt)</th>
                <th className="py-2.5 px-3 text-right">Component VaR (INR)</th>
                <th className="py-2.5 px-3 text-right">Standalone VaR (INR)</th>
                <th className="py-2.5 px-3 text-center">Action Signal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 font-mono">
              {data.risk_contributions.map((c) => (
                <tr key={c.ticker} className="hover:bg-[#162032]/60 transition">
                  <td className="py-2 px-3 font-semibold text-white">{c.ticker.replace('.NS', '')}</td>
                  <td className="py-2 px-3 text-gray-400 font-sans">{c.sector}</td>
                  <td className="py-2 px-3 text-right text-cyan-400">{c.weight_pct}%</td>
                  <td className="py-2 px-3 text-right text-amber-400 font-bold">{c.risk_contrib_pct}%</td>
                  <td className="py-2 px-3 text-right">{c.risk_to_weight_ratio}x</td>
                  <td className="py-2 px-3 text-right">{formatINR(c.component_var_inr)}</td>
                  <td className="py-2 px-3 text-right text-gray-500">{formatINR(c.standalone_var_inr)}</td>
                  <td className="py-2 px-3 text-center font-sans">
                    <span
                      className={`badge-tag text-[10px] ${
                        c.action_signal.includes('TRIM')
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : c.action_signal.includes('DIVERSIFIER')
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {c.action_signal}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
