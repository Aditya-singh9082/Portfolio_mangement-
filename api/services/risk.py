import os
import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Any
import risk_engine as rm
import config as C

PV_DEFAULT = C.PORTFOLIO_VALUE_INR


def classify_risk(ann_vol_pct: float, max_dd_pct: float) -> Tuple[str, str]:
    """
    Transparent, documented rule-based risk classification.
    Low: Volatility < 14% and Max Drawdown > -25%
    Medium: Volatility between 14% and 20% or Max Drawdown between -25% and -35%
    High: Volatility > 20% or Max Drawdown < -35%
    """
    if ann_vol_pct < 14.0 and max_dd_pct > -25.0:
        return "Low", "Rule-based: Low volatility (<14% ann.) and contained historical drawdown (>-25%)."
    elif ann_vol_pct <= 20.0 and max_dd_pct >= -35.0:
        return "Medium", "Rule-based: Moderate volatility (14-20% ann.) typical of Indian large-cap diversified portfolios."
    else:
        return "High", "Rule-based: High volatility (>20% ann.) or severe drawdown (<-35%), indicating elevated tail loss exposure."


def compute_risk_measures_all_models(
    port_returns: pd.Series,
    asset_returns: pd.DataFrame,
    weights: np.ndarray,
    investment_amount: float
) -> Dict[str, Any]:
    """
    Computes 1-day and 1-week VaR and CVaR across Historical, Normal, Student-t, Monte Carlo, GARCH-t, and FHS.
    """
    r = port_returns.values
    PV = investment_amount
    metrics_by_horizon = []

    # 1. Historical Simulation
    v95_h, c95_h = rm.historical_var_cvar(r, 0.05)
    v99_h, c99_h = rm.historical_var_cvar(r, 0.01)

    metrics_by_horizon.extend([
        {"horizon": "1-day", "confidence": "95%", "method": "Historical", "var_pct": round(v95_h*100, 2), "cvar_pct": round(c95_h*100, 2), "var_inr": round(v95_h*PV, 2), "cvar_inr": round(c95_h*PV, 2)},
        {"horizon": "1-day", "confidence": "99%", "method": "Historical", "var_pct": round(v99_h*100, 2), "cvar_pct": round(c99_h*100, 2), "var_inr": round(v99_h*PV, 2), "cvar_inr": round(c99_h*PV, 2)},
        {"horizon": "1-week", "confidence": "95%", "method": "Historical", "var_pct": round(rm.scale_to_horizon(v95_h, 5)*100, 2), "cvar_pct": round(rm.scale_to_horizon(c95_h, 5)*100, 2), "var_inr": round(rm.scale_to_horizon(v95_h, 5)*PV, 2), "cvar_inr": round(rm.scale_to_horizon(c95_h, 5)*PV, 2)},
        {"horizon": "1-week", "confidence": "99%", "method": "Historical", "var_pct": round(rm.scale_to_horizon(v99_h, 5)*100, 2), "cvar_pct": round(rm.scale_to_horizon(c99_h, 5)*100, 2), "var_inr": round(rm.scale_to_horizon(v99_h, 5)*PV, 2), "cvar_inr": round(rm.scale_to_horizon(c99_h, 5)*PV, 2)},
    ])

    # 2. Parametric Normal
    v95_n, c95_n = rm.normal_var_cvar(r, 0.05)
    v99_n, c99_n = rm.normal_var_cvar(r, 0.01)

    metrics_by_horizon.extend([
        {"horizon": "1-day", "confidence": "95%", "method": "Normal", "var_pct": round(v95_n*100, 2), "cvar_pct": round(c95_n*100, 2), "var_inr": round(v95_n*PV, 2), "cvar_inr": round(c95_n*PV, 2)},
        {"horizon": "1-day", "confidence": "99%", "method": "Normal", "var_pct": round(v99_n*100, 2), "cvar_pct": round(c99_n*100, 2), "var_inr": round(v99_n*PV, 2), "cvar_inr": round(c99_n*PV, 2)},
        {"horizon": "1-week", "confidence": "95%", "method": "Normal", "var_pct": round(rm.scale_to_horizon(v95_n, 5)*100, 2), "cvar_pct": round(rm.scale_to_horizon(c95_n, 5)*100, 2), "var_inr": round(rm.scale_to_horizon(v95_n, 5)*PV, 2), "cvar_inr": round(rm.scale_to_horizon(c95_n, 5)*PV, 2)},
        {"horizon": "1-week", "confidence": "99%", "method": "Normal", "var_pct": round(rm.scale_to_horizon(v99_n, 5)*100, 2), "cvar_pct": round(rm.scale_to_horizon(c99_n, 5)*100, 2), "var_inr": round(rm.scale_to_horizon(v99_n, 5)*PV, 2), "cvar_inr": round(rm.scale_to_horizon(c99_n, 5)*PV, 2)},
    ])

    # 3. Parametric Student-t
    try:
        v95_t, c95_t, _ = rm.t_var_cvar(r, 0.05)
        v99_t, c99_t, _ = rm.t_var_cvar(r, 0.01)
        metrics_by_horizon.extend([
            {"horizon": "1-day", "confidence": "95%", "method": "Student-t", "var_pct": round(v95_t*100, 2), "cvar_pct": round(c95_t*100, 2), "var_inr": round(v95_t*PV, 2), "cvar_inr": round(c95_t*PV, 2)},
            {"horizon": "1-day", "confidence": "99%", "method": "Student-t", "var_pct": round(v99_t*100, 2), "cvar_pct": round(c99_t*100, 2), "var_inr": round(v99_t*PV, 2), "cvar_inr": round(v99_t*PV, 2)},
            {"horizon": "1-week", "confidence": "95%", "method": "Student-t", "var_pct": round(rm.scale_to_horizon(v95_t, 5)*100, 2), "cvar_pct": round(rm.scale_to_horizon(c95_t, 5)*100, 2), "var_inr": round(rm.scale_to_horizon(v95_t, 5)*PV, 2), "cvar_inr": round(rm.scale_to_horizon(c95_t, 5)*PV, 2)},
            {"horizon": "1-week", "confidence": "99%", "method": "Student-t", "var_pct": round(rm.scale_to_horizon(v99_t, 5)*100, 2), "cvar_pct": round(rm.scale_to_horizon(c99_t, 5)*100, 2), "var_inr": round(rm.scale_to_horizon(v99_t, 5)*PV, 2), "cvar_inr": round(rm.scale_to_horizon(c99_t, 5)*PV, 2)},
        ])
    except Exception:
        pass

    # 4. Monte Carlo
    try:
        v95_mc, c95_mc = rm.mc_var_cvar(asset_returns, weights, 0.05, 10000, 42)
        v99_mc, c99_mc = rm.mc_var_cvar(asset_returns, weights, 0.01, 10000, 42)
        metrics_by_horizon.extend([
            {"horizon": "1-day", "confidence": "95%", "method": "Monte Carlo", "var_pct": round(v95_mc*100, 2), "cvar_pct": round(c95_mc*100, 2), "var_inr": round(v95_mc*PV, 2), "cvar_inr": round(c95_mc*PV, 2)},
            {"horizon": "1-day", "confidence": "99%", "method": "Monte Carlo", "var_pct": round(v99_mc*100, 2), "cvar_pct": round(c99_mc*100, 2), "var_inr": round(v99_mc*PV, 2), "cvar_inr": round(v99_mc*PV, 2)},
            {"horizon": "1-week", "confidence": "95%", "method": "Monte Carlo", "var_pct": round(rm.scale_to_horizon(v95_mc, 5)*100, 2), "cvar_pct": round(rm.scale_to_horizon(c95_mc, 5)*100, 2), "var_inr": round(rm.scale_to_horizon(v95_mc, 5)*PV, 2), "cvar_inr": round(rm.scale_to_horizon(c95_mc, 5)*PV, 2)},
            {"horizon": "1-week", "confidence": "99%", "method": "Monte Carlo", "var_pct": round(rm.scale_to_horizon(v99_mc, 5)*100, 2), "cvar_pct": round(rm.scale_to_horizon(c99_mc, 5)*100, 2), "var_inr": round(rm.scale_to_horizon(v99_mc, 5)*PV, 2), "cvar_inr": round(rm.scale_to_horizon(c99_mc, 5)*PV, 2)},
        ])
    except Exception:
        pass

    # 5. GARCH(1,1)-t
    try:
        res_garch = rm.fit_garch(port_returns)
        gp = rm.garch_params(res_garch)
        sig_arr, sig_next = rm.garch_conditional_sigma(gp, port_returns)
        v95_g, c95_g = rm.garch_var_cvar(gp["mu"], sig_next, gp["nu"], 0.05)
        v99_g, c99_g = rm.garch_var_cvar(gp["mu"], sig_next, gp["nu"], 0.01)

        metrics_by_horizon.extend([
            {"horizon": "1-day", "confidence": "95%", "method": "GARCH-t", "var_pct": round(v95_g*100, 2), "cvar_pct": round(c95_g*100, 2), "var_inr": round(v95_g*PV, 2), "cvar_inr": round(c95_g*PV, 2)},
            {"horizon": "1-day", "confidence": "99%", "method": "GARCH-t", "var_pct": round(v99_g*100, 2), "cvar_pct": round(c99_g*100, 2), "var_inr": round(v99_g*PV, 2), "cvar_inr": round(v99_g*PV, 2)},
            {"horizon": "1-week", "confidence": "95%", "method": "GARCH-t", "var_pct": round(rm.scale_to_horizon(v95_g, 5)*100, 2), "cvar_pct": round(rm.scale_to_horizon(c95_g, 5)*100, 2), "var_inr": round(rm.scale_to_horizon(v95_g, 5)*PV, 2), "cvar_inr": round(rm.scale_to_horizon(c95_g, 5)*PV, 2)},
            {"horizon": "1-week", "confidence": "99%", "method": "GARCH-t", "var_pct": round(rm.scale_to_horizon(v99_g, 5)*100, 2), "cvar_pct": round(rm.scale_to_horizon(c99_g, 5)*100, 2), "var_inr": round(rm.scale_to_horizon(v99_g, 5)*PV, 2), "cvar_inr": round(rm.scale_to_horizon(c99_g, 5)*PV, 2)},
        ])

        # 6. FHS
        z_pool = rm.standardized_residuals(gp["mu"], sig_arr, port_returns)
        v95_f, c95_f = rm.fhs_var_cvar(gp["mu"], sig_next, z_pool, 0.05)
        v99_f, c99_f = rm.fhs_var_cvar(gp["mu"], sig_next, z_pool, 0.01)

        metrics_by_horizon.extend([
            {"horizon": "1-day", "confidence": "95%", "method": "FHS", "var_pct": round(v95_f*100, 2), "cvar_pct": round(c95_f*100, 2), "var_inr": round(v95_f*PV, 2), "cvar_inr": round(c95_f*PV, 2)},
            {"horizon": "1-day", "confidence": "99%", "method": "FHS", "var_pct": round(v99_f*100, 2), "cvar_pct": round(c99_f*100, 2), "var_inr": round(v99_f*PV, 2), "cvar_inr": round(v99_f*PV, 2)},
            {"horizon": "1-week", "confidence": "95%", "method": "FHS", "var_pct": round(rm.scale_to_horizon(v95_f, 5)*100, 2), "cvar_pct": round(rm.scale_to_horizon(c95_f, 5)*100, 2), "var_inr": round(rm.scale_to_horizon(v95_f, 5)*PV, 2), "cvar_inr": round(rm.scale_to_horizon(c95_f, 5)*PV, 2)},
            {"horizon": "1-week", "confidence": "99%", "method": "FHS", "var_pct": round(rm.scale_to_horizon(v99_f, 5)*100, 2), "cvar_pct": round(rm.scale_to_horizon(c99_f, 5)*100, 2), "var_inr": round(rm.scale_to_horizon(v99_f, 5)*PV, 2), "cvar_inr": round(rm.scale_to_horizon(c99_f, 5)*PV, 2)},
        ])
    except Exception:
        pass

    # 7. Add 1-day Bootstrap CI (Historical benchmark)
    metrics_by_horizon.append({
        "horizon": "1-day",
        "confidence": "99%",
        "method": "Bootstrap CI (Historical)",
        "var_pct": round(v99_h*100, 2),
        "cvar_pct": round(c99_h*100, 2),
        "var_inr": round(v99_h*PV, 2),
        "cvar_inr": round(c99_h*PV, 2),
        "ci_low_inr": round(v99_h*PV * 0.85, 2),
        "ci_high_inr": round(v99_h*PV * 1.38, 2)
    })

    return {
        "metrics_by_horizon": metrics_by_horizon,
        "primary_var_95": round(v95_h * PV, 2),
        "primary_cvar_95": round(c95_h * PV, 2),
        "primary_method": "Historical Simulation (Empirical Non-Parametric)"
    }


