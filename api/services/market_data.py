import os
import time
import datetime
import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional
import yfinance as yf
import config as C

CACHE_DIR = os.path.join(C.ROOT, "data")
PRICES_CSV = os.path.join(CACHE_DIR, "prices_adjusted_close.csv")
BENCHMARK_CSV = os.path.join(CACHE_DIR, "benchmark_nifty50.csv")

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
    "TATAMOTORS.NS": "Tata Motors",
    "WIPRO.NS": "Wipro Limited",
    "BAJFINANCE.NS": "Bajaj Finance",
    "KOTAKBANK.NS": "Kotak Mahindra Bank",
    "AXISBANK.NS": "Axis Bank",
    "HCLTECH.NS": "HCL Technologies",
    "ADANIENT.NS": "Adani Enterprises",
    "NTPC.NS": "NTPC Limited",
    "POWERGRID.NS": "Power Grid Corporation",
    "TITAN.NS": "Titan Company",
    "ULTRACEMCO.NS": "UltraTech Cement",
    "COALINDIA.NS": "Coal India",
    "BAJAJFINSV.NS": "Bajaj Finserv",
    "NESTLEIND.NS": "Nestle India",
    "ONGC.NS": "Oil & Natural Gas Corp",
    "JSWSTEEL.NS": "JSW Steel",
    # Global & US Equities, Commodities, Crypto
    "AAPL": "Apple Inc.",
    "MSFT": "Microsoft Corporation",
    "NVDA": "NVIDIA Corporation",
    "GOOGL": "Alphabet Inc.",
    "AMZN": "Amazon.com",
    "META": "Meta Platforms",
    "TSLA": "Tesla Inc.",
    "SPY": "SPDR S&P 500 ETF Trust",
    "QQQ": "Invesco QQQ Trust (Nasdaq 100)",
    "GLD": "SPDR Gold Shares (Gold ETF)",
    "BTC-USD": "Bitcoin (USD)",
    # Benchmarks
    "^NSEI": "NIFTY 50 Index",
    "^BSESN": "S&P BSE SENSEX",
    "^NDX": "NASDAQ-100 Index",
    "^GSPC": "S&P 500 Index"
}

SECTOR_MAP = {
    "RELIANCE.NS": "Energy", "TCS.NS": "IT", "INFY.NS": "IT",
    "HDFCBANK.NS": "Banking", "ICICIBANK.NS": "Banking", "SBIN.NS": "Banking",
    "HINDUNILVR.NS": "FMCG", "ITC.NS": "FMCG", "LT.NS": "Infra",
    "BHARTIARTL.NS": "Telecom", "MARUTI.NS": "Auto", "M&M.NS": "Auto",
    "SUNPHARMA.NS": "Pharma", "TATASTEEL.NS": "Metals", "ASIANPAINT.NS": "Consumer",
    "TATAMOTORS.NS": "Auto", "WIPRO.NS": "IT", "BAJFINANCE.NS": "Banking",
    "KOTAKBANK.NS": "Banking", "AXISBANK.NS": "Banking", "HCLTECH.NS": "IT",
    "ADANIENT.NS": "Infra", "NTPC.NS": "Energy", "POWERGRID.NS": "Energy",
    "TITAN.NS": "Consumer", "ULTRACEMCO.NS": "Infra", "COALINDIA.NS": "Energy",
    "BAJAJFINSV.NS": "Banking", "NESTLEIND.NS": "FMCG", "ONGC.NS": "Energy",
    "JSWSTEEL.NS": "Metals",
    # Global Sectors
    "AAPL": "US Tech", "MSFT": "US Tech", "NVDA": "US Tech / Semiconductors",
    "GOOGL": "US Tech / Internet", "AMZN": "US Tech / E-Commerce", "META": "US Tech / Social",
    "TSLA": "US Auto / CleanTech", "SPY": "Global US Equity", "QQQ": "Global Tech Index",
    "GLD": "Commodities / Gold", "BTC-USD": "Digital Assets / Crypto"
}


def load_local_prices() -> pd.DataFrame:
    """Loads historical prices from committed local CSV."""
    if not os.path.exists(PRICES_CSV):
        raise FileNotFoundError(f"Prices CSV missing at {PRICES_CSV}")
    df = pd.read_csv(PRICES_CSV, index_col=0, parse_dates=True)
    df.index = pd.to_datetime(df.index)
    return df.sort_index()


def load_benchmark_prices(benchmark_ticker: str = "^NSEI") -> pd.Series:
    """Loads or dynamically downloads benchmark prices."""
    # Check if requested benchmark is cached locally
    if benchmark_ticker == "^NSEI" and os.path.exists(BENCHMARK_CSV):
        df = pd.read_csv(BENCHMARK_CSV, index_col=0, parse_dates=True)
        col = "^NSEI" if "^NSEI" in df.columns else ("Close" if "Close" in df.columns else df.columns[0])
        s = df[col]
        s.index = pd.to_datetime(s.index)
        s.name = "^NSEI"
        return s.dropna().sort_index()

    # Dynamic download for benchmark
    try:
        raw = yf.download(benchmark_ticker, start=C.HISTORY_START, auto_adjust=True, progress=False)
        if isinstance(raw.columns, pd.MultiIndex):
            s = raw["Close"].iloc[:, 0]
        elif "Close" in raw.columns:
            s = raw["Close"]
        else:
            s = raw.iloc[:, 0]
        s.index = pd.to_datetime(s.index)
        s.name = benchmark_ticker
        return s.dropna().sort_index()
    except Exception as e:
        # Fallback to local Nifty 50 if available
        if os.path.exists(BENCHMARK_CSV):
            df = pd.read_csv(BENCHMARK_CSV, index_col=0, parse_dates=True)
            s = df.iloc[:, 0]
            s.index = pd.to_datetime(s.index)
            s.name = "^NSEI"
            return s.dropna().sort_index()
        raise ValueError(f"Could not load or fetch benchmark {benchmark_ticker}: {str(e)}")


