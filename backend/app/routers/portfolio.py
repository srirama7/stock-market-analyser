from fastapi import APIRouter, HTTPException, Depends
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.portfolio import (
    PortfolioCreate, PortfolioResponse, HoldingCreate, HoldingUpdate,
    HoldingResponse, TransactionCreate, TransactionResponse, PortfolioSummary
)
from app.services import portfolio_service as ps
from app.services.market_data import get_quote
from app.utils.nse_symbols import SYMBOL_SECTOR

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])


@router.post("/", response_model=PortfolioResponse)
async def create_portfolio(data: PortfolioCreate, db: AsyncSession = Depends(get_db)):
    portfolio = await ps.create_portfolio(db, data.name)
    return portfolio


@router.get("/", response_model=List[PortfolioResponse])
async def list_portfolios(db: AsyncSession = Depends(get_db)):
    return await ps.get_all_portfolios(db)


@router.get("/{portfolio_id}", response_model=PortfolioResponse)
async def get_portfolio(portfolio_id: int, db: AsyncSession = Depends(get_db)):
    portfolio = await ps.get_portfolio(db, portfolio_id)
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return portfolio


@router.get("/{portfolio_id}/summary", response_model=PortfolioSummary)
async def get_portfolio_summary(portfolio_id: int, db: AsyncSession = Depends(get_db)):
    return await ps.get_portfolio_summary(db, portfolio_id)


@router.post("/{portfolio_id}/holdings", response_model=HoldingResponse)
async def add_holding(
    portfolio_id: int, data: HoldingCreate, db: AsyncSession = Depends(get_db)
):
    holding = await ps.add_holding(db, portfolio_id, data.symbol, data.quantity, data.avg_buy_price)
    quote = await get_quote(holding.symbol)
    response = HoldingResponse.model_validate(holding)
    if quote:
        response.current_price = quote["last_price"]
        response.market_value = quote["last_price"] * holding.quantity
        invested = holding.avg_buy_price * holding.quantity
        response.pnl = response.market_value - invested
        response.pnl_pct = (response.pnl / invested * 100) if invested else 0
        response.day_change = quote["day_change"]
        response.day_change_pct = quote["day_change_pct"]
    response.sector = SYMBOL_SECTOR.get(holding.symbol)
    return response


@router.put("/holdings/{holding_id}", response_model=HoldingResponse)
async def update_holding(
    holding_id: int, data: HoldingUpdate, db: AsyncSession = Depends(get_db)
):
    holding = await ps.update_holding(db, holding_id, data.quantity, data.avg_buy_price)
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")
    return HoldingResponse.model_validate(holding)


@router.delete("/holdings/{holding_id}")
async def delete_holding(holding_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await ps.delete_holding(db, holding_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Holding not found")
    return {"message": "Holding deleted"}


@router.post("/holdings/{holding_id}/transactions", response_model=TransactionResponse)
async def add_transaction(
    holding_id: int, data: TransactionCreate, db: AsyncSession = Depends(get_db)
):
    return await ps.add_transaction(
        db, holding_id, data.transaction_type, data.quantity, data.price
    )
