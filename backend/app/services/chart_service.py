"""Chart data service for OHLCV with indicator support."""

from typing import Optional, Dict, List
from app.services.market_data import get_history


PERIOD_MAP = {
    "1m": ("1d", "1m"),
    "5m": ("5d", "5m"),
    "15m": ("5d", "15m"),
    "1h": ("1mo", "1h"),
    "1d": ("6mo", "1d"),
    "1wk": ("2y", "1wk"),
    "1mo": ("5y", "1mo"),
}


async def get_chart_data(
    symbol: str,
    interval: str = "1d",
    period: Optional[str] = None
) -> Optional[Dict]:
    """Get OHLCV chart data for a symbol."""
    if period is None:
        period = PERIOD_MAP.get(interval, ("6mo", "1d"))[0]

    candles = await get_history(symbol, period=period, interval=interval)
    if not candles:
        return None

    return {
        "symbol": symbol,
        "interval": interval,
        "period": period,
        "candles": candles,
    }
