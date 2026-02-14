"""News aggregation service using RSS feeds."""

import feedparser
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import List, Dict, Optional
from datetime import datetime
import logging
import re

logger = logging.getLogger(__name__)
executor = ThreadPoolExecutor(max_workers=2)

RSS_FEEDS = {
    "Economic Times": "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
    "Moneycontrol": "https://www.moneycontrol.com/rss/marketreports.xml",
    "LiveMint": "https://www.livemint.com/rss/markets",
}

# Cache for news
_news_cache: List[Dict] = []
_last_fetch: Optional[datetime] = None


def _parse_feeds() -> List[Dict]:
    """Parse all RSS feeds."""
    articles = []
    for source, url in RSS_FEEDS.items():
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:15]:
                pub_date = None
                if hasattr(entry, "published_parsed") and entry.published_parsed:
                    pub_date = datetime(*entry.published_parsed[:6]).isoformat()

                # Clean description
                desc = entry.get("summary", "")
                desc = re.sub(r"<[^>]+>", "", desc)[:300]

                articles.append({
                    "title": entry.get("title", ""),
                    "url": entry.get("link", ""),
                    "description": desc,
                    "source": source,
                    "published_at": pub_date,
                    "image_url": None,
                })
        except Exception as e:
            logger.warning(f"Error fetching RSS from {source}: {e}")

    # Sort by date descending
    articles.sort(key=lambda x: x.get("published_at") or "", reverse=True)
    return articles


async def get_news(query: Optional[str] = None, limit: int = 30) -> List[Dict]:
    """Get latest market news, optionally filtered by query."""
    global _news_cache, _last_fetch

    # Use cache if fresh (less than 5 minutes)
    if _last_fetch and (datetime.now() - _last_fetch).seconds < 300 and _news_cache:
        articles = _news_cache
    else:
        loop = asyncio.get_event_loop()
        articles = await loop.run_in_executor(executor, _parse_feeds)
        _news_cache = articles
        _last_fetch = datetime.now()

    if query:
        query_lower = query.lower()
        articles = [
            a for a in articles
            if query_lower in a["title"].lower() or query_lower in a.get("description", "").lower()
        ]

    return articles[:limit]


async def refresh_news():
    """Force refresh news cache."""
    global _news_cache, _last_fetch
    loop = asyncio.get_event_loop()
    _news_cache = await loop.run_in_executor(executor, _parse_feeds)
    _last_fetch = datetime.now()
    return _news_cache
