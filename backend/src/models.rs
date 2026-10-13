use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::errors::Error;

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
#[sqlx(type_name = "ticket_status", rename_all = "snake_case")]
pub enum TicketStatus {
    Open,
    InProgress,
    Closed,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
#[sqlx(type_name = "ticket_priority", rename_all = "snake_case")]
pub enum TicketPriority {
    Low,
    Medium,
    High,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Ticket {
    pub id: i32,
    pub title: String,
    pub description: Option<String>,
    pub status: TicketStatus,
    pub priority: TicketPriority,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTicketRequest {
    pub title: String,
    pub description: Option<String>,
    #[serde(default = "default_priority")]
    pub priority: TicketPriority,
}

fn default_priority() -> TicketPriority {
    TicketPriority::Medium
}

#[derive(Debug, Deserialize)]
pub struct UpdateTicketRequest {
    pub status: Option<TicketStatus>,
    pub priority: Option<TicketPriority>,
}

#[derive(Debug, Deserialize)]
pub struct TicketQueryParams {
    pub status: Option<TicketStatus>,
    pub page: Option<i64>,
    pub limit: Option<i64>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct TicketStat {
    pub status: TicketStatus,
    pub count: i64,
}

impl Ticket {
    pub async fn create(db: &PgPool, payload: CreateTicketRequest) -> Result<Ticket, Error> {
        let ticket = sqlx::query_as::<_, Ticket>(
            r#"
            INSERT INTO tickets (title, description, status, priority)
            VALUES ($1, $2, $3, $4)
            RETURNING id, title, description, status, priority, created_at
            "#,
        )
        .bind(&payload.title)
        .bind(&payload.description)
        .bind(TicketStatus::Open)
        .bind(payload.priority)
        .fetch_one(db)
        .await?;
        Ok(ticket)
    }

    pub async fn get(db: &PgPool, id: i32) -> Result<Ticket, Error> {
        sqlx::query_as::<_, Ticket>(
            r#"
            SELECT id, title, description, status, priority, created_at
            FROM tickets
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(db)
        .await?
        .ok_or_else(|| Error::NotFound(format!("Ticket {id} not found")))
    }

    pub async fn list(db: &PgPool, params: TicketQueryParams) -> Result<Vec<Ticket>, Error> {
        let limit = params.limit.unwrap_or(20).clamp(1, 100);
        let page = params.page.unwrap_or(1).max(1);
        let offset = (page - 1) * limit;

        let tickets = match params.status {
            Some(status) => {
                sqlx::query_as::<_, Ticket>(
                    r#"
                    SELECT id, title, description, status, priority, created_at
                    FROM tickets
                    WHERE status = $1
                    ORDER BY created_at DESC
                    LIMIT $2 OFFSET $3
                    "#,
                )
                .bind(status)
                .bind(limit)
                .bind(offset)
                .fetch_all(db)
                .await?
            }
            None => {
                sqlx::query_as::<_, Ticket>(
                    r#"
                    SELECT id, title, description, status, priority, created_at
                    FROM tickets
                    ORDER BY created_at DESC
                    LIMIT $1 OFFSET $2
                    "#,
                )
                .bind(limit)
                .bind(offset)
                .fetch_all(db)
                .await?
            }
        };

        Ok(tickets)
    }

    pub async fn update(
        db: &PgPool,
        id: i32,
        payload: UpdateTicketRequest,
    ) -> Result<Ticket, Error> {
        sqlx::query_as::<_, Ticket>(
            r#"
            UPDATE tickets
            SET status = COALESCE($1, status),
                priority = COALESCE($2, priority)
            WHERE id = $3
            RETURNING id, title, description, status, priority, created_at
            "#,
        )
        .bind(payload.status)
        .bind(payload.priority)
        .bind(id)
        .fetch_optional(db)
        .await?
        .ok_or_else(|| Error::NotFound(format!("Ticket {id} not found")))
    }

    pub async fn stats(db: &PgPool) -> Result<Vec<TicketStat>, Error> {
        let stats = sqlx::query_as::<_, TicketStat>(
            r#"
            SELECT status, COUNT(*)::bigint AS count
            FROM tickets
            GROUP BY status
            ORDER BY status
            "#,
        )
        .fetch_all(db)
        .await?;
        Ok(stats)
    }
}