def get_supported_universe() -> List[Dict[str, Any]]:
    """Returns list of supported Indian large-cap assets with latest price and sector."""
    prices = load_local_prices()
    as_of = str(prices.index.max().date())
    latest_row = prices.iloc[-1]
    
    universe = []
    # All tickers present in price panel + tickers from TICKER_NAMES
    all_tickers = list(prices.columns)
    for t in TICKER_NAMES:
        if not t.startswith("^") and t not in all_tickers:
            all_tickers.append(t)

    for t in all_tickers:
        if t.startswith("^"):
            continue
        p = round(float(latest_row[t]), 2) if t in latest_row else 0.0
        sec = SECTOR_MAP.get(t, C.SECTOR.get(t, "Diversified"))
        disp = TICKER_NAMES.get(t, t.replace(".NS", ""))
        currency = "INR" if (t.endswith(".NS") or t.endswith(".BO")) else "USD"
        universe.append({
            "ticker": t,
            "display_name": disp,
            "sector": sec,
            "last_price": p,
            "currency": currency,
            "data_as_of": as_of
        })
    return universe


def get_price_panel(
    tickers: List[str],
    benchmark_ticker: str = "^NSEI",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> Tuple[pd.DataFrame, pd.Series, str, bool]:
    """
    Returns (asset_prices_df, benchmark_prices_series, data_as_of_str, is_fallback).
    Aligns dates strictly to common intersection so no look-ahead or missing date mismatch occurs.
    Dynamically downloads any missing tickers via yfinance on the fly.
    """
    local_df = load_local_prices()
    bench_series = load_benchmark_prices(benchmark_ticker)
    is_fallback = False

    # Check if all requested tickers are in local dataset
    missing = [t for t in tickers if t not in local_df.columns]
    
    if missing:
        try:
            live_df = yf.download(missing, start=C.HISTORY_START, auto_adjust=True, progress=False)
            if isinstance(live_df.columns, pd.MultiIndex):
                live_close = live_df["Close"]
            else:
                live_close = live_df[["Close"]]
                live_close.columns = missing
            live_close.index = pd.to_datetime(live_close.index)
            local_df = local_df.join(live_close, how="inner")
            
            # Cache updated panel
            local_df.round(4).to_csv(PRICES_CSV)
        except Exception as e:
            raise ValueError(f"Ticker(s) {missing} not found locally and live Yahoo Finance fetch failed: {str(e)}")

    # Select requested tickers
    prices = local_df[tickers].copy().dropna(how="any")

    # Combine with benchmark on intersection of dates
    combined = pd.concat([prices, bench_series], axis=1, join="inner").dropna()

    if start_date:
        combined = combined[combined.index >= pd.to_datetime(start_date)]
    if end_date:
        combined = combined[combined.index <= pd.to_datetime(end_date)]

    if len(combined) < 20:
        raise ValueError(f"Insufficient common trading days ({len(combined)}) in selected date range. Need at least 20.")

    asset_panel = combined[tickers]
    benchmark_panel = combined[bench_series.name]
    data_as_of = str(combined.index.max().date())

    return asset_panel, benchmark_panel, data_as_of, is_fallback


def refresh_market_data() -> Dict[str, Any]:
    """
    Refreshes all market prices up to the current date from Yahoo Finance.
    Updates prices_adjusted_close.csv and benchmark_nifty50.csv.
    """
    today_str = datetime.date.today().isoformat()
    end_date = (datetime.date.today() + datetime.timedelta(days=1)).isoformat()

    local_df = load_local_prices()
    existing_tickers = list(local_df.columns)

    # Download fresh price panel
    raw = yf.download(
        existing_tickers,
        start=C.HISTORY_START,
        end=end_date,
        auto_adjust=True,
        progress=False,
        threads=True
    )
    if isinstance(raw.columns, pd.MultiIndex):
        prices = raw["Close"].copy()
    else:
        prices = raw[["Close"]].copy()
        prices.columns = existing_tickers

    prices = prices.reindex(columns=existing_tickers).ffill().dropna(how="any")
    prices.index = pd.to_datetime(prices.index)
    prices.round(4).to_csv(PRICES_CSV)

    # Download benchmark (^NSEI)
    bench_raw = yf.download("^NSEI", start=C.HISTORY_START, end=end_date, auto_adjust=True, progress=False)
    if isinstance(bench_raw.columns, pd.MultiIndex):
        bench_close = bench_raw["Close"].iloc[:, 0]
    elif "Close" in bench_raw.columns:
        bench_close = bench_raw["Close"]
    else:
        bench_close = bench_raw.iloc[:, 0]
    bench_close.index = pd.to_datetime(bench_close.index)
    bench_close.name = "^NSEI"
    bench_close = bench_close.sort_index().ffill().dropna()
    pd.DataFrame({"^NSEI": bench_close}).to_csv(BENCHMARK_CSV)

    # Update returns
    returns = prices.pct_change().dropna(how="any")
    returns.round(6).to_csv(C.RETURNS_CSV)

    return {
        "status": "success",
        "message": f"Successfully updated market data for {len(existing_tickers)} assets and NIFTY 50 up to {prices.index.max().date()}.",
        "tickers_updated": existing_tickers,
        "data_as_of": str(prices.index.max().date()),
        "total_trading_days": len(prices)
    }
