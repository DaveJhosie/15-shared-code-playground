import asyncio
from uuid import uuid4

import pytest
from pycrdt import Doc, Text
from starlette.testclient import TestClient, WebSocketDisconnect

from app.models import File
from app.realtime.server import RealtimeApplication, _is_read_only_sync_write


def test_read_only_filter_only_rejects_yjs_document_writes():
    assert _is_read_only_sync_write(b"\x00\x01")
    assert _is_read_only_sync_write(b"\x00\x02")
    assert not _is_read_only_sync_write(b"\x00\x00")
    assert not _is_read_only_sync_write(b"\x01")


def test_realtime_room_uses_content_shared_ytext_and_stored_state():
    realtime = RealtimeApplication()
    file_id = uuid4()
    file = File(id=file_id, content="seed")
    asyncio.run(realtime._ensure_room(f"/file:{file_id}", file))
    assert str(realtime.documents[f"/file:{file_id}"].doc.get("content", type=Text)) == "seed"

    saved_doc = Doc({"content": Text("saved state")})
    restored = File(id=uuid4(), content="old text", yjs_state=saved_doc.get_update())
    asyncio.run(realtime._ensure_room(f"/file:{restored.id}", restored))
    assert str(realtime.documents[f"/file:{restored.id}"].doc.get("content", type=Text)) == "saved state"


def test_realtime_rejects_missing_token_and_disallowed_origin():
    with TestClient(RealtimeApplication()) as client:
        with pytest.raises(WebSocketDisconnect) as missing_token:
            with client.websocket_connect(f"/file:{uuid4()}"):
                pass
        assert missing_token.value.code == 4401

        with pytest.raises(WebSocketDisconnect) as disallowed_origin:
            with client.websocket_connect(
                f"/file:{uuid4()}?token=unused",
                headers={"origin": "https://not-allowed.example"},
            ):
                pass
        assert disallowed_origin.value.code == 4403
