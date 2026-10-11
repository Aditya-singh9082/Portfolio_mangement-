"""
AI Market Intelligence & Sentiment Service
Analyzes macroeconomic indicators, sector sentiment trends, and market regime risks
tailored specifically to the assets held in the user's portfolio.
"""

from typing import List, Dict, Any
import numpy as np
import pandas as pd


# Real-world macroeconomic benchmark regime indicators for Indian markets
MACRO_INDICATORS = [
    {
        "indicator": "RBI Monetary Policy (Repo Rate)",
        "value": "6.50%",
        "stance": "Neutral / Data-Dependent",
        "impact": "Steady policy environment supporting domestic bank net interest margins, but borrowing costs remain elevated for capex-heavy sectors.",
        "sentiment": "Neutral"
    },
    {
        "indicator": "Brent Crude Oil",
        "value": "$74 - $78 / bbl",
        "stance": "Rangebound",
        "impact": "Moderate crude prices provide relief to Indian current account deficit, lowering raw material pressure on paint (Asian Paints) and auto sectors.",
        "sentiment": "Bullish"
    },
    {
        "indicator": "USD / INR Exchange Rate",
        "value": "₹83.8 - ₹84.1",
        "stance": "Controlled Depreciation",
        "impact": "A soft rupee supports operating margins for IT exporters (TCS, INFY) and pharma multinationals (Sun Pharma), offsetting US tech discretionary spend slowdown.",
        "sentiment": "Bullish"
    },
    {
        "indicator": "Headline CPI Inflation",
        "value": "4.8% YoY",
        "stance": "Within RBI 4+/-2% Band",
        "impact": "Stable inflation bolsters rural FMCG volume recovery (HUL, ITC) and consumer discretionary spending.",
        "sentiment": "Bullish"
    },
    {
        "indicator": "NIFTY 50 Trailing P/E Valuation",
        "value": "22.4x",
        "stance": "Fair to Modestly Premium",
        "impact": "Indian equities trade at a modest premium to long-term historical average (20.5x), meaning earnings delivery is critical to sustain valuations.",
        "sentiment": "Neutral"
    }
]

SECTOR_INTELLIGENCE = {
    "Energy": {
        "sentiment": "Neutral",
        "catalysts": "Refining margins resilience and sustained domestic demand for transport fuels and petrochemical products.",
        "risks": "Global demand moderation, windfall taxes, and high capex in renewable energy transitions."
    },
    "IT": {
        "sentiment": "Cautious / Neutral",
        "catalysts": "Enterprise AI integration, multi-year cloud transformation renewals, and margin defense through rupee tailwinds.",
        "risks": "Prolonged decision-making cycles in US and European BFSI clients, discretionary deal pauses."
    },
    "Banking": {
        "sentiment": "Bullish",
        "catalysts": "Robust corporate credit growth (13-15%), multi-decade low gross non-performing assets (GNPAs < 2.5%), and strong capital adequacy.",
        "risks": "Deposit growth lagging credit demand, pressuring incremental cost of funds and NIM compression."
    },
    "FMCG": {
        "sentiment": "Bullish",
        "catalysts": "Normal monsoon stimulating rural wage recovery, moderating agricultural input costs, and stable pricing power.",
        "risks": "Intensifying competition from regional and direct-to-consumer players in urban centers."
    },
    "Auto": {
        "sentiment": "Bullish",
        "catalysts": "Strong SUV mix driving higher average selling prices, commercial vehicle replacement cycles, and expanding EV footprints.",
        "risks": "Rising dealer inventories in entry-level passenger vehicles and raw material price volatility."
    },
    "Pharma": {
        "sentiment": "Bullish",
        "catalysts": "Defensive earnings characteristics, high specialty product uptake in the US, and robust domestic formulation sales.",
        "risks": "US FDA inspection observations at key manufacturing sites, price erosion in commoditized generics."
    },
    "Metals": {
        "sentiment": "Cautious",
        "catalysts": "Government infrastructure capex outlays and domestic building construction demand.",
        "risks": "Chinese steel exports dumping into global markets depressing hot-rolled coil realization prices."
    },
    "Telecom": {
        "sentiment": "Bullish",
        "catalysts": "Tariff hikes driving industry ARPU expansion towards ₹220+, 5G monetization, and duopoly pricing discipline.",
        "risks": "High ongoing 5G spectrum and tower infrastructure debt servicing."
    },
    "Infra": {
        "sentiment": "Bullish",
        "catalysts": "Record order book visibility from domestic rail, highways, renewable energy, and Middle East EPC contracts.",
        "risks": "Execution delays, commodity cost escalation, and working capital cycle expansion."
    },
    "Consumer": {
        "sentiment": "Neutral",
        "catalysts": "Festive and real estate demand surge, premiumization trend in home decor.",
        "risks": "Entry of aggressive decorative paints competitors (e.g. Grasim) squeezing operating margins."
    }
}


