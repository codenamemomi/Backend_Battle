import os
import asyncio
import uuid
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from sqlalchemy import select
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

load_dotenv()

from app.api.v1.api import api_router
from app.models.schemas import APISubmission, BenchmarkConfig, BenchmarkStatus
from app.db.session import engine, Base, async_session
from app.models.database import DBSubmission, DBBenchmarkResult
from app.services.benchmark import run_benchmark
from app.api.v1.endpoints.benchmark import limiter
from app.healthcheck import run_periodic_healthcheck

async def seed_demo():
    await asyncio.sleep(2)  # wait for tables to create and server start
    async with async_session() as db:
        # Check if database already has results
        stmt = select(DBBenchmarkResult)
        existing = (await db.execute(stmt)).scalars().first()
        if existing:
            return

        demos = [
            APISubmission(name="JSONPlaceholder /posts", url="https://jsonplaceholder.typicode.com/posts/1", owner="Demo"),
            APISubmission(name="HTTPBin /get", url="https://httpbin.org/get", owner="Demo"),
            APISubmission(name="JSONPlaceholder /users", url="https://jsonplaceholder.typicode.com/users/1", owner="Demo"),
        ]
        for sub in demos:
            sub_id = str(uuid.uuid4())
            result_id = str(uuid.uuid4())
            
            db_sub = DBSubmission(
                id=sub_id,
                name=sub.name,
                url=sub.url,
                description=sub.description,
                http_method=sub.http_method,
                payload=sub.payload,
                headers=sub.headers,
                owner=sub.owner or "Demo",
            )
            db.add(db_sub)

            config = BenchmarkConfig(concurrent_users=5, total_requests=20)
            db_res = DBBenchmarkResult(
                id=result_id,
                submission_id=sub_id,
                api_name=sub.name,
                api_url=sub.url,
                owner=sub.owner or "Demo",
                status=BenchmarkStatus.PENDING,
                created_at=datetime.utcnow().isoformat(),
                concurrent_users=config.concurrent_users,
                total_requests=config.total_requests,
            )
            db.add(db_res)
            await db.commit()
            
            asyncio.create_task(run_benchmark(result_id, sub, config))


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    asyncio.create_task(seed_demo())
    asyncio.create_task(run_periodic_healthcheck())
    yield


app = FastAPI(title="Backend Battle API", version="1.0.0", lifespan=lifespan)

# Add Rate Limiter Exception Handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Policy configuration
origins_str = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = [o.strip() for o in origins_str.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Backend Battle API", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "ok"}

# Include v1 router with no prefix to match original endpoint signatures
app.include_router(api_router)
