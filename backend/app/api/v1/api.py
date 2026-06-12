from fastapi import APIRouter

from app.api.v1.endpoints import benchmark, leaderboard

api_router = APIRouter()
api_router.include_router(benchmark.router, tags=["benchmark"])
api_router.include_router(leaderboard.router, tags=["leaderboard"])
