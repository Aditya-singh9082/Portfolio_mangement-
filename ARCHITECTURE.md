# End-to-End System Architecture: Investment Risk Intelligence Platform

---

## 1. Executive System Architecture

```mermaid
flowchart TD
    subgraph L1_Data ["1. Data Ingestion & Live Market Feed Layer"]
        direction TB
        YF["Yahoo Finance Live API (yfinance)"]
        NSE["NSE India & BSE Price Panels"]
        US_FEED["US & Global Feeds (NASDAQ / NYSE)"]
        MACRO["Indian Macro Feed (RBI Repo, Brent, USD/INR, CPI)"]
        
        SYNC_ENGINE["Live Sync Engine (POST /api/market-data/refresh)"]
        LOCAL_CSV[("Disk Cache: data/prices_adjusted_close.csv")]
        MEM_CACHE[("In-Memory Price Panel & Ticker Cache")]

        YF --> SYNC_ENGINE
        NSE --> SYNC_ENGINE
        US_FEED --> SYNC_ENGINE
        MACRO --> SYNC_ENGINE
        SYNC_ENGINE --> LOCAL_CSV
        LOCAL_CSV --> MEM_CACHE
    end

    subgraph L2_DataPrep ["2. Time-Series Alignment & Returns Engine"]
        direction TB
        INNER_ALIGN["Strict Date-Intersection Inner Alignment (Zero Look-Ahead)"]
        LOG_RET["Daily Continuous Compounded Log-Returns (r_t = ln(P_t / P_{t-1}))"]
        COV_MAT["Empirical Covariance Matrix (Σ) & Pearson Correlation Matrix (ρ)"]
        PORT_WEALTH["Portfolio Wealth Curve & Underwater Drawdown Generator"]

        MEM_CACHE --> INNER_ALIGN
        INNER_ALIGN --> LOG_RET
        LOG_RET --> COV_MAT
        LOG_RET --> PORT_WEALTH
    end

    subgraph L3_Quant ["3. Multi-Model Quantitative Risk Engine"]
        direction TB
        subgraph Models ["6 Core Statistical Risk Models"]
            M_HIST["Historical Simulation (Non-Parametric)"]
            M_NORM["Parametric Normal (Gaussian Integral)"]
            M_T["Student-t MLE Distribution (Heavy Tails)"]
            M_MC["Monte Carlo (10,000 Cholesky Correlated Paths)"]
            M_GARCH["GARCH(1,1)-t Conditional Volatility (arch)"]
            M_FHS["Filtered Historical Simulation (FHS Bootstrap)"]
        end

        subgraph Decomp ["Euler Risk Attribution"]
            EULER_MVAR["Marginal VaR: ∂VaR/∂w_i = (Σw)_i / σ_p * z_α"]
            EULER_CVAR["Component VaR: w_i * MVaR_i"]
            RC_RATIO["Risk-to-Weight Contribution Ratio (Diversifier vs Driver)"]
        end

        subgraph Validation ["Dynamic Out-of-Sample Backtesting"]
            OOS_WIN["250-Day Rolling Out-of-Sample Window"]
            KUPIEC["Kupiec POF Likelihood Ratio Test: LR_POF ~ χ²(1)"]
            PINBALL["Quantile Pinball Loss Proper Scoring Rule"]
        end

        PORT_WEALTH --> Models
        PORT_WEALTH --> Decomp
        PORT_WEALTH --> Validation
    end

    subgraph L4_AI_ML ["4. Machine Learning & AI Intelligence Layer"]
        direction TB
        subgraph ML_Risk ["9-Factor ML Risk Classifier"]
            FEAT_EXTRACT["9-Factor Feature Extractor (Vol, VaR, CVaR, MDD, Skew, Kurt, etc.)"]
            RF_MODEL["Random Forest Classifier (100 Trees Ensemble)"]
            PROB_DIST["Softmax Class Probability (Low / Medium / High)"]
            XAI["Feature Importance Attribution (MDI)"]
            FEAT_EXTRACT --> RF_MODEL --> PROB_DIST --> XAI
        end

        subgraph AI_Macro ["AI Market Intelligence & Sentiment"]
            MACRO_STATE["Macro Regime Classifier (Interest Rate & Inflation Regimes)"]
            SECTOR_EXP["Portfolio Sector Concentration Engine"]
            CATALYST["Asset-Specific Catalysts & Risk Warnings Generator"]
            MACRO_STATE --> CATALYST
            SECTOR_EXP --> CATALYST
        end

        PORT_WEALTH --> ML_Risk
        MACRO --> AI_Macro
    end

    subgraph L5_Optimizer ["5. Markowitz Optimization & Stress Lab"]
        direction TB
        SLSQP["Sequential Least Squares Programming (SLSQP Optimizer)"]
        PROFILES["Target Risk Profiles: Conservative, Moderate, Aggressive"]
        STRAT_4WAY["4-Way Strategy Benchmark (User vs Optimal vs 1/N vs Index)"]
        
        CRISIS_REPLAY["Crisis Replay (COVID-19 2020, 2022 Rate Hike, Flash Crash)"]
        CUSTOM_SHOCK["Interactive Elasticity Shock Simulator (-1% to -40%)"]

        PORT_WEALTH --> SLSQP --> PROFILES --> STRAT_4WAY
        PORT_WEALTH --> CRISIS_REPLAY
        PORT_WEALTH --> CUSTOM_SHOCK
    end

    subgraph L6_API ["6. High-Performance REST API Layer (FastAPI)"]
        direction TB
        ENDPOINT_ANALYZE["POST /api/portfolio/analyze"]
        ENDPOINT_STRESS["POST /api/portfolio/stress-test"]
        ENDPOINT_REFRESH["POST /api/market-data/refresh"]
        ENDPOINT_ASSETS["GET /api/assets"]
        ENDPOINT_DEMO["GET /api/portfolio/demo"]
        ENDPOINT_HEALTH["GET /api/health"]

        PYDANTIC["Pydantic v2 Schema Validation & Rust Serialization Engine"]
        CORS["Cross-Origin Resource Sharing (CORS) Middleware"]

        L3_Quant --> PYDANTIC
        L4_AI_ML --> PYDANTIC
        L5_Optimizer --> PYDANTIC
        PYDANTIC --> ENDPOINT_ANALYZE
    end

    subgraph L7_UI ["7. Frontend Client Application (React 19 + TypeScript + Vite)"]
        direction TB
        NAVBAR["Navbar (Live Feed Pulse, Data As-Of, 1-Click Sync Button)"]
        
        TAB_OVERVIEW["Overview Tab: Portfolio Cards, ML Classification, Macro Intelligence, Alpha/Beta"]
        TAB_BUILDER["Portfolio Builder: Weight Sliders, Normalizer, Custom Ticker Ingestion, Presets"]
        TAB_RISK["Risk Analysis: Risk-Return Frontier Scatter, Multi-Horizon VaR/CVaR, Euler Table"]
        TAB_PERF["Performance Tab: Simulated Growth Curve, Drawdown Underwater, Benchmark Alpha"]
        TAB_ALLOC["Allocation Tab: Pairwise Correlation Heatmap, 4-Way Strategy Comparison"]
        TAB_STRESS["Stress Lab: Crisis Replay, Capital Loss Breakdown, Real-time Shock Slider"]
        TAB_VALID["Dynamic Backtest: 250-Day Out-of-Sample Breaches, Kupiec p-values, Pinball Loss"]

        RECHARTS["Recharts Data Visualization Engine (AreaChart, LineChart, ScatterChart)"]

        NAVBAR --> TAB_OVERVIEW
        TAB_OVERVIEW --> RECHARTS
        TAB_BUILDER --> RECHARTS
        TAB_RISK --> RECHARTS
        TAB_PERF --> RECHARTS
        TAB_ALLOC --> RECHARTS
        TAB_STRESS --> RECHARTS
        TAB_VALID --> RECHARTS
    end

    L6_API <===> |JSON Over HTTP / REST| L7_UI
```

