import os
import ssl
from celery import Celery
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Upstash (and any rediss:// URL) requires SSL/TLS.
# Celery needs broker_use_ssl set so the connection goes through TLS.
IS_TLS = REDIS_URL.startswith("rediss://")

celery_app = Celery(
    "backend_battle_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL,
)

base_conf = dict(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # Upstash free tier closes idle connections quickly;
    # heartbeat keeps the connection alive.
    broker_heartbeat=10,
    broker_connection_retry_on_startup=True,
)

if IS_TLS:
    # Skip hostname verification — Upstash certificates are valid,
    # but the SNI host in the URL may differ from the cert CN on some plans.
    ssl_opts = {
        "ssl_cert_reqs": ssl.CERT_NONE,
    }
    base_conf["broker_use_ssl"] = ssl_opts
    base_conf["redis_backend_use_ssl"] = ssl_opts

celery_app.conf.update(**base_conf)


@celery_app.task(name="run_benchmark_task")
def run_benchmark_task(result_id: str, submission_dict: dict, config_dict: dict):
    import asyncio
    from app.services.benchmark import run_benchmark
    from app.models.schemas import APISubmission, BenchmarkConfig

    submission = APISubmission(**submission_dict)
    config = BenchmarkConfig(**config_dict)

    asyncio.run(run_benchmark(result_id, submission, config))
