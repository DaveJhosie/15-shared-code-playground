import asyncio
import logging
import time
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.errors import ApiError
from app.models import File, User
from app.schemas import RunRequest
from app.security import get_current_user, require_role

logger = logging.getLogger(__name__)
router = APIRouter(tags=["run"])
_last_run: dict[UUID, float] = {}
_rate_lock = asyncio.Lock()


def _bounded(value: str, limit: int) -> tuple[str, bool]:
    return value[:limit], len(value) > limit


@router.post("/files/{file_id}/run")
async def run_file(
    file_id: UUID,
    payload: RunRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    file = db.get(File, file_id)
    if file is None:
        raise ApiError(404, "Not Found")
    require_role(db, user.id, file.project_id, "editor")
    settings = get_settings()
    if len(payload.code.encode("utf-8")) > settings.max_code_bytes:
        raise ApiError(400, "Code exceeds the maximum size")

    now = time.monotonic()
    async with _rate_lock:
        previous = _last_run.get(user.id)
        if previous is not None and now - previous < 2:
            raise ApiError(429, "Please wait a moment before running again.")
        _last_run[user.id] = now

    started = time.monotonic()
    status, stdout, stderr, exit_code = "success", "", "", 0
    if settings.execution_mode == "mock":
        if "__TIMEOUT__" in payload.code:
            status, stderr, exit_code = "timeout", "Execution timed out", 1
        elif "__DOWN__" in payload.code:
            status, stderr, exit_code = "unavailable", "Execution service unavailable", 1
        else:
            stdout = f"[mock] Ran {len(payload.code)} characters of {file.language}"
    elif settings.execution_mode == "piston":
        try:
            async with httpx.AsyncClient(timeout=(settings.run_timeout_ms + 3000) / 1000) as client:
                response = await client.post(
                    f"{settings.execution_api_url.rstrip('/')}/api/v2/execute",
                    json={
                        "language": file.language,
                        "version": "*",
                        "files": [{"content": payload.code}],
                        "stdin": payload.stdin,
                        "run_timeout": settings.run_timeout_ms,
                    },
                )
            if response.status_code >= 500:
                status, stderr, exit_code = "unavailable", "Execution service unavailable", 1
            elif response.is_error:
                status, stderr, exit_code = "error", "Execution failed", 1
            else:
                result = response.json().get("run", {})
                stdout = str(result.get("stdout") or "")
                stderr = str(result.get("stderr") or "")
                exit_code = result.get("code")
                if result.get("signal") == "SIGKILL":
                    status = "timeout"
                elif exit_code not in (0, None):
                    status = "error"
                elif result.get("signal"):
                    status = "error"
                if exit_code is None:
                    exit_code = 0 if status == "success" else 1
        except (httpx.TimeoutException, TimeoutError):
            status, stderr, exit_code = "timeout", "Execution timed out", 1
        except (httpx.RequestError, ValueError):
            logger.warning("Execution service request failed")
            status, stderr, exit_code = "unavailable", "Execution service unavailable", 1
    else:
        logger.error("Unsupported EXECUTION_MODE configuration")
        status, stderr, exit_code = "unavailable", "Execution service unavailable", 1

    stdout, stdout_cut = _bounded(stdout, settings.max_output_chars)
    stderr, stderr_cut = _bounded(stderr, settings.max_output_chars)
    return {
        "status": status,
        "stdout": stdout,
        "stderr": stderr,
        "exitCode": exit_code,
        "durationMs": int((time.monotonic() - started) * 1000),
        "truncated": stdout_cut or stderr_cut,
    }
