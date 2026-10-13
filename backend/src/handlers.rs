use axum::extract::{Path, Query, State};
use axum::routing::{get, post};
use axum::{Json, Router};

use crate::errors::Error;
use crate::models::{
    CreateTicketRequest, Ticket, TicketQueryParams, TicketStat, UpdateTicketRequest,
};
use crate::AppState;

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/tickets", post(create_ticket).get(list_tickets))
        .route("/tickets/stats", get(get_stats))
        .route("/tickets/{id}", get(get_ticket).patch(update_ticket))
        .with_state(state)
}

pub async fn create_ticket(
    State(state): State<AppState>,
    Json(payload): Json<CreateTicketRequest>,
) -> Result<Json<Ticket>, Error> {
    if payload.title.trim().is_empty() {
        return Err(Error::BadRequest("Title is required".to_string()));
    }

    let ticket = Ticket::create(&state.db, payload).await?;
    Ok(Json(ticket))
}

pub async fn list_tickets(
    State(state): State<AppState>,
    Query(params): Query<TicketQueryParams>,
) -> Result<Json<Vec<Ticket>>, Error> {
    Ok(Json(Ticket::list(&state.db, params).await?))
}

pub async fn get_ticket(
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> Result<Json<Ticket>, Error> {
    Ok(Json(Ticket::get(&state.db, id).await?))
}

pub async fn update_ticket(
    State(state): State<AppState>,
    Path(id): Path<i32>,
    Json(payload): Json<UpdateTicketRequest>,
) -> Result<Json<Ticket>, Error> {
    Ok(Json(Ticket::update(&state.db, id, payload).await?))
}

pub async fn get_stats(State(state): State<AppState>) -> Result<Json<Vec<TicketStat>>, Error> {
    Ok(Json(Ticket::stats(&state.db).await?))
}