def generate_market_intelligence(
    tickers: List[str],
    weights: List[float],
    sector_map: Dict[str, str]
) -> Dict[str, Any]:
    """
    Generates tailored AI market intelligence for the portfolio's specific sector allocation.
    """
    # 1. Aggregate portfolio sector weights
    sector_weights: Dict[str, float] = {}
    for t, w in zip(tickers, weights):
        sec = sector_map.get(t, "Diversified")
        sector_weights[sec] = sector_weights.get(sec, 0.0) + w

    # Sort sectors by portfolio exposure
    sorted_sectors = sorted(sector_weights.items(), key=lambda x: x[1], reverse=True)
    
    sector_analyses = []
    bullish_weight = 0.0
    neutral_weight = 0.0
    bearish_weight = 0.0

    for sec, w in sorted_sectors:
        info = SECTOR_INTELLIGENCE.get(sec, {
            "sentiment": "Neutral",
            "catalysts": "General macroeconomic expansion and domestic consumption.",
            "risks": "Systemic market volatility and liquidity tightening."
        })
        sentiment = info["sentiment"]
        if "Bullish" in sentiment:
            bullish_weight += w
        elif "Cautious" in sentiment or "Bearish" in sentiment:
            bearish_weight += w
        else:
            neutral_weight += w

        sector_analyses.append({
            "sector": sec,
            "weight_pct": round(w * 100, 1),
            "sentiment": sentiment,
            "catalysts": info["catalysts"],
            "key_risks": info["risks"]
        })

    # Portfolio-level market regime summary
    if bullish_weight > 0.55:
        overall_outlook = "Constructive / Favorable Macro Tailwinds"
        outlook_color = "emerald"
    elif bearish_weight > 0.35:
        overall_outlook = "Vulnerable / Headwind Sensitive"
        outlook_color = "rose"
    else:
        overall_outlook = "Balanced / Resilient Cyclical Exposure"
        outlook_color = "cyan"

    # Top holdings synthesis
    top_sec = sorted_sectors[0][0] if sorted_sectors else "Diversified"
    top_sec_w = round(sorted_sectors[0][1] * 100, 1) if sorted_sectors else 0.0

    insights = [
        f"Your highest sector allocation is {top_sec} ({top_sec_w}%), making portfolio performance particularly responsive to sector-specific policy and earnings surprises.",
        f"{round(bullish_weight * 100, 1)}% of your portfolio is anchored in sectors benefiting from positive macro catalysts (strong domestic bank credit growth, tariff expansion, and stable margins).",
        f"RBI's neutral rate posture and moderating input costs provide a steady foundation, though current equity valuations (NIFTY ~22x P/E) leave limited margin for downside quarterly earnings misses."
    ]

    return {
        "overall_outlook": overall_outlook,
        "outlook_color": outlook_color,
        "bullish_exposure_pct": round(bullish_weight * 100, 1),
        "neutral_exposure_pct": round(neutral_weight * 100, 1),
        "cautious_exposure_pct": round(bearish_weight * 100, 1),
        "macro_indicators": MACRO_INDICATORS,
        "sector_analyses": sector_analyses,
        "actionable_insights": insights
    }
