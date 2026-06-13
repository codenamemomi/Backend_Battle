from sqlalchemy import Column, String, Integer, Float, Enum as SQLEnum, JSON, ForeignKey
from app.db.session import Base
from app.models.schemas import BenchmarkStatus

class DBSubmission(Base):
    __tablename__ = "submissions"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    url = Column(String, nullable=False)
    description = Column(String, default="")
    http_method = Column(String, default="GET")
    payload = Column(JSON, nullable=True)
    headers = Column(JSON, nullable=True)
    owner = Column(String, default="Anonymous")

class DBBenchmarkResult(Base):
    __tablename__ = "benchmark_results"

    id = Column(String, primary_key=True)
    submission_id = Column(String, ForeignKey("submissions.id", ondelete="CASCADE"), nullable=False)
    api_name = Column(String, nullable=False)
    api_url = Column(String, nullable=False)
    owner = Column(String, nullable=False)
    status = Column(SQLEnum(BenchmarkStatus), nullable=False)
    created_at = Column(String, nullable=False)
    completed_at = Column(String, nullable=True)

    concurrent_users = Column(Integer, nullable=False)
    total_requests = Column(Integer, nullable=False)

    avg_latency_ms = Column(Float, nullable=True)
    p50_latency_ms = Column(Float, nullable=True)
    p95_latency_ms = Column(Float, nullable=True)
    p99_latency_ms = Column(Float, nullable=True)
    min_latency_ms = Column(Float, nullable=True)
    max_latency_ms = Column(Float, nullable=True)
    success_rate = Column(Float, nullable=True)
    requests_per_second = Column(Float, nullable=True)
    total_successful = Column(Integer, nullable=True)
    total_failed = Column(Integer, nullable=True)
    score = Column(Float, nullable=True)
    grade = Column(String, nullable=True)
    error_message = Column(String, nullable=True)
