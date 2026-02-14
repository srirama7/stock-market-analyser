"""Confidence scoring with volume and trend context."""

import numpy as np
from typing import List, Dict


def adjust_confidence(patterns: List[Dict], candles: List[Dict]) -> List[Dict]:
    """Adjust pattern confidence based on volume and trend context."""
    if not patterns or not candles:
        return patterns

    closes = np.array([c["close"] for c in candles])
    volumes = np.array([c["volume"] for c in candles])
    times = np.array([c["time"] for c in candles])

    avg_volume = np.mean(volumes[-20:]) if len(volumes) >= 20 else np.mean(volumes)

    # Calculate trend (using 20-period SMA slope)
    if len(closes) >= 20:
        sma = np.convolve(closes, np.ones(20)/20, mode='valid')
        trend = "UP" if sma[-1] > sma[-5] else "DOWN" if sma[-1] < sma[-5] else "FLAT"
    else:
        trend = "FLAT"

    for pattern in patterns:
        p_time = pattern["time"]
        # Find the candle index for this pattern
        idx = np.searchsorted(times, p_time)
        if idx >= len(candles):
            idx = len(candles) - 1

        adjustment = 0.0

        # Volume confirmation
        if idx < len(volumes):
            vol_ratio = volumes[idx] / avg_volume if avg_volume > 0 else 1
            if vol_ratio > 1.5:
                adjustment += 0.1  # High volume confirms pattern
            elif vol_ratio < 0.5:
                adjustment -= 0.1  # Low volume weakens pattern

        # Trend alignment
        direction = pattern.get("direction", "NEUTRAL")
        if direction == "BULLISH" and trend == "DOWN":
            adjustment += 0.05  # Bullish reversal at end of downtrend
        elif direction == "BEARISH" and trend == "UP":
            adjustment += 0.05  # Bearish reversal at end of uptrend
        elif direction == "BULLISH" and trend == "UP":
            adjustment -= 0.05  # Less significant in ongoing uptrend
        elif direction == "BEARISH" and trend == "DOWN":
            adjustment -= 0.05

        # Support/Resistance proximity
        if len(closes) >= 20:
            recent_high = np.max(closes[-20:])
            recent_low = np.min(closes[-20:])
            current = closes[idx] if idx < len(closes) else closes[-1]
            range_pct = (current - recent_low) / (recent_high - recent_low) if recent_high != recent_low else 0.5

            if direction == "BEARISH" and range_pct > 0.8:
                adjustment += 0.05  # Near resistance
            elif direction == "BULLISH" and range_pct < 0.2:
                adjustment += 0.05  # Near support

        pattern["confidence"] = round(min(0.95, max(0.3, pattern["confidence"] + adjustment)), 2)
        pattern["trend_context"] = trend

    return patterns