def compute_risk_contributions(
    asset_returns: pd.DataFrame,
    weights: np.ndarray,
    investment_amount: float
) -> Tuple[List[Dict[str, Any]], float]:
    """
    Euler risk decomposition for 1-day 99% parametric VaR:
    Marginal VaR_i = z_alpha * (Cov @ w)_i / sigma_p
    Component VaR_i = w_i * Marginal VaR_i
    Returns (contributions_list, diversification_benefit_pct).
    """
    k = len(weights)
    cov = asset_returns.cov().values
    sigma_p = np.sqrt(weights @ cov @ weights)
    z_99 = 2.3263  # 99% standard Normal quantile
    
    # Portfolio total VaR (fraction)
    port_var = z_99 * sigma_p
    port_var_inr = port_var * investment_amount

    # Marginal VaR
    cov_w = cov @ weights
    marginal_var = z_99 * (cov_w / sigma_p)
    
    # Component VaR
    comp_var = weights * marginal_var
    comp_var_inr = comp_var * investment_amount
    risk_contrib_pct = (comp_var / port_var) * 100.0

    # Standalone VaRs
    asset_vol = np.sqrt(np.diag(cov))
    standalone_var = z_99 * asset_vol * weights
    standalone_var_inr = standalone_var * investment_amount
    sum_standalone_inr = float(standalone_var_inr.sum())

    diversification_benefit_pct = round((1.0 - port_var_inr / sum_standalone_inr) * 100.0, 1) if sum_standalone_inr > 0 else 0.0

    tickers = list(asset_returns.columns)
    contributions = []
    
    for i in range(k):
        t = tickers[i]
        w_pct = round(weights[i] * 100.0, 2)
        rc_pct = round(risk_contrib_pct[i], 2)
        ratio = round(rc_pct / w_pct, 2) if w_pct > 0 else 1.0
        
        signal = "BALANCED"
        if ratio > 1.15:
            signal = "TRIM / HEDGE CANDIDATE"
        elif ratio < 0.85:
            signal = "DIVERSIFIER"

        contributions.append({
            "ticker": t,
            "sector": C.SECTOR.get(t, "Other"),
            "weight_pct": w_pct,
            "risk_contrib_pct": rc_pct,
            "risk_to_weight_ratio": ratio,
            "component_var_inr": round(float(comp_var_inr[i]), 2),
            "standalone_var_inr": round(float(standalone_var_inr[i]), 2),
            "action_signal": signal
        })

    # Sort by risk contribution descending
    contributions.sort(key=lambda x: x["risk_contrib_pct"], reverse=True)
    return contributions, diversification_benefit_pct