---

## 2. Multi-Market Data Ingestion & Alignment Pipeline

```mermaid
flowchart LR
    subgraph Sources ["Market Data Feeds"]
        NSE_SRC["NSE India (.NS)"]
        BSE_SRC["BSE India (.BO)"]
        US_SRC["US Equities (NASDAQ / NYSE)"]
        COMM_SRC["Commodities (GLD) & Crypto (BTC-USD)"]
        BENCH_SRC["Benchmark Indices (^NSEI, ^BSESN, ^NDX, ^GSPC)"]
    end

    subgraph Fetcher ["yfinance & Ingestion Worker"]
        YF_WORKER["Dynamic Download Worker (datetime.date.today())"]
    end

    subgraph Cleanser ["Time-Series Data Sanitization"]
        VALIDATE["Non-Zero & Positive Price Check"]
        ADJ_CLOSE["Split & Dividend Adjustment (Adjusted Close)"]
        DATE_ALIGN["Inner Calendar Join (Drops Non-Overlapping Holidays)"]
        LOG_TRANS["Continuous Compounding Log-Returns: r_t = ln(P_t / P_{t-1})"]
    end

    subgraph Storage ["Cache & Access"]
        CSV_STORAGE[("data/prices_adjusted_close.csv")]
        DATA_PANEL["Standardized Matrix: pd.DataFrame (T x N)"]
    end

    Sources --> Fetcher
    Fetcher --> Cleanser
    VALIDATE --> ADJ_CLOSE --> DATE_ALIGN --> LOG_TRANS
    LOG_TRANS --> Storage
```

