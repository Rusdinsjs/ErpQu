//! Real PostgreSQL Migration Governance Tests (Fase 16 — diperbaiki Fase 21)
//!
//! Validates:
//! 1. Fresh Database Install: sqlx::migrate! runs from scratch to latest schema.
//! 2. Idempotency: Running sqlx::migrate! twice on the same database succeeds as no-op.
//! 3. Role Separation: Runtime role (erpqu_app) can perform DML but is denied DDL.

use sqlx::PgPool;

#[sqlx::test(migrations = "../../migrations")]
async fn test_fresh_database_install_migration(pool: PgPool) {
    // 1. Verify core tables exist after migration
    let table_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'",
    )
    .fetch_one(&pool)
    .await
    .expect("fetch public table count");

    assert!(
        table_count > 10,
        "Fresh install must create all core schema tables, got {}",
        table_count
    );

    // 2. Verify _sqlx_migrations table records applied migrations
    let migration_count: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM _sqlx_migrations WHERE success = true")
            .fetch_one(&pool)
            .await
            .expect("fetch migration count");

    assert!(
        migration_count > 0,
        "Migration audit log must record applied migrations"
    );
}

#[sqlx::test(migrations = "../../migrations")]
async fn test_migration_run_twice_is_idempotent(pool: PgPool) {
    // Re-running sqlx::migrate! on an already migrated database must succeed without errors (no-op)
    let migration_res = sqlx::migrate!("../../migrations").run(&pool).await;
    assert!(
        migration_res.is_ok(),
        "Running migrations twice on the same database must be idempotent: {:?}",
        migration_res.err()
    );
}

#[sqlx::test(migrations = "../../migrations")]
async fn test_runtime_role_dml_allowed_ddl_denied(pool: PgPool) {
    let role = std::env::var("TEST_APP_DB_ROLE").unwrap_or_else(|_| "erpqu_app".to_string());

    let mut conn = pool.acquire().await.expect(
        "Failed to acquire database connection for runtime role test. Ensure TEST_DATABASE_URL is set.",
    );

    // 1. Ensure runtime application role exists in the cluster with DML-only privileges
    let bootstrap_sql = format!(
        "DO $$ BEGIN \
            IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '{role}') THEN \
                CREATE ROLE {role} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE; \
            END IF; \
         END $$;"
    );
    sqlx::query(&bootstrap_sql)
        .execute(&mut *conn)
        .await
        .expect("bootstrap application role");

    // Grant DML privileges (SELECT, INSERT, UPDATE, DELETE) to runtime role on public schema
    sqlx::query(&format!("GRANT USAGE ON SCHEMA public TO {role}"))
        .execute(&mut *conn)
        .await
        .expect("grant schema usage");

    sqlx::query(&format!(
        "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO {role}"
    ))
    .execute(&mut *conn)
    .await
    .expect("grant table dml");

    // 2. Switch role to runtime application role
    sqlx::query(&format!("SET ROLE {}", role))
        .execute(&mut *conn)
        .await
        .unwrap_or_else(|e| panic!("Failed to set role to application role '{}': {}", role, e));

    // 3. DML SELECT must be allowed as runtime role
    let dml_res = sqlx::query("SELECT COUNT(*) FROM public.companies")
        .fetch_one(&mut *conn)
        .await;
    assert!(
        dml_res.is_ok(),
        "Runtime role '{}' must be allowed to execute SELECT/DML on public.companies",
        role
    );

    // 4. DDL CREATE TABLE must be denied as runtime role
    let ddl_res = sqlx::query("CREATE TABLE public.unauthorized_test_table_fase21 (id INT)")
        .execute(&mut *conn)
        .await;

    // Reset role back to postgres before asserting
    let _ = sqlx::query("RESET ROLE").execute(&mut *conn).await;

    assert!(
        ddl_res.is_err(),
        "Runtime application role '{}' MUST be denied DDL privileges (CREATE TABLE).",
        role
    );
}
