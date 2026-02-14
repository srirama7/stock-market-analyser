"""Background task to poll prices for subscribed symbols."""

import asyncio
import logging
from app.websocket.manager import ws_manager
from app.services.market_data import get_batch_quotes
from app.config import settings

logger = logging.getLogger(__name__)


async def price_poller():
    """Poll prices for all subscribed symbols and broadcast via WebSocket."""
    logger.info("Price poller started")
    while True:
        try:
            symbols = ws_manager.get_all_subscribed_symbols()
            if symbols:
                symbol_list = list(symbols)
                # Process in batches of 10
                for i in range(0, len(symbol_list), 10):
                    batch = symbol_list[i:i+10]
                    quotes = await get_batch_quotes(batch)
                    for symbol, data in quotes.items():
                        await ws_manager.broadcast_price(symbol, data)
        except Exception as e:
            logger.error(f"Price poller error: {e}")

        await asyncio.sleep(settings.PRICE_POLL_INTERVAL)
