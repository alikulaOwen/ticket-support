# Mini Ticket Tracker

A small support-ticket app: a Rust/Axum REST API on PostgreSQL, and a React (Vite) page to list, create, and update tickets.

## Prerequisites

- Rust (stable, edition 2024)
- Node.js 20+ and Yarn
- [Podman](https://podman.io/) (or Docker Compose) for PostgreSQL

## Setup and run

### 1. Database

From the repo root:

```bash
podman compose up -d
```

Defaults (overridable via a `.env` next to `docker-compose.yml`, see `.env.example`):

| Variable | Default |
|---|---|
| `POSTGRES_USER` | `ticket` |
| `POSTGRES_PASSWORD` | `ticket` |
| `POSTGRES_DB` | `ticket_support` |
| port | `5432` |

If you use Docker instead of Podman, `docker compose up -d` is the same file.

### 2. Backend

```bash
cd backend
cp ../.env.example .env   # or keep the existing DATABASE_URL
# DATABASE_URL=postgres://ticket:ticket@localhost:5432/ticket_support
cargo run
```

The API listens on `http://localhost:3000`. Schema is applied on startup (`sqlx::migrate!()`).

| Method | Path | Notes |
|---|---|---|
| `POST` | `/tickets` | create (title required, status starts as `open`) |
| `GET` | `/tickets` | list; `?status=`, `?page=`, `?limit=` |
| `GET` | `/tickets/:id` | one ticket |
| `PATCH` | `/tickets/:id` | update `status` and/or `priority` |
| `GET` | `/tickets/stats` | counts grouped by status (zeros included) |

Enums are snake_case: `open` / `in_progress` / `closed`, `low` / `medium` / `high`.

### 3. Frontend

```bash
cd frontend
yarn
yarn dev
```

Open `http://localhost:5173`. The client talks to `http://localhost:3000` unless you set `VITE_API_URL` in `frontend/.env`.

## Tests

Three integration tests live in `backend/tests/api_test.rs`. They use `#[sqlx::test]`, which creates a throwaway database per test from `DATABASE_URL` and runs migrations there (your dev data is left alone).

```bash
cd backend
cargo test
```

- `create_ticket_validates_and_defaults` — blank title is 400; a valid create is 201 with `open` / `medium`
- `patch_updates_status_and_rejects_empty_body` — empty PATCH is 400; status updates keep priority; missing id is 404
- `list_filters_and_stats_include_zero_counts` — filter + pagination; stats include a `0` for unused statuses; invalid `status` is 400

Postgres must be running for these tests.

## Decisions & Tradeoffs

I kept the surface area to the brief: one page, the four required endpoints, plus `GET /tickets/:id` because the UI needed a round-trip after create. PATCH only updates status and priority — title and description stay immutable so I did not invent a field the spec did not ask for. The list returns `{ items, total, page, limit }` instead of a bare array so the pager does not have to guess; with more time I would add a stable cursor instead of offset pagination. After create or update the UI refetches list and stats via a `refreshKey` rather than patching local cache, which is simpler and hard to get wrong at this size. CORS allows any origin so Vite on `:5173` can call `:3000` without a proxy; that would be locked down in a real deploy. Tests use `#[sqlx::test]` isolated databases instead of truncating the shared `ticket_support` DB, so `cargo test` can run in parallel. The form is a native `<dialog>` used for both create and edit; I skipped a component library because the brief is not scoring polish. Auth, request logging, and graceful shutdown were left out — I would add tracing and a dedicated test compose service next.
