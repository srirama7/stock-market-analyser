"""FastAPI entry point for the Stock Market Analyzer."""

import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers import stocks, market, charts, portfolio, patterns, screener, news
from app.websocket.price_feed import price_ws_endpoint
from app.websocket.market_feed import market_ws_endpoint
from app.tasks.price_poller import price_poller
from app.tasks.index_poller import index_poller
from app.tasks.news_poller import news_poller
from app.tasks.pattern_scanner import pattern_scanner

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown lifecycle."""
    logger.info("Starting Stock Market Analyzer...")
    await init_db()
    logger.info("Database initialized")

    # Start background tasks
    tasks = [
        asyncio.create_task(price_poller()),
        asyncio.create_task(index_poller()),
        asyncio.create_task(news_poller()),
        asyncio.create_task(pattern_scanner()),
    ]
    logger.info("Background pollers started")

    yield

    # Shutdown
    for task in tasks:
        task.cancel()
    logger.info("Shutting down...")


app = FastAPI(
    title="AI Stock Market Analyzer",
    description="Real-time AI-based Indian Stock Market Pattern Analyzer",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST API Routers
app.include_router(stocks.router)
app.include_router(market.router)
app.include_router(charts.router)
app.include_router(portfolio.router)
app.include_router(patterns.router)
app.include_router(screener.router)
app.include_router(news.router)


# WebSocket endpoints
@app.websocket("/ws/prices")
async def ws_prices(websocket: WebSocket):
    await price_ws_endpoint(websocket)


@app.websocket("/ws/market")
async def ws_market(websocket: WebSocket):
    await market_ws_endpoint(websocket)


@app.get("/api/health")
async def health():
    return {"status": "ok", "message": "Stock Market Analyzer is running"}