---

## 3. Quantitative Risk & Multi-Model Engine Architecture

```mermaid
flowchart TD
    INPUT["Portfolio Allocation: Weights (w) & Adjusted Prices Matrix (P)"]
    
    RETURN_SERIES["Compute Daily Return Vector: R_{p,t} = ∑ w_i * R_{i,t}"]
    
    subgraph Parallel_Models ["6 Parallel Statistical Risk Quantile Pipelines"]
        direction TB
        
        subgraph HS ["1. Historical Simulation"]
            HS_SORT["Sort historical returns in ascending order"]
            HS_Q["Empirical Quantiles: q_{0.05}, q_{0.01}"]
            HS_RES["VaR_HS = -q_α | CVaR_HS = E[R | R < -VaR_HS]"]
            HS_SORT --> HS_Q --> HS_RES
        end

        subgraph Param_Norm ["2. Parametric Normal"]
            NORM_PAR["Compute sample mean (μ_p) and variance (σ_p²)"]
            NORM_Z["Standard Normal inverse CDF: z_{0.95}=1.645, z_{0.99}=2.326"]
            NORM_RES["VaR_Norm = -(μ - z_α*σ) | CVaR_Norm = -μ + σ*φ(z_α)/(1-α)"]
            NORM_PAR --> NORM_Z --> NORM_RES
        end

        subgraph Stud_T ["3. Student-t MLE"]
            T_FIT["Fit 3-parameter Student-t (ν, μ, σ) via MLE"]
            T_Q["Analytical Student-t Quantile: t_ν^{-1}(1-α)"]
            T_RES["VaR_t = -(μ + σ * t_ν^{-1}(1-α)) | Heavy-Tail CVaR_t"]
            T_FIT --> T_Q --> T_RES
        end

        subgraph MC_Sim ["4. Monte Carlo Simulation"]
            CHOL["Cholesky Factorization: Σ = L * L^T"]
            MC_DRAWS["Generate 10,000 draws: R_{sim} = μ + L * Z"]
            MC_RES["Sort simulated portfolio paths for VaR & CVaR"]
            CHOL --> MC_DRAWS --> MC_RES
        end

        subgraph GARCH_T ["5. GARCH(1,1)-t Dynamic Volatility"]
            GARCH_FIT["Fit: σ_t² = ω + α*ε_{t-1}² + β*σ_{t-1}²"]
            GARCH_FC["Forecast 1-step ahead volatility σ_{T+1}"]
            GARCH_RES["Conditional VaR_t scaled by current market turbulence"]
            GARCH_FIT --> GARCH_FC --> GARCH_RES
        end

        subgraph FHS_Sim ["6. Filtered Historical Simulation (FHS)"]
            FHS_RESID["Extract standardized residuals: z_t = (R_t - μ) / σ_t"]
            FHS_BOOT["Bootstrap sample z* with replacement"]
            FHS_SCALE["Scale by current volatility: R* = μ + σ_{T+1} * z*"]
            FHS_RES["Non-parametric empirical fat tails with GARCH volatility"]
            FHS_RESID --> FHS_BOOT --> FHS_SCALE --> FHS_RES
        end
    end

    INPUT --> RETURN_SERIES
    RETURN_SERIES --> HS
    RETURN_SERIES --> Param_Norm
    RETURN_SERIES --> Stud_T
    RETURN_SERIES --> MC_Sim
    RETURN_SERIES --> GARCH_T
    RETURN_SERIES --> FHS_Sim

    AGGREGATE["Unified Risk Schema (1-Day & 1-Week Horizons @ 95% & 99% Confidence)"]
    HS_RES --> AGGREGATE
    NORM_RES --> AGGREGATE
    T_RES --> AGGREGATE
    MC_RES --> AGGREGATE
    GARCH_RES --> AGGREGATE
    FHS_RES --> AGGREGATE
```

