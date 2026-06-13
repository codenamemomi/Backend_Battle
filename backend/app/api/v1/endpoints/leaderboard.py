from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.models.schemas import BenchmarkResult, BenchmarkStatus
from app.db.session import get_db
from app.models.database import DBBenchmarkResult, DBSubmission

router = APIRouter()

@router.get("/leaderboard", response_model=List[BenchmarkResult])
async def get_leaderboard(limit: int = 20, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(DBBenchmarkResult)
        .where(DBBenchmarkResult.status == BenchmarkStatus.COMPLETED)
        .where(DBBenchmarkResult.score.isnot(None))
        .order_by(DBBenchmarkResult.score.desc())
        .limit(limit)
    )
    results = (await db.execute(stmt)).scalars().all()
    return results

@router.delete("/leaderboard")
async def clear_leaderboard(db: AsyncSession = Depends(get_db)):
    # Clear both tables
    await db.execute(delete(DBBenchmarkResult))
    await db.execute(delete(DBSubmission))
    await db.commit()
    return {"message": "Leaderboard cleared"}
