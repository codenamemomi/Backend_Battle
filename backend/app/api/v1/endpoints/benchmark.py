import os
import uuid
from datetime import datetime
from typing import List
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, Security, status, Request
from fastapi.security.api_key import APIKeyHeader
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.models.schemas import APISubmission, BenchmarkConfig, BenchmarkResult, BenchmarkStatus
from app.db.session import get_db
from app.models.database import DBSubmission, DBBenchmarkResult
from app.services.benchmark import run_benchmark

# Set up Rate Limiter (SlowAPI)
from slowapi import Limiter
from slowapi.util import get_remote_address
limiter = Limiter(key_func=get_remote_address)

# API Key Security Header Configuration
API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)

def get_api_key(api_key: str = Security(API_KEY_HEADER)):
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-API-Key header is missing",
        )
    allowed_keys = [k.strip() for k in os.getenv("API_KEYS", "").split(",") if k.strip()]
    # If API_KEYS env is not set or empty, allow requests in local dev
    if not allowed_keys:
        return api_key
    if api_key not in allowed_keys:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API Key",
        )
    return api_key

router = APIRouter()

# Rate limit submit requests to 5 per minute per IP address
@router.post("/submit", response_model=dict)
@limiter.limit("5/minute")
async def submit_api(
    request: Request,
    submission: APISubmission,
    background_tasks: BackgroundTasks,
    concurrent_users: int = 10,
    total_requests: int = 50,
    db: AsyncSession = Depends(get_db),
    api_key: str = Depends(get_api_key),
):
    sub_id = str(uuid.uuid4())
    result_id = str(uuid.uuid4())

    # Create submission in DB
    db_sub = DBSubmission(
        id=sub_id,
        name=submission.name,
        url=submission.url,
        description=submission.description,
        http_method=submission.http_method,
        payload=submission.payload,
        headers=submission.headers,
        owner=submission.owner or "Anonymous",
    )
    db.add(db_sub)

    config = BenchmarkConfig(
        concurrent_users=min(concurrent_users, 50),
        total_requests=min(total_requests, 200),
    )

    # Create empty result entry
    db_res = DBBenchmarkResult(
        id=result_id,
        submission_id=sub_id,
        api_name=submission.name,
        api_url=submission.url,
        owner=submission.owner or "Anonymous",
        status=BenchmarkStatus.PENDING,
        created_at=datetime.utcnow().isoformat(),
        concurrent_users=config.concurrent_users,
        total_requests=config.total_requests,
    )
    db.add(db_res)
    await db.commit()

    use_celery = os.getenv("USE_CELERY", "false").lower() == "true"
    if use_celery:
        from app.tasks.worker import run_benchmark_task
        run_benchmark_task.delay(result_id, submission.model_dump(), config.model_dump())
    else:
        background_tasks.add_task(run_benchmark, result_id, submission, config)

    return {"result_id": result_id, "submission_id": sub_id, "message": "Benchmark queued"}


@router.get("/results/{result_id}", response_model=BenchmarkResult)
async def get_result(result_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(DBBenchmarkResult).where(DBBenchmarkResult.id == result_id)
    result = (await db.execute(stmt)).scalar_one_or_none()
    if not result:
        raise HTTPException(404, "Result not found")
    return result


@router.get("/results", response_model=List[BenchmarkResult])
async def list_results(limit: int = 50, db: AsyncSession = Depends(get_db)):
    stmt = select(DBBenchmarkResult).order_by(DBBenchmarkResult.created_at.desc()).limit(limit)
    results = (await db.execute(stmt)).scalars().all()
    return results


@router.delete("/results/{result_id}")
async def delete_result(result_id: str, db: AsyncSession = Depends(get_db), api_key: str = Depends(get_api_key)):
    stmt = select(DBBenchmarkResult).where(DBBenchmarkResult.id == result_id)
    result = (await db.execute(stmt)).scalar_one_or_none()
    if not result:
        raise HTTPException(404, "Result not found")
    
    await db.delete(result)
    await db.commit()
    return {"message": "Deleted"}
