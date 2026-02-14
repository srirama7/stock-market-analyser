"""Chart pattern detection using scipy for peak/trough detection."""

import numpy as np
import pandas as pd
from scipy.signal import argrelextrema
from typing import List, Dict


def _find_peaks_troughs(closes: np.ndarray, order: int = 5):
    """Find local peaks and troughs."""
    peaks = argrelextrema(closes, np.greater, order=order)[0]
    troughs = argrelextrema(closes, np.less, order=order)[0]
    return peaks, troughs


def detect_head_and_shoulders(candles: List[Dict], order: int = 5) -> List[Dict]:
    """Detect Head and Shoulders pattern."""
    patterns = []
    if len(candles) < 30:
        return patterns

    closes = np.array([c["close"] for c in candles])
    times = np.array([c["time"] for c in candles])
    peaks, troughs = _find_peaks_troughs(closes, order)

    if len(peaks) < 3 or len(troughs) < 2:
        return patterns

    for i in range(len(peaks) - 2):
        p1, p2, p3 = peaks[i], peaks[i + 1], peaks[i + 2]
        left_shoulder = closes[p1]
        head = closes[p2]
        right_shoulder = closes[p3]

        # Head should be highest
        if head <= left_shoulder or head <= right_shoulder:
            continue

        # Shoulders should be roughly equal (within 3%)
        shoulder_diff = abs(left_shoulder - right_shoulder) / max(left_shoulder, right_shoulder)
        if shoulder_diff > 0.03:
            continue

        # Find neckline troughs between shoulders
        t_between = troughs[(troughs > p1) & (troughs < p3)]
        if len(t_between) < 2:
            continue

        confidence = 0.7 + min(0.2, (1 - shoulder_diff) * 0.2)

        patterns.append({
            "time": int(times[p3]),
            "pattern_name": "Head and Shoulders",
            "direction": "BEARISH",
            "confidence": round(confidence, 2),
            "description": f"Bearish reversal pattern. Head: {head:.2f}, Shoulders: {left_shoulder:.2f}/{right_shoulder:.2f}",
            "points": {
                "left_shoulder": {"time": int(times[p1]), "price": float(left_shoulder)},
                "head": {"time": int(times[p2]), "price": float(head)},
                "right_shoulder": {"time": int(times[p3]), "price": float(right_shoulder)},
            }
        })

    return patterns


def detect_double_top_bottom(candles: List[Dict], order: int = 5) -> List[Dict]:
    """Detect Double Top and Double Bottom patterns."""
    patterns = []
    if len(candles) < 20:
        return patterns

    closes = np.array([c["close"] for c in candles])
    times = np.array([c["time"] for c in candles])
    peaks, troughs = _find_peaks_troughs(closes, order)

    # Double Top
    for i in range(len(peaks) - 1):
        p1, p2 = peaks[i], peaks[i + 1]
        if p2 - p1 < 5:
            continue
        price_diff = abs(closes[p1] - closes[p2]) / max(closes[p1], closes[p2])
        if price_diff < 0.02:
            confidence = 0.75 + min(0.15, (1 - price_diff) * 0.15)
            patterns.append({
                "time": int(times[p2]),
                "pattern_name": "Double Top",
                "direction": "BEARISH",
                "confidence": round(confidence, 2),
                "description": f"Bearish reversal - two peaks at similar levels ({closes[p1]:.2f}, {closes[p2]:.2f})",
            })

    # Double Bottom
    for i in range(len(troughs) - 1):
        t1, t2 = troughs[i], troughs[i + 1]
        if t2 - t1 < 5:
            continue
        price_diff = abs(closes[t1] - closes[t2]) / max(closes[t1], closes[t2])
        if price_diff < 0.02:
            confidence = 0.75 + min(0.15, (1 - price_diff) * 0.15)
            patterns.append({
                "time": int(times[t2]),
                "pattern_name": "Double Bottom",
                "direction": "BULLISH",
                "confidence": round(confidence, 2),
                "description": f"Bullish reversal - two troughs at similar levels ({closes[t1]:.2f}, {closes[t2]:.2f})",
            })

    return patterns


