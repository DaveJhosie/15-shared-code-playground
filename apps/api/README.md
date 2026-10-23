# Shared Code Playground API

Python 3.11+ FastAPI REST API and a Python Yjs-compatible WebSocket service. The existing PostgreSQL schema is mapped as-is; the API does not create or alter production tables.

## Install

From the repository root:

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env` and set the real remote `DATABASE_URL`, a private random `JWT_SECRET`, and the frontend's comma-separated `CORS_ORIGINS`. Do not commit `.env`. The connection string should use `postgresql+psycopg://...`; do not use a localhost address for the database on machine C.

Example values for the three-machine setup:

```dotenv
DATABASE_URL=postgresql+psycopg://playground_user:YOUR_PASSWORD@192.168.1.30:5432/playground
JWT_SECRET=replace-with-a-long-random-secret
CORS_ORIGINS=http://192.168.1.10:3000,http://localhost:3000
EXECUTION_MODE=mock
REALTIME_PORT=4001
```

## Remote PostgreSQL

On machine C, configure PostgreSQL to listen on the LAN interface and allow machine B only. Add the following to `postgresql.conf` and `pg_hba.conf`, respectively:

```conf
listen_addresses = '*'
```

```conf
host playground playground_user 192.168.1.20/32 scram-sha-256
```

Then restart the service and allow port 5432 from machine B only:

```bash
sudo systemctl restart postgresql
sudo ufw allow from 192.168.1.20 to any port 5432 proto tcp
```

On machine B, test network reachability before checking PostgreSQL authentication:

```bash
nc -zv 192.168.1.30 5432
```

If the port is reachable but the API cannot connect, check `pg_hba.conf`, then the database firewall rule. Open the API ports to machine A:

```bash
sudo ufw allow from 192.168.1.10 to any port 4000 proto tcp
sudo ufw allow from 192.168.1.10 to any port 4001 proto tcp
```

Verify table names and columns (this command connects only; it does not change schema):

```bash
python scripts/check_db.py
```

At startup, the REST service runs `SELECT 1`. If PostgreSQL is unavailable, it logs the remote hostname and port and remains available: `/api/health` returns `{"status":"ok"}`, while `/api/health/db` returns HTTP 503 and `{"status":"database_unavailable"}`.

## Start

Run both services and stop them together with Ctrl+C:

```bash
python scripts/run_all.py
```

Or run REST alone:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 4000 --reload
```

REST routes use `/api`; interactive OpenAPI docs are at `http://192.168.1.20:4000/api/docs`. The bearer-token security scheme is included in the docs. The WebSocket service listens on port 4001 and uses the room name `file:{fileId}`.

WebSocket clients authenticate with `Authorization: Bearer <accessToken>` or a `token` query parameter (needed by browser providers that cannot set headers). WebSocket origins must be listed in `CORS_ORIGINS`. Viewers receive document updates but their Yjs document writes are ignored.

The realtime integration test uses two `pycrdt` clients to verify synchronization, persistence after reconnect, and viewer read-only behavior. Before release, also validate with the actual frontend provider in two browser windows; the frontend application/provider is not included in this workspace.

When using Piston, set `EXECUTION_MODE=piston` and point `EXECUTION_API_URL` to the Piston host reachable from machine B. User code is never executed inside FastAPI.

## Tests

Tests never use the demo database. By default, the integration tests use a disposable in-memory SQLite database. To run them against PostgreSQL, create a disposable database whose name includes `test`, set `TEST_DATABASE_URL` to it, then run:

```bash
export TEST_DATABASE_URL=postgresql+psycopg://playground_user:YOUR_PASSWORD@127.0.0.1:5432/playground_test
pytest
```

The integration fixture creates and drops only the tables in that explicitly named disposable test database. With the default in-memory SQLite database, no data is persisted beyond the test process.
