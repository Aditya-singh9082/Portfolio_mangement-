import sys
import os
from typing import List, Dict, Optional, Any
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

# Ensure repo root is on sys.path
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

import config as C
from api.schemas import (
    AssetInfo,
    PortfolioAnalyzeRequest,
    PortfolioAnalyzeResponse,
    StressTestRequest,
    StressTestResponse
)
from api.services.market_data import get_supported_universe, get_price_panel
from api.services.portfolio import (
    calculate_portfolio_series,
    compute_performance_metrics,
    compute_asset_metrics
)
from api.services.risk import (
    classify_risk,
    compute_risk_measures_all_models,
    compute_risk_contributions,
    get_static_diagnostics
)
from api.services.optimizer import generate_recommendation_and_strategies
from api.services.stress import run_stress_test

app = FastAPI(
    title="Indian Portfolio Risk Intelligence API",
    version="1.0.0",
    description="Thin API exposing quantitative risk engine, VaR/CVaR, GARCH, FHS, stress testing, and Markowitz optimization."
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "portfolio-risk-api", "timestamp": str(pd.Timestamp.now())}


@app.get("/api/assets", response_model=List[AssetInfo])
def get_assets(query: Optional[str] = Query(None, description="Optional search term")):
    universe = get_supported_universe()
    if query:
        q = query.lower()
        universe = [
            a for a in universe
            if q in a["ticker"].lower() or q in a["display_name"].lower() or q in a["sector"].lower()
        ]
    return universe


