"""Background task to poll index data and broadcast."""

import asyncio
import logging
from app.websocket.manager import ws_manager
from app.services.market_data import get_index_data
from app.config import settings

logger = logging.getLogger(__name__)


async def index_poller():
    """Poll index data and broadcast to all market WS connections."""
    logger.info("Index poller started")
    while True:
        try:
            indices = await get_index_data()
            if indices:
                await ws_manager.broadcast_market({"indices": indices})
        except Exception as e:
            logger.error(f"Index poller error: {e}")

        await asyncio.sleep(settings.INDEX_POLL_INTERVAL)
