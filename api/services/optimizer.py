import numpy as np
import pandas as pd
from scipy.optimize import minimize
from typing import Dict, List, Tuple, Any
from api.services.portfolio import compute_performance_metrics, RISK_FREE_RATE_ANNUAL, TRADING_DAYS
import risk_engine as rm


def run_markowitz_optimization(
    asset_returns: pd.DataFrame,
    risk_preference: str = "moderate"
) -> Tuple[np.ndarray, np.ndarray, Dict[str, float], Dict[str, float]]:
    """
    Computes:
      - Min-Variance weights
      - Max-Sharpe weights
      - Metrics for Min-Variance
      - Metrics for Max-Sharpe
    """
    mu = asset_returns.mean().values * TRADING_DAYS  # annualized return
    cov = asset_returns.cov().values * TRADING_DAYS   # annualized cov
    k = len(mu)
    rf = RISK_FREE_RATE_ANNUAL

    # Constraints: sum(w) = 1, w_i in [0, 1]
    bounds = tuple((0.0, 1.0) for _ in range(k))
    init_guess = np.repeat(1.0 / k, k)
    constraints = {"type": "eq", "fun": lambda w: np.sum(w) - 1.0}

    # 1. Minimum Variance
    def min_var_obj(w):
        return np.sqrt(w @ cov @ w)

    res_min_var = minimize(min_var_obj, init_guess, method="SLSQP", bounds=bounds, constraints=constraints)
    w_min_var = res_min_var.x if res_min_var.success else init_guess

    # 2. Maximum Sharpe
    def neg_sharpe_obj(w):
        port_ret = np.dot(w, mu)
        port_vol = np.sqrt(w @ cov @ w)
        if port_vol < 1e-6:
            return 0.0
        return -(port_ret - rf) / port_vol

    res_max_sharpe = minimize(neg_sharpe_obj, init_guess, method="SLSQP", bounds=bounds, constraints=constraints)
    w_max_sharpe = res_max_sharpe.x if res_max_sharpe.success else init_guess

    # Normalize within tolerance
    w_min_var = np.maximum(0, w_min_var)
    w_min_var /= w_min_var.sum()
    w_max_sharpe = np.maximum(0, w_max_sharpe)
    w_max_sharpe /= w_max_sharpe.sum()

    # Calculate metrics
    def stats_for_w(w):
        ret = float(np.dot(w, mu))
        vol = float(np.sqrt(w @ cov @ w))
        sharpe = float((ret - rf) / vol) if vol > 0 else 0.0
        return {"return_pct": round(ret * 100, 2), "vol_pct": round(vol * 100, 2), "sharpe": round(sharpe, 2)}

    stats_min = stats_for_w(w_min_var)
    stats_max = stats_for_w(w_max_sharpe)

    return w_min_var, w_max_sharpe, stats_min, stats_max


def generate_recommendation_and_strategies(
    asset_prices: pd.DataFrame,
    current_weights: np.ndarray,
    investment_amount: float,
    risk_preference: str,
    benchmark_returns: pd.Series
) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """
    Builds the risk-aware recommendation and strategy comparison table.
    """
    tickers = list(asset_prices.columns)
    k = len(tickers)
    asset_returns = asset_prices.pct_change().dropna(how="any")

    w_min, w_max, stats_min, stats_max = run_markowitz_optimization(asset_returns, risk_preference)

    # Equal weights
    w_eq = np.repeat(1.0 / k, k)

    # Select recommendation based on profile
    target_prof = risk_preference.lower()
    if target_prof == "conservative":
        rec_weights = w_min
        rec_stats = stats_min
        rationale = "Targeted Minimum-Variance portfolio to curb downside volatility and reduce maximum drawdowns."
    elif target_prof == "aggressive":
        rec_weights = w_max
        rec_stats = stats_max
        rationale = "Targeted Maximum-Sharpe portfolio to maximise return per unit of equity risk taken."
    else:  # Moderate (blended 50/50 min-var and max-sharpe)
        rec_weights = 0.5 * w_min + 0.5 * w_max
        rec_weights /= rec_weights.sum()
        ret = float(np.dot(rec_weights, asset_returns.mean().values * TRADING_DAYS))
        vol = float(np.sqrt(rec_weights @ (asset_returns.cov().values * TRADING_DAYS) @ rec_weights))
        sharpe = float((ret - RISK_FREE_RATE_ANNUAL) / vol) if vol > 0 else 0.0
        rec_stats = {"return_pct": round(ret * 100, 2), "vol_pct": round(vol * 100, 2), "sharpe": round(sharpe, 2)}
        rationale = "Balanced optimal risk-return trade-off blending Minimum-Variance stability with Sharpe efficiency."

    # Explanation generation
    explanations = [rationale]
    # Identify largest rebalances
    weight_diffs = {tickers[i]: rec_weights[i] - current_weights[i] for i in range(k)}
    top_increases = sorted([(t, d) for t, d in weight_diffs.items() if d > 0.03], key=lambda x: x[1], reverse=True)
    top_decreases = sorted([(t, d) for t, d in weight_diffs.items() if d < -0.03], key=lambda x: x[1])

    if top_decreases:
        trims = ", ".join([f"{t} ({-d*100:.1f}%)" for t, d in top_decreases[:2]])
        explanations.append(f"Trim high-risk or concentrated holdings: {trims} to lower marginal portfolio variance.")
    if top_increases:
        adds = ", ".join([f"{t} (+{d*100:.1f}%)" for t, d in top_increases[:2]])
        explanations.append(f"Increase defensive or high Sharpe contributors: {adds} to boost diversification benefit.")

    explanations.append("Optimization uses long-only non-negative weights summing to 100% with no leverage.")

    recommendation = {
        "target_profile": risk_preference.capitalize(),
        "weights": {tickers[i]: round(float(rec_weights[i]), 4) for i in range(k)},
        "expected_risk_pct": rec_stats["vol_pct"],
        "expected_return_pct": rec_stats["return_pct"],
        "sharpe_ratio": rec_stats["sharpe"],
        "explanation": explanations
    }

    # Strategy comparison
    # Helper to compute strategy stats
    def eval_strategy(name, w):
        port_ret = pd.Series(asset_returns.values @ w, index=asset_returns.index)
        perf = compute_performance_metrics(port_ret)
        v95, c95 = rm.historical_var_cvar(port_ret.values, 0.05)
        v99, _ = rm.historical_var_cvar(port_ret.values, 0.01)
        return {
            "name": name,
            "total_return_pct": perf["total_return_pct"],
            "annualized_vol_pct": perf["annualized_vol_pct"],
            "sharpe_ratio": perf["sharpe_ratio"],
            "max_drawdown_pct": perf["max_drawdown_pct"],
            "var_95_1d_inr": round(v95 * investment_amount, 2),
            "cvar_95_1d_inr": round(c95 * investment_amount, 2),
            "var_99_1d_inr": round(v99 * investment_amount, 2)
        }

    strategies = [
        eval_strategy("User Portfolio", current_weights),
        eval_strategy("Equal-Weight Portfolio", w_eq),
        eval_strategy(f"Recommended ({risk_preference.capitalize()})", rec_weights),
    ]

    return recommendation, strategies
