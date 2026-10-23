from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from starlette.exceptions import HTTPException as StarletteHTTPException


class ApiError(Exception):
    def __init__(self, status_code: int, message: str, error: str | None = None):
        self.status_code = status_code
        self.message = message
        self.error = error or {
            400: "Bad Request",
            401: "Unauthorized",
            403: "Forbidden",
            404: "Not Found",
            409: "Conflict",
            429: "Too Many Requests",
        }.get(status_code, "Error")


async def api_error_handler(_: Request, exc: ApiError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"statusCode": exc.status_code, "message": exc.message, "error": exc.error},
    )


async def validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    errors = exc.errors()
    message = "Invalid request"
    if errors:
        location = ".".join(str(part) for part in errors[0].get("loc", ()) if part != "body")
        message = f"Invalid {location}" if location else "Invalid request"
    return JSONResponse(
        status_code=400,
        content={"statusCode": 400, "message": message, "error": "Bad Request"},
    )


async def http_error_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
    detail = exc.detail if isinstance(exc.detail, str) else "Request failed"
    error = {
        401: "Unauthorized",
        403: "Forbidden",
        404: "Not Found",
        405: "Method Not Allowed",
    }.get(exc.status_code, "Error")
    return JSONResponse(
        status_code=exc.status_code,
        content={"statusCode": exc.status_code, "message": detail, "error": error},
        headers=exc.headers,
    )


async def integrity_error_handler(_: Request, __: IntegrityError) -> JSONResponse:
    return JSONResponse(
        status_code=409,
        content={"statusCode": 409, "message": "Resource already exists", "error": "Conflict"},
    )
