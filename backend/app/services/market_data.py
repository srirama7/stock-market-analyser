"""Market data service using yfinance."""

import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor

from app.utils.nse_symbols import (
    get_yfinance_symbol, NIFTY_50_SYMBOLS, INDEX_SYMBOLS, SYMBOL_SECTOR
)
from app.utils.cache import (
    quote_cache, history_cache, info_cache,
    index_cache, gainers_losers_cache, breadth_cache, sectors_cache
)

logger = logging.getLogger(__name__)
executor = ThreadPoolExecutor(max_workers=4)


def _fetch_quote(symbol: str) -> Optional[Dict[str, Any]]:
    """Fetch real-time quote for a symbol (runs in thread)."""
    try:
        yf_symbol = get_yfinance_symbol(symbol)
        ticker = yf.Ticker(yf_symbol)
        info = ticker.fast_info

        last_price = float(info.get("lastPrice", 0) or info.get("last_price", 0) or 0)
        prev_close = float(info.get("previousClose", 0) or info.get("previous_close", 0) or 0)

        if last_price == 0:
            hist = ticker.history(period="2d")
            if not hist.empty:
                last_price = float(hist["Close"].iloc[-1])
                if len(hist) > 1:
                    prev_close = float(hist["Close"].iloc[-2])

        if last_price == 0:
            return None

        change = last_price - prev_close if prev_close else 0
        change_pct = (change / prev_close * 100) if prev_close else 0

        open_price = float(info.get("open", 0) or 0)
        day_high = float(info.get("dayHigh", 0) or info.get("day_high", 0) or 0)
        day_low = float(info.get("dayLow", 0) or info.get("day_low", 0) or 0)
        volume = int(info.get("lastVolume", 0) or info.get("last_volume", 0) or 0)
        market_cap = float(info.get("marketCap", 0) or info.get("market_cap", 0) or 0)

        name = NIFTY_50_SYMBOLS.get(symbol, symbol)

        result = {
            "symbol": symbol,
            "name": name,
            "exchange": "NSE",
            "last_price": round(last_price, 2),
            "prev_close": round(prev_close, 2),
            "open": round(open_price, 2),
            "high": round(day_high, 2),
            "low": round(day_low, 2),
            "volume": volume,
            "day_change": round(change, 2),
            "day_change_pct": round(change_pct, 2),
            "market_cap": market_cap if market_cap else None,
            "pe_ratio": None,
            "week_52_high": float(info.get("yearHigh", 0) or info.get("year_high", 0) or 0) or None,
            "week_52_low": float(info.get("yearLow", 0) or info.get("year_low", 0) or 0) or None,
            "timestamp": datetime.now().isoformat(),
        }
        return result
    except Exception as e:
        logger.error(f"Error fetching quote for {symbol}: {e}")
        return None


async def get_quote(symbol: str) -> Optional[Dict[str, Any]]:
    """Get quote with caching."""
    cached = quote_cache.get(symbol)
    if cached:
        return cached

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(executor, _fetch_quote, symbol)
    if result:
        quote_cache.set(symbol, result, ttl=5)
    return result


def _fetch_batch_quotes(symbols: List[str]) -> Dict[str, Dict[str, Any]]:
    """Fetch quotes for multiple symbols at once."""
    results = {}
    try:
        yf_symbols = [get_yfinance_symbol(s) for s in symbols]
        tickers = yf.Tickers(" ".join(yf_symbols))

        for symbol, yf_sym in zip(symbols, yf_symbols):
            try:
                ticker = tickers.tickers.get(yf_sym)
                if not ticker:
                    continue
                info = ticker.fast_info
                last_price = float(info.get("lastPrice", 0) or info.get("last_price", 0) or 0)
                prev_close = float(info.get("previousClose", 0) or info.get("previous_close", 0) or 0)

                if last_price == 0:
                    continue

                change = last_price - prev_close if prev_close else 0
                change_pct = (change / prev_close * 100) if prev_close else 0

                results[symbol] = {
                    "symbol": symbol,
                    "name": NIFTY_50_SYMBOLS.get(symbol, symbol),
                    "last_price": round(last_price, 2),
                    "prev_close": round(prev_close, 2),
                    "day_change": round(change, 2),
                    "day_change_pct": round(change_pct, 2),
                    "volume": int(info.get("lastVolume", 0) or info.get("last_volume", 0) or 0),
                    "timestamp": datetime.now().isoformat(),
                }
            except Exception as e:
                logger.warning(f"Error in batch quote for {symbol}: {e}")
    except Exception as e:
        logger.error(f"Batch quote error: {e}")
    return results


