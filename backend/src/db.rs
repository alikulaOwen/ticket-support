use sqlx::PgPool;

pub async fn migrate(pool: &PgPool) -> Result<(), sqlx::Error> {
    sqlx::raw_sql(include_str!("../migrations/001_init.sql"))
        .execute(pool)
        .await?;
    Ok(())
}
