from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.errors import ApiError
from app.models import File, FileVersion, User
from app.schemas import VersionCreate
from app.security import get_current_user, require_role

router = APIRouter(tags=["versions"])


def _version_payload(version: FileVersion, creator: User, include_content: bool = False) -> dict:
    result = {
        "id": str(version.id),
        "fileId": str(version.file_id),
        "versionNumber": version.version_number,
        "label": version.label,
        "createdBy": {"id": str(creator.id), "name": creator.name},
        "createdAt": version.created_at,
    }
    if include_content:
        result["content"] = version.content
    return result


@router.get("/files/{file_id}/versions")
def list_versions(
    file_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[dict]:
    file = db.get(File, file_id)
    if file is None:
        raise ApiError(404, "Not Found")
    require_role(db, user.id, file.project_id, "viewer")
    rows = db.execute(
        select(FileVersion, User)
        .join(User, User.id == FileVersion.created_by)
        .where(FileVersion.file_id == file_id)
        .order_by(FileVersion.version_number.desc())
    ).all()
    return [_version_payload(version, creator) for version, creator in rows]


@router.post("/files/{file_id}/versions", status_code=201)
def create_version(
    file_id: UUID,
    payload: VersionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    file = db.scalar(select(File).where(File.id == file_id).with_for_update())
    if file is None:
        raise ApiError(404, "Not Found")
    require_role(db, user.id, file.project_id, "editor")
    if len(payload.content.encode("utf-8")) > get_settings().max_code_bytes:
        raise ApiError(400, "Code exceeds the maximum size")
    number = db.scalar(select(func.coalesce(func.max(FileVersion.version_number), 0)).where(FileVersion.file_id == file_id)) + 1
    version = FileVersion(
        file_id=file_id,
        version_number=number,
        label=payload.label,
        content=payload.content,
        created_by=user.id,
    )
    db.add(version)
    db.commit()
    db.refresh(version)
    return _version_payload(version, user)


@router.get("/versions/{version_id}")
def get_version(
    version_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    version = db.get(FileVersion, version_id)
    if version is None:
        raise ApiError(404, "Not Found")
    file = db.get(File, version.file_id)
    require_role(db, user.id, file.project_id, "viewer")
    creator = db.get(User, version.created_by)
    return _version_payload(version, creator, include_content=True)
