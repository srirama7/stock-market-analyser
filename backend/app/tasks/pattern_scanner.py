"""Background task to scan for patterns across watchlist."""

import asyncio
import logging
from app.websocket.manager import ws_manager
from app.services.market_data import get_history
from app.ai.candlestick_patterns import detect_patterns as detect_candlestick
from app.ai.chart_patterns import detect_all_chart_patterns
from app.ai.confidence import adjust_confidence
from app.utils.nse_symbols import NIFTY_50_SYMBOLS
from app.config import settings

logger = logging.getLogger(__name__)

# Track recently detected patterns to avoid spam
_recent_alerts = set()


async def pattern_scanner():
    """Scan popular stocks for high-confidence patterns."""
    logger.info("Pattern scanner started")
    symbols = list(NIFTY_50_SYMBOLS.keys())[:20]  # Top 20

    while True:
        try:
            for symbol in symbols:
                try:
                    candles = await get_history(symbol, period="3mo", interval="1d")
                    if not candles or len(candles) < 10:
                        continue

                    candlestick = detect_candlestick(candles)
                    chart = detect_all_chart_patterns(candles)

                    all_patterns = candlestick + chart
                    all_patterns = adjust_confidence(all_patterns, candles)

                    # Only alert on high-confidence recent patterns
                    for p in all_patterns:
                        if p.get("confidence", 0) >= 0.75:
                            alert_key = f"{symbol}:{p['pattern_name']}:{p.get('time', '')}"
                            if alert_key not in _recent_alerts:
                                _recent_alerts.add(alert_key)
                                p["symbol"] = symbol
                                await ws_manager.broadcast_pattern(p)

                    # Keep alert cache manageable
                    if len(_recent_alerts) > 500:
                        _recent_alerts.clear()

                except Exception as e:
                    logger.warning(f"Pattern scan error for {symbol}: {e}")

                await asyncio.sleep(1)  # Rate limit

        except Exception as e:
            logger.error(f"Pattern scanner error: {e}")

        await asyncio.sleep(settings.PATTERN_SCAN_INTERVAL)
