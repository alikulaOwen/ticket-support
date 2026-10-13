use axum::body::Body;
use axum::http::{Request, StatusCode};
use http_body_util::BodyExt;
use serde_json::{json, Value};
use sqlx::PgPool;
use tower::ServiceExt;

fn app(pool: PgPool) -> axum::Router {
    backend::app(backend::AppState { db: pool })
}

async fn send(app: &axum::Router, method: &str, uri: &str, body: Option<Value>) -> (StatusCode, Value) {
    let mut req = Request::builder().method(method).uri(uri);
    let body = match body {
        Some(b) => {
            req = req.header("content-type", "application/json");
            Body::from(b.to_string())
        }
        None => Body::empty(),
    };
    let res = app.clone().oneshot(req.body(body).unwrap()).await.unwrap();
    let status = res.status();
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    let json = if bytes.is_empty() { Value::Null } else { serde_json::from_slice(&bytes).unwrap() };
    (status, json)
}

#[sqlx::test]
async fn create_ticket_validates_and_defaults(pool: PgPool) {
    let app = app(pool);

    let (status, _) = send(&app, "POST", "/tickets", Some(json!({ "title": "  " }))).await;
    assert_eq!(status, StatusCode::BAD_REQUEST);

    let (status, body) = send(&app, "POST", "/tickets", Some(json!({ "title": "Printer jam" }))).await;
    assert_eq!(status, StatusCode::CREATED);
    assert_eq!(body["status"], "open");
    assert_eq!(body["priority"], "medium");
}

#[sqlx::test]
async fn patch_updates_status_and_rejects_empty_body(pool: PgPool) {
    let app = app(pool);
    let (_, created) = send(&app, "POST", "/tickets", Some(json!({ "title": "VPN down", "priority": "high" }))).await;
    let id = created["id"].as_i64().unwrap();

    let (status, _) = send(&app, "PATCH", &format!("/tickets/{id}"), Some(json!({}))).await;
    assert_eq!(status, StatusCode::BAD_REQUEST);

    let (status, body) = send(&app, "PATCH", &format!("/tickets/{id}"), Some(json!({ "status": "closed" }))).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["status"], "closed");
    assert_eq!(body["priority"], "high");

    let (status, _) = send(&app, "PATCH", "/tickets/999999", Some(json!({ "status": "closed" }))).await;
    assert_eq!(status, StatusCode::NOT_FOUND);
}

#[sqlx::test]
async fn list_filters_and_stats_include_zero_counts(pool: PgPool) {
    let app = app(pool);
    for title in ["A", "B", "C"] {
        send(&app, "POST", "/tickets", Some(json!({ "title": title }))).await;
    }
    send(&app, "PATCH", "/tickets/1", Some(json!({ "status": "closed" }))).await;

    let (status, body) = send(&app, "GET", "/tickets?status=open&page=1&limit=1", None).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["total"], 2);
    assert_eq!(body["items"].as_array().unwrap().len(), 1);

    let (_, stats) = send(&app, "GET", "/tickets/stats", None).await;
    let count = |s: &str| stats.as_array().unwrap().iter().find(|r| r["status"] == s).unwrap()["count"].clone();
    assert_eq!(count("open"), 2);
    assert_eq!(count("in_progress"), 0);
    assert_eq!(count("closed"), 1);

    let (status, _) = send(&app, "GET", "/tickets?status=bogus", None).await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
}