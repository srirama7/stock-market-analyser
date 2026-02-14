"""Candlestick pattern detection using pure numpy/pandas."""

import numpy as np
import pandas as pd
from typing import List, Dict


def _body(o, c):
    return abs(c - o)


def _upper_shadow(h, o, c):
    return h - max(o, c)


def _lower_shadow(o, c, l):
    return min(o, c) - l


def _is_bullish(o, c):
    return c > o


def _is_bearish(o, c):
    return c < o


def detect_patterns(candles: List[Dict]) -> List[Dict]:
    """Detect candlestick patterns from OHLCV data."""
    if len(candles) < 5:
        return []

    df = pd.DataFrame(candles)
    patterns = []

    o = df["open"].values
    h = df["high"].values
    l = df["low"].values
    c = df["close"].values
    v = df["volume"].values
    times = df["time"].values

    avg_body = pd.Series(abs(c - o)).rolling(20).mean().values

    for i in range(2, len(df)):
        body_i = _body(o[i], c[i])
        upper_i = _upper_shadow(h[i], o[i], c[i])
        lower_i = _lower_shadow(o[i], c[i], l[i])
        avg = avg_body[i] if not np.isnan(avg_body[i]) else body_i

        if avg == 0:
            avg = 0.01

        # --- Single candle patterns ---

        # Doji
        if body_i < avg * 0.1:
            patterns.append({
                "time": int(times[i]),
                "pattern_name": "Doji",
                "direction": "NEUTRAL",
                "confidence": 0.6,
                "description": "Indecision candle - open and close nearly equal",
            })

        # Hammer (bullish reversal)
        if (lower_i > body_i * 2 and upper_i < body_i * 0.3 and
                body_i > avg * 0.3 and _is_bullish(o[i], c[i])):
            patterns.append({
                "time": int(times[i]),
                "pattern_name": "Hammer",
                "direction": "BULLISH",
                "confidence": 0.7,
                "description": "Bullish reversal - long lower shadow with small body at top",
            })

        # Inverted Hammer
        if (upper_i > body_i * 2 and lower_i < body_i * 0.3 and
                body_i > avg * 0.3 and _is_bullish(o[i], c[i])):
            patterns.append({
                "time": int(times[i]),
                "pattern_name": "Inverted Hammer",
                "direction": "BULLISH",
                "confidence": 0.65,
                "description": "Potential bullish reversal - long upper shadow",
            })

        # Shooting Star (bearish)
        if (upper_i > body_i * 2 and lower_i < body_i * 0.3 and
                body_i > avg * 0.3 and _is_bearish(o[i], c[i])):
            patterns.append({
                "time": int(times[i]),
                "pattern_name": "Shooting Star",
                "direction": "BEARISH",
                "confidence": 0.7,
                "description": "Bearish reversal - long upper shadow with small body at bottom",
            })

        # Hanging Man
        if (lower_i > body_i * 2 and upper_i < body_i * 0.3 and
                body_i > avg * 0.3 and _is_bearish(o[i], c[i])):
            patterns.append({
                "time": int(times[i]),
                "pattern_name": "Hanging Man",
                "direction": "BEARISH",
                "confidence": 0.65,
                "description": "Bearish reversal - long lower shadow at top of uptrend",
            })

        # Marubozu (Bullish)
        if (_is_bullish(o[i], c[i]) and body_i > avg * 1.5 and
                upper_i < body_i * 0.05 and lower_i < body_i * 0.05):
            patterns.append({
                "time": int(times[i]),
                "pattern_name": "Bullish Marubozu",
                "direction": "BULLISH",
                "confidence": 0.75,
                "description": "Strong bullish candle with no shadows",
            })

        # Marubozu (Bearish)
        if (_is_bearish(o[i], c[i]) and body_i > avg * 1.5 and
                upper_i < body_i * 0.05 and lower_i < body_i * 0.05):
            patterns.append({
                "time": int(times[i]),
                "pattern_name": "Bearish Marubozu",
                "direction": "BEARISH",
                "confidence": 0.75,
                "description": "Strong bearish candle with no shadows",
            })

        # Spinning Top
        if (body_i < avg * 0.3 and upper_i > body_i and lower_i > body_i):
            if body_i > avg * 0.05:  # Not a doji
                patterns.append({
                    "time": int(times[i]),
                    "pattern_name": "Spinning Top",
                    "direction": "NEUTRAL",
                    "confidence": 0.55,
                    "description": "Indecision - small body with shadows on both sides",
                })

        if i < 1:
            continue

        # --- Two candle patterns ---
        body_prev = _body(o[i-1], c[i-1])

        # Bullish Engulfing
        if (_is_bearish(o[i-1], c[i-1]) and _is_bullish(o[i], c[i]) and
                o[i] <= c[i-1] and c[i] >= o[i-1] and body_i > body_prev):
            patterns.append({
                "time": int(times[i]),
                "pattern_name": "Bullish Engulfing",
                "direction": "BULLISH",
                "confidence": 0.8,
                "description": "Strong bullish reversal - bullish candle completely engulfs previous bearish candle",
            })

        # Bearish Engulfing
        if (_is_bullish(o[i-1], c[i-1]) and _is_bearish(o[i], c[i]) and
                o[i] >= c[i-1] and c[i] <= o[i-1] and body_i > body_prev):
            patterns.append({
                "time": int(times[i]),
                "pattern_name": "Bearish Engulfing",
                "direction": "BEARISH",
                "confidence": 0.8,
                "description": "Strong bearish reversal - bearish candle completely engulfs previous bullish candle",
            })

        # Piercing Line
        if (_is_bearish(o[i-1], c[i-1]) and _is_bullish(o[i], c[i]) and
                o[i] < l[i-1] and c[i] > (o[i-1] + c[i-1]) / 2 and c[i] < o[i-1]):
            patterns.append({
                "time": int(times[i]),
                "pattern_name": "Piercing Line",
                "direction": "BULLISH",
                "confidence": 0.7,
                "description": "Bullish reversal - opens below previous low, closes above midpoint",
            })

        # Dark Cloud Cover
        if (_is_bullish(o[i-1], c[i-1]) and _is_bearish(o[i], c[i]) and
                o[i] > h[i-1] and c[i] < (o[i-1] + c[i-1]) / 2 and c[i] > o[i-1]):
            patterns.append({
                "time": int(times[i]),
                "pattern_name": "Dark Cloud Cover",
                "direction": "BEARISH",
                "confidence": 0.7,
                "description": "Bearish reversal - opens above previous high, closes below midpoint",
            })

        # Tweezer Bottom
        if (abs(l[i] - l[i-1]) < avg * 0.05 and
                _is_bearish(o[i-1], c[i-1]) and _is_bullish(o[i], c[i])):
            patterns.append({
                "time": int(times[i]),
                "pattern_name": "Tweezer Bottom",
                "direction": "BULLISH",
                "confidence": 0.65,
                "description": "Bullish reversal - two candles with matching lows",
            })

        # Tweezer Top
        if (abs(h[i] - h[i-1]) < avg * 0.05 and
                _is_bullish(o[i-1], c[i-1]) and _is_bearish(o[i], c[i])):
            patterns.append({
                "time": int(times[i]),
                "pattern_name": "Tweezer Top",
                "direction": "BEARISH",
                "confidence": 0.65,
                "description": "Bearish reversal - two candles with matching highs",
            })

        if i < 2:
            continue

        # --- Three candle patterns ---

        # Morning Star
        body_2 = _body(o[i-2], c[i-2])
        if (_is_bearish(o[i-2], c[i-2]) and body_2 > avg and
                body_prev < avg * 0.3 and
                _is_bullish(o[i], c[i]) and body_i > avg and
                c[i] > (o[i-2] + c[i-2]) / 2):
            patterns.append({
                "time": int(times[i]),
                "pattern_name": "Morning Star",
                "direction": "BULLISH",
                "confidence": 0.85,
                "description": "Strong bullish reversal - three candle pattern with gap down and recovery",
            })

        # Evening Star
        if (_is_bullish(o[i-2], c[i-2]) and body_2 > avg and
                body_prev < avg * 0.3 and
                _is_bearish(o[i], c[i]) and body_i > avg and
                c[i] < (o[i-2] + c[i-2]) / 2):
            patterns.append({
                "time": int(times[i]),
                "pattern_name": "Evening Star",
                "direction": "BEARISH",
                "confidence": 0.85,
                "description": "Strong bearish reversal - three candle pattern with gap up and decline",
            })

        # Three White Soldiers
        if (all(_is_bullish(o[i-j], c[i-j]) for j in range(3)) and
                c[i] > c[i-1] > c[i-2] and
                o[i] > o[i-1] > o[i-2] and
                all(_body(o[i-j], c[i-j]) > avg * 0.5 for j in range(3))):
            patterns.append({
                "time": int(times[i]),
                "pattern_name": "Three White Soldiers",
                "direction": "BULLISH",
                "confidence": 0.85,
                "description": "Strong bullish continuation - three consecutive long bullish candles",
            })

        # Three Black Crows
        if (all(_is_bearish(o[i-j], c[i-j]) for j in range(3)) and
                c[i] < c[i-1] < c[i-2] and
                o[i] < o[i-1] < o[i-2] and
                all(_body(o[i-j], c[i-j]) > avg * 0.5 for j in range(3))):
            patterns.append({
                "time": int(times[i]),
                "pattern_name": "Three Black Crows",
                "direction": "BEARISH",
                "confidence": 0.85,
                "description": "Strong bearish continuation - three consecutive long bearish candles",
            })

    return patterns
