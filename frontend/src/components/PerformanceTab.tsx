import React from 'react';
import {
  TrendingUp,
  Activity,
  Layers,
  ArrowUpRight,
  Info,
  Award,
  Zap,
  CheckCircle,
  XCircle,
  BarChart3
} from 'lucide-react';
import { PortfolioAnalyzeResponse } from '../types';
import { formatINR } from '../lib/api';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

interface PerformanceTabProps {
  data: PortfolioAnalyzeResponse;
}

export const PerformanceTab: React.FC<PerformanceTabProps> = ({ data }) => {
  const p = data.portfolio;
  const r = data.risk;
  const bm = data.benchmark_metrics;
  const bc = data.benchmark_comparison;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">Historical Simulation & Benchmark Intelligence</h2>
          <p className="text-xs text-gray-400">
            Realized portfolio growth, risk-adjusted returns, and benchmark outperformance metrics against {bm.name}.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="badge-tag bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
            Benchmark: {bm.ticker}
          </span>
          <span className="badge-tag bg-slate-800 text-slate-300">
            {data.performance_series.length} Aligned Trading Days
          </span>
        </div>
      </div>

      {/* Relative Performance KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-4">
          <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
            <span>Jensen's Alpha</span>
            <span className={`badge-tag text-[9px] py-0 px-1 ${bc.outperforming_risk_adjusted ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'}`}>
              {bc.outperforming_risk_adjusted ? 'OUTPERFORMING' : 'NEUTRAL / LAGGING'}
            </span>
          </div>
          <div className={`text-2xl font-bold font-mono ${bc.alpha_pct >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {bc.alpha_pct >= 0 ? '+' : ''}{bc.alpha_pct}%
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Excess return over CAPM benchmark hurdle</p>
        </div>

        <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-4">
          <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
            <span>Portfolio Beta (&beta;)</span>
            <span className="text-gray-500 font-mono text-[10px]">Market Sensitivity</span>
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400">
            {bc.beta}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {bc.beta > 1.1 ? 'Aggressive / High Beta' : bc.beta < 0.9 ? 'Defensive / Low Beta' : 'Market-Aligned Beta'}
          </p>
        </div>

        <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-4">
          <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
            <span>Tracking Error</span>
            <span className="text-gray-500 font-mono text-[10px]">Ann. Vol of Excess Ret</span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {bc.tracking_error_pct}%
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Dispersion from benchmark return path</p>
        </div>

        <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-4">
          <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
            <span>Information Ratio</span>
            <span className="text-gray-500 font-mono text-[10px]">Alpha / Tracking Error</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {bc.information_ratio}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Consistency of active managerial alpha</p>
        </div>
      </div>

      {/* Main Cumulative Growth Chart */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Historical Simulation: Wealth Growth Trajectory</h3>
            <p className="text-xs text-gray-400">Simulated portfolio valuation vs {bm.name} on common trading dates</p>
          </div>
          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className="text-emerald-400 font-semibold">Port: {p.total_return_pct > 0 ? '+' : ''}{p.total_return_pct}%</span>
            <span className="text-gray-600">|</span>
            <span className="text-cyan-400 font-semibold">NIFTY: {bm.total_return_pct > 0 ? '+' : ''}{bm.total_return_pct}%</span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.performance_series}>
              <XAxis dataKey="date" stroke="#4B5563" fontSize={11} tickLine={false} />
              <YAxis stroke="#4B5563" fontSize={11} unit="%" tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.5rem', fontSize: '12px' }}
                formatter={(val: any, name: any) => [`${val}%`, name === 'portfolio_return_pct' ? 'Portfolio Return' : `${bm.name} Return`]}
                labelStyle={{ color: '#9CA3AF' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="portfolio_return_pct" name="Your Portfolio" stroke="#10B981" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="benchmark_return_pct" name={bm.name} stroke="#06B6D4" strokeWidth={2} strokeDasharray="3 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Drawdown Curve */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Historical Underwater Drawdown Profile</h3>
            <p className="text-xs text-gray-400">Peak-to-trough drawdown evolution across historical market regimes</p>
          </div>
          <span className="text-xs font-mono font-bold text-rose-400">
            Portfolio Max Drawdown: {r.max_drawdown_pct}% (Benchmark: {bm.max_drawdown_pct}%)
          </span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.performance_series}>
              <defs>
                <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#4B5563" fontSize={11} tickLine={false} />
              <YAxis stroke="#4B5563" fontSize={11} unit="%" domain={['dataMin', 0]} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.5rem', fontSize: '12px' }}
                formatter={(val: any) => [`${val}%`, 'Drawdown from Peak']}
                labelStyle={{ color: '#9CA3AF' }}
              />
              <Area type="monotone" dataKey="drawdown_pct" stroke="#F43F5E" strokeWidth={1.5} fillOpacity={1} fill="url(#ddGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Individual Asset Performance Table */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-sm space-y-4">
        <div className="border-b border-gray-800 pb-3">
          <h3 className="text-sm font-semibold text-white">Constituent Asset Performance & Risk Table</h3>
          <p className="text-xs text-gray-400">Historical performance statistics across identical date range</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#162032] text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
              <tr>
                <th className="py-2.5 px-3">Asset</th>
                <th className="py-2.5 px-3">Sector</th>
                <th className="py-2.5 px-3 text-right">Latest Price</th>
                <th className="py-2.5 px-3 text-right">Weight %</th>
                <th className="py-2.5 px-3 text-right">CAGR Return %</th>
                <th className="py-2.5 px-3 text-right">Ann. Volatility %</th>
                <th className="py-2.5 px-3 text-right">Sharpe</th>
                <th className="py-2.5 px-3 text-right">Max Drawdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 font-mono">
              {data.asset_metrics.map((a) => (
                <tr key={a.ticker} className="hover:bg-[#162032]/60 transition">
                  <td className="py-2.5 px-3 font-semibold text-white font-sans">
                    {a.display_name} <span className="text-[10px] text-gray-400 font-mono">({a.ticker.replace('.NS', '')})</span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-400 font-sans">{a.sector}</td>
                  <td className="py-2.5 px-3 text-right text-gray-200">₹{a.latest_price.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-3 text-right text-cyan-400">{a.weight_pct}%</td>
                  <td className={`py-2.5 px-3 text-right font-bold ${a.annualized_return_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {a.annualized_return_pct > 0 ? '+' : ''}{a.annualized_return_pct}%
                  </td>
                  <td className="py-2.5 px-3 text-right text-amber-400">{a.annualized_vol_pct}%</td>
                  <td className="py-2.5 px-3 text-right text-cyan-400">{a.sharpe_ratio}</td>
                  <td className="py-2.5 px-3 text-right text-rose-400">{a.max_drawdown_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
