import React from 'react';
import {
  TrendingUp,
  Activity,
  Layers,
  ArrowUpRight,
  Info
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
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">Performance & Backtest Comparison</h2>
          <p className="text-xs text-gray-400">
            Historical portfolio trajectories aligned to common trading dates with NIFTY 50 benchmark.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="badge-tag bg-cyan-950 text-cyan-400 border border-cyan-800">
            Benchmark: ^NSEI
          </span>
          <span className="badge-tag bg-slate-800 text-slate-300">
            Aligned Dates: {data.performance_series.length} points
          </span>
        </div>
      </div>

      {/* Main Cumulative Growth Chart */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Cumulative Return % Comparison</h3>
            <p className="text-xs text-gray-400">Portfolio Return % vs NIFTY 50 over historical period</p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.performance_series}>
              <XAxis dataKey="date" stroke="#4B5563" fontSize={11} tickLine={false} />
              <YAxis stroke="#4B5563" fontSize={11} unit="%" tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.5rem', fontSize: '12px' }}
                formatter={(val: any, name: any) => [`${val}%`, name === 'portfolio_return_pct' ? 'Portfolio Return' : 'NIFTY 50 Return']}
                labelStyle={{ color: '#9CA3AF' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="portfolio_return_pct" name="User Portfolio" stroke="#10B981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="benchmark_return_pct" name="NIFTY 50 Benchmark" stroke="#06B6D4" strokeWidth={2} strokeDasharray="3 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Drawdown Curve */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Historical Drawdown Profile</h3>
            <p className="text-xs text-gray-400">Peak-to-trough drawdown evolution</p>
          </div>
          <span className="text-xs font-mono font-bold text-rose-400">
            Max Drawdown: {data.risk.max_drawdown_pct}%
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
                formatter={(val: any) => [`${val}%`, 'Drawdown']}
                labelStyle={{ color: '#9CA3AF' }}
              />
              <Area type="monotone" dataKey="drawdown_pct" stroke="#F43F5E" strokeWidth={1.5} fill="url(#ddGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Strategy Comparison Matrix */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-sm space-y-4">
        <div className="border-b border-gray-800 pb-3">
          <h3 className="text-sm font-semibold text-white">Strategy Comparison Matrix</h3>
          <p className="text-xs text-gray-400">
            Comparing User Allocation against Equal-Weighting, Markowitz Recommended Allocation, and NIFTY 50.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#162032] text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
              <tr>
                <th className="py-2.5 px-3">Strategy</th>
                <th className="py-2.5 px-3 text-right">Total Return %</th>
                <th className="py-2.5 px-3 text-right">Ann. Volatility %</th>
                <th className="py-2.5 px-3 text-right">Sharpe Ratio</th>
                <th className="py-2.5 px-3 text-right">Max Drawdown %</th>
                <th className="py-2.5 px-3 text-right">1-Day 95% VaR (INR)</th>
                <th className="py-2.5 px-3 text-right">1-Day 95% CVaR (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 font-mono">
              {data.strategies.map((s, idx) => (
                <tr key={idx} className="hover:bg-[#162032]/60 transition">
                  <td className="py-2.5 px-3 font-semibold text-white font-sans">{s.name}</td>
                  <td className={`py-2.5 px-3 text-right ${s.total_return_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {s.total_return_pct}%
                  </td>
                  <td className="py-2.5 px-3 text-right text-gray-300">{s.annualized_vol_pct}%</td>
                  <td className="py-2.5 px-3 text-right text-cyan-400 font-bold">{s.sharpe_ratio}</td>
                  <td className="py-2.5 px-3 text-right text-rose-400">{s.max_drawdown_pct}%</td>
                  <td className="py-2.5 px-3 text-right text-amber-400">{formatINR(s.var_95_1d_inr)}</td>
                  <td className="py-2.5 px-3 text-right text-rose-300">{formatINR(s.cvar_95_1d_inr)}</td>
                </tr>
              ))}
              {/* Benchmark Row */}
              <tr className="bg-[#162032]/40 font-semibold border-t-2 border-gray-700">
                <td className="py-2.5 px-3 text-cyan-400 font-sans">NIFTY 50 Benchmark (^NSEI)</td>
                <td className="py-2.5 px-3 text-right text-emerald-400">{data.benchmark_metrics.total_return_pct}%</td>
                <td className="py-2.5 px-3 text-right text-gray-300">{data.benchmark_metrics.annualized_vol_pct}%</td>
                <td className="py-2.5 px-3 text-right text-cyan-400">{data.benchmark_metrics.sharpe_ratio}</td>
                <td className="py-2.5 px-3 text-right text-rose-400">{data.benchmark_metrics.max_drawdown_pct}%</td>
                <td className="py-2.5 px-3 text-right text-gray-500">—</td>
                <td className="py-2.5 px-3 text-right text-gray-500">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Constituent Assets Table */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-sm space-y-4">
        <div className="border-b border-gray-800 pb-3">
          <h3 className="text-sm font-semibold text-white">Constituent Asset Metrics</h3>
          <p className="text-xs text-gray-400">Individual historical performance metrics for active holdings</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#162032] text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
              <tr>
                <th className="py-2.5 px-3">Asset</th>
                <th className="py-2.5 px-3">Sector</th>
                <th className="py-2.5 px-3 text-right">Weight %</th>
                <th className="py-2.5 px-3 text-right">Latest Price</th>
                <th className="py-2.5 px-3 text-right">Ann. Return %</th>
                <th className="py-2.5 px-3 text-right">Ann. Volatility %</th>
                <th className="py-2.5 px-3 text-right">Sharpe</th>
                <th className="py-2.5 px-3 text-right">Max Drawdown %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 font-mono">
              {data.asset_metrics.map((a) => (
                <tr key={a.ticker} className="hover:bg-[#162032]/60 transition">
                  <td className="py-2 px-3 font-semibold text-white font-sans">{a.display_name} ({a.ticker.replace('.NS', '')})</td>
                  <td className="py-2 px-3 text-gray-400 font-sans">{a.sector}</td>
                  <td className="py-2 px-3 text-right text-cyan-400">{a.weight_pct}%</td>
                  <td className="py-2 px-3 text-right text-gray-200">{formatINR(a.latest_price)}</td>
                  <td className={`py-2 px-3 text-right ${a.annualized_return_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {a.annualized_return_pct}%
                  </td>
                  <td className="py-2 px-3 text-right text-gray-300">{a.annualized_vol_pct}%</td>
                  <td className="py-2 px-3 text-right text-cyan-400">{a.sharpe_ratio}</td>
                  <td className="py-2 px-3 text-right text-rose-400">{a.max_drawdown_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
