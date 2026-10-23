import os
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://user:password@127.0.0.1/playground")
os.environ.setdefault("JWT_SECRET", "test-secret-not-for-production-32-characters")

from app.config import get_settings
from app.database import get_db
from app.main import app
from app.models import Base

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "sqlite+pysqlite:///:memory:")


@pytest.fixture(scope="session")
def test_engine():
    is_memory_sqlite = TEST_DATABASE_URL.endswith(":memory:")
    if not is_memory_sqlite and "test" not in TEST_DATABASE_URL.rsplit("/", 1)[-1].lower():
        pytest.fail("TEST_DATABASE_URL must name a disposable database containing 'test'")
    if TEST_DATABASE_URL == get_settings().database_url:
        pytest.fail("TEST_DATABASE_URL must differ from DATABASE_URL")
    options = {"pool_pre_ping": True}
    if is_memory_sqlite:
        options.update(
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
    engine = create_engine(TEST_DATABASE_URL, **options)
    if engine.dialect.name == "sqlite":
        @event.listens_for(engine, "connect")
        def configure_sqlite(connection, _):
            connection.create_function("gen_random_uuid", 0, lambda: str(uuid.uuid4()))
            connection.execute("PRAGMA foreign_keys=ON")
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def reset_test_database(test_engine):
    Base.metadata.drop_all(test_engine)
    Base.metadata.create_all(test_engine)
    return test_engine


@pytest.fixture
def client(reset_test_database, monkeypatch):
    TestingSession = sessionmaker(bind=reset_test_database, autoflush=False, expire_on_commit=False)

    @event.listens_for(TestingSession, "before_flush")
    def assign_sqlite_ids(session, _, __):
        if reset_test_database.dialect.name == "sqlite":
            for entity in session.new:
                if hasattr(entity, "id") and entity.id is None:
                    entity.id = uuid.uuid4()

    def override_get_db():
        with TestingSession() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    monkeypatch.setattr("app.main.check_database", lambda: True)
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def reset_run_rate_limit():
    from app.run.routes import _last_run

    _last_run.clear()
