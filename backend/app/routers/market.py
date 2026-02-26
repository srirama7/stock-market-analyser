import logging
from fastapi import APIRouter
from typing import List
from app.services.market_data import get_index_data, get_gainers_losers, get_batch_quotes
from app.utils.nse_symbols import SECTOR_MAP, NIFTY_50_SYMBOLS
from app.utils.cache import breadth_cache, sectors_cache
from app.schemas.market import IndexData, GainerLoser, SectorPerformance

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/market", tags=["market"])


@router.get("/indices", response_model=List[IndexData])
async def get_indices():
    """Get live index data."""
    return await get_index_data()


@router.get("/gainers-losers")
async def get_top_gainers_losers(count: int = 5):
    """Get top gainers and losers."""
    return await get_gainers_losers(count)


@router.get("/breadth")
async def get_market_breadth():
    """Get market breadth (advances/declines)."""
    cached = breadth_cache.get("breadth")
    if cached:
        return cached

    quotes = await get_batch_quotes(list(NIFTY_50_SYMBOLS.keys()))
    if quotes:
        advances = sum(1 for q in quotes.values() if q.get("day_change", 0) > 0)
        declines = sum(1 for q in quotes.values() if q.get("day_change", 0) < 0)
        unchanged = len(quotes) - advances - declines
        result = {"advances": advances, "declines": declines, "unchanged": unchanged}
        breadth_cache.set("breadth", result, ttl=30)
        return result

    stale = breadth_cache.get_stale("breadth")
    if stale:
        logger.info("Using stale breadth data as fallback")
        return stale
    return {"advances": 0, "declines": 0, "unchanged": 0}


@router.get("/sectors", response_model=List[SectorPerformance])
async def get_sector_performance():
    """Get sector-wise performance."""
    cached = sectors_cache.get("sectors")
    if cached:
        return cached

    all_symbols = set()
    for symbols in SECTOR_MAP.values():
        all_symbols.update(symbols)

    quotes = await get_batch_quotes(list(all_symbols))
    if quotes:
        sectors = []
        for sector, symbols in SECTOR_MAP.items():
            sector_quotes = [quotes[s] for s in symbols if s in quotes]
            if not sector_quotes:
                continue
            avg_change = sum(q.get("day_change_pct", 0) for q in sector_quotes) / len(sector_quotes)
            top = max(sector_quotes, key=lambda x: x.get("day_change_pct", 0))
            sectors.append({
                "sector": sector,
                "change_pct": round(avg_change, 2),
                "top_stock": top.get("symbol"),
                "top_stock_change": top.get("day_change_pct"),
            })
        sectors.sort(key=lambda x: x["change_pct"], reverse=True)
        if sectors:
            sectors_cache.set("sectors", sectors, ttl=30)
        return sectors

    stale = sectors_cache.get_stale("sectors")
    if stale:
        logger.info("Using stale sector data as fallback")
        return stale
    return []