def detect_triangles(candles: List[Dict], min_points: int = 4) -> List[Dict]:
    """Detect triangle patterns (ascending, descending, symmetric)."""
    patterns = []
    if len(candles) < 20:
        return patterns

    closes = np.array([c["close"] for c in candles])
    highs = np.array([c["high"] for c in candles])
    lows = np.array([c["low"] for c in candles])
    times = np.array([c["time"] for c in candles])

    peaks, troughs = _find_peaks_troughs(closes, order=3)

    if len(peaks) < 2 or len(troughs) < 2:
        return patterns

    # Check recent peaks and troughs (last 30 candles)
    window = min(30, len(candles))
    recent_peaks = peaks[peaks > len(candles) - window]
    recent_troughs = troughs[troughs > len(candles) - window]

    if len(recent_peaks) >= 2 and len(recent_troughs) >= 2:
        peak_values = closes[recent_peaks]
        trough_values = closes[recent_troughs]

        peaks_slope = (peak_values[-1] - peak_values[0]) / (recent_peaks[-1] - recent_peaks[0]) if recent_peaks[-1] != recent_peaks[0] else 0
        troughs_slope = (trough_values[-1] - trough_values[0]) / (recent_troughs[-1] - recent_troughs[0]) if recent_troughs[-1] != recent_troughs[0] else 0

        # Ascending Triangle
        if abs(peaks_slope) < 0.1 and troughs_slope > 0.1:
            patterns.append({
                "time": int(times[-1]),
                "pattern_name": "Ascending Triangle",
                "direction": "BULLISH",
                "confidence": 0.7,
                "description": "Bullish continuation - flat resistance with rising support",
            })

        # Descending Triangle
        elif peaks_slope < -0.1 and abs(troughs_slope) < 0.1:
            patterns.append({
                "time": int(times[-1]),
                "pattern_name": "Descending Triangle",
                "direction": "BEARISH",
                "confidence": 0.7,
                "description": "Bearish continuation - declining resistance with flat support",
            })

        # Symmetric Triangle
        elif peaks_slope < -0.05 and troughs_slope > 0.05:
            patterns.append({
                "time": int(times[-1]),
                "pattern_name": "Symmetric Triangle",
                "direction": "NEUTRAL",
                "confidence": 0.65,
                "description": "Converging trendlines - breakout direction unclear",
            })

    return patterns


def detect_wedges(candles: List[Dict]) -> List[Dict]:
    """Detect Rising and Falling Wedge patterns."""
    patterns = []
    if len(candles) < 20:
        return patterns

    closes = np.array([c["close"] for c in candles])
    highs = np.array([c["high"] for c in candles])
    lows = np.array([c["low"] for c in candles])
    times = np.array([c["time"] for c in candles])

    peaks, troughs = _find_peaks_troughs(closes, order=3)

    if len(peaks) < 2 or len(troughs) < 2:
        return patterns

    window = min(30, len(candles))
    recent_peaks = peaks[peaks > len(candles) - window]
    recent_troughs = troughs[troughs > len(candles) - window]

    if len(recent_peaks) >= 2 and len(recent_troughs) >= 2:
        peak_values = closes[recent_peaks]
        trough_values = closes[recent_troughs]

        peaks_slope = (peak_values[-1] - peak_values[0]) / (recent_peaks[-1] - recent_peaks[0]) if recent_peaks[-1] != recent_peaks[0] else 0
        troughs_slope = (trough_values[-1] - trough_values[0]) / (recent_troughs[-1] - recent_troughs[0]) if recent_troughs[-1] != recent_troughs[0] else 0

        range_narrowing = (peak_values[-1] - trough_values[-1]) < (peak_values[0] - trough_values[0])

        # Rising Wedge (bearish)
        if peaks_slope > 0 and troughs_slope > 0 and range_narrowing:
            patterns.append({
                "time": int(times[-1]),
                "pattern_name": "Rising Wedge",
                "direction": "BEARISH",
                "confidence": 0.7,
                "description": "Bearish reversal - both support and resistance rising but converging",
            })

        # Falling Wedge (bullish)
        elif peaks_slope < 0 and troughs_slope < 0 and range_narrowing:
            patterns.append({
                "time": int(times[-1]),
                "pattern_name": "Falling Wedge",
                "direction": "BULLISH",
                "confidence": 0.7,
                "description": "Bullish reversal - both support and resistance falling but converging",
            })

    return patterns


def detect_all_chart_patterns(candles: List[Dict]) -> List[Dict]:
    """Run all chart pattern detectors."""
    patterns = []
    patterns.extend(detect_head_and_shoulders(candles))
    patterns.extend(detect_double_top_bottom(candles))
    patterns.extend(detect_triangles(candles))
    patterns.extend(detect_wedges(candles))
    return patterns
