from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field


class AssetInfo(BaseModel):
    ticker: str
    display_name: str
    sector: str
    last_price: float
    currency: str = "INR"
    data_as_of: str


class PortfolioAnalyzeRequest(BaseModel):
    tickers: List[str]
    weights: List[float]
    investment_amount: float = Field(default=100000.0, gt=0)
    risk_preference: str = Field(default="moderate")  # conservative, moderate, aggressive
    start_date: Optional[str] = "2023-01-01"
    end_date: Optional[str] = None
    benchmark_ticker: str = "^NSEI"


class AssetMetric(BaseModel):
    ticker: str
    display_name: str
    sector: str
    weight_pct: float
    annualized_return_pct: float
    annualized_vol_pct: float
    sharpe_ratio: float
    max_drawdown_pct: float
    latest_price: float


class RiskContribution(BaseModel):
    ticker: str
    sector: str
    weight_pct: float
    risk_contrib_pct: float
    risk_to_weight_ratio: float
    component_var_inr: float
    standalone_var_inr: float
    action_signal: str  # "TRIM / HEDGE CANDIDATE", "BALANCED", "DIVERSIFIER"


class PerformancePoint(BaseModel):
    date: str
    portfolio_value: float
    portfolio_return_pct: float
    benchmark_return_pct: float
    drawdown_pct: float


class BenchmarkMetrics(BaseModel):
    ticker: str
    name: str
    total_return_pct: float
    annualized_vol_pct: float
    max_drawdown_pct: float
    sharpe_ratio: float


class StrategyComparison(BaseModel):
    name: str
    total_return_pct: float
    annualized_vol_pct: float
    sharpe_ratio: float
    max_drawdown_pct: float
    var_95_1d_inr: float
    cvar_95_1d_inr: float
    var_99_1d_inr: float


class Recommendation(BaseModel):
    target_profile: str
    weights: Dict[str, float]
    expected_risk_pct: float
    expected_return_pct: float
    sharpe_ratio: float
    explanation: List[str]


class ModelValidationItem(BaseModel):
    model: str
    confidence: str
    horizon: str
    breaches: int
    observations: int
    hit_rate_pct: float
    target_pct: float
    kupiec_p: Optional[float]
    status: str
    verdict: str


class PinballLossItem(BaseModel):
    confidence: str
    model: str
    pinball_loss_x1e4: float
    rank: int


class ModelDiagnostics(BaseModel):
    model_config = {"protected_namespaces": ()}
    backtest_window: Dict[str, Any]
    models: List[ModelValidationItem]
    pinball_loss_ranking: List[PinballLossItem]
    validation_warnings: List[str]


class HorizonRiskMetric(BaseModel):
    horizon: str  # "1-day" or "1-week"
    confidence: str  # "95%" or "99%"
    method: str  # "Historical", "Normal", "Student-t", "Monte Carlo", "GARCH-t", "FHS", "Bootstrap CI"
    var_pct: float
    cvar_pct: float
    var_inr: float
    cvar_inr: float
    ci_low_inr: Optional[float] = None
    ci_high_inr: Optional[float] = None


class PortfolioAnalyzeResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    data_as_of: str
    currency: str = "INR"
    is_fallback_data: bool = False
    portfolio: Dict[str, Any]
    risk: Dict[str, Any]
    asset_metrics: List[AssetMetric]
    risk_contributions: List[RiskContribution]
    performance_series: List[PerformancePoint]
    benchmark_metrics: BenchmarkMetrics
    strategies: List[StrategyComparison]
    recommendation: Recommendation
    model_diagnostics: ModelDiagnostics
    risk_metrics_by_horizon: List[HorizonRiskMetric]
    warnings: List[str]


class StressTestRequest(BaseModel):
    tickers: List[str]
    weights: List[float]
    investment_amount: float = Field(default=100000.0, gt=0)
    scenario: str = "broad_market"  # covid_crash, rate_hike, correction, broad_market, banking_crisis, custom
    custom_shock_pct: Optional[float] = None


class StressTestResponse(BaseModel):
    scenario_name: str
    scenario_description: str
    scenario_type: str  # "historical_replay" or "hypothetical_shock"
    estimated_pnl_inr: float
    estimated_pnl_pct: float
    portfolio_value_before: float
    portfolio_value_after: float
    duration_trading_days: int
    asset_impacts: List[Dict[str, Any]]
    assumptions: List[str]
