from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, field_validator

class BenchmarkStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class APISubmission(BaseModel):
    name: str
    url: str
    description: Optional[str] = ""
    http_method: str = "GET"
    payload: Optional[dict] = None
    headers: Optional[dict] = None
    owner: Optional[str] = "Anonymous"

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with 'http://' or 'https://'")
        return v



class BenchmarkConfig(BaseModel):
    concurrent_users: int = 10
    total_requests: int = 50
    timeout_seconds: float = 10.0


class RequestMetric(BaseModel):
    latency_ms: float
    status_code: int
    success: bool
    error: Optional[str] = None


class BenchmarkResult(BaseModel):
    id: str
    submission_id: str
    api_name: str
    api_url: str
    owner: str
    status: BenchmarkStatus
    created_at: str
    completed_at: Optional[str] = None

    # config
    concurrent_users: int
    total_requests: int

    # metrics (populated after completion)
    avg_latency_ms: Optional[float] = None
    p50_latency_ms: Optional[float] = None
    p95_latency_ms: Optional[float] = None
    p99_latency_ms: Optional[float] = None
    min_latency_ms: Optional[float] = None
    max_latency_ms: Optional[float] = None
    success_rate: Optional[float] = None
    requests_per_second: Optional[float] = None
    total_successful: Optional[int] = None
    total_failed: Optional[int] = None
    score: Optional[float] = None
    grade: Optional[str] = None
    error_message: Optional[str] = None
