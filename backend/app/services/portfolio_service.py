"""Portfolio management service."""

from typing import List, Optional, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.portfolio import Portfolio, Holding, Transaction
from app.services.market_data import get_quote, get_batch_quotes
from app.utils.nse_symbols import SYMBOL_SECTOR


async def create_portfolio(db: AsyncSession, name: str = "My Portfolio") -> Portfolio:
    portfolio = Portfolio(name=name)
    db.add(portfolio)
    await db.commit()
    await db.refresh(portfolio)
    return portfolio


async def get_portfolio(db: AsyncSession, portfolio_id: int) -> Optional[Portfolio]:
    result = await db.execute(
        select(Portfolio)
        .options(selectinload(Portfolio.holdings).selectinload(Holding.transactions))
        .where(Portfolio.id == portfolio_id)
    )
    return result.scalar_one_or_none()


async def get_all_portfolios(db: AsyncSession) -> List[Portfolio]:
    result = await db.execute(
        select(Portfolio).options(selectinload(Portfolio.holdings))
    )
    return list(result.scalars().all())


async def add_holding(
    db: AsyncSession, portfolio_id: int, symbol: str, quantity: int, avg_buy_price: float
) -> Holding:
    holding = Holding(
        portfolio_id=portfolio_id,
        symbol=symbol.upper(),
        quantity=quantity,
        avg_buy_price=avg_buy_price,
    )
    db.add(holding)

    transaction = Transaction(
        holding_id=0,  # will update after flush
        transaction_type="BUY",
        quantity=quantity,
        price=avg_buy_price,
    )

    await db.flush()
    transaction.holding_id = holding.id
    db.add(transaction)
    await db.commit()
    await db.refresh(holding)
    return holding


async def update_holding(
    db: AsyncSession, holding_id: int, quantity: Optional[int] = None, avg_buy_price: Optional[float] = None
) -> Optional[Holding]:
    result = await db.execute(select(Holding).where(Holding.id == holding_id))
    holding = result.scalar_one_or_none()
    if not holding:
        return None
    if quantity is not None:
        holding.quantity = quantity
    if avg_buy_price is not None:
        holding.avg_buy_price = avg_buy_price
    await db.commit()
    await db.refresh(holding)
    return holding


async def delete_holding(db: AsyncSession, holding_id: int) -> bool:
    result = await db.execute(select(Holding).where(Holding.id == holding_id))
    holding = result.scalar_one_or_none()
    if not holding:
        return False
    await db.delete(holding)
    await db.commit()
    return True


async def add_transaction(
    db: AsyncSession, holding_id: int, txn_type: str, quantity: int, price: float
) -> Transaction:
    transaction = Transaction(
        holding_id=holding_id,
        transaction_type=txn_type.upper(),
        quantity=quantity,
        price=price,
    )
    db.add(transaction)

    # Update holding based on transaction
    result = await db.execute(select(Holding).where(Holding.id == holding_id))
    holding = result.scalar_one_or_none()
    if holding:
        if txn_type.upper() == "BUY":
            total_cost = (holding.avg_buy_price * holding.quantity) + (price * quantity)
            holding.quantity += quantity
            holding.avg_buy_price = total_cost / holding.quantity
        elif txn_type.upper() == "SELL":
            holding.quantity = max(0, holding.quantity - quantity)

    await db.commit()
    await db.refresh(transaction)
    return transaction


async def get_portfolio_summary(db: AsyncSession, portfolio_id: int) -> Dict:
    portfolio = await get_portfolio(db, portfolio_id)
    if not portfolio or not portfolio.holdings:
        return {
            "total_invested": 0, "current_value": 0, "total_pnl": 0,
            "total_pnl_pct": 0, "day_change": 0, "day_change_pct": 0,
            "holdings_count": 0, "sector_allocation": {},
        }

    symbols = [h.symbol for h in portfolio.holdings]
    quotes = await get_batch_quotes(symbols)

    total_invested = 0
    current_value = 0
    day_change = 0
    sector_values = {}

    for holding in portfolio.holdings:
        invested = holding.avg_buy_price * holding.quantity
        total_invested += invested

        quote = quotes.get(holding.symbol, {})
        price = quote.get("last_price", holding.avg_buy_price)
        value = price * holding.quantity
        current_value += value

        prev = quote.get("prev_close", price)
        day_change += (price - prev) * holding.quantity

        sector = SYMBOL_SECTOR.get(holding.symbol, "Other")
        sector_values[sector] = sector_values.get(sector, 0) + value

    total_pnl = current_value - total_invested
    total_pnl_pct = (total_pnl / total_invested * 100) if total_invested else 0
    day_change_pct = (day_change / (current_value - day_change) * 100) if (current_value - day_change) else 0

    # Convert sector values to percentages
    sector_allocation = {}
    if current_value > 0:
        for sector, value in sector_values.items():
            sector_allocation[sector] = round(value / current_value * 100, 1)

    return {
        "total_invested": round(total_invested, 2),
        "current_value": round(current_value, 2),
        "total_pnl": round(total_pnl, 2),
        "total_pnl_pct": round(total_pnl_pct, 2),
        "day_change": round(day_change, 2),
        "day_change_pct": round(day_change_pct, 2),
        "holdings_count": len(portfolio.holdings),
        "sector_allocation": sector_allocation,
    }
