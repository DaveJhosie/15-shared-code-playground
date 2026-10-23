from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.errors import ApiError
from app.models import Project, ProjectMember, User
from app.schemas import MemberCreate, MemberRolePatch
from app.security import get_current_user, require_role

router = APIRouter(prefix="/projects/{project_id}/members", tags=["members"])


@router.get("")
def list_members(
    project_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[dict]:
    require_role(db, user.id, project_id, "viewer")
    rows = db.execute(
        select(ProjectMember, User).join(User, User.id == ProjectMember.user_id)
        .where(ProjectMember.project_id == project_id)
    ).all()
    return [
        {"userId": str(member.user_id), "name": member_user.name, "email": member_user.email, "role": member.role}
        for member, member_user in rows
    ]


@router.post("", status_code=201)
def add_member(
    project_id: UUID,
    payload: MemberCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    require_role(db, user.id, project_id, "owner")
    new_user = db.scalar(select(User).where(User.email == str(payload.email).lower()))
    if new_user is None:
        raise ApiError(404, "No user with that email")
    if db.get(ProjectMember, (project_id, new_user.id)) is not None:
        raise ApiError(409, "Already a member")
    db.add(ProjectMember(project_id=project_id, user_id=new_user.id, role=payload.role))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ApiError(409, "Already a member") from None
    return {"userId": str(new_user.id), "name": new_user.name, "email": new_user.email, "role": payload.role}


@router.patch("/{member_user_id}")
def change_member_role(
    project_id: UUID,
    member_user_id: UUID,
    payload: MemberRolePatch,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    require_role(db, user.id, project_id, "owner")
    project = db.get(Project, project_id)
    membership = db.get(ProjectMember, (project_id, member_user_id))
    if project is None or membership is None:
        raise ApiError(404, "Not Found")
    if member_user_id == project.owner_id or membership.role == "owner":
        raise ApiError(400, "The owner cannot be changed or removed")
    membership.role = payload.role
    db.commit()
    member_user = db.get(User, member_user_id)
    return {"userId": str(member_user.id), "name": member_user.name, "email": member_user.email, "role": membership.role}


@router.delete("/{member_user_id}")
def remove_member(
    project_id: UUID,
    member_user_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    membership = db.get(ProjectMember, (project_id, member_user_id))
    project = db.get(Project, project_id)
    if membership is None or project is None:
        raise ApiError(404, "Not Found")
    if user.id != member_user_id:
        require_role(db, user.id, project_id, "owner")
    if member_user_id == project.owner_id or membership.role == "owner":
        raise ApiError(400, "The owner cannot be changed or removed")
    db.delete(membership)
    db.commit()
    return {"ok": True}
