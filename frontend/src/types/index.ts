export interface AssetInfo {
  ticker: string;
  display_name: string;
  sector: string;
  last_price: number;
  currency: string;
  data_as_of: string;
}

export interface PortfolioAnalyzeRequest {
  tickers: string[];
  weights: number[];
  investment_amount: number;
  risk_preference: 'conservative' | 'moderate' | 'aggressive';
  start_date?: string;
  end_date?: string | null;
  benchmark_ticker: string;
}

export interface AssetMetric {
  ticker: string;
  display_name: string;
  sector: string;
  weight_pct: number;
  annualized_return_pct: number;
  annualized_vol_pct: number;
  sharpe_ratio: number;
  max_drawdown_pct: number;
  latest_price: number;
}

export interface RiskContribution {
  ticker: string;
  sector: string;
  weight_pct: number;
  risk_contrib_pct: number;
  risk_to_weight_ratio: number;
  component_var_inr: number;
  standalone_var_inr: number;
  action_signal: string;
}

export interface PerformancePoint {
  date: string;
  portfolio_value: number;
  portfolio_return_pct: number;
  benchmark_return_pct: number;
  drawdown_pct: number;
}

export interface BenchmarkMetrics {
  ticker: string;
  name: string;
  total_return_pct: number;
  annualized_vol_pct: number;
  max_drawdown_pct: number;
  sharpe_ratio: number;
}

export interface BenchmarkComparisonDetails {
  ticker: string;
  name: string;
  alpha_pct: number;
  beta: number;
  correlation: number;
  tracking_error_pct: number;
  information_ratio: number;
  treynor_ratio: number;
  outperforming_return: boolean;
  outperforming_risk_adjusted: boolean;
}

export interface StrategyComparison {
  name: string;
  total_return_pct: number;
  annualized_vol_pct: number;
  sharpe_ratio: number;
  max_drawdown_pct: number;
  var_95_1d_inr: number;
  cvar_95_1d_inr: number;
  var_99_1d_inr: number;
}

export interface Recommendation {
  target_profile: string;
  weights: Record<string, number>;
  expected_risk_pct: number;
  expected_return_pct: number;
  sharpe_ratio: number;
  explanation: string[];
}

export interface ModelValidationItem {
  model: string;
  confidence: string;
  horizon: string;
  breaches: number;
  observations: number;
  hit_rate_pct: number;
  target_pct: number;
  kupiec_p: number | null;
  status: string;
  verdict: string;
}

export interface PinballLossItem {
  confidence: string;
  model: string;
  pinball_loss_x1e4: number;
  rank: number;
}

export interface ModelDiagnostics {
  backtest_window: {
    start_date: string;
    end_date: string;
    observations: number;
    notice: string;
  };
  models: ModelValidationItem[];
  pinball_loss_ranking: PinballLossItem[];
  validation_warnings: string[];
}

export interface HorizonRiskMetric {
  horizon: '1-day' | '1-week';
  confidence: '95%' | '99%';
  method: string;
  var_pct: number;
  cvar_pct: number;
  var_inr: number;
  cvar_inr: number;
  ci_low_inr?: number;
  ci_high_inr?: number;
}

export interface MLRiskPrediction {
  predicted_class: 'Low' | 'Medium' | 'High';
  confidence_probabilities: Record<string, number>;
  feature_attribution: Array<{
    feature: string;
    display_name: string;
    value: number;
    model_weight_pct: number;
  }>;
  explanation: string;
  calculated_features: Record<string, number>;
  algorithm: string;
}

export interface MarketIntelligenceReport {
  overall_outlook: string;
  outlook_color: string;
  bullish_exposure_pct: number;
  neutral_exposure_pct: number;
  cautious_exposure_pct: number;
  macro_indicators: Array<{
    indicator: string;
    value: string;
    stance: string;
    impact: string;
    sentiment: string;
  }>;
  sector_analyses: Array<{
    sector: string;
    weight_pct: number;
    sentiment: string;
    catalysts: string;
    key_risks: string;
  }>;
  actionable_insights: string[];
}

export interface RiskReturnPoint {
  name: string;
  ticker?: string;
  vol_pct: number;
  ret_pct: number;
  sharpe: number;
  point_type: 'asset' | 'portfolio' | 'recommended' | 'benchmark' | 'equal_weight';
  weight_pct?: number;
}

export interface PortfolioAnalyzeResponse {
  data_as_of: string;
  currency: string;
  is_fallback_data: boolean;
  portfolio: {
    investment_amount: number;
    weights: Record<string, number>;
    latest_value: number;
    pnl_amount: number;
    total_return_pct: number;
    annualized_return_pct: number;
    diversification_benefit_pct: number;
  };
  risk: {
    classification: 'Low' | 'Medium' | 'High';
    classification_type: string;
    classification_details: string;
    annualized_volatility_pct: number;
    max_drawdown_pct: number;
    sharpe_ratio: number;
    var_95_amount: number;
    cvar_95_amount: number;
    var_method: string;
  };
  ml_risk_prediction: MLRiskPrediction;
  market_intelligence: MarketIntelligenceReport;
  asset_metrics: AssetMetric[];
  correlation_matrix: Record<string, Record<string, number>>;
  risk_return_points: RiskReturnPoint[];
  risk_contributions: RiskContribution[];
  performance_series: PerformancePoint[];
  benchmark_metrics: BenchmarkMetrics;
  benchmark_comparison: BenchmarkComparisonDetails;
  strategies: StrategyComparison[];
  recommendation: Recommendation;
  model_diagnostics: ModelDiagnostics;
  risk_metrics_by_horizon: HorizonRiskMetric[];
  warnings: string[];
}

export interface StressTestRequest {
  tickers: string[];
  weights: number[];
  investment_amount: number;
  scenario: string;
  custom_shock_pct?: number;
}

export interface StressTestResponse {
  scenario_name: string;
  scenario_description: string;
  scenario_type: string;
  estimated_pnl_inr: number;
  estimated_pnl_pct: number;
  portfolio_value_before: number;
  portfolio_value_after: number;
  duration_trading_days: number;
  asset_impacts: Array<{
    ticker: string;
    display_name: string;
    sector: string;
    shock_pct: number;
    loss_inr: number;
  }>;
  assumptions: string[];
}

export interface MarketDataRefreshResponse {
  status: string;
  message: string;
  tickers_updated: string[];
  data_as_of: string;
  total_trading_days: number;
}
