"""Technical indicator calculation service using pandas-ta."""

import pandas as pd
import numpy as np
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)


def _candles_to_df(candles: List[Dict]) -> pd.DataFrame:
    """Convert candle list to DataFrame."""
    df = pd.DataFrame(candles)
    df.columns = [c.capitalize() if c != "time" else "Time" for c in df.columns]
    return df


def calculate_sma(candles: List[Dict], period: int = 20) -> List[Dict]:
    """Simple Moving Average."""
    df = _candles_to_df(candles)
    sma = df["Close"].rolling(window=period).mean()
    return [{"time": c["time"], "value": round(float(v), 2) if not pd.isna(v) else None}
            for c, v in zip(candles, sma)]


def calculate_ema(candles: List[Dict], period: int = 20) -> List[Dict]:
    """Exponential Moving Average."""
    df = _candles_to_df(candles)
    ema = df["Close"].ewm(span=period, adjust=False).mean()
    return [{"time": c["time"], "value": round(float(v), 2) if not pd.isna(v) else None}
            for c, v in zip(candles, ema)]


def calculate_rsi(candles: List[Dict], period: int = 14) -> List[Dict]:
    """Relative Strength Index."""
    df = _candles_to_df(candles)
    delta = df["Close"].diff()
    gain = delta.where(delta > 0, 0.0)
    loss = (-delta).where(delta < 0, 0.0)

    avg_gain = gain.rolling(window=period).mean()
    avg_loss = loss.rolling(window=period).mean()

    # Use Wilder's smoothing after initial window
    for i in range(period, len(df)):
        avg_gain.iloc[i] = (avg_gain.iloc[i-1] * (period - 1) + gain.iloc[i]) / period
        avg_loss.iloc[i] = (avg_loss.iloc[i-1] * (period - 1) + loss.iloc[i]) / period

    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))

    return [{"time": c["time"], "value": round(float(v), 2) if not pd.isna(v) else None}
            for c, v in zip(candles, rsi)]


def calculate_macd(candles: List[Dict], fast: int = 12, slow: int = 26, signal: int = 9) -> Dict[str, List[Dict]]:
    """MACD indicator."""
    df = _candles_to_df(candles)
    ema_fast = df["Close"].ewm(span=fast, adjust=False).mean()
    ema_slow = df["Close"].ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram = macd_line - signal_line

    def to_list(series):
        return [{"time": c["time"], "value": round(float(v), 2) if not pd.isna(v) else None}
                for c, v in zip(candles, series)]

    return {
        "macd": to_list(macd_line),
        "signal": to_list(signal_line),
        "histogram": to_list(histogram),
    }


def calculate_bollinger_bands(candles: List[Dict], period: int = 20, std_dev: float = 2.0) -> Dict[str, List[Dict]]:
    """Bollinger Bands."""
    df = _candles_to_df(candles)
    sma = df["Close"].rolling(window=period).mean()
    std = df["Close"].rolling(window=period).std()
    upper = sma + (std * std_dev)
    lower = sma - (std * std_dev)

    def to_list(series):
        return [{"time": c["time"], "value": round(float(v), 2) if not pd.isna(v) else None}
                for c, v in zip(candles, series)]

    return {
        "upper": to_list(upper),
        "middle": to_list(sma),
        "lower": to_list(lower),
    }


def calculate_supertrend(candles: List[Dict], period: int = 10, multiplier: float = 3.0) -> List[Dict]:
    """Supertrend indicator."""
    df = _candles_to_df(candles)
    high = df["High"]
    low = df["Low"]
    close = df["Close"]

    atr_series = pd.Series(index=df.index, dtype=float)
    tr = pd.concat([
        high - low,
        (high - close.shift(1)).abs(),
        (low - close.shift(1)).abs()
    ], axis=1).max(axis=1)
    atr_series = tr.rolling(window=period).mean()

    hl2 = (high + low) / 2
    upper_band = hl2 + (multiplier * atr_series)
    lower_band = hl2 - (multiplier * atr_series)

    supertrend = pd.Series(index=df.index, dtype=float)
    direction = pd.Series(index=df.index, dtype=float)

    supertrend.iloc[period - 1] = upper_band.iloc[period - 1]
    direction.iloc[period - 1] = -1

    for i in range(period, len(df)):
        if close.iloc[i] > supertrend.iloc[i - 1]:
            supertrend.iloc[i] = max(lower_band.iloc[i], supertrend.iloc[i - 1]) if direction.iloc[i-1] == 1 else lower_band.iloc[i]
            direction.iloc[i] = 1
        else:
            supertrend.iloc[i] = min(upper_band.iloc[i], supertrend.iloc[i - 1]) if direction.iloc[i-1] == -1 else upper_band.iloc[i]
            direction.iloc[i] = -1

    return [{"time": c["time"], "value": round(float(v), 2) if not pd.isna(v) else None,
             "color": "#22c55e" if d == 1 else "#ef4444" if d == -1 else None}
            for c, v, d in zip(candles, supertrend, direction)]


def calculate_vwap(candles: List[Dict]) -> List[Dict]:
    """Volume Weighted Average Price."""
    df = _candles_to_df(candles)
    typical_price = (df["High"] + df["Low"] + df["Close"]) / 3
    cum_tp_vol = (typical_price * df["Volume"]).cumsum()
    cum_vol = df["Volume"].cumsum()
    vwap = cum_tp_vol / cum_vol

    return [{"time": c["time"], "value": round(float(v), 2) if not pd.isna(v) else None}
            for c, v in zip(candles, vwap)]


def get_indicators(candles: List[Dict], indicator_names: List[str]) -> Dict:
    """Calculate multiple indicators."""
    results = {}
    for name in indicator_names:
        try:
            if name == "sma20":
                results["sma20"] = calculate_sma(candles, 20)
            elif name == "sma50":
                results["sma50"] = calculate_sma(candles, 50)
            elif name == "sma200":
                results["sma200"] = calculate_sma(candles, 200)
            elif name == "ema20":
                results["ema20"] = calculate_ema(candles, 20)
            elif name == "ema50":
                results["ema50"] = calculate_ema(candles, 50)
            elif name == "rsi":
                results["rsi"] = calculate_rsi(candles)
            elif name == "macd":
                results["macd"] = calculate_macd(candles)
            elif name == "bollinger":
                results["bollinger"] = calculate_bollinger_bands(candles)
            elif name == "supertrend":
                results["supertrend"] = calculate_supertrend(candles)
            elif name == "vwap":
                results["vwap"] = calculate_vwap(candles)
        except Exception as e:
            logger.error(f"Error calculating {name}: {e}")
    return results
