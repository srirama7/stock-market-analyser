from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base


class PatternDetection(Base):
    __tablename__ = "pattern_detections"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    pattern_type = Column(String(50), nullable=False)
    pattern_name = Column(String(100), nullable=False)
    direction = Column(String(10))  # BULLISH, BEARISH, NEUTRAL
    confidence = Column(Float, nullable=False)
    description = Column(Text)
    price_at_detection = Column(Float)
    detected_at = Column(DateTime, server_default=func.now())
    timeframe = Column(String(10), default="1d")
