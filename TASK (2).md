# TASK.md — Indian Portfolio Risk Intelligence Platform

## 1. Project goal

Build a premium-feeling React web application for the REQUIEM TE/BE Fintech problem statement **Investment Risk Prediction**, using [`VihanS9750/indian-portfolio-risk-model`](https://github.com/VihanS9750/indian-portfolio-risk-model) as the quantitative analytics base.

The application must let a user construct an Indian-equity portfolio, analyse historical and latest available market data, understand its risks, compare it with NIFTY 50, test alternative allocations and stress scenarios, and receive explainable risk-aware recommendations.

**Hackathon constraint:** 3 team members, 6 hours. Prioritise a reliable, complete vertical slice over a large number of unfinished features.

**Important distinction:** The repository is a Python command-line/research risk engine, not a ready-made React app or API. The task is to add a React frontend and a thin API layer, while reusing the existing quantitative code wherever practical. Do not rewrite or silently replace validated risk methods with arbitrary formulas.

---

## 2. Existing repository: starting point and limitations

Repository: <https://github.com/VihanS9750/indian-portfolio-risk-model>

The repository documents the following existing capabilities:

- Indian large-cap equity price/return data ingestion using Yahoo Finance (`yfinance`).
- Six VaR/CVaR estimation approaches: Historical Simulation, Parametric Normal, Parametric Student-t, Monte Carlo, GARCH(1,1)-t, and Filtered Historical Simulation (FHS).
- Out-of-sample risk backtesting and calibration tests.
- Risk decomposition (component/marginal contributions), stress testing, Markowitz optimization, bootstrap confidence intervals, and validation plots.
- INR-denominated outputs and a predefined 15-stock, market-cap-weighted example portfolio.

Important existing files to inspect before changing code:

- `README.md` — documented assumptions, methods, data and run order.
- `config.py` — current universe, weights, dates and risk parameters.
- `01_download_data.py` — historical market data download.
- `02_risk_models.py` — core risk estimation/model functions.
- `03_run_analysis.py` — main analysis workflow.
- `04_scorecard.py` — quantile/pinball loss and statistical model scorecard.
- `05_actual_vs_predicted.py` — GARCH(1,1)-t actual-vs-predicted P&L and out-of-sample coverage.
- `06_fhs.py` — Filtered Historical Simulation and its separate backtest.
- `07_risk_decomposition.py` — asset risk contribution.
- `08_stress_testing.py` — stress scenarios.
- `09_markowitz.py` — portfolio optimization.
- `10_bootstrap_ci.py` — bootstrap confidence intervals.
- `12_validation_plots.py` — model validation outputs.
- `utils.py`, `requirements.txt`, `data/`, `outputs/`.

### Existing-code constraints to confirm during the initial setup level

1. The current setup is centred on a fixed example portfolio; dynamic user-selected tickers, holdings and arbitrary weights must be implemented and tested.
2. A web/API contract does not currently exist. Add a thin API rather than making the React browser run Python scripts directly.
3. NIFTY 50 benchmark comparison must be wired explicitly (Yahoo Finance symbol commonly used: `^NSEI`) and tested independently of the investable-stock universe.
4. The latest Yahoo Finance observation is not guaranteed real-time intraday data. The UI must show the last successful data timestamp and label the feed accurately.
5. Do not assume every research script can be imported safely. Check for top-level execution, hard-coded paths, global configuration and code that runs on import. Refactor carefully so reusable functions can be called without executing the entire pipeline.
6. Current backtest/report outputs for the repository's predefined portfolio must not be misrepresented as results for a user-defined portfolio.
7. Treat model backtests separately: `05_actual_vs_predicted.py` evaluates parametric GARCH(1,1)-t, while `06_fhs.py` evaluates Filtered Historical Simulation (FHS). They use different models and slightly different sample lengths; do not combine their hit rates into one model status.
8. The current 65–66 trading-day out-of-sample window is short, especially for 99% VaR (expected breaches are only about 0.65 over 65 days). Present calibration tests as indicative evidence, not long-term or regulatory proof.
9. The existing project states limitations such as constant/rebalanced weights, no transaction costs and survivorship bias. Preserve relevant caveats in the UI/report.

During initial setup, clone and run the original pipeline once. Save a short baseline note: which commands ran successfully, data source/date range, and any failure. If the original pipeline is blocked, document the blocker and create a working fallback path rather than debugging indefinitely.

---

## 3. Product requirements mapped to the REQUIEM PS

Legend: **Reuse** = documented in the base repository; **Extend** = existing capability must be parameterised or surfaced; **Build** = new application functionality.

| PS requirement | Status | Implementation task |
|---|---|---|
| Select/enter multiple assets | Extend | Multi-select NSE tickers; validate ticker and data coverage. |
| Enter investment amount or allocation | Extend | Support investment amount and editable weights or share quantities. |
| Select risk preference | Build | Conservative, Moderate and Aggressive profile. |
| Analyse historical performance and risk | Reuse + Extend | Display return, annualised volatility, max drawdown, Sharpe, VaR/CVaR and risk contributions for current user inputs. |
| Track latest available prices and gains/losses | Extend | Holdings quantities, latest available price, invested/current value, P&L and data timestamp. |
| Classify portfolio risk Low/Medium/High | Extend | Transparent, documented classification using computed portfolio metrics; label it a rule-based classification unless a trained and evaluated classifier is actually implemented. |
| Recommend risk-appropriate allocation | Extend | Reuse/extend Markowitz optimiser; respect constraints; explain trade-offs and assumptions. |
| Compare assets | Reuse + Extend | Comparable return, volatility, drawdown, Sharpe, correlation and risk metrics for the same date range. |
| Simulate historical portfolio performance | Extend | User-controlled date range and dynamic portfolio weights; show growth and drawdown. |
| Compare against NIFTY 50 | Extend | Same-date-range comparison using `^NSEI`; display return, volatility, max drawdown, Sharpe and growth. |
| Identify assets driving risk/return | Reuse + Extend | Surface component/marginal risk contribution with percentage contribution and an explanation. |
| Compare portfolio strategies | Extend | User portfolio vs recommended allocation vs equal-weight portfolio vs NIFTY 50. |
| Market scenario analysis (bonus) | Reuse + Extend | Surface existing stress-testing function; add an adjustable shock where feasible. |
| AI market intelligence (bonus) | Optional | Only add after the core requirements pass; news/API issues must not block the demo. |
| Explainable recommendations (bonus) | Build/Extend | Explain concentration, volatility, correlation, drawdown and risk contribution in plain language. |

---

## 4. Required architecture

### Frontend

- **React + TypeScript + Vite**.
- Tailwind CSS for design tokens and responsive styling.
- Recharts for time-series and risk visualisations; Lucide icons.
- React Router if multiple routes are used.
- Use a clear API client module; never hard-code analytical results in UI components.
- Avoid adding a global state library unless needed. React state/context is enough for this MVP.

### Backend

- **FastAPI** in Python, serving as a thin interface to the existing analytics engine.
- Pydantic request/response schemas and validation.
- A service layer that loads/validates price data, computes portfolio metrics and calls reusable functions from the original repository.
- Refactor the research scripts only as much as required to expose reusable functions. Preserve CLI behaviour where practical.
- Never let a request execute every research script or regenerate all charts synchronously.

### Data and fallback behaviour

- Yahoo Finance through the existing data layer is the primary market-data path.
- Use a prepared, clearly labelled historical CSV fallback so the app can be demonstrated without network access.
- Include a `data_as_of` field in API responses and show it in the interface.
- Never silently replace missing data with zero, fabricate a price, or label a stale/cached observation as live.
- If data fetch fails, show a visible stale/fallback-data notice and keep historical analysis available.
- Do not introduce a database or authentication for the six-hour MVP unless the core requirements are already complete.

### Suggested workspace (adapt if the repository has a better structure)

```text
indian-portfolio-risk-model/
├── config.py
├── utils.py
├── 02_risk_models.py
├── ...existing analysis scripts...
├── api/
│   ├── main.py                 # FastAPI app and route registration
│   ├── schemas.py              # Pydantic request/response models
│   ├── services/
│   │   ├── market_data.py
│   │   ├── portfolio.py
│   │   ├── risk.py
│   │   └── optimizer.py
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── lib/api.ts
│   │   ├── types/
│   │   └── App.tsx
│   ├── package.json
│   └── ...Vite/Tailwind config...
├── data/
├── outputs/
└── TASK.md
```

Because `02_risk_models.py` starts with a digit, normal Python import syntax cannot import it as `import 02_risk_models`. Inspect how its functions are currently loaded. If necessary, move reusable functions into a clearly named module such as `risk_engine.py`, update the old script to import from it, and add regression checks. Do not copy-paste model logic into the API.

---

## 5. User experience and premium visual direction

Create a refined financial analytics product—not a generic admin template.

### Visual direction

- Dark, premium charcoal/navy canvas with restrained emerald/teal positive accents and amber/red risk states.
- Clear typography, strong spacing, consistent alignment, low-noise cards, subtle borders and restrained motion.
- Meaningful charts with readable axes, tooltips and legends. Colour must not be the only way to communicate risk.
- Responsive on laptop first, but usable on tablet/mobile.
- Use skeletons during analysis, explicit empty states, error messages and a visible data timestamp.
- Avoid excessive glassmorphism, giant gradients, fake financial figures, overloaded cards and ornamental charts.
- Show labels such as **Historical**, **Forecast**, **Scenario** and **Data as of** so the user can distinguish observations from estimates.

### Suggested application navigation

1. **Overview** — total portfolio value, daily change, risk classification, VaR/CVaR, volatility, max drawdown, benchmark comparison and key risk drivers.
2. **Portfolio Builder** — add/remove tickers, enter investment amount or holdings, edit weights, choose risk preference, choose period and benchmark.
3. **Risk Analysis** — VaR/CVaR method comparison, volatility, drawdown, correlation matrix, risk contributions and model/backtest evidence where available.
4. **Performance & Backtest** — portfolio growth, drawdown curve, selected historical period, strategy comparison and NIFTY 50.
5. **Allocation Lab** — current vs recommended vs equal-weight allocation, efficient frontier if callable within the time budget, weights and risk-return trade-offs.
6. **Stress Lab** — preset market/sector shocks and user-adjustable shock size; show estimated INR loss and assumptions.
7. **Model Validation** — model-by-model VaR breach coverage, Kupiec/Christoffersen/DQ test outputs where available, quantile-loss ranking, sample-size warning and separate horizon-specific metrics.

For the six-hour version, these can be tabs or sections in one dashboard rather than six separate complex routes. The portfolio builder and overview are the first priorities.

---

## 6. Core user workflow

1. User opens the dashboard and sees the data timestamp plus a clear sample/demo-data notice when applicable.
2. User selects two or more Indian tickers (for example `RELIANCE.NS`, `TCS.NS`, `INFY.NS`) and a benchmark (`^NSEI` by default).
3. User enters investment amount and either holdings quantities or portfolio weights. Validation ensures weights are non-negative and sum to 100% (or the UI explicitly normalises them with confirmation).
4. User selects a historical period and a risk profile: Conservative, Moderate or Aggressive.
5. User runs analysis.
6. The backend returns computed risk/performance metrics and warnings without exposing internal stack traces.
7. User sees the top risk drivers, an allocation proposal and a comparison with equal-weight and NIFTY 50.
8. User changes an input or stress scenario and reruns/recalculates; dependent visuals update accordingly.
9. User can download a concise CSV or JSON report if time permits. PDF export is optional, not a blocker.

---

## 7. API contract — minimum useful endpoints

Use these contracts as a target; adapt to the functions that actually exist after the repository inspection.

### `GET /api/health`

```json
{ "status": "ok", "service": "portfolio-risk-api" }
```

### `GET /api/assets?query=rel`

Return supported ticker, display name if available, sector if available, and last available price/date. Do not promise exhaustive symbol search if using a fixed universe.

### `POST /api/portfolio/analyze`

Example request:

```json
{
  "tickers": ["RELIANCE.NS", "TCS.NS", "INFY.NS"],
  "weights": [0.4, 0.35, 0.25],
  "investment_amount": 100000,
  "risk_preference": "moderate",
  "start_date": "2023-01-01",
  "end_date": null,
  "benchmark_ticker": "^NSEI"
}
```

Minimum response fields:

```json
{
  "data_as_of": "YYYY-MM-DD",
  "currency": "INR",
  "portfolio": {
    "investment_amount": 100000,
    "weights": {},
    "latest_value": null,
    "pnl_amount": null,
    "total_return_pct": null
  },
  "risk": {
    "classification": "medium",
    "classification_type": "rule_based",
    "annualized_volatility_pct": null,
    "max_drawdown_pct": null,
    "sharpe_ratio": null,
    "var_95_amount": null,
    "cvar_95_amount": null,
    "var_method": null
  },
  "asset_metrics": [],
  "risk_contributions": [],
  "performance_series": [],
  "benchmark_metrics": {},
  "strategies": [],
  "recommendation": {
    "weights": {},
    "expected_risk_pct": null,
    "expected_return_pct": null,
    "explanation": []
  },
  "model_diagnostics": {
    "backtest_window": {"start_date": null, "end_date": null, "observations": null, "notice": null},
    "models": [],
    "pinball_loss_ranking": [],
    "validation_warnings": []
  },
  "risk_metrics_by_horizon": [],
  "warnings": []
}
```

`null` above indicates a field that must be filled with a real computed value when the endpoint claims support; it is not permission to return fake data. Prefer a clear `422`/`503` error or a warning for unavailable data over fabricated numbers.

### `POST /api/portfolio/stress-test` (P1 if time permits)

Request: selected tickers, weights, investment amount and either a named scenario or a set of shock percentages. Response: scenario definition, estimated portfolio change in INR and percent, affected assets, and assumptions.

### `GET /api/portfolio/demo`

Optional. Supplies a known-good, clearly labelled demo portfolio using a committed/prepared dataset. This should be independent of live API availability.

### API rules

- Enable CORS only for the local frontend development origin(s) needed.
- Validate ticker count, duplicate symbols, date order, missing data, weights, investment amount and risk-profile enum.
- Do not return Python NaN/Infinity; serialise safely or return an explicit error/warning.
- Return actionable errors to the UI, but keep stack traces in server logs only.
- Avoid repeated market downloads on every render; cache fetched data for a short, explicit interval where appropriate.

---

## 8. Quantitative and financial correctness requirements

1. **No fake ML claims.** If Low/Medium/High is based on thresholds, label it `rule_based`. Only label it ML when a model has been trained and evaluated on time-separated data.
2. **Avoid look-ahead leakage.** Historical simulation must not use future data in past decisions. For ML evaluation use chronological splits; do not randomly split time-series rows.
3. **Keep periods consistent.** Compare portfolio and benchmark on matching dates. Clearly disclose if data rows are dropped because one symbol has no observation.
4. **Annualisation must be consistent.** For daily data, use the documented trading-day convention (typically 252) consistently and display the chosen convention.
5. **Define drawdown.** Calculate peak-to-trough drawdown from the cumulative value/wealth series; label maximum drawdown clearly.
6. **Define VaR/CVaR consistently.** Document horizon (1-day or 1-week), confidence (95%/99%), model/method and sign convention. Show loss in INR and as a percentage of portfolio value. Never put 1-day and 1-week CVaR estimates in one undifferentiated comparison.
7. **Model-specific calibration statuses.** Display calibration by model × confidence level × horizon. For the current run, GARCH(1,1)-t at 95% VaR had 8 breaches/66 observations (12.12% hit rate; 87.88% non-breach coverage; Kupiec POF p=0.021) and should show `Under-covered / FAIL in this sample`. FHS at 95% had 3 breaches/65 observations (4.62% hit rate; Kupiec p=0.885) and may show `No rejection in this sample`, alongside the small-sample caveat. Do not display one blanket `All models validated` badge.
8. **Short backtest sample warning.** For the current 65-observation FHS window, show: `Backtest window: 65 trading days — indicative short-term evaluation, not long-term validation.` At 99% confidence, the expected number of breaches is only about 0.65; one breach corresponds to 1.54%. The sample is too short to establish robust long-term calibration. A non-significant test does not prove a model is correct.
9. **Pinball loss interpretation.** Lower quantile/pinball loss is better. Use numeric CSV values as the source of truth and verify any text labels such as `A > B`, which may describe ranking order rather than the numeric inequality.
10. **Do not imply guarantees.** Backtested or modelled results are estimates, not assurances of future returns or loss limits.
11. **Allocation constraints must be visible.** If long-only and fully-invested weights are used, validate weights and disclose those constraints. Transaction costs and taxes are out of scope unless implemented.
12. **Optimizer outputs must be sanity-checked.** Weights must be finite, sum to 100% within tolerance and obey the declared constraints. If optimisation fails, show a clear fallback (equal-weight or original portfolio), labelled as fallback.
13. **Data freshness and survivorship caveats.** Show the last available date. Preserve the repository's limitations; do not call end-of-day data “real-time”.
14. **Currency and units.** Rupee amounts must be formatted as INR; percentages, daily vs annualised metrics, and risk horizon must be explicit.
15. **Benchmark is not an investable asset by default.** Use NIFTY 50 as a comparator, not as an optimizable stock, unless a separately modelled investable proxy is deliberately introduced.

### Verified baseline findings from the current pipeline run

These are baseline outputs provided after running the existing scripts. Treat them as reference values for regression checks, not as outputs for every user-customized portfolio. If input data, period, weights or code changes, recalculate instead of hard-coding these numbers into the UI.

**Portfolio and return properties**

- Example portfolio: ₹1 crore, 15 market-cap-weighted Indian large-cap stocks; 2,082 trading-day observations spanning 2018–2026.
- Annualised volatility: 17.25%; skewness: −0.659; excess kurtosis: +17.48.
- Reported current-model 95% 1-day VaR range: ₹1.24 lakh (GARCH-t) to ₹1.72 lakh (Normal/Monte Carlo).
- Reported 99% 1-day VaR range: ₹2.01 lakh (GARCH-t) to ₹2.76 lakh (Historical).
- Reported 99% 1-week CVaR range: ₹5.70 lakh (GARCH-t) to ₹10.20 lakh (Historical). Keep this separate from the 1-day bootstrap metrics below.

**Model-specific backtest outcomes**

- `05_actual_vs_predicted.py`, parametric GARCH(1,1)-t, 2 March 2026–8 June 2026, N=66: 95% VaR breaches = 8; hit rate = 12.12%; non-breach coverage = 87.88%; Kupiec POF p=0.021. Show as a 95% under-coverage failure in this sample.
- `06_fhs.py`, FHS, 2 March 2026–5 June 2026, N=65: 95% VaR breaches = 3; hit rate = 4.62%; Kupiec POF p=0.885. Show as no rejection by the reported Kupiec test in this sample, not as proof of long-term calibration.
- A separate reported full-window figure for FHS is 63/66 non-breach observations (95.45%); clearly identify its denominator/sample definition if displayed alongside the 65-observation result.
- The 99% VaR test window is too short for strong conclusions: expected breaches at N=65 are 0.65. Show actual breach count and test status; avoid describing a non-rejection as conclusive validation.

**Pinball/quantile loss scorecard**

Lower is better. Display each value with its confidence level and unit convention (`reported score × 10^4`), and avoid converting the rank into an opposite numeric inequality.

| Confidence | Model | Pinball loss (reported × 10^4) | Rank |
|---|---|---:|---:|
| 95% | FHS | 11.121 | 1 |
| 95% | GARCH-t | 11.609 | 2 |
| 95% | Normal | 11.834 | 3 |
| 95% | Historical | 13.489 | 4 |
| 95% | Student-t | 13.596 | 5 |
| 99% | Historical | 2.945 | 1 |
| 99% | Student-t | 2.968 | 2 |
| 99% | FHS | 3.055 | 3 |
| 99% | Normal | 3.088 | 4 |
| 99% | GARCH-t | 3.113 | 5 |

**Other reported baseline outputs**

- GARCH(1,1)-t volatility forecast: QLIKE 1.4485 vs constant-volatility baseline 1.5201 (lower QLIKE is better); reported RMSE was also lower.
- Risk decomposition: 1-day 99% total VaR ₹2,52,783; diversification benefit 37.4% compared with the sum of standalone VaRs ₹4,03,640. RELIANCE.NS risk share 19.86% at 16.94% weight; SBIN.NS risk share 11.67% at 8.98% weight.
- Stress tests: COVID replay −34.51% over 22 trading days; maximum sample drawdown −35.97%; worst one-month window −41.11%; banking shock (banks −20%) estimated −₹7.95 lakh; broad-market shock (all assets −10%) estimated −₹10 lakh.
- Markowitz results: cap-weighted return 16.36%, volatility 17.25%, Sharpe 0.57, 1-day 99% VaR ₹2,52,783; minimum-variance return 12.51%, volatility 14.71%, Sharpe 0.41, VaR ₹2,15,517; maximum-Sharpe return 20.03%, volatility 18.52%, Sharpe 0.73, VaR ₹2,71,348. Verify the return metric's annualisation and period label before presenting it.
- Bootstrap (daily returns, block length 10, 2,000 resamples): 1-day 99% VaR ₹2,75,941 [95% CI ₹2,33,966–₹3,82,769]; 1-day 99% CVaR ₹4,56,137 [95% CI ₹3,04,294–₹6,57,438]. These are distinct from 1-week CVaR values.

### Required model-validation UI

Create a dedicated Model Validation area or panel that displays:

- Model, confidence level, horizon, test start/end dates, sample size, breach count, hit rate, target hit rate and test result (with p-value where computed).
- A plain-language status per model and confidence level: e.g. `GARCH-t — under-covered / failed Kupiec POF at 95% in this sample (p=0.021)` and `FHS — no rejection by Kupiec POF at 95% in this sample (p=0.885)`.
- The warning: `Backtest window: 65 trading days — indicative short-term evaluation, not long-term validation.`
- Pinball-loss rankings with the numeric values and a legend that lower is better.
- Separate cards/tables for 1-day and 1-week VaR/CVaR. Every metric must carry model, confidence, horizon and data period where relevant.
- No aggregate “validated” badge that hides model differences. Explain that a failure to reject a calibration test is not proof that a model is correct.

---

## 9. Level-wise delivery plan

Work through the levels in order. A level is complete only when its exit criteria pass. The team may work on different tasks in parallel, but do not begin optional polish while a lower-level requirement is broken.

### Level 0 — Baseline and shared contracts

- Clone the repository and run the smallest existing data/analysis workflow.
- Record what ran successfully, the data source/date range, output paths and any blocker.
- Inspect how reusable functions are defined and identify hard-coded configuration or top-level script execution.
- Create the React/Vite frontend shell and FastAPI skeleton in parallel.
- Agree on the portfolio request/response schema and one known-good sample portfolio.
- Prepare a fallback historical dataset early if the live data path is unreliable.

**Exit criteria:** The baseline is understood (or a blocker is documented), the React app renders, `/api/health` responds, and frontend/backend agree on the request/response shape.

### Level 1 — Working end-to-end vertical slice

- Let the user select at least two supported Indian stocks and enter an investment amount and valid weights.
- Load either verified market data or a clearly labelled fallback dataset.
- Calculate and return actual portfolio returns, volatility and drawdown.
- Show the results in React through the API client, with loading, validation and failure states.

**Exit criteria:** Selecting assets and pressing **Analyse** displays real computed metrics in the React application. No analytical results are hard-coded in the UI.

### Level 2 — Core REQUIEM risk requirements

- Integrate the existing VaR/CVaR methods where they can be called reliably.
- Add transparent Low/Medium/High portfolio risk classification and disclose whether it is rule-based or model-based.
- Display asset-level performance, correlation and risk contributions where supported by the base engine.
- Integrate NIFTY 50 as a benchmark and compare both series over matching dates.
- Expose the existing model scorecard and backtest data in a Model Validation panel: model, confidence level, horizon, sample dates/count, breach count/hit rate, test/p-value where available, and pinball loss.
- Distinguish GARCH-t and FHS results; show the 65–66 trading-day sample warning and lower-is-better pinball-loss ranking.
- Show the last available data date and a visible stale/fallback-data notice where applicable.

**Exit criteria:** The main portfolio risk workflow works end-to-end, benchmark dates match, each risk metric is labelled by model/confidence/horizon, and model-validation statuses are not merged into one blanket badge.

### Level 3 — Recommendations and strategy comparison

- Connect the Markowitz optimizer if it can be integrated without destabilising the core workflow.
- Compare the user portfolio, equal-weight portfolio, recommended allocation and NIFTY 50.
- Explain the key drivers behind risk and recommendations, such as volatility, concentration, correlation and asset risk contribution.
- Add historical date-range selection and a portfolio growth/drawdown view.

**Exit criteria:** Users can compare the original and equal-weight portfolios against NIFTY 50; the recommended strategy is included if the optimizer is working and validated. Any unavailable feature is clearly labelled rather than represented with fabricated values.

### Level 4 — Stress testing and premium UX

- Surface the repository's existing stress-testing functionality where practical, or provide a clearly labelled deterministic shock calculation.
- Add scenario controls and display estimated impact in INR and percentage terms.
- Refine the layout, spacing, responsive behaviour, tooltips, loading skeletons, empty states and error states.
- Ensure charts distinguish observed historical results from model forecasts and hypothetical scenarios.

**Exit criteria:** The dashboard is coherent and understandable, and at least one stress scenario can be demonstrated from the UI with assumptions disclosed.

### Level 5 — Validation, feature freeze and demo readiness

- Freeze new feature development; focus on reliability and the complete demo path.
- Test invalid weights, missing ticker data, incorrect date ranges, failed data downloads, stale cached data and optimizer failure.
- Manually validate at least one small portfolio calculation and confirm weights satisfy their declared constraints.
- Cross-check displayed model statuses, confidence levels, horizons, breach counts, p-values and pinball losses against the CSV outputs generated by the scripts.
- Confirm the GARCH-t 95% outcome is shown as under-covered/failed in the tested sample (8/66 breaches, 12.12%, Kupiec POF p=0.021), while the FHS 95% outcome is shown separately (3/65, 4.62%, p=0.885; no rejection in this sample).
- Confirm the 65–66 observation backtest warning is visible, 99% VaR validation is not overclaimed, and 1-day and 1-week CVaR values are not mixed.
- Confirm there are no fabricated fallback values, no visible console errors on the normal demo path, and no mismatch between historical dates used for the portfolio and benchmark.
- Verify frontend/backend run instructions and keep a known-good fallback dataset available.
- Rehearse the demo narrative and clearly disclose data freshness and model limitations.

**Exit criteria:** The application starts using documented commands and the main user journey works repeatedly, including when live data is unavailable; model-validation cards agree with the current output files and carry appropriate sample-size caveats.

### Scope rule

P0 requirements take priority over P1 improvements and optional bonus features. If the team is behind, remove optional features in this order: AI news intelligence, extra ML models, PDF export, then advanced optimizer visualisations. Do not remove the core portfolio analysis, risk explanation, benchmark comparison or data-freshness disclosure to make room for visual extras.

---

## 10. Team allocation (3 members)

### Member 1 — Quant/ML and existing Python code

- Inspect and expose reusable functions from `02_risk_models.py` and related modules.
- Implement dynamic portfolio weights and calculate core metrics for arbitrary selected tickers.
- Integrate VaR/CVaR, risk decomposition and risk classification.
- Keep existing command-line workflows working when practical.
- Add minimal tests for formulas and output schemas.

### Member 2 — React UI/UX

- Set up React + TypeScript + Vite, Tailwind and charting.
- Build Overview, Portfolio Builder, Risk Analysis and strategy comparison views.
- Create premium design tokens and consistent components for cards, tables, charts, badges, controls, loading states and errors.
- Connect via the shared API client; do not hard-code computed results.

### Member 3 — API/data/optimizer integration

- Implement FastAPI routes and Pydantic schemas.
- Integrate market-data fetching, caching, fallback CSV and NIFTY 50 comparison.
- Connect optimizer and stress-test functions where possible.
- Own integration tests, CORS, error handling and end-to-end smoke test.

### Integration discipline

- Agree on request/response schemas before parallel coding.
- Commit in small increments; avoid multiple members rewriting `config.py` or the same risk functions.
- Prepare and test the fallback dataset as soon as the initial data check shows that the public data path may be unreliable; never block UI development on a public API.
- Keep one person responsible for the final working main branch.

---

## 11. Acceptance criteria / definition of done

The project is considered demo-ready only when all P0 criteria pass:

### Functionality

- [ ] React app starts using documented commands.
- [ ] FastAPI starts using documented commands and `/api/health` returns healthy status.
- [ ] User can select at least two supported Indian stocks and enter a positive investment amount.
- [ ] User can provide weights or holdings; invalid weights are handled visibly.
- [ ] Clicking Analyse returns actual computed risk metrics for the selected assets/weights.
- [ ] Low/Medium/High risk classification is visible and its rule/model basis is disclosed.
- [ ] Historical performance, volatility, maximum drawdown and Sharpe ratio display with units and period.
- [ ] At least one documented VaR method and CVaR/Expected Shortfall are displayed with horizon/confidence/model labels when the base model can compute them.
- [ ] Model Validation shows model-specific backtest results; GARCH-t 95% (8/66 breaches, 12.12%, Kupiec p=0.021) is distinct from FHS 95% (3/65, 4.62%, p=0.885).
- [ ] The dashboard explains the short 65–66 observation sample and does not present a non-rejected calibration test as proof of correctness.
- [ ] Pinball-loss ranking matches the numeric outputs, with `lower is better` clearly stated.
- [ ] One-day bootstrap CVaR and one-week model CVaR are clearly separated.
- [ ] NIFTY 50 comparison uses the same date range and is clearly labelled.
- [ ] At least original and equal-weight strategy comparisons work; recommended allocation is included if the optimizer can be integrated reliably.
- [ ] Asset risk contribution or a clear explanation of top risk drivers is visible.
- [ ] Data timestamp and any stale/fallback-data warning are visible.
- [ ] No fabricated values are shown when APIs or models fail.

### UX and quality

- [ ] UI looks cohesive and professional at laptop size and remains usable on mobile/tablet.
- [ ] Loading, empty, validation, network-error and model-failure states are implemented.
- [ ] Charts have titles, units, tooltips and understandable legends.
- [ ] No visible console errors during the normal demo path.
- [ ] Demo path works without internet if the fallback dataset is available.
- [ ] README/run instructions include frontend and backend commands.

### Explicitly out of scope for the six-hour MVP

- Brokerage account linking or real-money trading.
- User authentication, roles and cloud database.
- Production-grade intraday streaming.
- A fully automated news sentiment pipeline.
- PDF report generation unless all P0 criteria already pass.
- Multiple sophisticated ML models without sufficient evaluation.

---

## 12. Demo narrative (2–3 minutes)

1. Select three Indian stocks and set a ₹1,00,000 portfolio with editable weights.
2. Show the selected period, latest available data date and NIFTY 50 benchmark.
3. Run analysis and explain volatility, maximum drawdown, 95% VaR/CVaR and portfolio risk class.
4. Point out which holding contributes most to risk and explain whether correlation reduces or increases diversification.
5. Compare the original portfolio with equal weighting and the recommended allocation.
6. Run a market shock and show the estimated impact in rupees.
7. Finish with a clear caveat: model estimates and historical backtests are informative, not guarantees or personal financial advice.

---

## 13. Immediate next actions

1. Inspect and run the original repository; record any errors and generated output paths.
2. Create a branch for hackathon integration; do not overwrite the original research results.
3. Build the FastAPI health endpoint and React shell immediately.
4. Deliver the smallest end-to-end vertical slice first: ticker selection → portfolio weights → risk calculation → chart and explanation.
5. Add requirements level by level; once the validation/demo-readiness level begins, stop feature development and focus on integration and reliability.

**Success principle:** Keep the quantitative engine honest, make the React experience premium, and ensure every displayed number comes from a real calculation or is clearly labelled demo/fallback data.
