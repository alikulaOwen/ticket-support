use axum::{Json, extract::State, http::StatusCode};
use crate::{AppState, Error};
use crate::models::{Ticket, CreateTicketRequest, UpdateTicketRequest};
use crate::errors::Error;
use crate::models::{Ticket, CreateTicketRequest, UpdateTicketRequest};


pub async fn create_ticket(State(state): State<AppState>, Json(payload): Json<CreateTicketRequest>) -> Result<Json<Ticket>, Error> {
    if payload.title.is_empty()  {
        return Err(Error::BadRequest("Title is required".to_string()));
    }

    let ticket = Ticket::create(&state.db, payload).await?;

    Ok(Json(ticket))
}

pub async fn get_ticket(State(state): State<AppState>, Path(id): Path<i32>) -> Result<Json<Ticket>, Error> {
    todo!('listtickets')
}

pub async fn update_ticket(State(state): State<AppState>, Path(id): Path<i32>, Json(payload): Json<UpdateTicketRequest>) -> Result<Json<Ticket>, Error> {
    todo!()
}

pub async fn get_stats(State(state): State<AppState>, Path(id): Path<i32>) -> Result<Json<Ticket>, Error> {
    todo!()
}