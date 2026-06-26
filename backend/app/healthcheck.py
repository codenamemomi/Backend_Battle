import asyncio
import logging
import os
from typing import Optional

import httpx

logger = logging.getLogger(__name__)


def get_healthcheck_interval_seconds() -> int:
    raw_value = os.getenv("HEALTHCHECK_INTERVAL_MINUTES", "13")
    try:
        minutes = int(raw_value)
    except ValueError:
        minutes = 13
    return max(1, minutes * 60)


def get_healthcheck_url() -> str:
    configured_url = os.getenv("HEALTHCHECK_URL")
    if configured_url:
        return configured_url

    host = os.getenv("HEALTHCHECK_HOST", "127.0.0.1")
    port = os.getenv("HEALTHCHECK_PORT", os.getenv("PORT", "8000"))
    return f"http://{host}:{port}/health"


async def ping_service(url: Optional[str] = None) -> bool:
    target_url = url or get_healthcheck_url()
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(target_url)
            response.raise_for_status()
        logger.info("Health check succeeded for %s", target_url)
        return True
    except Exception as exc:
        logger.warning("Health check failed for %s: %s", target_url, exc)
        return False


async def run_periodic_healthcheck(interval_seconds: Optional[int] = None) -> None:
    seconds = interval_seconds or get_healthcheck_interval_seconds()
    while True:
        await ping_service()
        await asyncio.sleep(seconds)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    print(f"Health checks will run every {get_healthcheck_interval_seconds() // 60} minute(s) against {get_healthcheck_url()}")
    asyncio.run(run_periodic_healthcheck())
