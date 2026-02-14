from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class PatternResponse(BaseModel):
    id: Optional[int] = None
    symbol: str
    pattern_type: str  # candlestick or chart
    pattern_name: str
    direction: str  # BULLISH, BEARISH, NEUTRAL
    confidence: float
    description: Optional[str] = None
    price_at_detection: Optional[float] = None
    detected_at: Optional[datetime] = None
    timeframe: str = "1d"

    class Config:
        from_attributes = True


class PatternScanRequest(BaseModel):
    symbols: List[str] = []
    timeframe: str = "1d"
    min_confidence: float = 0.6
