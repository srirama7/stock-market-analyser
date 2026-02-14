"""WebSocket connection manager for real-time data push."""

import json
import logging
from typing import Dict, Set, List, Any
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self._price_connections: Dict[WebSocket, Set[str]] = {}
        self._market_connections: Set[WebSocket] = set()
        self._pattern_connections: Set[WebSocket] = set()

    async def connect_prices(self, websocket: WebSocket):
        await websocket.accept()
        self._price_connections[websocket] = set()
        logger.info(f"Price WS connected. Total: {len(self._price_connections)}")

    async def connect_market(self, websocket: WebSocket):
        await websocket.accept()
        self._market_connections.add(websocket)
        logger.info(f"Market WS connected. Total: {len(self._market_connections)}")

    async def connect_patterns(self, websocket: WebSocket):
        await websocket.accept()
        self._pattern_connections.add(websocket)
        logger.info(f"Pattern WS connected. Total: {len(self._pattern_connections)}")

    def disconnect_prices(self, websocket: WebSocket):
        self._price_connections.pop(websocket, None)
        logger.info(f"Price WS disconnected. Total: {len(self._price_connections)}")

    def disconnect_market(self, websocket: WebSocket):
        self._market_connections.discard(websocket)
        logger.info(f"Market WS disconnected. Total: {len(self._market_connections)}")

    def disconnect_patterns(self, websocket: WebSocket):
        self._pattern_connections.discard(websocket)

    def subscribe(self, websocket: WebSocket, symbols: List[str]):
        if websocket in self._price_connections:
            self._price_connections[websocket].update(s.upper() for s in symbols)

    def unsubscribe(self, websocket: WebSocket, symbols: List[str]):
        if websocket in self._price_connections:
            for s in symbols:
                self._price_connections[websocket].discard(s.upper())

    def get_all_subscribed_symbols(self) -> Set[str]:
        all_symbols = set()
        for symbols in self._price_connections.values():
            all_symbols.update(symbols)
        return all_symbols

    async def broadcast_price(self, symbol: str, data: Dict[str, Any]):
        message = json.dumps({"type": "price", "symbol": symbol, "data": data})
        dead = []
        for ws, symbols in self._price_connections.items():
            if symbol in symbols:
                try:
                    await ws.send_text(message)
                except Exception:
                    dead.append(ws)
        for ws in dead:
            self.disconnect_prices(ws)

    async def broadcast_market(self, data: Dict[str, Any]):
        message = json.dumps({"type": "market", "data": data})
        dead = []
        for ws in self._market_connections:
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect_market(ws)

    async def broadcast_pattern(self, data: Dict[str, Any]):
        message = json.dumps({"type": "pattern", "data": data})
        dead = []
        for ws in self._pattern_connections:
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect_patterns(ws)


ws_manager = ConnectionManager()