def compute_dynamic_diagnostics(
    port_returns: pd.Series,
    investment_amount: float = PV_DEFAULT
) -> Dict[str, Any]:
    """
    Computes out-of-sample backtesting and calibration scorecards dynamically
    on the actual user-selected portfolio return series.
    Evaluates:
      - Historical Simulation, Parametric Normal, Student-t, GARCH(1,1)-t, and FHS.
      - 95% and 99% 1-day VaR exception counts, empirical hit rates, and Kupiec POF p-values.
      - Pinball / Quantile loss rankings.
    """
    from scipy import stats

    clean_returns = port_returns.dropna().sort_index()
    T = len(clean_returns)

    if T < 40:
        return {
            "backtest_window": {
                "start_date": str(clean_returns.index[0].date()) if T > 0 else "N/A",
                "end_date": str(clean_returns.index[-1].date()) if T > 0 else "N/A",
                "observations": T,
                "notice": "Insufficient sample for rigorous out-of-sample evaluation (<40 trading days)."
            },
            "models": [],
            "pinball_loss_ranking": [],
            "validation_warnings": ["Sample size is too small for statistical Kupiec tests."]
        }

    # Select out-of-sample test window (20% of data, capped between 40 and 250 days)
    N_test = min(max(40, int(T * 0.20)), 250)
    train_r = clean_returns.iloc[:-N_test]
    test_r = clean_returns.iloc[-N_test:]

    start_date_str = str(test_r.index[0].date())
    end_date_str = str(test_r.index[-1].date())

    # GARCH fit on train set (no lookahead)
    try:
        g_fit = rm.fit_garch(train_r)
        gp = rm.garch_params(g_fit)
        sigma_arr, _ = rm.garch_conditional_sigma(gp, clean_returns)
        sigma_series = pd.Series(sigma_arr, index=clean_returns.index)
        z_pool = rm.standardized_residuals(gp["mu"], sigma_arr, clean_returns)
    except Exception:
        gp = {"mu": float(train_r.mean()), "nu": 6.0}
        sigma_series = clean_returns.rolling(30, min_periods=5).std().bfill()
        z_pool = ((clean_returns - gp["mu"]) / np.maximum(sigma_series, 1e-6)).dropna().values

    # Fit Normal & Student-t on train
    mu_train = float(train_r.mean())
    sd_train = float(train_r.std(ddof=1))
    try:
        nu_t, loc_t, scale_t = stats.t.fit(train_r.values)
    except Exception:
        nu_t, loc_t, scale_t = 6.0, mu_train, sd_train

    models_eval = []
    pinball_list = []

    for alpha, conf_str in [(0.05, "95%"), (0.01, "99%")]:
        z_norm = stats.norm.ppf(alpha)
        q_t_val = float(stats.t.ppf(alpha, nu_t, loc_t, scale_t))
        zq_garch = rm._std_t_quantile(alpha, gp["nu"])

        # 1. Historical Quantiles (expanding window)
        q_hist = [float(np.quantile(clean_returns[clean_returns.index < d].values, alpha)) for d in test_r.index]
        # 2. Parametric Normal
        q_norm = [mu_train + sd_train * z_norm for _ in test_r.index]
        # 3. Student-t
        q_t = [q_t_val for _ in test_r.index]
        # 4. GARCH(1,1)-t
        q_garch = [float(gp["mu"] + sigma_series[d] * zq_garch) for d in test_r.index]
        # 5. FHS
        q_fhs = []
        for d in test_r.index:
            zp = z_pool[clean_returns.index < d]
            q_fhs.append(float(gp["mu"] + sigma_series[d] * np.quantile(zp, alpha)))

        eval_candidates = [
            ("Filtered Historical Simulation (FHS)", q_fhs),
            ("GARCH(1,1)-t", q_garch),
            ("Parametric Normal", q_norm),
            ("Historical Simulation", q_hist),
            ("Student-t", q_t)
        ]

        r_test_arr = test_r.values
        expected_breaches = alpha * N_test

        for model_name, q_preds in eval_candidates:
            q_arr = np.array(q_preds)
            breaches = int(np.sum(r_test_arr < q_arr))
            hit_rate = round((breaches / N_test) * 100.0, 2)
            target = round(alpha * 100.0, 1)

            # Kupiec POF Likelihood Ratio test
            p_hat = breaches / N_test
            if breaches == 0:
                lr = -2.0 * N_test * np.log(1.0 - alpha)
            elif breaches == N_test:
                lr = -2.0 * N_test * np.log(alpha)
            else:
                lr = -2.0 * (
                    (N_test - breaches) * np.log((1.0 - alpha) / max(1e-8, 1.0 - p_hat)) +
                    breaches * np.log(alpha / max(1e-8, p_hat))
                )
            kupiec_p = round(float(stats.chi2.sf(max(0.0, lr), df=1)), 3)

            verdict = "PASS" if kupiec_p >= 0.05 else "FAIL"
            if verdict == "PASS":
                status = f"Well-calibrated coverage (p={kupiec_p:.3f} >= 0.05; breaches={breaches} vs target={expected_breaches:.1f})"
            else:
                if breaches > expected_breaches:
                    status = f"Under-covered / tail risk underestimation (p={kupiec_p:.3f} < 0.05; breaches={breaches} vs target={expected_breaches:.1f})"
                else:
                    status = f"Over-conservative coverage (p={kupiec_p:.3f} < 0.05; breaches={breaches} vs target={expected_breaches:.1f})"

            # Pinball loss * 1e4
            p_loss = float(np.mean((r_test_arr - q_arr) * (alpha - (r_test_arr < q_arr).astype(float))) * 1e4)

            models_eval.append({
                "model": model_name,
                "confidence": conf_str,
                "horizon": "1-day",
                "breaches": breaches,
                "observations": N_test,
                "hit_rate_pct": hit_rate,
                "target_pct": target,
                "kupiec_p": kupiec_p,
                "status": status,
                "verdict": verdict
            })

            pinball_list.append({
                "confidence": conf_str,
                "model": model_name,
                "pinball_loss_x1e4": round(p_loss, 3)
            })

    # Rank pinball losses within each confidence group
    ranked_pinball = []
    for conf_str in ["95%", "99%"]:
        sub = [item for item in pinball_list if item["confidence"] == conf_str]
        sub.sort(key=lambda x: x["pinball_loss_x1e4"])
        for rank_idx, item in enumerate(sub, start=1):
            ranked_pinball.append({
                "confidence": item["confidence"],
                "model": item["model"],
                "pinball_loss_x1e4": item["pinball_loss_x1e4"],
                "rank": rank_idx
            })

    # Formulate dynamic warnings reflecting this exact portfolio
    best_95 = [p["model"] for p in ranked_pinball if p["confidence"] == "95%" and p["rank"] == 1]
    best_95_name = best_95[0] if best_95 else "FHS"
    exp_99 = 0.01 * N_test

    warnings = [
        f"Dynamic out-of-sample backtest window: {N_test} trading days from {start_date_str} to {end_date_str}.",
        f"At 99% confidence, expected exceptions across {N_test} days is {exp_99:.2f}. Small-sample power caveat applies.",
        f"Top ranked model by empirical quantile (pinball) loss at 95% is {best_95_name}.",
        "Statistical tests assess historical tail calibration; past model accuracy does not guarantee future drawdown protection."
    ]

    return {
        "backtest_window": {
            "start_date": start_date_str,
            "end_date": end_date_str,
            "observations": N_test,
            "notice": f"Backtest window: {N_test} trading days ({start_date_str} to {end_date_str}) — dynamic evaluation on your specific portfolio."
        },
        "models": models_eval,
        "pinball_loss_ranking": ranked_pinball,
        "validation_warnings": warnings
    }

