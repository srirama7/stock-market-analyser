from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.services.chart_service import get_chart_data
from app.services.indicator_service import get_indicators

router = APIRouter(prefix="/api/charts", tags=["charts"])


@router.get("/{symbol}")
async def get_chart(
    symbol: str,
    interval: str = "1d",
    period: Optional[str] = None,
    indicators: Optional[str] = None,
):
    """Get chart data with optional indicators.

    indicators: comma-separated list (e.g., 'sma20,rsi,macd,bollinger')
    """
    symbol = symbol.upper().strip()
    chart_data = await get_chart_data(symbol, interval, period)
    if not chart_data:
        raise HTTPException(status_code=404, detail=f"Chart data not found for {symbol}")

    if indicators:
        indicator_list = [i.strip() for i in indicators.split(",")]
        chart_data["indicators"] = get_indicators(chart_data["candles"], indicator_list)

    return chart_data
