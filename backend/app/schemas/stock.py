from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class StockQuote(BaseModel):
    symbol: str
    name: str
    exchange: str = "NSE"
    last_price: float
    prev_close: float
    open: float
    high: float
    low: float
    volume: int
    day_change: float
    day_change_pct: float
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    week_52_high: Optional[float] = None
    week_52_low: Optional[float] = None
    timestamp: Optional[datetime] = None


class StockSearch(BaseModel):
    symbol: str
    name: str
    exchange: str = "NSE"


class StockInfo(BaseModel):
    symbol: str
    name: str
    exchange: str = "NSE"
    sector: Optional[str] = None
    industry: Optional[str] = None
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    pb_ratio: Optional[float] = None
    dividend_yield: Optional[float] = None
    roe: Optional[float] = None
    debt_to_equity: Optional[float] = None
    eps: Optional[float] = None
    book_value: Optional[float] = None
    face_value: Optional[float] = None
    week_52_high: Optional[float] = None
    week_52_low: Optional[float] = None
