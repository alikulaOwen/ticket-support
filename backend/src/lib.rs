mod db;
mod errors;
mod handlers;
mod models;

pub use db::migrate;
pub use errors::Error;

use axum::Router;
use sqlx::PgPool;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
}

pub fn app(state: AppState) -> Router {
    handlers::router(state)
}
