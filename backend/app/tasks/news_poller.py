"""Background task to poll news feeds."""

import asyncio
import logging
from app.services.news_service import refresh_news
from app.config import settings

logger = logging.getLogger(__name__)


async def news_poller():
    """Poll news feeds periodically."""
    logger.info("News poller started")
    while True:
        try:
            await refresh_news()
            logger.info("News cache refreshed")
        except Exception as e:
            logger.error(f"News poller error: {e}")

        await asyncio.sleep(settings.NEWS_POLL_INTERVAL)
