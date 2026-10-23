import queue
import threading
import time
import uuid

from pycrdt import Doc, Text, create_sync_message, create_update_message, handle_sync_message
from sqlalchemy.orm import sessionmaker
from starlette.testclient import TestClient

from app.models import File, Project, ProjectMember, User
from app.security import create_access_token


def _receive(websocket, timeout=5):
    messages = queue.Queue()
    threading.Thread(target=lambda: messages.put(websocket.receive_bytes()), daemon=True).start()
    try:
        return messages.get(timeout=timeout)
    except queue.Empty:
        raise AssertionError("Timed out waiting for a realtime update") from None


def _sync_document(websocket, doc):
    server_step = _receive(websocket)
    reply = handle_sync_message(server_step[1:], doc)
    if reply:
        websocket.send_bytes(reply)
    websocket.send_bytes(create_sync_message(doc))
    for _ in range(5):
        message = _receive(websocket)
        if message[0] == 0:
            reply = handle_sync_message(message[1:], doc)
            if reply:
                websocket.send_bytes(reply)
            try:
                return doc.get("content", type=Text)
            except KeyError:
                pass
    raise AssertionError("Yjs document did not synchronize")


def test_two_editors_sync_and_reconnect_and_viewer_cannot_edit(reset_test_database, monkeypatch):
    from app.realtime.server import RealtimeApplication

    TestingSession = sessionmaker(bind=reset_test_database, autoflush=False, expire_on_commit=False)
    owner = User(id=uuid.uuid4(), name="Owner", email="owner@example.com", password_hash="unused")
    viewer = User(id=uuid.uuid4(), name="Viewer", email="viewer@example.com", password_hash="unused")
    project = Project(id=uuid.uuid4(), name="Collaboration", owner_id=owner.id)
    file = File(
        id=uuid.uuid4(),
        project_id=project.id,
        name="main.py",
        language="python",
        content="seed",
    )
    with TestingSession() as db:
        db.add_all([owner, viewer])
        db.flush()
        db.add(project)
        db.flush()
        db.add(file)
        db.flush()
        db.add_all(
            [
                ProjectMember(project_id=project.id, user_id=owner.id, role="owner"),
                ProjectMember(project_id=project.id, user_id=viewer.id, role="viewer"),
            ]
        )
        db.commit()

    monkeypatch.setattr("app.realtime.server.SessionLocal", TestingSession)
    owner_token = create_access_token(owner)
    viewer_token = create_access_token(viewer)
    room = f"/file:{file.id}"

    realtime = RealtimeApplication()
    with TestClient(realtime) as websocket_client:
        with (
            websocket_client.websocket_connect(f"{room}?token={owner_token}") as owner_socket,
            websocket_client.websocket_connect(f"{room}?token={owner_token}") as second_socket,
        ):
            owner_doc = Doc({"content": Text("")})
            second_doc = Doc({"content": Text("")})
            owner_text = _sync_document(owner_socket, owner_doc)
            second_text = _sync_document(second_socket, second_doc)
            assert str(owner_text) == str(second_text) == "seed"

            owner_text.insert(len(owner_text), " shared")
            owner_socket.send_bytes(create_update_message(owner_doc.get_update()))
            for _ in range(5):
                update = _receive(second_socket)
                if update[0] == 0:
                    handle_sync_message(update[1:], second_doc)
                    if str(second_doc.get("content", type=Text)) == "seed shared":
                        break
            assert str(second_doc.get("content", type=Text)) == "seed shared"

            time.sleep(2.2)
            with TestingSession() as db:
                assert db.get(File, file.id).content == "seed shared"

    restarted = RealtimeApplication()
    with TestClient(restarted) as websocket_client:
        with websocket_client.websocket_connect(f"{room}?token={owner_token}") as owner_socket:
            reconnected = _sync_document(owner_socket, Doc({"content": Text("")}))
            assert str(reconnected) == "seed shared"
        with websocket_client.websocket_connect(f"{room}?token={viewer_token}") as viewer_socket:
            viewer_doc = Doc({"content": Text("")})
            viewer_text = _sync_document(viewer_socket, viewer_doc)
            viewer_text.insert(len(viewer_text), " forbidden")
            viewer_socket.send_bytes(create_update_message(viewer_doc.get_update()))
            time.sleep(2.2)
            with TestingSession() as db:
                assert db.get(File, file.id).content == "seed shared"
