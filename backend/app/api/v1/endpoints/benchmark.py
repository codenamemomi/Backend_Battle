import uuid
from datetime import datetime
from typing import List
from fastapi import APIRouter, HTTPException, BackgroundTasks

from app.models.schemas import APISubmission, BenchmarkConfig, BenchmarkResult, BenchmarkStatus
from app.db.in_memory import submissions, benchmark_results
from app.services.benchmark import run_benchmark

router = APIRouter()

@router.post("/submit", response_model=dict)
async def submit_api(
    submission: APISubmission,
    background_tasks: BackgroundTasks,
    concurrent_users: int = 10,
    total_requests: int = 50,
):
    sub_id = str(uuid.uuid4())
    result_id = str(uuid.uuid4())

    submissions[sub_id] = submission

    config = BenchmarkConfig(
        concurrent_users=min(concurrent_users, 50),
        total_requests=min(total_requests, 200),
    )

    result = BenchmarkResult(
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
    benchmark_results[result_id] = result

    background_tasks.add_task(run_benchmark, result_id, submission, config)

    return {"result_id": result_id, "submission_id": sub_id, "message": "Benchmark queued"}


@router.get("/results/{result_id}", response_model=BenchmarkResult)
def get_result(result_id: str):
    if result_id not in benchmark_results:
        raise HTTPException(404, "Result not found")
    return benchmark_results[result_id]


@router.get("/results", response_model=List[BenchmarkResult])
def list_results(limit: int = 50):
    results = list(benchmark_results.values())
    return sorted(results, key=lambda r: r.created_at, reverse=True)[:limit]


@router.delete("/results/{result_id}")
def delete_result(result_id: str):
    if result_id not in benchmark_results:
        raise HTTPException(404, "Result not found")
    del benchmark_results[result_id]
    return {"message": "Deleted"}
