import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Any
from api.services.market_data import TICKER_NAMES
import config as C

RISK_FREE_RATE_ANNUAL = 0.065  # 6.5% Indian 10y G-Sec proxy
TRADING_DAYS = 252


def calculate_portfolio_series(
    prices: pd.DataFrame,
    weights: np.ndarray,
    investment_amount: float
) -> Tuple[pd.Series, pd.Series, pd.Series]:
    """
    Computes:
      - portfolio daily simple returns series
      - portfolio value series (starting at investment_amount)
      - drawdown series (percentage from peak)
    """
    asset_returns = prices.pct_change().dropna(how="any")
    port_returns = pd.Series(asset_returns.values @ weights, index=asset_returns.index, name="portfolio_return")
    
    # Cumulative wealth evolution: W_t = W_0 * prod(1 + r_t)
    wealth_index = (1.0 + port_returns).cumprod()
    portfolio_value = wealth_index * investment_amount
    
    # Drawdown series
    rolling_peak = wealth_index.cummax()
    drawdown = (wealth_index - rolling_peak) / rolling_peak
    
    return port_returns, portfolio_value, drawdown


def compute_performance_metrics(returns: pd.Series, rf_annual: float = RISK_FREE_RATE_ANNUAL) -> Dict[str, float]:
    """Computes total return, annualised return, annualised volatility, Sharpe ratio, and max drawdown."""
    n_days = len(returns)
    if n_days < 2:
        return {"total_return_pct": 0.0, "annualized_return_pct": 0.0, "annualized_vol_pct": 0.0, "sharpe_ratio": 0.0, "max_drawdown_pct": 0.0}

    # Cumulative return
    cum_wealth = (1.0 + returns).cumprod()
    total_ret = float(cum_wealth.iloc[-1] - 1.0)
    
    # CAGR
    years = max(n_days / TRADING_DAYS, 0.01)
    ann_ret = float((1.0 + total_ret) ** (1.0 / years) - 1.0) if total_ret > -1 else -1.0
    
    # Annualized Volatility
    daily_vol = float(returns.std(ddof=1))
    ann_vol = daily_vol * np.sqrt(TRADING_DAYS)
    
    # Sharpe ratio
    rf_daily = (1.0 + rf_annual) ** (1.0 / TRADING_DAYS) - 1.0
    excess_mean = float((returns - rf_daily).mean())
    sharpe = float((excess_mean / daily_vol) * np.sqrt(TRADING_DAYS)) if daily_vol > 1e-8 else 0.0
    
    # Max Drawdown
    peaks = cum_wealth.cummax()
    dd = (cum_wealth - peaks) / peaks
    max_dd = float(dd.min())
    
    return {
        "total_return_pct": round(total_ret * 100.0, 2),
        "annualized_return_pct": round(ann_ret * 100.0, 2),
        "annualized_vol_pct": round(ann_vol * 100.0, 2),
        "sharpe_ratio": round(sharpe, 2),
        "max_drawdown_pct": round(max_dd * 100.0, 2),
    }


def compute_asset_metrics(prices: pd.DataFrame, weights: np.ndarray) -> List[Dict[str, Any]]:
    """Calculates metrics for each constituent stock in the portfolio."""
    asset_returns = prices.pct_change().dropna(how="any")
    tickers = list(prices.columns)
    metrics_list = []
    
    for i, t in enumerate(tickers):
        ret_series = asset_returns[t]
        perf = compute_performance_metrics(ret_series)
        last_price = float(prices[t].iloc[-1])
        
        metrics_list.append({
            "ticker": t,
            "display_name": TICKER_NAMES.get(t, t.replace(".NS", "")),
            "sector": C.SECTOR.get(t, "Other"),
            "weight_pct": round(float(weights[i]) * 100.0, 2),
            "annualized_return_pct": perf["annualized_return_pct"],
            "annualized_vol_pct": perf["annualized_vol_pct"],
            "sharpe_ratio": perf["sharpe_ratio"],
            "max_drawdown_pct": perf["max_drawdown_pct"],
            "latest_price": round(last_price, 2)
        })
    return metrics_list


def compute_correlation_matrix(prices: pd.DataFrame) -> Dict[str, Dict[str, float]]:
    """Calculates pairwise Pearson correlation matrix for constituent stocks."""
    returns = prices.pct_change().dropna(how="any")
    corr_df = returns.corr().round(3)
    return {col: {idx: float(corr_df.loc[idx, col]) for idx in corr_df.index} for col in corr_df.columns}


