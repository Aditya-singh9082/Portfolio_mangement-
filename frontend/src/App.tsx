import React, { useState, useEffect } from 'react';
import {
  Navbar
} from './components/Navbar';
import { OverviewTab } from './components/OverviewTab';
import { BuilderTab } from './components/BuilderTab';
import { RiskTab } from './components/RiskTab';
import { PerformanceTab } from './components/PerformanceTab';
import { AllocationTab } from './components/AllocationTab';
import { StressTab } from './components/StressTab';
import { ValidationTab } from './components/ValidationTab';

import {
  AssetInfo,
  PortfolioAnalyzeRequest,
  PortfolioAnalyzeResponse
} from './types';
import {
  fetchAssets,
  analyzePortfolio,
  fetchDemoPortfolio,
  refreshMarketData
} from './lib/api';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [availableAssets, setAvailableAssets] = useState<AssetInfo[]>([]);
  const [analysisData, setAnalysisData] = useState<PortfolioAnalyzeResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Default request state
  const [currentRequest, setCurrentRequest] = useState<PortfolioAnalyzeRequest>({
    tickers: ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'BHARTIARTL.NS', 'SBIN.NS'],
    weights: [0.30, 0.25, 0.20, 0.15, 0.10],
    investment_amount: 100000.0,
    risk_preference: 'moderate',
    start_date: '2023-01-01',
    end_date: null,
    benchmark_ticker: '^NSEI'
  });

  // Load assets and initial analysis
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        // Fetch supported universe
        const assets = await fetchAssets().catch(() => []);
        setAvailableAssets(assets);

        // Fetch initial analysis
        const res = await analyzePortfolio(currentRequest);
        setAnalysisData(res);
      } catch (err: any) {
        console.error('Initialization error:', err);
        // Fallback to demo endpoint
        try {
          const demo = await fetchDemoPortfolio();
          setAnalysisData(demo);
        } catch (demoErr: any) {
          setErrorMsg(err.message || 'Failed to connect to backend risk engine.');
        }
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const handleRefreshMarketData = async () => {
    setIsRefreshing(true);
    setErrorMsg(null);
    try {
      await refreshMarketData();
      const assets = await fetchAssets().catch(() => []);
      setAvailableAssets(assets);
      const res = await analyzePortfolio(currentRequest);
      setAnalysisData(res);
    } catch (err: any) {
      console.error('Market data sync error:', err);
      setErrorMsg(err.message || 'Market data refresh failed.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRunAnalysis = async (req: PortfolioAnalyzeRequest) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      setCurrentRequest(req);
      const res = await analyzePortfolio(req);
      setAnalysisData(res);
      setActiveTab('overview');
    } catch (err: any) {
      setErrorMsg(err.message || 'Analysis calculation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadDemo = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const demo = await fetchDemoPortfolio();
      setAnalysisData(demo);
      setCurrentRequest({
        tickers: Object.keys(demo.portfolio.weights),
        weights: Object.values(demo.portfolio.weights),
        investment_amount: demo.portfolio.investment_amount,
        risk_preference: 'moderate',
        start_date: '2018-01-01',
        end_date: null,
        benchmark_ticker: '^NSEI'
      });
      setActiveTab('overview');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load demo reference book.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dataAsOf={analysisData?.data_as_of || '2026-10-09'}
        isFallback={analysisData?.is_fallback_data || false}
        onRefreshMarketData={handleRefreshMarketData}
        isRefreshing={isRefreshing}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {errorMsg && (
          <div className="mb-6 bg-rose-950/80 border border-rose-800 rounded-xl p-4 text-xs text-rose-200 flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => handleLoadDemo()}
              className="px-3 py-1 rounded bg-rose-900 hover:bg-rose-800 text-white font-semibold text-xs transition"
            >
              Load Demo Fallback
            </button>
          </div>
        )}

        {isLoading && !analysisData ? (
          <div className="h-96 flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
            <div className="text-sm font-medium text-gray-300">Calculating Portfolio Risk & VaR Engine...</div>
            <p className="text-xs text-gray-500">Estimating GARCH volatilities and asset covariance matrix</p>
          </div>
        ) : analysisData ? (
          <div>
            {activeTab === 'overview' && (
              <OverviewTab
                data={analysisData}
                onNavigateToBuilder={() => setActiveTab('builder')}
                onNavigateToRisk={() => setActiveTab('risk')}
              />
            )}
            {activeTab === 'builder' && (
              <BuilderTab
                availableAssets={availableAssets}
                currentRequest={currentRequest}
                onAnalyze={handleRunAnalysis}
                onLoadDemo={handleLoadDemo}
                isLoading={isLoading}
              />
            )}
            {activeTab === 'risk' && <RiskTab data={analysisData} />}
            {activeTab === 'performance' && <PerformanceTab data={analysisData} />}
            {activeTab === 'allocation' && <AllocationTab data={analysisData} />}
            {activeTab === 'stress' && <StressTab data={analysisData} />}
            {activeTab === 'validation' && <ValidationTab data={analysisData} />}
          </div>
        ) : null}
      </main>

      <footer className="border-t border-[#1F293D] py-4 bg-[#0B0F19] text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>REQUIEM TE/BE Fintech — Investment Risk Intelligence Platform</span>
          <span>Educational & Quantitative Engine. Not Financial Investment Advice.</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
