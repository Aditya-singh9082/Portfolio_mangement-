import os
import time
import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional
import config as C

CACHE_DIR = os.path.join(C.ROOT, "data")
PRICES_CSV = os.path.join(CACHE_DIR, "prices_adjusted_close.csv")
BENCHMARK_CSV = os.path.join(CACHE_DIR, "benchmark_nifty50.csv")

# In-memory memory cache
_CACHE: Dict[str, Tuple[float, pd.DataFrame]] = {}
CACHE_TTL = 3600  # 1 hour


TICKER_NAMES = {
    "RELIANCE.NS": "Reliance Industries",
    "TCS.NS": "Tata Consultancy Services",
    "INFY.NS": "Infosys",
    "HDFCBANK.NS": "HDFC Bank",
    "ICICIBANK.NS": "ICICI Bank",
    "SBIN.NS": "State Bank of India",
    "HINDUNILVR.NS": "Hindustan Unilever",
    "ITC.NS": "ITC Limited",
    "LT.NS": "Larsen & Toubro",
    "BHARTIARTL.NS": "Bharti Airtel",
    "MARUTI.NS": "Maruti Suzuki",
    "M&M.NS": "Mahindra & Mahindra",
    "SUNPHARMA.NS": "Sun Pharmaceutical",
    "TATASTEEL.NS": "Tata Steel",
    "ASIANPAINT.NS": "Asian Paints",
    "^NSEI": "NIFTY 50 Index"
}


def get_supported_universe() -> List[Dict]:
    """Returns list of supported Indian large-cap assets with latest price and sector."""
    prices = load_local_prices()
    as_of = str(prices.index.max().date())
    latest_row = prices.iloc[-1]
    
    universe = []
    for t in C.TICKERS:
        universe.append({
            "ticker": t,
            "display_name": TICKER_NAMES.get(t, t.replace(".NS", "")),
            "sector": C.SECTOR.get(t, "Diversified"),
            "last_price": round(float(latest_row[t]), 2) if t in latest_row else 0.0,
            "currency": "INR",
            "data_as_of": as_of
        })
    return universe


def load_local_prices() -> pd.DataFrame:
    """Loads historical prices from committed local CSV fallback."""
    df = pd.read_csv(PRICES_CSV, index_col=0, parse_dates=True)
    df.index = pd.to_datetime(df.index)
    return df.sort_index()


def load_benchmark_prices() -> pd.Series:
    """Loads benchmark (^NSEI) prices."""
    if os.path.exists(BENCHMARK_CSV):
        df = pd.read_csv(BENCHMARK_CSV, index_col=0, parse_dates=True)
        # Handle single column or Close column
        if "Close" in df.columns:
            s = df["Close"]
        else:
            s = df.iloc[:, 0]
        s.index = pd.to_datetime(s.index)
        s.name = "^NSEI"
        return s.dropna().sort_index()
    else:
        # Fallback to local average or synthetic index
        local = load_local_prices()
        s = local.mean(axis=1)
        s.name = "^NSEI"
        return s


def get_price_panel(
    tickers: List[str],
    benchmark_ticker: str = "^NSEI",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> Tuple[pd.DataFrame, pd.Series, str, bool]:
    """
    Returns (asset_prices_df, benchmark_prices_series, data_as_of_str, is_fallback).
    Aligns dates strictly to common intersection so no look-ahead or missing date mismatch occurs.
    """
    local_df = load_local_prices()
    bench_series = load_benchmark_prices()
    is_fallback = True

    # Check if all tickers are in local dataset
    missing = [t for t in tickers if t not in local_df.columns]
    
    if missing:
        # Try live download via yfinance for missing
        try:
            import yfinance as yf
            live_df = yf.download(missing, start=C.HISTORY_START, auto_adjust=True, progress=False)
            if isinstance(live_df.columns, pd.MultiIndex):
                live_close = live_df["Close"]
            else:
                live_close = live_df[["Close"]]
                live_close.columns = missing
            live_close.index = pd.to_datetime(live_close.index)
            local_df = local_df.join(live_close, how="inner")
            is_fallback = False
        except Exception:
            raise ValueError(f"Ticker(s) {missing} not available in preloaded universe and live fetch failed.")

    # Select requested tickers
    prices = local_df[tickers].copy().dropna(how="any")

    # Combine with benchmark on intersection of dates
    combined = pd.concat([prices, bench_series], axis=1, join="inner").dropna()

    if start_date:
        combined = combined[combined.index >= pd.to_datetime(start_date)]
    if end_date:
        combined = combined[combined.index <= pd.to_datetime(end_date)]

    if len(combined) < 30:
        raise ValueError(f"Insufficient common trading days ({len(combined)}) in selected date range. Need at least 30.")

    asset_panel = combined[tickers]
    benchmark_panel = combined[bench_series.name]
    data_as_of = str(combined.index.max().date())

    return asset_panel, benchmark_panel, data_as_of, is_fallback
