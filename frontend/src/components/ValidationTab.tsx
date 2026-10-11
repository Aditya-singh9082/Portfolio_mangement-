import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Layers,
  Award,
  Calendar,
  ShieldAlert
} from 'lucide-react';
import { PortfolioAnalyzeResponse } from '../types';
import { formatINR } from '../lib/api';

interface ValidationTabProps {
  data: PortfolioAnalyzeResponse;
}

export const ValidationTab: React.FC<ValidationTabProps> = ({ data }) => {
  const diag = data.model_diagnostics;
  const models = diag.models;
  const pinball = diag.pinball_loss_ranking;

  const pinball95 = pinball.filter(p => p.confidence === '95%').sort((a, b) => a.rank - b.rank);
  const pinball99 = pinball.filter(p => p.confidence === '99%').sort((a, b) => a.rank - b.rank);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Model Validation & Backtest Evidence</h2>
          </div>
          <p className="text-xs text-gray-400">
            Out-of-sample statistical backtesting, Kupiec POF tests, and pinball loss scoring.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="badge-tag bg-slate-800 text-slate-300">
            Window: {diag.backtest_window.start_date} &rarr; {diag.backtest_window.end_date}
          </span>
          <span className="badge-tag bg-cyan-950 text-cyan-400 border border-cyan-800">
            N = {diag.backtest_window.observations} Trading Days
          </span>
        </div>
      </div>

      {/* Prominent Sample Size Warning Banner (TASK requirement) */}
      <div className="bg-amber-950/40 border border-amber-800/80 rounded-xl p-4 text-xs text-amber-200 flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-amber-300 text-sm">Sample Size Caveat & Statistical Power Notice:</span>
          <p className="leading-relaxed text-gray-300">
            {diag.backtest_window.notice} At 99% confidence, expected exceptions across 65 trading days is only ~0.65 breaches. 
            Because expected breaches are under 1, statistical tests have very low power to reject false models. 
            <span className="text-amber-300 font-semibold"> A failure to reject a calibration test is indicative short-term evidence, NOT proof that a model is correct or calibrated for all market regimes.</span>
          </p>
        </div>
      </div>

      {/* Model-Specific Backtest Outcomes Table */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-sm space-y-4">
        <div className="border-b border-gray-800 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Model Calibration & Coverage Verification</h3>
            <p className="text-xs text-gray-400">
              Evaluating hit rate vs expected alpha and Kupiec Proportion-of-Failures (POF) p-values.
            </p>
          </div>
          <span className="text-xs text-gray-500 font-mono">Significance: &alpha; = 0.05</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#162032] text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
              <tr>
                <th className="py-2.5 px-3">Model</th>
                <th className="py-2.5 px-3">Conf. Level</th>
                <th className="py-2.5 px-3">Horizon</th>
                <th className="py-2.5 px-3 text-right">Sample (N)</th>
                <th className="py-2.5 px-3 text-right">Breaches (x)</th>
                <th className="py-2.5 px-3 text-right">Hit Rate %</th>
                <th className="py-2.5 px-3 text-right">Target %</th>
                <th className="py-2.5 px-3 text-right">Kupiec p-val</th>
                <th className="py-2.5 px-3 text-center">Status / Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 font-mono">
              {models.map((m, idx) => {
                const isPass = m.verdict === 'PASS';
                const isFail = m.verdict === 'FAIL';
                return (
                  <tr key={idx} className="hover:bg-[#162032]/60 transition">
                    <td className="py-2.5 px-3 font-semibold text-white font-sans">{m.model}</td>
                    <td className="py-2.5 px-3 text-cyan-400">{m.confidence}</td>
                    <td className="py-2.5 px-3 text-gray-400">{m.horizon}</td>
                    <td className="py-2.5 px-3 text-right text-gray-400">{m.observations}</td>
                    <td className={`py-2.5 px-3 text-right font-bold ${isFail ? 'text-rose-400' : 'text-gray-200'}`}>
                      {m.breaches}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold ${isFail ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {m.hit_rate_pct}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-500">{m.target_pct}%</td>
                    <td className={`py-2.5 px-3 text-right font-bold ${m.kupiec_p !== null && m.kupiec_p < 0.05 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {m.kupiec_p !== null ? m.kupiec_p.toFixed(3) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      <div className="flex items-center justify-center space-x-1.5">
                        {isPass ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        )}
                        <span
                          className={`badge-tag text-[9px] ${
                            isPass
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-[#162032] p-3 rounded-lg border border-gray-800 text-xs text-gray-400">
          <p className="leading-relaxed">
            <span className="font-semibold text-gray-300">Methodology Note: </span>
            Notice that <span className="text-rose-400 font-bold">GARCH(1,1)-t failed 95% coverage</span> (8 breaches / 66 days, 12.12%, p=0.021), whereas <span className="text-emerald-400 font-bold">Filtered Historical Simulation (FHS) passed 95% coverage</span> (3 breaches / 65 days, 4.62%, p=0.885). 
            They use different models and slightly different window cuts; we strictly report them separately rather than displaying a misleading blanket pass badge.
          </p>
        </div>
      </div>

      {/* Pinball / Quantile Loss Scorecard Table */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-sm space-y-4">
        <div className="border-b border-gray-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Forecast Skill Scorecard — Pinball (Quantile) Loss</span>
            </h3>
            <p className="text-xs text-gray-400">
              Scored using consistent quantile scoring function: L_&tau;(r, q) = (r - q)(&tau; - 1_&#123;r &lt; q&#125;).
            </p>
          </div>
          <span className="badge-tag bg-cyan-950 text-cyan-400 border border-cyan-800 text-xs">
            Lower Score is Strictly Better
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 95% Table */}
          <div className="bg-[#162032] border border-gray-800 rounded-xl p-4">
            <h4 className="text-xs font-bold text-white mb-3 uppercase tracking-wider text-cyan-400">
              95% Confidence Level Ranking
            </h4>
            <div className="space-y-2 font-mono text-xs">
              {pinball95.map((item) => (
                <div key={item.model} className="flex items-center justify-between p-2 rounded bg-[#111827] border border-gray-800/80">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-gray-300 flex items-center justify-center text-[10px] font-bold">
                      #{item.rank}
                    </span>
                    <span className="font-semibold text-white font-sans">{item.model}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-amber-400 font-bold">{item.pinball_loss_x1e4}</span>
                    <span className="text-[10px] text-gray-500 ml-1">&times; 10⁻⁴</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-500 mt-3 font-sans">
              Winner at 95%: <span className="text-emerald-400 font-semibold">Filtered Historical Simulation (FHS)</span> with lowest quantile penalty of 11.121.
            </p>
          </div>

          {/* 99% Table */}
          <div className="bg-[#162032] border border-gray-800 rounded-xl p-4">
            <h4 className="text-xs font-bold text-white mb-3 uppercase tracking-wider text-cyan-400">
              99% Confidence Level Ranking
            </h4>
            <div className="space-y-2 font-mono text-xs">
              {pinball99.map((item) => (
                <div key={item.model} className="flex items-center justify-between p-2 rounded bg-[#111827] border border-gray-800/80">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-gray-300 flex items-center justify-center text-[10px] font-bold">
                      #{item.rank}
                    </span>
                    <span className="font-semibold text-white font-sans">{item.model}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-amber-400 font-bold">{item.pinball_loss_x1e4}</span>
                    <span className="text-[10px] text-gray-500 ml-1">&times; 10⁻⁴</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-500 mt-3 font-sans">
              Winner at 99%: <span className="text-emerald-400 font-semibold">Historical Simulation</span> (2.945) followed by Student-t (2.968) and FHS (3.055).
            </p>
          </div>
        </div>
      </div>

      {/* Horizon Separation Summary Box */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Horizon Segregation & Metric Reference</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-300">
          <div className="bg-[#162032] p-3 rounded-lg border border-gray-800">
            <span className="font-bold text-white block mb-1">1-Day Metrics (Daily Risk Limit)</span>
            <ul className="space-y-1 text-gray-400 list-disc list-inside">
              <li>1-Day 95% VaR: ~₹1.24L (GARCH-t) to ₹1.72L (Normal)</li>
              <li>1-Day 99% VaR: ~₹2.01L (GARCH-t) to ₹2.76L (Historical)</li>
              <li>1-Day 99% Bootstrap CVaR: ₹4.56L [95% CI: ₹3.04L — ₹6.57L]</li>
            </ul>
          </div>

          <div className="bg-[#162032] p-3 rounded-lg border border-gray-800">
            <span className="font-bold text-white block mb-1">1-Week Metrics (Multi-Day Horizon)</span>
            <ul className="space-y-1 text-gray-400 list-disc list-inside">
              <li>1-Week 95% VaR: ~₹2.78L (GARCH-t) to ₹3.85L (Normal)</li>
              <li>1-Week 99% CVaR: ~₹5.70L (GARCH-t) to ₹10.20L (Historical)</li>
              <li>Notice: 1-Week CVaR is structurally ~2.2x to 2.5x larger than 1-Day CVaR.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
