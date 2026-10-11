import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
import config as C
from api.services.market_data import TICKER_NAMES, load_local_prices


SCENARIOS = {
    "covid_crash": {
        "name": "COVID-19 Market Crash (Historical Replay)",
        "type": "historical_replay",
        "description": "Replays the historic Feb-Mar 2020 liquidity shock (22 trading days).",
        "start": "2020-02-19",
        "end": "2020-03-23",
        "assumptions": [
            "Replays actual historical daily return trajectory during the 2020 liquidity freeze.",
            "Assumes current portfolio weights are held constant with zero liquidation costs."
        ]
    },
    "rate_hike": {
        "name": "2022 Global Rate-Hike Selloff (Historical Replay)",
        "type": "historical_replay",
        "description": "Replays the prolonged inflation and quantitative tightening regime of 2022 (114 trading days).",
        "start": "2022-01-03",
        "end": "2022-06-17",
        "assumptions": [
            "Replays 2022 rate hike selloff trajectory.",
            "Higher impact on high-PE tech and capital goods."
        ]
    },
    "correction": {
        "name": "2024-2025 Market Correction (Historical Replay)",
        "type": "historical_replay",
        "description": "Replays the broad mid/large-cap valuation reset of late 2024 to early 2025.",
        "start": "2024-09-27",
        "end": "2025-02-28",
        "assumptions": [
            "Replays actual market correction drawdown series."
        ]
    },
    "broad_market": {
        "name": "Broad Market Crash (-10% Shock)",
        "type": "hypothetical_shock",
        "description": "Hypothetical instantaneous -10% market-wide panic across all equity holdings.",
        "shock_pct": -10.0,
        "assumptions": [
            "Deterministic -10% decline applied simultaneously across all portfolio assets.",
            "No diversification offset during systematic broad market liquidations."
        ]
    },
    "banking_crisis": {
        "name": "Indian Banking Stress Scenario",
        "type": "hypothetical_shock",
        "description": "Hypothetical systemic stress in financial sector: Banking names plunge -20%, other sectors -3%.",
        "sector_shocks": {"Banking": -20.0, "default": -3.0},
        "assumptions": [
            "Banking stocks (HDFCBANK, ICICIBANK, SBIN) drop -20% due to asset quality / NPA panic.",
            "Contagion shock of -3% across non-financial constituents."
        ]
    },
    "custom": {
        "name": "Custom User-Adjusted Shock",
        "type": "hypothetical_shock",
        "description": "User-defined instantaneous equity shock.",
        "assumptions": [
            "Uniform shock applied to all constituent stocks based on slider selection."
        ]
    }
}


def run_stress_test(
    tickers: List[str],
    weights: List[float],
    investment_amount: float,
    scenario_key: str = "broad_market",
    custom_shock_pct: Optional[float] = None
) -> Dict[str, Any]:
    w = np.array(weights)
    PV = investment_amount
    k = len(tickers)

    scen = SCENARIOS.get(scenario_key, SCENARIOS["broad_market"])
    asset_impacts = []

    if scen["type"] == "historical_replay":
        prices = load_local_prices()
        start = pd.to_datetime(scen["start"])
        end = pd.to_datetime(scen["end"])
        sub = prices.loc[(prices.index >= start) & (prices.index <= end), [t for t in tickers if t in prices.columns]]
        
        if len(sub) >= 2:
            asset_ret = sub.iloc[-1] / sub.iloc[0] - 1.0
            duration = len(sub)
        else:
            asset_ret = pd.Series(-0.35, index=tickers)
            duration = 22

        port_ret = 0.0
        for i, t in enumerate(tickers):
            r = float(asset_ret.get(t, -0.30))
            asset_pnl = r * w[i] * PV
            port_ret += r * w[i]
            asset_impacts.append({
                "ticker": t,
                "display_name": TICKER_NAMES.get(t, t),
                "sector": C.SECTOR.get(t, "Other"),
                "shock_pct": round(r * 100, 2),
                "loss_inr": round(asset_pnl, 2)
            })

    elif scenario_key == "banking_crisis":
        duration = 1
        port_ret = 0.0
        for i, t in enumerate(tickers):
            sec = C.SECTOR.get(t, "Other")
            shock = -0.20 if sec == "Banking" else -0.03
            asset_pnl = shock * w[i] * PV
            port_ret += shock * w[i]
            asset_impacts.append({
                "ticker": t,
                "display_name": TICKER_NAMES.get(t, t),
                "sector": sec,
                "shock_pct": round(shock * 100, 2),
                "loss_inr": round(asset_pnl, 2)
            })

    else:
        # Uniform or custom shock
        shock_pct_val = (custom_shock_pct if custom_shock_pct is not None else scen.get("shock_pct", -10.0)) / 100.0
        duration = 1
        port_ret = shock_pct_val
        for i, t in enumerate(tickers):
            asset_pnl = shock_pct_val * w[i] * PV
            asset_impacts.append({
                "ticker": t,
                "display_name": TICKER_NAMES.get(t, t),
                "sector": C.SECTOR.get(t, "Other"),
                "shock_pct": round(shock_pct_val * 100, 2),
                "loss_inr": round(asset_pnl, 2)
            })

    pnl_inr = port_ret * PV
    val_after = PV + pnl_inr

    return {
        "scenario_name": scen["name"],
        "scenario_description": scen["description"],
        "scenario_type": scen["type"],
        "estimated_pnl_inr": round(pnl_inr, 2),
        "estimated_pnl_pct": round(port_ret * 100, 2),
        "portfolio_value_before": round(PV, 2),
        "portfolio_value_after": round(val_after, 2),
        "duration_trading_days": duration,
        "asset_impacts": asset_impacts,
        "assumptions": scen["assumptions"]
    }
