from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base


class Stock(Base):
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    exchange = Column(String(10), default="NSE")
    sector = Column(String(100))
    industry = Column(String(100))
    market_cap = Column(Float)
    pe_ratio = Column(Float)
    pb_ratio = Column(Float)
    dividend_yield = Column(Float)
    roe = Column(Float)
    debt_to_equity = Column(Float)
    eps = Column(Float)
    book_value = Column(Float)
    face_value = Column(Float)
    week_52_high = Column(Float)
    week_52_low = Column(Float)
    last_price = Column(Float)
    prev_close = Column(Float)
    day_change = Column(Float)
    day_change_pct = Column(Float)
    volume = Column(Integer)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime, server_default=func.now())
