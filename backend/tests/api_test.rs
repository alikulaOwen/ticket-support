use axum::body::Body;
use axum::http::{Request, StatusCode};
use http_body_util::BodyExt;
use serde_json::Value;
use tower::ServiceExt;

async fn app() -> axum::Router {
    dotenvy::dotenv().ok();
    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL");
    let db = sqlx::PgPool::connect(&database_url)
        .await
        .expect("connect to postgres");
    backend::migrate(&db).await.expect("migrate");
    sqlx::query("TRUNCATE tickets RESTART IDENTITY")
        .execute(&db)
        .await
        .expect("truncate tickets");
    backend::app(backend::AppState { db })
}

async fn json(response: axum::response::Response) -> Value {
    let bytes = response.into_body().collect().await.unwrap().to_bytes();
    serde_json::from_slice(&bytes).unwrap()
}

#[tokio::test]
async fn ticket_api() {
    let app = app().await;

    let missing_title = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/tickets")
                .header("content-type", "application/json")
                .body(Body::from(r#"{"title":"   "}"#))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(missing_title.status(), StatusCode::BAD_REQUEST);

    let created = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/tickets")
                .header("content-type", "application/json")
                .body(Body::from(
                    r#"{"title":"Printer jam","description":"Tray 2","priority":"high"}"#,
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(created.status(), StatusCode::OK);
    let created = json(created).await;
    let id = created["id"].as_i64().unwrap();
    assert_eq!(created["title"], "Printer jam");
    assert_eq!(created["status"], "open");
    assert_eq!(created["priority"], "high");

    let fetched = app
        .clone()
        .oneshot(
            Request::builder()
                .uri(format!("/tickets/{id}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(fetched.status(), StatusCode::OK);
    assert_eq!(json(fetched).await["description"], "Tray 2");

    let updated = app
        .clone()
        .oneshot(
            Request::builder()
                .method("PATCH")
                .uri(format!("/tickets/{id}"))
                .header("content-type", "application/json")
                .body(Body::from(r#"{"status":"closed"}"#))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(updated.status(), StatusCode::OK);
    let updated = json(updated).await;
    assert_eq!(updated["status"], "closed");
    assert_eq!(updated["priority"], "high");

    let listed = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/tickets?status=closed")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(listed.status(), StatusCode::OK);
    let listed = json(listed).await;
    assert_eq!(listed.as_array().unwrap().len(), 1);

    let stats = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/tickets/stats")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(stats.status(), StatusCode::OK);
    let stats = json(stats).await;
    assert_eq!(stats[0]["status"], "closed");
    assert_eq!(stats[0]["count"], 1);

    let missing = app
        .oneshot(
            Request::builder()
                .uri("/tickets/999999")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(missing.status(), StatusCode::NOT_FOUND);
}
