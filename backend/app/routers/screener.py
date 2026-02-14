from fastapi import APIRouter, Query
from typing import Optional, List
from app.services.screener_service import run_screen, PREBUILT_SCREENS

router = APIRouter(prefix="/api/screener", tags=["screener"])


@router.get("/presets")
async def get_presets():
    """Get available pre-built screens."""
    return PREBUILT_SCREENS


@router.get("/run")
async def run_screener(
    preset: Optional[str] = None,
    min_pe: Optional[float] = None,
    max_pe: Optional[float] = None,
    min_market_cap: Optional[float] = None,
    max_market_cap: Optional[float] = None,
    min_rsi: Optional[float] = None,
    max_rsi: Optional[float] = None,
    macd_cross: Optional[str] = None,
    min_volume_ratio: Optional[float] = None,
    near_52w_high_pct: Optional[float] = None,
    near_52w_low_pct: Optional[float] = None,
):
    """Run stock screener with filters."""
    # If preset, use pre-defined filters
    if preset and preset in PREBUILT_SCREENS:
        filters = PREBUILT_SCREENS[preset]["filters"]
        return await run_screen(**filters)

    return await run_screen(
        min_pe=min_pe, max_pe=max_pe,
        min_market_cap=min_market_cap, max_market_cap=max_market_cap,
        min_rsi=min_rsi, max_rsi=max_rsi,
        macd_cross=macd_cross,
        min_volume_ratio=min_volume_ratio,
        near_52w_high_pct=near_52w_high_pct,
        near_52w_low_pct=near_52w_low_pct,
    )
