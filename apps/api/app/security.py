from datetime import datetime, timedelta, timezone
from uuid import UUID

import bcrypt
import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.errors import ApiError
from app.models import ProjectMember, User

bearer = HTTPBearer(auto_error=False)
ROLE_LEVEL = {"viewer": 0, "editor": 1, "owner": 2}


def _expiration_delta(value: str) -> timedelta:
    unit = value[-1].lower()
    amount = int(value[:-1]) if unit in {"d", "h", "m", "s"} else int(value)
    return {
        "d": timedelta(days=amount),
        "h": timedelta(hours=amount),
        "m": timedelta(minutes=amount),
        "s": timedelta(seconds=amount),
    }.get(unit, timedelta(seconds=amount))


def create_access_token(user: User) -> str:
    settings = get_settings()
    expires_at = datetime.now(timezone.utc) + _expiration_delta(settings.jwt_expires_in)
    return jwt.encode(
        {"sub": str(user.id), "email": user.email, "exp": expires_at},
        settings.jwt_secret,
        algorithm="HS256",
    )


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=10)).decode()


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), password_hash.encode())
    except ValueError:
        return False


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise ApiError(401, "Unauthorized")
    try:
        payload = jwt.decode(credentials.credentials, get_settings().jwt_secret, algorithms=["HS256"])
        user_id = UUID(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, ValueError, TypeError):
        raise ApiError(401, "Unauthorized") from None
    user = db.get(User, user_id)
    if user is None:
        raise ApiError(401, "Unauthorized")
    return user


def require_role(db: Session, user_id: UUID, project_id: UUID, min_role: str) -> str:
    membership = db.scalar(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
    )
    if membership is None:
        raise ApiError(404, "Not Found")
    if ROLE_LEVEL[membership.role] < ROLE_LEVEL[min_role]:
        raise ApiError(403, "You do not have permission to do that.")
    return membership.role
