from pydantic import BaseModel
from typing import Optional, List


class IndexData(BaseModel):
    name: str
    value: float
    change: float
    change_pct: float
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    prev_close: Optional[float] = None


class MarketBreadth(BaseModel):
    advances: int
    declines: int
    unchanged: int


class GainerLoser(BaseModel):
    symbol: str
    name: str
    last_price: float
    change: float
    change_pct: float
    volume: Optional[int] = None


class SectorPerformance(BaseModel):
    sector: str
    change_pct: float
    top_stock: Optional[str] = None
    top_stock_change: Optional[float] = None