def compute_benchmark_comparison_details(
    port_returns: pd.Series,
    bench_returns: pd.Series,
    bench_ticker: str = "^NSEI",
    rf_annual: float = RISK_FREE_RATE_ANNUAL
) -> Dict[str, Any]:
    """
    Computes rigorous financial relative metrics against the benchmark:
    Beta, Jensen's Alpha, Correlation, Tracking Error, Information Ratio, Treynor Ratio.
    """
    aligned = pd.concat([port_returns, bench_returns], axis=1, join="inner").dropna()
    if len(aligned) < 5:
        return {
            "ticker": bench_ticker,
            "name": "NIFTY 50 Benchmark" if "^NSEI" in bench_ticker else bench_ticker,
            "alpha_pct": 0.0,
            "beta": 1.0,
            "correlation": 1.0,
            "tracking_error_pct": 0.0,
            "information_ratio": 0.0,
            "treynor_ratio": 0.0,
            "outperforming_return": False,
            "outperforming_risk_adjusted": False
        }

    p_r = aligned.iloc[:, 0].values
    b_r = aligned.iloc[:, 1].values

    # Covariance & Variance
    cov_pb = float(np.cov(p_r, b_r)[0, 1])
    var_b = float(np.var(b_r, ddof=1))
    beta = float(cov_pb / var_b) if var_b > 1e-8 else 1.0

    # Correlation
    std_p = float(np.std(p_r, ddof=1))
    std_b = float(np.std(b_r, ddof=1))
    corr = float(cov_pb / (std_p * std_b)) if (std_p * std_b) > 1e-8 else 1.0

    # Annualized Returns
    ann_port_ret = float(np.mean(p_r) * TRADING_DAYS)
    ann_bench_ret = float(np.mean(b_r) * TRADING_DAYS)

    # Jensen's Alpha (annualized)
    alpha = (ann_port_ret - rf_annual) - beta * (ann_bench_ret - rf_annual)

    # Tracking error
    diff = p_r - b_r
    te = float(np.std(diff, ddof=1) * np.sqrt(TRADING_DAYS))

    # Information ratio
    ir = float((ann_port_ret - ann_bench_ret) / te) if te > 1e-6 else 0.0

    # Treynor ratio
    treynor = float((ann_port_ret - rf_annual) / beta) if abs(beta) > 1e-4 else 0.0

    return {
        "ticker": bench_ticker,
        "name": "NIFTY 50 Index" if "^NSEI" in bench_ticker else bench_ticker,
        "alpha_pct": round(alpha * 100.0, 2),
        "beta": round(beta, 2),
        "correlation": round(corr, 3),
        "tracking_error_pct": round(te * 100.0, 2),
        "information_ratio": round(ir, 2),
        "treynor_ratio": round(treynor * 100.0, 2),
        "outperforming_return": bool(ann_port_ret > ann_bench_ret),
        "outperforming_risk_adjusted": bool(alpha > 0)
    }


def compute_risk_return_points(
    asset_metrics: List[Dict[str, Any]],
    port_perf: Dict[str, float],
    rec_stats: Dict[str, float],
    bench_perf: Dict[str, float],
    eq_perf: Optional[Dict[str, float]] = None
) -> List[Dict[str, Any]]:
    """Generates coordinates for the Risk vs Return scatter plot."""
    points = []

    # 1. Assets
    for a in asset_metrics:
        points.append({
            "name": a["display_name"],
            "ticker": a["ticker"],
            "vol_pct": a["annualized_vol_pct"],
            "ret_pct": a["annualized_return_pct"],
            "sharpe": a["sharpe_ratio"],
            "point_type": "asset",
            "weight_pct": a["weight_pct"]
        })

    # 2. User Portfolio
    points.append({
        "name": "User Portfolio",
        "ticker": "PORTFOLIO",
        "vol_pct": port_perf["annualized_vol_pct"],
        "ret_pct": port_perf["annualized_return_pct"],
        "sharpe": port_perf["sharpe_ratio"],
        "point_type": "portfolio",
        "weight_pct": 100.0
    })

    # 3. Recommended Portfolio
    points.append({
        "name": "Recommended Optimal",
        "ticker": "RECOMMENDED",
        "vol_pct": rec_stats.get("vol_pct", rec_stats.get("expected_risk_pct", 15.0)),
        "ret_pct": rec_stats.get("return_pct", rec_stats.get("expected_return_pct", 18.0)),
        "sharpe": rec_stats.get("sharpe", 1.0),
        "point_type": "recommended",
        "weight_pct": 100.0
    })

    # 4. Benchmark
    points.append({
        "name": "NIFTY 50 Benchmark",
        "ticker": "^NSEI",
        "vol_pct": bench_perf["annualized_vol_pct"],
        "ret_pct": bench_perf["annualized_return_pct"],
        "sharpe": bench_perf["sharpe_ratio"],
        "point_type": "benchmark",
        "weight_pct": 100.0
    })

    # 5. Equal Weight
    if eq_perf:
        points.append({
            "name": "Equal Weight (1/N)",
            "ticker": "EQUAL_WEIGHT",
            "vol_pct": eq_perf["annualized_vol_pct"],
            "ret_pct": eq_perf["annualized_return_pct"],
            "sharpe": eq_perf["sharpe_ratio"],
            "point_type": "equal_weight",
            "weight_pct": 100.0
        })

    return points
