from contextlib import asynccontextmanager
import asyncio
import uuid
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.models.schemas import APISubmission, BenchmarkConfig, BenchmarkResult, BenchmarkStatus
from app.db.in_memory import submissions, benchmark_results
from app.services.benchmark import run_benchmark

async def seed_demo():
    await asyncio.sleep(2)  # wait for server start
    demos = [
        APISubmission(name="JSONPlaceholder /posts", url="https://jsonplaceholder.typicode.com/posts/1", owner="Demo"),
        APISubmission(name="HTTPBin /get", url="https://httpbin.org/get", owner="Demo"),
        APISubmission(name="JSONPlaceholder /users", url="https://jsonplaceholder.typicode.com/users/1", owner="Demo"),
    ]
    for sub in demos:
        sub_id = str(uuid.uuid4())
        result_id = str(uuid.uuid4())
        submissions[sub_id] = sub
        config = BenchmarkConfig(concurrent_users=5, total_requests=20)
        result = BenchmarkResult(
            id=result_id, submission_id=sub_id,
            api_name=sub.name, api_url=sub.url, owner=sub.owner or "Demo",
            status=BenchmarkStatus.PENDING,
            created_at=datetime.utcnow().isoformat(),
            concurrent_users=config.concurrent_users,
            total_requests=config.total_requests,
        )
        benchmark_results[result_id] = result
        asyncio.create_task(run_benchmark(result_id, sub, config))


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: seed demo data
    asyncio.create_task(seed_demo())
    yield


app = FastAPI(title="Backend Battle API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Backend Battle API", "docs": "/docs"}

# Include v1 router with no prefix to match original endpoint signatures
app.include_router(api_router)
