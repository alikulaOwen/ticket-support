use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde_json::json;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("Internal server error")]
    InternalServerError,
    #[error("Bad request: {0}")]
    BadRequest(String),
    #[error("Not found: {0}")]
    NotFound(String),
    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx::Error),
}

impl From<axum::Error> for Error {
    fn from(_error: axum::Error) -> Self {
        Error::InternalServerError
    }
}

use axum::extract::rejection::{JsonRejection, PathRejection, QueryRejection};

impl From<JsonRejection> for Error {
    fn from(e: JsonRejection) -> Self {
        Error::BadRequest(e.body_text())
    }
}

impl From<QueryRejection> for Error {
    fn from(e: QueryRejection) -> Self {
        Error::BadRequest(e.body_text())
    }
}

impl From<PathRejection> for Error {
    fn from(e: PathRejection) -> Self {
        Error::BadRequest(e.body_text())
    }
}

impl Error {
    pub fn status_code(&self) -> StatusCode {
        match self {
            Error::InternalServerError | Error::DatabaseError(_) => {
                StatusCode::INTERNAL_SERVER_ERROR
            }
            Error::BadRequest(_) => StatusCode::BAD_REQUEST,
            Error::NotFound(_) => StatusCode::NOT_FOUND,
        }
    }
}

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        let status = self.status_code();
        let body = Json(json!({ "error": self.to_string() }));
        (status, body).into_response()
    }
}


