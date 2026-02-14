from fastapi import APIRouter
from typing import Optional
from app.services.news_service import get_news

router = APIRouter(prefix="/api/news", tags=["news"])


@router.get("/")
async def get_market_news(q: Optional[str] = None, limit: int = 30):
    """Get latest market news, optionally filtered by query/stock."""
    return await get_news(query=q, limit=limit)