---

## 4. Machine Learning & Decision Attribution Architecture

```mermaid
flowchart TD
    subgraph Feature_Vector ["Feature Extraction Engine (9 Quantitative Factors)"]
        F1["Factor 1: Annualized Volatility (σ_ann)"]
        F2["Factor 2: 1-Day 95% Historical VaR (VaR_95)"]
        F3["Factor 3: 1-Day 95% Expected Shortfall (CVaR_95)"]
        F4["Factor 4: Historical Maximum Drawdown (MDD)"]
        F5["Factor 5: Downside Semi-Deviation (σ_down)"]
        F6["Factor 6: Return Distribution Skewness (S)"]
        F7["Factor 7: Return Distribution Kurtosis (K)"]
        F8["Factor 8: Portfolio Diversification Benefit (DB %)"]
        F9["Factor 9: Max Asset Weight Concentration (w_max)"]
    end

    F_VEC["9-Dimensional Feature Vector: x = [F1, F2, ..., F9]"]
    F1 --> F_VEC
    F2 --> F_VEC
    F3 --> F_VEC
    F4 --> F_VEC
    F5 --> F_VEC
    F6 --> F_VEC
    F7 --> F_VEC
    F8 --> F_VEC
    F9 --> F_VEC

    subgraph Model_Core ["Random Forest Ensemble Classifier"]
        TREES["100 Bootstrap De-correlated Decision Trees"]
        SPLIT["Gini Impurity Optimization: I_G(p) = 1 - ∑ p_i²"]
        AGG["Majority Ensemble Voting & Probability Softmax"]
        TREES --> SPLIT --> AGG
    end

    F_VEC --> Model_Core

    subgraph Outputs ["Explainable AI (XAI) Output Delivery"]
        PRED["Predicted Category: Low / Medium / High"]
        CONF["Confidence Vector: P(Low), P(Med), P(High)"]
        MDI["Mean Decrease in Impurity (MDI) Feature Attribution Table"]
        EXPLAIN["Natural Language Rationale & Risk Factor Diagnosis"]
    end

    AGG --> PRED
    AGG --> CONF
    AGG --> MDI
    AGG --> EXPLAIN
```

---

## 5. Markowitz Optimization & 4-Way Strategy Benchmark Flow

```mermaid
flowchart TD
    INPUT_OPT["Portfolio Returns Time-Series & Target Investor Profile"]

    subgraph Markowitz_Optimizer ["Markowitz Modern Portfolio Theory (SLSQP Solver)"]
        OBJ["Objective Function: Maximize Sharpe Ratio = (w^T μ - R_f) / sqrt(w^T Σ w)"]
        CONSTR["Constraints: ∑ w_i = 1.0 (Full Investment), 0 ≤ w_i ≤ 1.0 (Long-Only)"]
        SOLVER["Sequential Least Squares Programming (SciPy optimize.minimize)"]
        OBJ --> CONSTR --> SOLVER
    end

    subgraph Profiles ["Profile-Specific Optimization Regimes"]
        P_CONS["Conservative: Minimum-Variance (Min w^T Σ w)"]
        P_MOD["Moderate: Balanced 50/50 Risk-Parity Blend"]
        P_AGG["Aggressive: Maximum-Sharpe Tangency Portfolio"]
    end

    INPUT_OPT --> Markowitz_Optimizer
    SOLVER --> Profiles

    subgraph Strategies ["4-Way Strategy Benchmark Generation"]
        S1["Strategy 1: User's Current Portfolio Allocation"]
        S2["Strategy 2: Markowitz Optimal Recommended Allocation"]
        S3["Strategy 3: Equal-Weight Baseline Portfolio (w_i = 1/N)"]
        S4["Strategy 4: Market Benchmark Index (^NSEI / ^NDX / ^GSPC)"]
    end

    Profiles --> Strategies

    subgraph Comparison_Metrics ["Evaluated Comparative Metrics"]
        M1["Total Return %"]
        M2["Annualized Volatility %"]
        M3["Sharpe Ratio (R_f = 6.5%)"]
        M4["Maximum Drawdown %"]
        M5["1-Day 95% & 99% VaR (₹)"]
        M6["1-Day 95% CVaR (₹)"]
    end

    Strategies --> Comparison_Metrics
```

---

