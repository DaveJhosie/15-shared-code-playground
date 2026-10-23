from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.errors import ApiError
from app.models import File, Project, ProjectMember, User
from app.schemas import ProjectCreate, ProjectPatch
from app.security import get_current_user, require_role

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("", status_code=201)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    project = Project(name=payload.name, description=payload.description, owner_id=user.id)
    db.add(project)
    db.flush()
    db.add(ProjectMember(project_id=project.id, user_id=user.id, role="owner"))
    db.commit()
    db.refresh(project)
    return {
        "id": str(project.id),
        "name": project.name,
        "description": project.description,
        "role": "owner",
        "createdAt": project.created_at,
    }


@router.get("")
def list_projects(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> list[dict]:
    rows = db.execute(
        select(Project, ProjectMember.role)
        .join(ProjectMember, ProjectMember.project_id == Project.id)
        .where(ProjectMember.user_id == user.id)
        .order_by(Project.created_at.desc())
    ).all()
    result = []
    for project, role in rows:
        count = db.scalar(select(func.count()).select_from(ProjectMember).where(ProjectMember.project_id == project.id))
        result.append(
            {
                "id": str(project.id),
                "name": project.name,
                "description": project.description,
                "role": role,
                "memberCount": count or 0,
                "createdAt": project.created_at,
            }
        )
    return result


@router.get("/{project_id}")
def get_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    require_role(db, user.id, project_id, "viewer")
    project = db.get(Project, project_id)
    if project is None:
        raise ApiError(404, "Not Found")
    members = db.execute(
        select(ProjectMember, User).join(User, User.id == ProjectMember.user_id)
        .where(ProjectMember.project_id == project_id)
    ).all()
    files = db.scalars(select(File).where(File.project_id == project_id).order_by(File.name)).all()
    return {
        "id": str(project.id),
        "name": project.name,
        "description": project.description,
        "ownerId": str(project.owner_id),
        "role": require_role(db, user.id, project_id, "viewer"),
        "members": [
            {"userId": str(member.user_id), "name": member_user.name, "email": member_user.email, "role": member.role}
            for member, member_user in members
        ],
        "files": [
            {"id": str(file.id), "name": file.name, "language": file.language, "updatedAt": file.updated_at}
            for file in files
        ],
    }


@router.patch("/{project_id}")
def update_project(
    project_id: UUID,
    payload: ProjectPatch,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    require_role(db, user.id, project_id, "owner")
    project = db.get(Project, project_id)
    if project is None:
        raise ApiError(404, "Not Found")
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise ApiError(400, "At least one field is required")
    for key, value in updates.items():
        setattr(project, key, value)
    db.commit()
    db.refresh(project)
    return {
        "id": str(project.id),
        "name": project.name,
        "description": project.description,
        "ownerId": str(project.owner_id),
        "updatedAt": project.updated_at,
    }


@router.delete("/{project_id}")
def delete_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    require_role(db, user.id, project_id, "owner")
    project = db.get(Project, project_id)
    if project is None:
        raise ApiError(404, "Not Found")
    db.delete(project)
    db.commit()
    return {"ok": True}
