import {
  AssetInfo,
  PortfolioAnalyzeRequest,
  PortfolioAnalyzeResponse,
  StressTestRequest,
  StressTestResponse,
  MarketDataRefreshResponse
} from '../types';

const API_BASE = '/api';

export async function refreshMarketData(): Promise<MarketDataRefreshResponse> {
  const res = await fetch(`${API_BASE}/market-data/refresh`, {
    method: 'POST',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Market data refresh failed with status ${res.status}`);
  }
  return res.json();
}

export async function fetchHealth(): Promise<{ status: string; service: string }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchAssets(query?: string): Promise<AssetInfo[]> {
  const url = query ? `${API_BASE}/assets?query=${encodeURIComponent(query)}` : `${API_BASE}/assets`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch assets: ${res.statusText}`);
  return res.json();
}

export async function analyzePortfolio(payload: PortfolioAnalyzeRequest): Promise<PortfolioAnalyzeResponse> {
  const res = await fetch(`${API_BASE}/portfolio/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Analysis request failed with status ${res.status}`);
  }
  return res.json();
}

export async function runStressTest(payload: StressTestRequest): Promise<StressTestResponse> {
  const res = await fetch(`${API_BASE}/portfolio/stress-test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Stress test failed with status ${res.status}`);
  }
  return res.json();
}

export async function fetchDemoPortfolio(): Promise<PortfolioAnalyzeResponse> {
  const res = await fetch(`${API_BASE}/portfolio/demo`);
  if (!res.ok) throw new Error(`Failed to load demo portfolio: ${res.statusText}`);
  return res.json();
}

export function formatINR(val: number): string {
  const abs = Math.abs(Math.round(val));
  const sign = val < 0 ? '-' : '';
  const str = abs.toString();
  if (str.length <= 3) return `₹${sign}${str}`;
  
  const last3 = str.substring(str.length - 3);
  let other = str.substring(0, str.length - 3);
  const parts = [];
  while (other.length > 2) {
    parts.unshift(other.substring(other.length - 2));
    other = other.substring(0, other.length - 2);
  }
  if (other.length > 0) parts.unshift(other);
  return `₹${sign}${parts.join(',')},${last3}`;
}
