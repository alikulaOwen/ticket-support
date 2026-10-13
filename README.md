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


| Variable            | Default          |
| ------------------- | ---------------- |
| `POSTGRES_USER`     | `ticket`         |
| `POSTGRES_PASSWORD` | `ticket`         |
| `POSTGRES_DB`       | `ticket_support` |
| port                | `5432`           |


If you use Docker instead of Podman, `docker compose up -d` is the same file.

### 2. Backend

```bash
cd backend
cp ../.env.example .env   # or keep the existing DATABASE_URL
# DATABASE_URL=postgres://ticket:ticket@localhost:5432/ticket_support
cargo run
```

The API listens on `http://localhost:3000`. Schema is applied on startup (`sqlx::migrate!()`).


| Method  | Path             | Notes                                            |
| ------- | ---------------- | ------------------------------------------------ |
| `POST`  | `/tickets`       | create (title required, status starts as `open`) |
| `GET`   | `/tickets`       | list; `?status=`, `?page=`, `?limit=`            |
| `PATCH` | `/tickets/:id`   | update `status` and/or `priority`                |
| `GET`   | `/tickets/stats` | counts grouped by status (zeros included)        |


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

### This has been scoped to an implementation:
A single-page interface, the four endpoints. Per the specification, PATCH /tickets/:id mutates only status and priority, deliberately keeping title and description immutable to avoid inventing unrequested behavior. 

The ticket list endpoint returns an envelope ({ items, total, page, limit }) rather than a bare array, providing deterministic metadata for pagination; given more time, I would replace offset pagination with cursor-based keysets to handle large datasets efficiently. On mutations, the React frontend increments a refresh key to trigger clean server re-fetches for the list and stats rather than managing fragile optimistic cache diffs. Permissive CORS was enabled to eliminate local proxy friction between Vite (:5173) and Axum (:3000), which would be restricted to explicit allowed origins in production. For automated verification, integration tests leverage #[sqlx::test] with isolated ephemeral databases rather than truncating shared state, allowing cargo test to execute safely in parallel. The UI utilizes native HTML <dialog> elements and basic styles without heavy component libraries. Production concerns such as authentication, structured tracing (tracing-subscriber), and graceful shutdown signals were what I intentionally deferred.