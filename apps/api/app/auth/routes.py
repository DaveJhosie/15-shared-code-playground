from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.errors import ApiError
from app.models import User
from app.schemas import LoginRequest, RegisterRequest
from app.security import create_access_token, get_current_user, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def user_response(user: User) -> dict:
    return {"id": str(user.id), "name": user.name, "email": user.email}


@router.post("/register", status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> dict:
    email = str(payload.email).lower()
    if db.scalar(select(User.id).where(User.email == email)) is not None:
        raise ApiError(409, "Email already registered")
    user = User(name=payload.name, email=email, password_hash=hash_password(payload.password))
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise ApiError(409, "Email already registered") from None
    return {"user": user_response(user), "accessToken": create_access_token(user)}


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> dict:
    user = db.scalar(select(User).where(User.email == str(payload.email).lower()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise ApiError(401, "Invalid email or password")
    return {"user": user_response(user), "accessToken": create_access_token(user)}


@router.get("/me")
def me(user: User = Depends(get_current_user)) -> dict:
    return user_response(user)
