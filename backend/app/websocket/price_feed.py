"""WebSocket endpoint for price subscriptions."""

import json
import logging
from fastapi import WebSocket, WebSocketDisconnect
from app.websocket.manager import ws_manager

logger = logging.getLogger(__name__)


async def price_ws_endpoint(websocket: WebSocket):
    """Handle price WebSocket connections. Clients send subscribe/unsubscribe messages."""
    await ws_manager.connect_prices(websocket)
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
                action = msg.get("action")
                symbols = msg.get("symbols", [])

                if action == "subscribe" and symbols:
                    ws_manager.subscribe(websocket, symbols)
                    await websocket.send_text(json.dumps({
                        "type": "subscribed",
                        "symbols": symbols
                    }))
                elif action == "unsubscribe" and symbols:
                    ws_manager.unsubscribe(websocket, symbols)
                    await websocket.send_text(json.dumps({
                        "type": "unsubscribed",
                        "symbols": symbols
                    }))
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({"type": "error", "message": "Invalid JSON"}))
    except WebSocketDisconnect:
        ws_manager.disconnect_prices(websocket)
    except Exception as e:
        logger.error(f"Price WS error: {e}")
        ws_manager.disconnect_prices(websocket)
