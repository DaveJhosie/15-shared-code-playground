from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.database import check_database

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
def health() -> dict:
    return {"status": "ok"}


@router.get("/db", response_model=None)
def database_health() -> dict | JSONResponse:
    if check_database():
        return {"status": "ok"}
    return JSONResponse(status_code=503, content={"status": "database_unavailable"})
