from typing import List
from fastapi import APIRouter

from app.models.schemas import BenchmarkResult, BenchmarkStatus
from app.db.in_memory import benchmark_results

router = APIRouter()

@router.get("/leaderboard", response_model=List[BenchmarkResult])
def get_leaderboard(limit: int = 20):
    completed = [
        r for r in benchmark_results.values()
        if r.status == BenchmarkStatus.COMPLETED and r.score is not None
    ]
    return sorted(completed, key=lambda r: r.score, reverse=True)[:limit]
