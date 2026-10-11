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
