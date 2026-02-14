"""Stock screener service with fundamental and technical filters."""

from typing import List, Dict, Optional
from app.services.market_data import get_batch_quotes, get_stock_info, get_history
from app.services.indicator_service import calculate_rsi, calculate_macd, calculate_sma
from app.utils.nse_symbols import NIFTY_50_SYMBOLS
import logging
import asyncio

logger = logging.getLogger(__name__)

# Pre-built screen definitions
PREBUILT_SCREENS = {
    "undervalued_largecap": {
        "name": "Undervalued Large Caps",
        "description": "Large cap stocks with low PE ratio",
        "filters": {"min_market_cap": 50000, "max_pe": 20},
    },
    "rsi_oversold": {
        "name": "RSI Oversold",
        "description": "Stocks with RSI below 30",
        "filters": {"max_rsi": 30},
    },
    "rsi_overbought": {
        "name": "RSI Overbought",
        "description": "Stocks with RSI above 70",
        "filters": {"min_rsi": 70},
    },
    "macd_bullish_cross": {
        "name": "MACD Bullish Crossover",
        "description": "Stocks where MACD crossed above signal line",
        "filters": {"macd_cross": "bullish"},
    },
    "high_volume": {
        "name": "High Volume",
        "description": "Stocks with volume 2x above average",
        "filters": {"min_volume_ratio": 2.0},
    },
    "near_52w_high": {
        "name": "Near 52-Week High",
        "description": "Stocks within 5% of 52-week high",
        "filters": {"near_52w_high_pct": 5},
    },
    "near_52w_low": {
        "name": "Near 52-Week Low",
        "description": "Stocks within 5% of 52-week low",
        "filters": {"near_52w_low_pct": 5},
    },
}


async def run_screen(
    symbols: Optional[List[str]] = None,
    min_pe: Optional[float] = None,
    max_pe: Optional[float] = None,
    min_market_cap: Optional[float] = None,
    max_market_cap: Optional[float] = None,
    min_rsi: Optional[float] = None,
    max_rsi: Optional[float] = None,
    macd_cross: Optional[str] = None,
    min_volume_ratio: Optional[float] = None,
    near_52w_high_pct: Optional[float] = None,
    near_52w_low_pct: Optional[float] = None,
    min_roe: Optional[float] = None,
    max_debt_to_equity: Optional[float] = None,
) -> List[Dict]:
    """Run screener with given filters."""
    if not symbols:
        symbols = list(NIFTY_50_SYMBOLS.keys())

    results = []
    quotes = await get_batch_quotes(symbols)

    for symbol in symbols:
        try:
            quote = quotes.get(symbol)
            if not quote:
                continue

            stock_data = {
                "symbol": symbol,
                "name": quote.get("name", symbol),
                "last_price": quote.get("last_price", 0),
                "day_change": quote.get("day_change", 0),
                "day_change_pct": quote.get("day_change_pct", 0),
                "volume": quote.get("volume", 0),
                "passed_filters": [],
            }

            # Technical filters that need historical data
            need_technicals = any([min_rsi, max_rsi, macd_cross, min_volume_ratio])

            if need_technicals:
                candles = await get_history(symbol, period="3mo", interval="1d")
                if candles and len(candles) > 20:
                    # RSI filter
                    if min_rsi is not None or max_rsi is not None:
                        rsi_data = calculate_rsi(candles)
                        current_rsi = None
                        for r in reversed(rsi_data):
                            if r["value"] is not None:
                                current_rsi = r["value"]
                                break
                        if current_rsi is not None:
                            stock_data["rsi"] = round(current_rsi, 2)
                            if min_rsi and current_rsi < min_rsi:
                                continue
                            if max_rsi and current_rsi > max_rsi:
                                continue
                            stock_data["passed_filters"].append("RSI")

                    # MACD filter
                    if macd_cross:
                        macd_data = calculate_macd(candles)
                        macd_vals = macd_data["macd"]
                        signal_vals = macd_data["signal"]
                        if len(macd_vals) >= 2:
                            m1 = macd_vals[-1]["value"]
                            m2 = macd_vals[-2]["value"]
                            s1 = signal_vals[-1]["value"]
                            s2 = signal_vals[-2]["value"]
                            if m1 is not None and m2 is not None and s1 is not None and s2 is not None:
                                if macd_cross == "bullish" and m2 < s2 and m1 > s1:
                                    stock_data["passed_filters"].append("MACD Bullish Cross")
                                elif macd_cross == "bearish" and m2 > s2 and m1 < s1:
                                    stock_data["passed_filters"].append("MACD Bearish Cross")
                                elif macd_cross == "bullish" and not (m2 < s2 and m1 > s1):
                                    continue
                                elif macd_cross == "bearish" and not (m2 > s2 and m1 < s1):
                                    continue

                    # Volume filter
                    if min_volume_ratio:
                        volumes = [c["volume"] for c in candles[-20:]]
                        avg_vol = sum(volumes) / len(volumes) if volumes else 0
                        current_vol = candles[-1]["volume"]
                        ratio = current_vol / avg_vol if avg_vol > 0 else 0
                        stock_data["volume_ratio"] = round(ratio, 2)
                        if ratio < min_volume_ratio:
                            continue
                        stock_data["passed_filters"].append("High Volume")

            results.append(stock_data)

        except Exception as e:
            logger.warning(f"Screener error for {symbol}: {e}")
            continue

    results.sort(key=lambda x: abs(x.get("day_change_pct", 0)), reverse=True)
    return results
