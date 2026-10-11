import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Percent,
  Activity,
  Layers,
  ArrowUpRight,
  Info,
  Brain,
  Globe,
  Compass,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PortfolioAnalyzeResponse } from '../types';
import { formatINR } from '../lib/api';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

interface OverviewTabProps {
  data: PortfolioAnalyzeResponse;
  onNavigateToBuilder: () => void;
  onNavigateToRisk: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  data,
  onNavigateToBuilder,
  onNavigateToRisk
}) => {
  const p = data.portfolio;
  const r = data.risk;
  const bm = data.benchmark_metrics;
  const bc = data.benchmark_comparison;
  const ml = data.ml_risk_prediction;
  const ai = data.market_intelligence;

  const isPositivePnL = p.pnl_amount >= 0;

  // Top risk concentrators and diversifiers
  const concentrators = data.risk_contributions.filter(c => c.action_signal.includes("TRIM")).slice(0, 3);
  const diversifiers = data.risk_contributions.filter(c => c.action_signal.includes("DIVERSIFIER")).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Risk Profile & Top Banner */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h1 className="text-xl font-bold text-white tracking-tight">Portfolio Risk Intelligence Dashboard</h1>
            <span
              className={`badge-tag font-semibold ${
                r.classification === 'Low'
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700'
                  : r.classification === 'Medium'
                  ? 'bg-amber-950/80 text-amber-400 border border-amber-700'
                  : 'bg-rose-950/80 text-rose-400 border border-rose-700'
              }`}
            >
              Risk Class: {r.classification}
            </span>
            <span className="badge-tag bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center space-x-1">
              <Brain className="w-3 h-3 inline" />
              <span>ML: {ml.predicted_class} ({Math.round((ml.confidence_probabilities[ml.predicted_class] || 0.8) * 100)}%)</span>
            </span>
            <span className="badge-tag bg-slate-800 text-slate-300 border border-slate-700">
              {data.is_fallback_data ? 'Fallback CSV' : 'Live NSE Data'}
            </span>
          </div>
          <p className="text-xs text-gray-400 max-w-3xl leading-relaxed">
            {r.classification_details} Aligned with NIFTY 50 ({bm.ticker}) over {data.performance_series.length} evaluated trading dates.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onNavigateToBuilder}
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors flex items-center space-x-1.5"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Edit Holdings</span>
          </button>
          <button
            onClick={onNavigateToRisk}
            className="px-3.5 py-2 rounded-lg bg-[#1F293D] hover:bg-[#2A374F] text-gray-200 text-xs font-semibold border border-gray-700 transition-colors flex items-center space-x-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
            <span>Risk Breakdown</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Value & PnL */}
        <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-4 shadow-sm hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>Current Valuation</span>
            <span className="text-[11px] font-mono text-gray-500">Capital: {formatINR(p.investment_amount)}</span>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">{formatINR(p.latest_value)}</div>
          <div className="flex items-center mt-2 text-xs font-medium space-x-1">
            {isPositivePnL ? (
              <TrendingUp className="w-4 h-4 text-emerald-400 inline" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-400 inline" />
            )}
            <span className={isPositivePnL ? 'text-emerald-400' : 'text-rose-400 font-mono'}>
              {formatINR(p.pnl_amount)} ({p.total_return_pct > 0 ? '+' : ''}{p.total_return_pct}%)
            </span>
          </div>
        </div>

        {/* Volatility & Sharpe */}
        <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-4 shadow-sm hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>Volatility & Sharpe</span>
            <span className="text-[11px] text-gray-500 font-mono">252d Ann.</span>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {r.annualized_volatility_pct}%
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
            <span>Sharpe (Rf 6.5%):</span>
            <span className="font-semibold text-emerald-400 font-mono">{r.sharpe_ratio}</span>
          </div>
        </div>

        {/* Relative Alpha / Beta vs Benchmark */}
        <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-4 shadow-sm hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>Benchmark Relative</span>
            <span className="badge-tag bg-slate-800 text-cyan-400 text-[10px] py-0 px-1">Beta: {bc.beta}</span>
          </div>
          <div className={`text-2xl font-bold font-mono tracking-tight ${bc.alpha_pct >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {bc.alpha_pct >= 0 ? '+' : ''}{bc.alpha_pct}% <span className="text-xs font-normal text-gray-400">Alpha</span>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
            <span>Tracking Error:</span>
            <span className="text-gray-300 font-mono">{bc.tracking_error_pct}%</span>
          </div>
        </div>

        {/* Primary 1-Day 95% VaR */}
        <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-4 shadow-sm hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>1-Day 95% Tail Risk</span>
            <span className="badge-tag bg-cyan-950 text-cyan-400 text-[10px] py-0 px-1.5">VaR</span>
          </div>
          <div className="text-2xl font-bold text-amber-400 tracking-tight font-mono">
            {formatINR(r.var_95_amount)}
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
            <span>95% CVaR (Expected Shortfall):</span>
            <span className="text-rose-400 font-mono font-medium">{formatINR(r.cvar_95_amount)}</span>
          </div>
        </div>
      </div>

      {/* Machine Learning Risk Classification & Explanation Section */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Machine Learning Risk Classification & Attribution</h2>
              <p className="text-xs text-gray-400">Trained Random Forest 9-Factor Classifier predicting tail risk regime</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">Class Probabilities:</span>
            <span className="badge-tag bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
              Low: {Math.round((ml.confidence_probabilities["Low"] || 0) * 100)}%
            </span>
            <span className="badge-tag bg-amber-950 text-amber-400 border border-amber-800 font-mono">
              Medium: {Math.round((ml.confidence_probabilities["Medium"] || 0) * 100)}%
            </span>
            <span className="badge-tag bg-rose-950 text-rose-400 border border-rose-700 font-mono">
              High: {Math.round((ml.confidence_probabilities["High"] || 0) * 100)}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Explanation narrative */}
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-[#162032] p-4 rounded-xl border border-gray-800 text-xs text-gray-200 leading-relaxed">
              <div className="font-semibold text-cyan-400 mb-1 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Explainable Decision Rationale:</span>
              </div>
              <p>{ml.explanation}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="bg-[#162032]/60 p-2.5 rounded-lg border border-gray-800/80 text-center">
                <span className="text-[10px] text-gray-400 block">Ann. Volatility</span>
                <span className="text-xs font-mono font-bold text-white">{ml.calculated_features.annualized_volatility_pct}%</span>
              </div>
              <div className="bg-[#162032]/60 p-2.5 rounded-lg border border-gray-800/80 text-center">
                <span className="text-[10px] text-gray-400 block">Max Drawdown</span>
                <span className="text-xs font-mono font-bold text-rose-400">{ml.calculated_features.max_drawdown_pct}%</span>
              </div>
              <div className="bg-[#162032]/60 p-2.5 rounded-lg border border-gray-800/80 text-center">
                <span className="text-[10px] text-gray-400 block">Div. Ratio</span>
                <span className="text-xs font-mono font-bold text-emerald-400">{ml.calculated_features.diversification_ratio}x</span>
              </div>
              <div className="bg-[#162032]/60 p-2.5 rounded-lg border border-gray-800/80 text-center">
                <span className="text-[10px] text-gray-400 block">Benchmark Beta</span>
                <span className="text-xs font-mono font-bold text-cyan-400">{ml.calculated_features.beta_to_benchmark}</span>
              </div>
            </div>
          </div>

          {/* Feature Importances */}
          <div className="bg-[#162032] p-4 rounded-xl border border-gray-800 space-y-2">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">Key Factor Importance</h3>
            <div className="space-y-2 text-xs">
              {ml.feature_attribution.slice(0, 5).map(f => (
                <div key={f.feature} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-300">{f.display_name}</span>
                    <span className="text-cyan-400 font-mono">{f.model_weight_pct}% weight</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-cyan-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, f.model_weight_pct * 2.5)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart + Top Signals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart Preview */}
        <div className="lg:col-span-2 bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">Cumulative Growth vs NIFTY 50</h2>
              <p className="text-xs text-gray-400">Historical wealth progression normalized to initial investment</p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1.5 text-emerald-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span>Portfolio</span>
              </span>
              <span className="flex items-center space-x-1.5 text-cyan-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block"></span>
                <span>NIFTY 50</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.performance_series}>
                <defs>
                  <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#4B5563" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#4B5563"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.5rem', fontSize: '12px' }}
                  formatter={(val: any) => [formatINR(Number(val)), 'Valuation']}
                  labelStyle={{ color: '#9CA3AF' }}
                />
                <Area type="monotone" dataKey="portfolio_value" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#portGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Concentration & Diversification Card */}
        <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white tracking-tight">Risk Drivers & Signals</h2>
              <span className="badge-tag bg-emerald-950 text-emerald-400 border border-emerald-800">
                Div Benefit: {p.diversification_benefit_pct}%
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Euler decomposition isolates which holdings carry disproportionate marginal tail risk.
            </p>

            {/* Concentrators */}
            <div className="mb-4">
              <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
                <span>Concentration Candidates (Risk &gt; Weight)</span>
              </div>
              <div className="space-y-2">
                {concentrators.map(c => (
                  <div key={c.ticker} className="flex items-center justify-between bg-[#162032] p-2 rounded-lg border border-amber-900/40 text-xs">
                    <div>
                      <span className="font-semibold text-white">{c.ticker.replace('.NS', '')}</span>
                      <span className="text-[11px] text-gray-400 ml-1.5">({c.sector})</span>
                    </div>
                    <div className="text-right">
                      <span className="text-amber-400 font-mono font-medium">{c.risk_contrib_pct}% risk</span>
                      <span className="text-[10px] text-gray-400 ml-1">/ {c.weight_pct}% wt</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Diversifiers */}
            <div>
              <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                Strong Diversifiers (Risk &lt; Weight)
              </div>
              <div className="space-y-2">
                {diversifiers.map(d => (
                  <div key={d.ticker} className="flex items-center justify-between bg-[#162032] p-2 rounded-lg border border-emerald-900/40 text-xs">
                    <div>
                      <span className="font-semibold text-white">{d.ticker.replace('.NS', '')}</span>
                      <span className="text-[11px] text-gray-400 ml-1.5">({d.sector})</span>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-400 font-mono font-medium">{d.risk_contrib_pct}% risk</span>
                      <span className="text-[10px] text-gray-400 ml-1">/ {d.weight_pct}% wt</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-800 text-[11px] text-gray-400 flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Diversification offsets standalone risk by {p.diversification_benefit_pct}%.</span>
          </div>
        </div>
      </div>

      {/* AI Market Intelligence & Macro Regime Card */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">AI Market Intelligence & Macro Regime Context</h2>
              <p className="text-xs text-gray-400">Macroeconomic sentiment and sector trend evaluation tailored to your holdings</p>
            </div>
          </div>
          <span className="badge-tag bg-cyan-950 text-cyan-400 border border-cyan-800 text-xs font-semibold">
            Outlook: {ai.overall_outlook}
          </span>
        </div>

        {/* Macro Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {ai.macro_indicators.map((m, idx) => (
            <div key={idx} className="bg-[#162032] p-3 rounded-xl border border-gray-800/80 space-y-1">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block">{m.indicator}</span>
              <div className="text-base font-bold font-mono text-white">{m.value}</div>
              <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-medium ${
                m.sentiment === 'Bullish'
                  ? 'bg-emerald-950 text-emerald-400'
                  : m.sentiment === 'Cautious'
                  ? 'bg-rose-950 text-rose-400'
                  : 'bg-cyan-950 text-cyan-400'
              }`}>
                {m.stance}
              </span>
              <p className="text-[11px] text-gray-400 leading-tight pt-1">{m.impact}</p>
            </div>
          ))}
        </div>

        {/* Sector breakdowns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {ai.sector_analyses.map((sec, idx) => (
            <div key={idx} className="bg-[#162032] p-3.5 rounded-xl border border-gray-800 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-white text-xs">{sec.sector}</span>
                  <span className="badge-tag bg-slate-800 text-slate-300 text-[10px]">{sec.weight_pct}% Portfolio</span>
                  <span className={`badge-tag text-[10px] ${
                    sec.sentiment.includes('Bullish') ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                  }`}>{sec.sentiment}</span>
                </div>
                <p className="text-[11px] text-gray-300"><span className="text-emerald-400 font-medium">Catalysts: </span>{sec.catalysts}</p>
                <p className="text-[11px] text-gray-400"><span className="text-rose-400 font-medium">Risks: </span>{sec.key_risks}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimers & Notes */}
      <div className="bg-[#111827]/70 border border-[#1F293D] rounded-lg p-3 text-xs text-gray-400 space-y-1">
        {data.warnings.map((w, idx) => (
          <div key={idx} className="flex items-start space-x-2">
            <span className="text-cyan-400 font-mono">•</span>
            <span>{w}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
