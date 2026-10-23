import asyncio
import logging
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from urllib.parse import parse_qs
from uuid import UUID

import jwt
from pycrdt import Doc, Text
from pycrdt.websocket import ASGIServer, WebsocketServer
from pycrdt.websocket.yroom import YRoom
from sqlalchemy import select
from starlette.types import ASGIApp, Receive, Scope, Send

from app.config import get_settings
from app.database import SessionLocal
from app.models import File, ProjectMember

logger = logging.getLogger(__name__)


@dataclass
class DocumentState:
    doc: Doc
    text: Text
    file_id: UUID
    revision: int = 0
    last_changed: float = 0
    first_changed: float = 0
    save_task: asyncio.Task | None = None


def _load_access(token: str, file_id: UUID) -> tuple[File, str] | None:
    try:
        payload = jwt.decode(token, get_settings().jwt_secret, algorithms=["HS256"])
        user_id = UUID(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, TypeError, ValueError):
        return None
    with SessionLocal() as db:
        file = db.get(File, file_id)
        if file is None:
            return None
        role = db.scalar(
            select(ProjectMember.role).where(
                ProjectMember.project_id == file.project_id,
                ProjectMember.user_id == user_id,
            )
        )
        if role is None:
            return None
        return file, role


def _persist_file(file_id: UUID, content: str, state: bytes) -> None:
    with SessionLocal() as db:
        file = db.get(File, file_id)
        if file is None:
            logger.error("Cannot persist realtime document for missing file %s", file_id)
            return
        file.content = content
        file.yjs_state = state
        file.updated_at = datetime.now(timezone.utc)
        db.commit()


def _read_varuint(data: bytes, offset: int) -> tuple[int, int] | None:
    value = 0
    shift = 0
    while offset < len(data) and shift < 35:
        byte = data[offset]
        offset += 1
        value |= (byte & 0x7F) << shift
        if byte < 0x80:
            return value, offset
        shift += 7
    return None


def _is_read_only_sync_write(message: bytes) -> bool:
    message_type = _read_varuint(message, 0)
    if message_type is None or message_type[0] != 0:
        return False
    subtype = _read_varuint(message, message_type[1])
    return subtype is not None and subtype[0] in {1, 2}


class RealtimeApplication:
    def __init__(self) -> None:
        self.websocket_server = WebsocketServer(auto_clean_rooms=False)
        self.protocol_app = ASGIServer(self.websocket_server)
        self.documents: dict[str, DocumentState] = {}
        self.room_lock = asyncio.Lock()
        self.server_task: asyncio.Task | None = None
        self.allowed_origins = set(get_settings().allowed_origins)

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "lifespan":
            await self._lifespan(receive, send)
        elif scope["type"] == "websocket":
            await self._websocket(scope, receive, send)
        elif scope["type"] == "http":
            await send({"type": "http.response.start", "status": 404, "headers": []})
            await send({"type": "http.response.body", "body": b"Not Found"})

    async def _lifespan(self, receive: Receive, send: Send) -> None:
        while True:
            message = await receive()
            if message["type"] == "lifespan.startup":
                self.server_task = asyncio.create_task(self.websocket_server.start())
                await self.websocket_server.started.wait()
                await send({"type": "lifespan.startup.complete"})
            elif message["type"] == "lifespan.shutdown":
                await self.websocket_server.stop()
                if self.server_task is not None:
                    await self.server_task
                for state in self.documents.values():
                    while state.save_task is not None:
                        state.last_changed = 0
                        await state.save_task
                await send({"type": "lifespan.shutdown.complete"})
                return

    async def _websocket(self, scope: Scope, receive: Receive, send: Send) -> None:
        origin = next((value.decode() for key, value in scope.get("headers", []) if key.lower() == b"origin"), None)
        if origin is not None and origin not in self.allowed_origins:
            await send({"type": "websocket.close", "code": 4403})
            return

        room_name = scope.get("path", "")
        document_name = room_name.lstrip("/")
        if not document_name.startswith("file:"):
            await send({"type": "websocket.close", "code": 4404})
            return
        try:
            file_id = UUID(document_name.removeprefix("file:"))
        except ValueError:
            await send({"type": "websocket.close", "code": 4404})
            return

        headers = dict(scope.get("headers", []))
        authorization = headers.get(b"authorization", b"").decode("latin-1")
        token = authorization.removeprefix("Bearer ").strip()
        if not token:
            query = parse_qs(scope.get("query_string", b"").decode("latin-1"))
            token = query.get("token", [""])[0]
        if not token:
            await send({"type": "websocket.close", "code": 4401})
            return
        try:
            access = await asyncio.to_thread(_load_access, token, file_id)
        except Exception as exc:
            logger.error("Realtime authorization database lookup failed (%s)", type(exc).__name__)
            await send({"type": "websocket.close", "code": 1011})
            return
        if access is None:
            await send({"type": "websocket.close", "code": 4404})
            return
        file, role = access

        try:
            await self._ensure_room(room_name, file)
        except Exception as exc:
            logger.error("Realtime document initialization failed (%s)", type(exc).__name__)
            await send({"type": "websocket.close", "code": 1011})
            return

        if role == "viewer":
            async def receive_read_only() -> dict:
                while True:
                    event = await receive()
                    if event["type"] == "websocket.receive":
                        data = event.get("bytes")
                        if data is None:
                            data = event.get("text", "").encode()
                        if _is_read_only_sync_write(data):
                            continue
                    return event

            await self.protocol_app(scope, receive_read_only, send)
        else:
            await self.protocol_app(scope, receive, send)

    async def _ensure_room(self, room_name: str, file: File) -> None:
        async with self.room_lock:
            if room_name in self.documents:
                return
            doc = Doc()
            if file.yjs_state:
                doc.apply_update(file.yjs_state)
            else:
                doc["content"] = Text(file.content)
            text = doc.get("content", type=Text)
            state = DocumentState(doc=doc, text=text, file_id=file.id)
            doc.observe(lambda _: self._mark_dirty(room_name))
            self.documents[room_name] = state
            self.websocket_server.rooms[room_name] = YRoom(ydoc=doc)

    def _mark_dirty(self, room_name: str) -> None:
        state = self.documents[room_name]
        now = time.monotonic()
        state.revision += 1
        state.last_changed = now
        if state.first_changed == 0:
            state.first_changed = now
        if state.save_task is None or state.save_task.done():
            state.save_task = asyncio.create_task(self._save_after_edits(room_name, state))

    async def _save_after_edits(self, room_name: str, state: DocumentState) -> None:
        try:
            while True:
                now = time.monotonic()
                quiet_for = now - state.last_changed
                changed_for = now - state.first_changed
                if quiet_for >= 2 or changed_for >= 10:
                    revision = state.revision
                    content = str(state.text)
                    yjs_state = state.doc.get_update()
                    await asyncio.to_thread(_persist_file, state.file_id, content, yjs_state)
                    if revision == state.revision:
                        state.first_changed = 0
                        return
                    continue
                await asyncio.sleep(min(0.2, 2 - quiet_for, 10 - changed_for))
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            logger.error("Realtime persistence failed for file %s (%s)", state.file_id, type(exc).__name__)
            state.first_changed = 0
            state.last_changed = 0
        finally:
            state.save_task = None
            if state.first_changed and state.revision:
                state.save_task = asyncio.create_task(self._save_after_edits(room_name, state))


app: ASGIApp = RealtimeApplication()
