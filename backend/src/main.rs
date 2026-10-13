use backend::{app, migrate, AppState};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();

    let database_url = std::env::var("DATABASE_URL")?;
    let db = sqlx::PgPool::connect(&database_url).await?;
    migrate(&db).await?;

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
    axum::serve(listener, app(AppState { db })).await?;
    Ok(())
}
