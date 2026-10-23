import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError

from app.auth.routes import router as auth_router
from app.config import get_settings
from app.database import check_database
from app.errors import ApiError, api_error_handler, http_error_handler, integrity_error_handler, validation_error_handler
from app.files.routes import router as files_router
from app.health.routes import router as health_router
from app.members.routes import router as members_router
from app.projects.routes import router as projects_router
from app.run.routes import router as run_router
from app.versions.routes import router as versions_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("api.requests")


@asynccontextmanager
async def lifespan(_: FastAPI):
    check_database()
    yield


app = FastAPI(
    title="Shared Code Playground API",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def request_logging(request: Request, call_next):
    started = time.monotonic()
    status_code = 500
    try:
        response = await call_next(request)
        status_code = response.status_code
        return response
    finally:
        duration_ms = int((time.monotonic() - started) * 1000)
        logger.info("%s %s %s %dms", request.method, request.url.path, status_code, duration_ms)


app.add_exception_handler(ApiError, api_error_handler)
app.add_exception_handler(404, http_error_handler)
app.add_exception_handler(405, http_error_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)
app.add_exception_handler(IntegrityError, integrity_error_handler)

for router in (
    health_router,
    auth_router,
    projects_router,
    members_router,
    files_router,
    versions_router,
    run_router,
):
    app.include_router(router, prefix="/api")
