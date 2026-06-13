import asyncio
import time
import statistics
from datetime import datetime
from typing import List
import httpx
from sqlalchemy import select

from app.models.schemas import (
    APISubmission,
    BenchmarkConfig,
    RequestMetric,
    BenchmarkStatus,
)
from app.db.session import async_session
from app.models.database import DBBenchmarkResult

async def run_single_request(
    client: httpx.AsyncClient,
    url: str,
    method: str,
    headers: dict,
    payload: dict,
    timeout: float
) -> RequestMetric:
    start = time.perf_counter()
    try:
        response = await client.request(
            method=method,
            url=url,
            json=payload if payload else None,
            headers=headers,
            timeout=timeout,
            follow_redirects=True,
        )
        latency = (time.perf_counter() - start) * 1000
        return RequestMetric(
            latency_ms=round(latency, 2),
            status_code=response.status_code,
            success=response.status_code < 500,
            error=None,
        )
    except httpx.TimeoutException:
        latency = (time.perf_counter() - start) * 1000
        return RequestMetric(latency_ms=round(latency, 2), status_code=0, success=False, error="timeout")
    except Exception as e:
        latency = (time.perf_counter() - start) * 1000
        return RequestMetric(latency_ms=round(latency, 2), status_code=0, success=False, error=str(e)[:100])


def compute_grade(score: float) -> str:
    if score >= 90: return "S"
    if score >= 80: return "A"
    if score >= 65: return "B"
    if score >= 50: return "C"
    if score >= 30: return "D"
    return "F"


def compute_score(avg_latency: float, p95_latency: float, success_rate: float, rps: float) -> float:
    """
    Score 0-100:
    - 40pts: latency score (lower is better, <100ms = full, >3000ms = 0)
    - 30pts: p95 latency score
    - 20pts: success rate
    - 10pts: throughput bonus
    """
    if success_rate == 0:
        return 0.0

    lat_score = max(0, 40 * (1 - (avg_latency - 50) / 2950)) if avg_latency > 50 else 40
    p95_score = max(0, 30 * (1 - (p95_latency - 100) / 4900)) if p95_latency > 100 else 30
    success_score = success_rate * 20
    rps_score = min(10, rps / 10)  # max 10pts at 100 rps
    return round(min(100, lat_score + p95_score + success_score + rps_score), 1)


async def run_benchmark(result_id: str, submission: APISubmission, config: BenchmarkConfig):
    # Set status to running
    async with async_session() as db:
        stmt = select(DBBenchmarkResult).where(DBBenchmarkResult.id == result_id)
        db_res = (await db.execute(stmt)).scalar_one_or_none()
        if not db_res:
            return
        db_res.status = BenchmarkStatus.RUNNING
        await db.commit()

    metrics: List[RequestMetric] = []
    start_wall = time.perf_counter()

    try:
        async with httpx.AsyncClient() as client:
            semaphore = asyncio.Semaphore(config.concurrent_users)

            async def bounded_request():
                async with semaphore:
                    return await run_single_request(
                        client,
                        submission.url,
                        submission.http_method.upper(),
                        submission.headers or {},
                        submission.payload,
                        config.timeout_seconds,
                    )

            tasks = [bounded_request() for _ in range(config.total_requests)]
            metrics = await asyncio.gather(*tasks)

        wall_time = time.perf_counter() - start_wall
        successful = [m for m in metrics if m.success]
        failed = [m for m in metrics if not m.success]
        success_rate = round(len(successful) / len(metrics), 4)
        rps = round(len(metrics) / wall_time, 2)

        if successful:
            latencies = [m.latency_ms for m in successful]
            latencies_sorted = sorted(latencies)

            def percentile(data, pct):
                idx = int(len(data) * pct / 100)
                return data[min(idx, len(data) - 1)]

            avg_lat = round(statistics.mean(latencies), 2)
            p50 = round(percentile(latencies_sorted, 50), 2)
            p95 = round(percentile(latencies_sorted, 95), 2)
            p99 = round(percentile(latencies_sorted, 99), 2)
            min_lat = round(min(latencies), 2)
            max_lat = round(max(latencies), 2)
            score = compute_score(avg_lat, p95, success_rate, rps)
        else:
            avg_lat = None
            p50 = None
            p95 = None
            p99 = None
            min_lat = None
            max_lat = None
            score = 0.0

        async with async_session() as db:
            stmt = select(DBBenchmarkResult).where(DBBenchmarkResult.id == result_id)
            db_res = (await db.execute(stmt)).scalar_one_or_none()
            if db_res:
                db_res.avg_latency_ms = avg_lat
                db_res.p50_latency_ms = p50
                db_res.p95_latency_ms = p95
                db_res.p99_latency_ms = p99
                db_res.min_latency_ms = min_lat
                db_res.max_latency_ms = max_lat
                db_res.success_rate = success_rate
                db_res.requests_per_second = rps
                db_res.total_successful = len(successful)
                db_res.total_failed = len(failed)
                db_res.score = score
                db_res.grade = compute_grade(score)
                db_res.status = BenchmarkStatus.COMPLETED
                db_res.completed_at = datetime.utcnow().isoformat()
                await db.commit()

    except Exception as e:
        async with async_session() as db:
            stmt = select(DBBenchmarkResult).where(DBBenchmarkResult.id == result_id)
            db_res = (await db.execute(stmt)).scalar_one_or_none()
            if db_res:
                db_res.status = BenchmarkStatus.FAILED
                db_res.error_message = str(e)[:300]
                db_res.completed_at = datetime.utcnow().isoformat()
                await db.commit()