## 6. End-to-End Client-Server Execution Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor User as Investor / Quantitative Analyst
    participant UI as React 19 Frontend (Vite)
    participant API as FastAPI REST Gateway
    participant MarketData as Market Data Service
    participant QuantEngine as Quantitative Risk Engine
    participant MLEngine as ML & AI Intelligence Service
    participant OptEngine as Markowitz Optimizer Service
    participant Cache as In-Memory & Disk Cache

    User->>UI: Selects Assets, adjusts Weight Sliders, clicks "Run Portfolio Risk Analysis"
    UI->>API: POST /api/portfolio/analyze (Tickers, Weights, Capital, Profile, Benchmark, Date)
    
    API->>MarketData: get_price_panel(tickers, benchmark, start_date)
    MarketData->>Cache: Check local price cache
    alt Missing Ticker Found
        MarketData->>MarketData: yf.download(missing, start=2018-01-01)
        MarketData->>Cache: Update data/prices_adjusted_close.csv
    end
    MarketData-->>API: Aligned Prices Matrix & Benchmark Series

    par Parallel Execution
        API->>QuantEngine: Compute Portfolio Return Series, Wealth Path & Drawdowns
        API->>QuantEngine: Calculate VaR & CVaR (Historical, Normal, Student-t, MC, GARCH, FHS)
        API->>QuantEngine: Compute Euler Marginal & Component VaR Decomposition
        API->>QuantEngine: Run 250-Day Rolling Backtest (Breaches, Kupiec p-values, Pinball Loss)
    and
        API->>MLEngine: Extract 9-Factor Vector & Predict Risk Tier (Random Forest)
        API->>MLEngine: Generate AI Market Intelligence Report & Macro Regime Insights
    and
        API->>OptEngine: Run Markowitz SLSQP Optimization for Profile
        API->>OptEngine: Compute 4-Way Strategy Benchmark Metrics
    end

    QuantEngine-->>API: Risk Metrics & Diagnostics Payload
    MLEngine-->>API: ML Classification & Macro Report Payload
    OptEngine-->>API: Optimal Weights & 4-Way Strategies Payload

    API->>API: Aggregate unified PortfolioAnalyzeResponse Schema (Pydantic v2)
    API-->>UI: 200 OK JSON Response (< 1.8s latency)

    UI->>UI: Update Global React State (analysisData)
    UI->>User: Renders Interactive Recharts (Frontier, Wealth Curve, Correlations, Diagnostics)
```

---

## 7. Directory & Component Mapping

| Subsystem | Source Location | Key Functions / Responsibilities |
| :--- | :--- | :--- |
| **Data Ingestion** | `api/services/market_data.py` | `get_price_panel`, `load_local_prices`, `refresh_market_data`, on-the-fly dynamic ticker download |
| **Portfolio Series** | `api/services/portfolio.py` | `calculate_portfolio_series`, `compute_performance_metrics`, `compute_correlation_matrix`, alpha/beta regression |
| **Statistical Risk** | `api/services/risk.py` | `compute_risk_measures_all_models`, `compute_risk_contributions` (Euler), `compute_dynamic_diagnostics` (Kupiec & Pinball) |
| **Machine Learning** | `api/services/ml_risk.py` | `predict_portfolio_risk_ml`, 9-factor feature extraction, Random Forest classifier, feature attribution |
| **Market Intelligence** | `api/services/ai_intelligence.py` | `generate_market_intelligence`, RBI repo rates, crude oil, USD/INR, sector sentiment analysis |
| **Optimization** | `api/services/optimizer.py` | `generate_recommendation_and_strategies`, SLSQP mean-variance solver, 4-way strategy generator |
| **Stress Lab** | `api/services/stress.py` | `run_stress_test`, historical crisis replay (COVID, 2022 rate hike), custom interactive drawdown shock |
| **API Endpoints** | `api/main.py` | FastAPI application, CORS middleware, Pydantic route handlers |
| **Data Schemas** | `api/schemas.py` | Pydantic v2 request/response models with type validation |
| **Frontend UI** | `frontend/src/components/` | `OverviewTab.tsx`, `BuilderTab.tsx`, `RiskTab.tsx`, `PerformanceTab.tsx`, `AllocationTab.tsx`, `StressTab.tsx`, `ValidationTab.tsx`, `Navbar.tsx` |
| **API Client** | `frontend/src/lib/api.ts` | Typed fetch client connecting client interface to `/api/*` endpoints |
