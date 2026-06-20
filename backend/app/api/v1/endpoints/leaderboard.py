from typing import List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.models.schemas import BenchmarkResult, BenchmarkStatus
from app.db.session import get_db
from app.models.database import DBBenchmarkResult, DBSubmission
from app.api.v1.endpoints.benchmark import get_api_key

router = APIRouter()

@router.get("/leaderboard", response_model=List[BenchmarkResult])
async def get_leaderboard(period: str = "all", limit: int = 20, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(DBBenchmarkResult)
        .where(DBBenchmarkResult.status == BenchmarkStatus.COMPLETED)
        .where(DBBenchmarkResult.score.isnot(None))
    )
    
    period = period.lower().strip()
    if period != "all":
        now = datetime.utcnow()
        if period == "today":
            cutoff = now - timedelta(days=1)
        elif period == "week":
            cutoff = now - timedelta(days=7)
        elif period == "month":
            cutoff = now - timedelta(days=30)
        else:
            cutoff = None
            
        if cutoff:
            stmt = stmt.where(DBBenchmarkResult.created_at >= cutoff.isoformat())

    stmt = stmt.order_by(DBBenchmarkResult.score.desc()).limit(limit)
    results = (await db.execute(stmt)).scalars().all()
    return results

@router.delete("/leaderboard")
async def clear_leaderboard(db: AsyncSession = Depends(get_db), api_key: str = Depends(get_api_key)):
    # Clear both tables
    await db.execute(delete(DBBenchmarkResult))
    await db.execute(delete(DBSubmission))
    await db.commit()
    return {"message": "Leaderboard cleared"}
