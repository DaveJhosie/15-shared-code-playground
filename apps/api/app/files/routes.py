from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.errors import ApiError
from app.models import File, User
from app.schemas import FileCreate, FilePatch
from app.security import get_current_user, require_role

router = APIRouter(tags=["files"])


def _check_code_size(content: str) -> None:
    if len(content.encode("utf-8")) > get_settings().max_code_bytes:
        raise ApiError(400, "Code exceeds the maximum size")


def _file_payload(file: File) -> dict:
    return {
        "id": str(file.id),
        "projectId": str(file.project_id),
        "name": file.name,
        "language": file.language,
        "content": file.content,
        "updatedAt": file.updated_at,
    }


@router.get("/projects/{project_id}/files")
def list_files(
    project_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[dict]:
    require_role(db, user.id, project_id, "viewer")
    files = db.scalars(select(File).where(File.project_id == project_id).order_by(File.name)).all()
    return [_file_payload(file) for file in files]


@router.post("/projects/{project_id}/files", status_code=201)
def create_file(
    project_id: UUID,
    payload: FileCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    require_role(db, user.id, project_id, "editor")
    _check_code_size(payload.content)
    if db.scalar(select(File.id).where(File.project_id == project_id, File.name == payload.name)) is not None:
        raise ApiError(409, "A file with that name already exists")
    file = File(project_id=project_id, name=payload.name, language=payload.language, content=payload.content)
    db.add(file)
    try:
        db.commit()
        db.refresh(file)
    except IntegrityError:
        db.rollback()
        raise ApiError(409, "A file with that name already exists") from None
    return _file_payload(file)


@router.get("/files/{file_id}")
def get_file(
    file_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    file = db.get(File, file_id)
    if file is None:
        raise ApiError(404, "Not Found")
    require_role(db, user.id, file.project_id, "viewer")
    return _file_payload(file)


@router.patch("/files/{file_id}")
def update_file(
    file_id: UUID,
    payload: FilePatch,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    file = db.get(File, file_id)
    if file is None:
        raise ApiError(404, "Not Found")
    require_role(db, user.id, file.project_id, "editor")
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise ApiError(400, "At least one field is required")
    if "name" in updates and db.scalar(
        select(File.id).where(
            File.project_id == file.project_id,
            File.name == updates["name"],
            File.id != file.id,
        )
    ):
        raise ApiError(409, "A file with that name already exists")
    for key, value in updates.items():
        setattr(file, key, value)
    try:
        db.commit()
        db.refresh(file)
    except IntegrityError:
        db.rollback()
        raise ApiError(409, "A file with that name already exists") from None
    return _file_payload(file)


@router.delete("/files/{file_id}")
def delete_file(
    file_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    file = db.get(File, file_id)
    if file is None:
        raise ApiError(404, "Not Found")
    require_role(db, user.id, file.project_id, "editor")
    db.delete(file)
    db.commit()
    return {"ok": True}
