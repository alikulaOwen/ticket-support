use axum::extract::{FromRequest, FromRequestParts, State};
use axum::http::StatusCode;
use axum::routing::{get, post};
use axum::{Json, Router};
use tower_http::cors::{Any, CorsLayer};

use crate::errors::Error;
use crate::models::{
    CreateTicketRequest, Ticket, TicketList, TicketQueryParams, TicketStat, UpdateTicketRequest,
};
use crate::AppState;

#[derive(FromRequest)]
#[from_request(via(axum::Json), rejection(Error))]
pub struct AppJson<T>(pub T);

#[derive(FromRequestParts)]
#[from_request(via(axum::extract::Query), rejection(Error))]
pub struct AppQuery<T>(pub T);

#[derive(FromRequestParts)]
#[from_request(via(axum::extract::Path), rejection(Error))]
pub struct AppPath<T>(pub T);

pub fn router(state: AppState) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        .route("/tickets", post(create_ticket).get(list_tickets))
        .route("/tickets/stats", get(get_stats))
        .route("/tickets/{id}", get(get_ticket).patch(update_ticket))
        .with_state(state)
        .layer(cors)
}

pub async fn create_ticket(
    State(state): State<AppState>,
    AppJson(payload): AppJson<CreateTicketRequest>,
) -> Result<(StatusCode, Json<Ticket>), Error> {
    if payload.title.trim().is_empty() {
        return Err(Error::BadRequest("Title is required".to_string()));
    }
    let ticket = Ticket::create(&state.db, payload).await?;
    Ok((StatusCode::CREATED, Json(ticket)))
}

pub async fn list_tickets(
    State(state): State<AppState>,
    AppQuery(params): AppQuery<TicketQueryParams>,
) -> Result<Json<TicketList>, Error> {
    Ok(Json(Ticket::list(&state.db, params).await?))
}

pub async fn get_ticket(
    State(state): State<AppState>,
    AppPath(id): AppPath<i32>,
) -> Result<Json<Ticket>, Error> {
    Ok(Json(Ticket::get(&state.db, id).await?))
}

pub async fn update_ticket(
    State(state): State<AppState>,
    AppPath(id): AppPath<i32>,
    AppJson(payload): AppJson<UpdateTicketRequest>,
) -> Result<Json<Ticket>, Error> {
    if payload.status.is_none() && payload.priority.is_none() {
        return Err(Error::BadRequest(
            "Provide status and/or priority".to_string(),
        ));
    }
    Ok(Json(Ticket::update(&state.db, id, payload).await?))
}

pub async fn get_stats(State(state): State<AppState>) -> Result<Json<Vec<TicketStat>>, Error> {
    Ok(Json(Ticket::stats(&state.db).await?))
}