async def get_batch_quotes(symbols: List[str]) -> Dict[str, Dict[str, Any]]:
    """Get batch quotes with caching."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, _fetch_batch_quotes, symbols)


def _fetch_history(symbol: str, period: str = "1mo", interval: str = "1d") -> Optional[List[Dict]]:
    """Fetch historical OHLCV data."""
    try:
        yf_symbol = get_yfinance_symbol(symbol)
        ticker = yf.Ticker(yf_symbol)
        hist = ticker.history(period=period, interval=interval)

        if hist.empty:
            return None

        candles = []
        for idx, row in hist.iterrows():
            ts = int(idx.timestamp()) if hasattr(idx, 'timestamp') else int(pd.Timestamp(idx).timestamp())
            candles.append({
                "time": ts,
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]),
            })
        return candles
    except Exception as e:
        logger.error(f"Error fetching history for {symbol}: {e}")
        return None


async def get_history(symbol: str, period: str = "1mo", interval: str = "1d") -> Optional[List[Dict]]:
    """Get historical data with caching."""
    cache_key = f"{symbol}:{period}:{interval}"
    cached = history_cache.get(cache_key)
    if cached:
        return cached

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(executor, _fetch_history, symbol, period, interval)
    if result:
        history_cache.set(cache_key, result, ttl=300)
    return result


def _fetch_stock_info(symbol: str) -> Optional[Dict[str, Any]]:
    """Fetch detailed stock information."""
    try:
        yf_symbol = get_yfinance_symbol(symbol)
        ticker = yf.Ticker(yf_symbol)
        info = ticker.info

        return {
            "symbol": symbol,
            "name": info.get("longName", NIFTY_50_SYMBOLS.get(symbol, symbol)),
            "exchange": "NSE",
            "sector": info.get("sector", SYMBOL_SECTOR.get(symbol)),
            "industry": info.get("industry"),
            "market_cap": info.get("marketCap"),
            "pe_ratio": info.get("trailingPE"),
            "pb_ratio": info.get("priceToBook"),
            "dividend_yield": info.get("dividendYield"),
            "roe": info.get("returnOnEquity"),
            "debt_to_equity": info.get("debtToEquity"),
            "eps": info.get("trailingEps"),
            "book_value": info.get("bookValue"),
            "face_value": info.get("faceValue"),
            "week_52_high": info.get("fiftyTwoWeekHigh"),
            "week_52_low": info.get("fiftyTwoWeekLow"),
        }
    except Exception as e:
        logger.error(f"Error fetching info for {symbol}: {e}")
        return None


async def get_stock_info(symbol: str) -> Optional[Dict[str, Any]]:
    """Get stock info with caching."""
    cached = info_cache.get(symbol)
    if cached:
        return cached

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(executor, _fetch_stock_info, symbol)
    if result:
        info_cache.set(symbol, result, ttl=3600)
    return result


def _fetch_index_data() -> List[Dict[str, Any]]:
    """Fetch index data."""
    results = []
    for name, yf_sym in INDEX_SYMBOLS.items():
        try:
            ticker = yf.Ticker(yf_sym)
            info = ticker.fast_info
            last = float(info.get("lastPrice", 0) or info.get("last_price", 0) or 0)
            prev = float(info.get("previousClose", 0) or info.get("previous_close", 0) or 0)

            if last == 0:
                hist = ticker.history(period="2d")
                if not hist.empty:
                    last = float(hist["Close"].iloc[-1])
                    if len(hist) > 1:
                        prev = float(hist["Close"].iloc[-2])

            if last > 0:
                change = last - prev if prev else 0
                change_pct = (change / prev * 100) if prev else 0
                results.append({
                    "name": name,
                    "value": round(last, 2),
                    "change": round(change, 2),
                    "change_pct": round(change_pct, 2),
                    "open": float(info.get("open", 0) or 0),
                    "high": float(info.get("dayHigh", 0) or info.get("day_high", 0) or 0),
                    "low": float(info.get("dayLow", 0) or info.get("day_low", 0) or 0),
                    "prev_close": round(prev, 2),
                })
        except Exception as e:
            logger.warning(f"Error fetching index {name}: {e}")
    return results


async def get_index_data() -> List[Dict[str, Any]]:
    """Get index data with fallback cache."""
    cached = index_cache.get("indices")
    if cached:
        return cached

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(executor, _fetch_index_data)
    if result:
        index_cache.set("indices", result, ttl=30)
        return result

    # Fallback to stale data
    stale = index_cache.get_stale("indices")
    if stale:
        logger.info("Using stale index data as fallback")
        return stale
    return []


def _fetch_gainers_losers(count: int = 5) -> Dict[str, List[Dict]]:
    """Compute top gainers/losers from NIFTY 50."""
    quotes = _fetch_batch_quotes(list(NIFTY_50_SYMBOLS.keys()))
    sorted_stocks = sorted(quotes.values(), key=lambda x: x.get("day_change_pct", 0), reverse=True)
    return {
        "gainers": sorted_stocks[:count],
        "losers": sorted_stocks[-count:][::-1] if len(sorted_stocks) >= count else [],
    }


async def get_gainers_losers(count: int = 5) -> Dict[str, List[Dict]]:
    """Get top gainers and losers with fallback cache."""
    cache_key = f"gl:{count}"
    cached = gainers_losers_cache.get(cache_key)
    if cached:
        return cached

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(executor, _fetch_gainers_losers, count)
    if result and (result.get("gainers") or result.get("losers")):
        gainers_losers_cache.set(cache_key, result, ttl=30)
        return result

    # Fallback to stale data
    stale = gainers_losers_cache.get_stale(cache_key)
    if stale:
        logger.info("Using stale gainers/losers data as fallback")
        return stale
    return {"gainers": [], "losers": []}
