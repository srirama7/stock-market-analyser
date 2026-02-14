from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class PortfolioCreate(BaseModel):
    name: str = "My Portfolio"


class HoldingCreate(BaseModel):
    symbol: str
    quantity: int
    avg_buy_price: float


class HoldingUpdate(BaseModel):
    quantity: Optional[int] = None
    avg_buy_price: Optional[float] = None


class TransactionCreate(BaseModel):
    transaction_type: str  # BUY or SELL
    quantity: int
    price: float


class TransactionResponse(BaseModel):
    id: int
    holding_id: int
    transaction_type: str
    quantity: int
    price: float
    timestamp: datetime

    class Config:
        from_attributes = True


class HoldingResponse(BaseModel):
    id: int
    portfolio_id: int
    symbol: str
    quantity: int
    avg_buy_price: float
    current_price: Optional[float] = None
    pnl: Optional[float] = None
    pnl_pct: Optional[float] = None
    day_change: Optional[float] = None
    day_change_pct: Optional[float] = None
    market_value: Optional[float] = None
    sector: Optional[str] = None

    class Config:
        from_attributes = True


class PortfolioResponse(BaseModel):
    id: int
    name: str
    holdings: List[HoldingResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


class PortfolioSummary(BaseModel):
    total_invested: float
    current_value: float
    total_pnl: float
    total_pnl_pct: float
    day_change: float
    day_change_pct: float
    holdings_count: int
    sector_allocation: dict = {}
