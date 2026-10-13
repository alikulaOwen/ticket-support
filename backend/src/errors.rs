use axum::{http::StatusCode, Json, Response};
use serde_json::json;
use std::fmt;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("Internal server error")]
    InternalServerError,
    #[error("Bad request: {0}")]
    BadRequest(String),
    #[error("Not found: {0}")]
    NotFound(String),
    #[error("Database error: {0}")]
    DatabaseError(sqlx::Error),
}


impl From<sqlx::Error> for Error {
    fn from(error: sqlx::Error) -> Self {
        Error::DatabaseError(error)
    }
}

impl From<axum::Error> for Error {
    fn from(error: axum::Error) -> Self {
        Error::InternalServerError
    }
}

impl Error {
    pub fn status_code(&self) -> StatusCode {
        match self {
            Error::InternalServerError => StatusCode::INTERNAL_SERVER_ERROR,
            Error::BadRequest(_) => StatusCode::BAD_REQUEST,
            Error::NotFound(_) => StatusCode::NOT_FOUND,
            Error::DatabaseError(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}

impl Response::IntoResponse for Error {
    fn into_response(self) -> Response {
        let status_code = self.status_code();
        let error_message = self.to_string();
        let response_body = json!({
            "error": error_message,
        });
        (status_code, Json(response_body)).into_response()
    }
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}