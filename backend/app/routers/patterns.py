from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.services.market_data import get_history
from app.ai.candlestick_patterns import detect_patterns as detect_candlestick
from app.ai.chart_patterns import detect_all_chart_patterns
from app.ai.confidence import adjust_confidence
from app.schemas.pattern import PatternResponse

router = APIRouter(prefix="/api/patterns", tags=["patterns"])


@router.get("/{symbol}", response_model=List[PatternResponse])
async def get_patterns(
    symbol: str,
    timeframe: str = "1d",
    min_confidence: float = 0.5,
):
    """Detect all patterns for a symbol."""
    symbol = symbol.upper().strip()

    period_map = {
        "1d": "6mo",
        "1h": "1mo",
        "15m": "5d",
        "5m": "5d",
        "1wk": "2y",
    }
    period = period_map.get(timeframe, "6mo")
    candles = await get_history(symbol, period=period, interval=timeframe)

    if not candles:
        raise HTTPException(status_code=404, detail=f"No data for {symbol}")

    # Detect patterns
    candlestick_patterns = detect_candlestick(candles)
    chart_patterns = detect_all_chart_patterns(candles)

    # Tag pattern types
    for p in candlestick_patterns:
        p["pattern_type"] = "candlestick"
        p["symbol"] = symbol
        p["timeframe"] = timeframe
    for p in chart_patterns:
        p["pattern_type"] = "chart"
        p["symbol"] = symbol
        p["timeframe"] = timeframe

    all_patterns = candlestick_patterns + chart_patterns

    # Adjust confidence with context
    all_patterns = adjust_confidence(all_patterns, candles)

    # Filter by minimum confidence
    all_patterns = [p for p in all_patterns if p.get("confidence", 0) >= min_confidence]

    # Sort by time descending, then confidence descending
    all_patterns.sort(key=lambda x: (x.get("time", 0), x.get("confidence", 0)), reverse=True)

    # Return last 50 patterns max
    return all_patterns[:50]


@router.post("/scan")
async def scan_patterns(symbols: List[str], timeframe: str = "1d", min_confidence: float = 0.6):
    """Scan multiple symbols for patterns."""
    results = {}
    for symbol in symbols[:20]:  # Limit to 20 symbols
        try:
            symbol = symbol.upper().strip()
            period_map = {"1d": "6mo", "1h": "1mo", "15m": "5d", "5m": "5d", "1wk": "2y"}
            period = period_map.get(timeframe, "6mo")
            candles = await get_history(symbol, period=period, interval=timeframe)

            if not candles:
                continue

            candlestick = detect_candlestick(candles)
            chart = detect_all_chart_patterns(candles)

            for p in candlestick:
                p["pattern_type"] = "candlestick"
                p["symbol"] = symbol
            for p in chart:
                p["pattern_type"] = "chart"
                p["symbol"] = symbol

            all_p = adjust_confidence(candlestick + chart, candles)
            filtered = [p for p in all_p if p.get("confidence", 0) >= min_confidence]

            if filtered:
                results[symbol] = sorted(filtered, key=lambda x: x.get("confidence", 0), reverse=True)[:5]
        except Exception:
            continue

    return results
