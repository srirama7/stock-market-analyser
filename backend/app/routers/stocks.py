from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.services.market_data import get_quote, get_stock_info, get_history
from app.utils.nse_symbols import search_symbols
from app.schemas.stock import StockQuote, StockSearch, StockInfo

router = APIRouter(prefix="/api/stocks", tags=["stocks"])


@router.get("/search", response_model=List[StockSearch])
async def search_stocks(q: str, limit: int = 10):
    """Search for stocks by symbol or name."""
    results = search_symbols(q, limit)
    return results


@router.get("/{symbol}/quote", response_model=StockQuote)
async def get_stock_quote(symbol: str):
    """Get real-time quote for a stock."""
    symbol = symbol.upper().strip()
    quote = await get_quote(symbol)
    if not quote:
        raise HTTPException(status_code=404, detail=f"Quote not found for {symbol}")
    return quote


@router.get("/{symbol}/info", response_model=StockInfo)
async def get_stock_information(symbol: str):
    """Get detailed stock information."""
    symbol = symbol.upper().strip()
    info = await get_stock_info(symbol)
    if not info:
        raise HTTPException(status_code=404, detail=f"Info not found for {symbol}")
    return info


@router.get("/{symbol}/history")
async def get_stock_history(
    symbol: str,
    period: str = "1mo",
    interval: str = "1d"
):
    """Get historical OHLCV data."""
    symbol = symbol.upper().strip()
    valid_periods = ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "max"]
    valid_intervals = ["1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h", "1d", "5d", "1wk", "1mo"]

    if period not in valid_periods:
        raise HTTPException(status_code=400, detail=f"Invalid period. Use: {valid_periods}")
    if interval not in valid_intervals:
        raise HTTPException(status_code=400, detail=f"Invalid interval. Use: {valid_intervals}")

    data = await get_history(symbol, period, interval)
    if not data:
        raise HTTPException(status_code=404, detail=f"History not found for {symbol}")
    return {"symbol": symbol, "interval": interval, "data": data}
