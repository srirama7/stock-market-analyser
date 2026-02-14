"""WebSocket endpoint for market-wide updates (indices, breadth)."""

import logging
from fastapi import WebSocket, WebSocketDisconnect
from app.websocket.manager import ws_manager

logger = logging.getLogger(__name__)


async def market_ws_endpoint(websocket: WebSocket):
    """Handle market WebSocket connections. Broadcasts index updates."""
    await ws_manager.connect_market(websocket)
    try:
        while True:
            await websocket.receive_text()  # Keep alive
    except WebSocketDisconnect:
        ws_manager.disconnect_market(websocket)
    except Exception as e:
        logger.error(f"Market WS error: {e}")
        ws_manager.disconnect_market(websocket)