@app.post("/api/portfolio/analyze", response_model=PortfolioAnalyzeResponse)
def analyze_portfolio(req: PortfolioAnalyzeRequest):
    # Validation checks
    if len(req.tickers) < 2:
        raise HTTPException(status_code=422, detail="Please select at least 2 stocks to construct a portfolio.")
    if len(req.tickers) != len(req.weights):
        raise HTTPException(status_code=422, detail="Length of tickers and weights must match.")
    if any(w < 0 for w in req.weights):
        raise HTTPException(status_code=422, detail="Weights must be non-negative.")

    total_w = sum(req.weights)
    if abs(total_w - 1.0) > 1e-3:
        if total_w <= 0:
            raise HTTPException(status_code=422, detail="Sum of weights must be positive.")
        # Normalize weights
        norm_weights = [round(w / total_w, 4) for w in req.weights]
    else:
        norm_weights = [round(w, 4) for w in req.weights]

    weights_arr = np.array(norm_weights, dtype=float)

    try:
        prices_df, bench_series, data_as_of, is_fallback = get_price_panel(
            req.tickers,
            req.benchmark_ticker,
            start_date=req.start_date,
            end_date=req.end_date
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Market data processing error: {str(e)}")

    # Portfolio return series & metrics
    port_returns, port_value_series, drawdown_series = calculate_portfolio_series(
        prices_df, weights_arr, req.investment_amount
    )
    port_perf = compute_performance_metrics(port_returns)

    # Benchmark metrics
    bench_returns = bench_series.pct_change().dropna(how="any")
    bench_perf = compute_performance_metrics(bench_returns)

    # Risk Classification
    risk_class, risk_basis = classify_risk(
        port_perf["annualized_vol_pct"],
        port_perf["max_drawdown_pct"]
    )

    # Comprehensive Risk Measures across models (Historical, Normal, Student-t, Monte Carlo, GARCH-t, FHS)
    asset_returns = prices_df.pct_change().dropna(how="any")
    risk_results = compute_risk_measures_all_models(
        port_returns, asset_returns, weights_arr, req.investment_amount
    )

    # Risk decomposition (Euler component VaR)
    contributions, div_benefit = compute_risk_contributions(
        asset_returns, weights_arr, req.investment_amount
    )

    # Recommendations & Strategy Comparisons
    recommendation, strategies = generate_recommendation_and_strategies(
        prices_df, weights_arr, req.investment_amount, req.risk_preference, bench_returns
    )

    # Asset-level metrics table
    asset_metrics = compute_asset_metrics(prices_df, weights_arr)

    # Downsampled performance series (max 120 points for smooth charting)
    step = max(1, len(port_value_series) // 120)
    sampled_idx = port_value_series.index[::step]
    if port_value_series.index[-1] not in sampled_idx:
        sampled_idx = sampled_idx.append(port_value_series.index[-1:])

    perf_series = []
    # Aligned benchmark wealth index
    bench_cum = (1.0 + bench_returns).cumprod()
    bench_cum = bench_cum.reindex(port_returns.index).ffill().fillna(1.0)

    for d in sampled_idx:
        date_str = str(d.date())
        perf_series.append({
            "date": date_str,
            "portfolio_value": round(float(port_value_series[d]), 2),
            "portfolio_return_pct": round(float(port_value_series[d] / req.investment_amount - 1.0) * 100, 2),
            "benchmark_return_pct": round(float(bench_cum.get(d, 1.0) - 1.0) * 100, 2),
            "drawdown_pct": round(float(drawdown_series[d]) * 100, 2)
        })

    # Warnings & Caveats
    warnings = [
        f"Data as of {data_as_of}. End-of-day adjusted close data used (not real-time streaming).",
        "Assumes long-only, daily rebalancing with zero transaction fees and survivorship bias caveats.",
        "Model estimates and historical backtests are informative, not guarantees or personal financial advice."
    ]
    if is_fallback:
        warnings.insert(0, "Using prepared, verified historical CSV dataset fallback.")

    return PortfolioAnalyzeResponse(
        data_as_of=data_as_of,
        currency="INR",
        is_fallback_data=is_fallback,
        portfolio={
            "investment_amount": req.investment_amount,
            "weights": {req.tickers[i]: norm_weights[i] for i in range(len(req.tickers))},
            "latest_value": round(float(port_value_series.iloc[-1]), 2),
            "pnl_amount": round(float(port_value_series.iloc[-1] - req.investment_amount), 2),
            "total_return_pct": port_perf["total_return_pct"],
            "annualized_return_pct": port_perf["annualized_return_pct"],
            "diversification_benefit_pct": div_benefit
        },
        risk={
            "classification": risk_class,
            "classification_type": "rule_based",
            "classification_details": risk_basis,
            "annualized_volatility_pct": port_perf["annualized_vol_pct"],
            "max_drawdown_pct": port_perf["max_drawdown_pct"],
            "sharpe_ratio": port_perf["sharpe_ratio"],
            "var_95_amount": risk_results["primary_var_95"],
            "cvar_95_amount": risk_results["primary_cvar_95"],
            "var_method": risk_results["primary_method"]
        },
        asset_metrics=asset_metrics,
        risk_contributions=contributions,
        performance_series=perf_series,
        benchmark_metrics={
            "ticker": req.benchmark_ticker,
            "name": "NIFTY 50 Index",
            "total_return_pct": bench_perf["total_return_pct"],
            "annualized_vol_pct": bench_perf["annualized_vol_pct"],
            "max_drawdown_pct": bench_perf["max_drawdown_pct"],
            "sharpe_ratio": bench_perf["sharpe_ratio"]
        },
        strategies=strategies,
        recommendation=recommendation,
        model_diagnostics=get_static_diagnostics(),
        risk_metrics_by_horizon=risk_results["metrics_by_horizon"],
        warnings=warnings
    )


@app.post("/api/portfolio/stress-test", response_model=StressTestResponse)
def stress_test(req: StressTestRequest):
    if len(req.tickers) < 1 or len(req.tickers) != len(req.weights):
        raise HTTPException(status_code=422, detail="Valid tickers and weights required.")
    
    total_w = sum(req.weights)
    norm_weights = [w / total_w for w in req.weights] if total_w > 0 else req.weights

    result = run_stress_test(
        req.tickers,
        norm_weights,
        req.investment_amount,
        req.scenario,
        req.custom_shock_pct
    )
    return result


@app.get("/api/portfolio/demo", response_model=PortfolioAnalyzeResponse)
def get_demo_portfolio():
    """Supplies known-good default demo portfolio (15 market-cap weighted stocks, ₹1 Cr)."""
    weights = [
        0.1694, 0.0771, 0.0476, 0.1127, 0.0888,
        0.0898, 0.0491, 0.0347, 0.0528, 0.1095,
        0.0402, 0.0353, 0.0425, 0.0251, 0.0253
    ]
    req = PortfolioAnalyzeRequest(
        tickers=C.TICKERS,
        weights=weights,
        investment_amount=10000000.0,
        risk_preference="moderate",
        start_date="2018-01-01",
        end_date=None,
        benchmark_ticker="^NSEI"
    )
    return analyze_portfolio(req)
