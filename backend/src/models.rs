use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, Copy, PartialEq, Eq)]
#[sqlx(type_name = "ticket_status", rename_all = "snake_case")]
pub enum TicketStatus {
    Open,
    InProgress,
    Closed,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, Copy, PartialEq, Eq)]
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
        use crate::models::TicketPriority;
        use crate::models::TicketStatus;
        use chrono::Utc;

        let status = TicketStatus::Open; 
        let priority = payload.priority;

        let ticket = sqlx::query_as::<_, Ticket>(
            r#"
            INSERT INTO tickets (title, description, status, priority)
            VALUES ($1, $2, $3, $4)
            RETURNING id, title, description, status, priority, created_at
            "#,
        )
        .bind(&payload.title)
        .bind(&payload.description)
        .bind(status)
        .bind(priority)
        .fetch_one(db)
        .await?;
        Ok(ticket)
    }

    pub async fn get(db: &PgPool, id: i32) -> Result<Ticket, Error> {
        use crate::models::TicketPriority;
        let ticket = sqlx::query_as::<_, Ticket>(
            r#"
            SELECT id, title, description, status, priority, created_at FROM tickets WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_one(db)
        .await?;
        Ok(ticket)
    }

    pub async fn update(db: &PgPool, id: i32, payload: UpdateTicketRequest) -> Result<Ticket, Error> {
        use crate::models::TicketPriority;
        use crate::models::TicketStatus;
        use chrono::Utc;

        let status = payload.status.unwrap_or(TicketStatus::Open);
        let priority = payload.priority.unwrap_or(TicketPriority::Medium);

        let ticket = sqlx::query_as::<_, Ticket>(
            r#"
            UPDATE tickets SET status = $1, priority = $2 WHERE id = $3 RETURNING id, title, description, status, priority, created_at
            "#,
        )
        .bind(status)
        .bind(priority)
        .bind(id)
        .fetch_one(db)
        .await?;
        Ok(ticket)
    }
}