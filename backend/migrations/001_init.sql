DO $$
BEGIN
    CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'closed');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
    CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status ticket_status NOT NULL,
    priority ticket_priority NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
