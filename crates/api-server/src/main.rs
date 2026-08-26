//! Management System ERP Backend Server
//!
//! Entry point for the integrated management system (Asset, HRD, Finance, Inventory).

use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod api;
mod application;

use api::{create_app, AppState};
use management_system_core::shared::config::AppConfig;
use management_system_core::shared::utils::jwt::JwtConfig;

#[tokio::main]
async fn main() {
    // Load .env file
    dotenvy::dotenv().ok();

    // Initialize logging — JSON in production, human-readable in development
    let env_filter = tracing_subscriber::EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| "management_system=debug,tower_http=debug".into());

    let log_format = std::env::var("LOG_FORMAT").unwrap_or_default();
    if log_format.eq_ignore_ascii_case("json") {
        // Production: JSON structured logging (for Loki, ELK, CloudWatch, etc.)
        tracing_subscriber::registry()
            .with(env_filter)
            .with(
                tracing_subscriber::fmt::layer()
                    .json()
                    .with_target(true)
                    .with_thread_ids(true)
                    .with_file(true)
                    .with_line_number(true)
                    .flatten_event(true),
            )
            .init();
    } else {
        // Development: human-readable colored output
        tracing_subscriber::registry()
            .with(env_filter)
            .with(tracing_subscriber::fmt::layer())
            .init();
    }

    // Load configuration
    let config = AppConfig::from_env();
    tracing::info!("Database Connection Target: {}", config.sanitized_db_url());

    tracing::info!(
        "Starting Management System ERP v{}",
        env!("CARGO_PKG_VERSION")
    );
    tracing::info!("Environment: {}", config.environment);

    // Check for CLI flags (--check-migration, --migrate-only, -v, --version)
    let args: Vec<String> = std::env::args().collect();
    let is_migration_only = args
        .iter()
        .any(|arg| arg == "--check-migration" || arg == "--migrate-only");

    if args.iter().any(|arg| arg == "-v" || arg == "--version") {
        println!("management-system v{}", env!("CARGO_PKG_VERSION"));
        std::process::exit(0);
    }

    // 1. Migration Execution (Fail-Closed: Any migration error immediately halts startup)
    let run_migrations = is_migration_only
        || std::env::var("RUN_MIGRATIONS_ON_STARTUP")
            .map(|v| v.trim().eq_ignore_ascii_case("true") || v == "1")
            .unwrap_or(true);

    if run_migrations {
        let migration_database_url =
            std::env::var("MIGRATION_DATABASE_URL").unwrap_or_else(|_| config.database_url.clone());
        tracing::info!("Running database migrations with migration role...");
        let migration_pool = match PgPoolOptions::new()
            .max_connections(2)
            .connect(&migration_database_url)
            .await
        {
            Ok(pool) => pool,
            Err(e) => {
                tracing::error!("CRITICAL: Failed to connect to migration database: {}", e);
                std::process::exit(1);
            }
        };

        if let Err(e) = sqlx::migrate!("../../database/migrations")
            .run(&migration_pool)
            .await
        {
            tracing::error!("CRITICAL: Database migration failed (Fail-Closed): {}", e);
            std::process::exit(1);
        }

        tracing::info!("Database migrations applied successfully.");
        migration_pool.close().await;

        if is_migration_only {
            tracing::info!(
                "Migration-only execution completed successfully. Exiting with status 0."
            );
            std::process::exit(0);
        }
    } else {
        tracing::info!("Startup migration skipped (decoupled runner mode active).");
    }

    // 2. Runtime Database Connection Pool (Least-Privilege Role, NO privileged fallback)
    let pool = PgPoolOptions::new()
        .max_connections(50)
        .min_connections(2)
        .acquire_timeout(std::time::Duration::from_secs(30))
        .idle_timeout(std::time::Duration::from_secs(600))
        .connect(&config.database_url)
        .await
        .unwrap_or_else(|err| {
            panic!(
                "CRITICAL: Failed to connect to runtime database ({}): {}. Privileged fallback is strictly disabled (Fail-Closed).",
                config.sanitized_db_url(),
                err
            );
        });

    tracing::info!("Database connected successfully");

    // Synchronize registered DocTypes to the database
    tracing::info!("Synchronizing DocTypes from registry...");
    for doctype in
        inventory::iter::<management_system_core::shared::doctype_registry::DocTypeRegistration>
    {
        let result = sqlx::query(
            r#"
            INSERT INTO doctypes (name, module, description, is_submittable) 
            VALUES ($1, $2, $3, $4) 
            ON CONFLICT (name) DO UPDATE SET 
                module = EXCLUDED.module, 
                description = EXCLUDED.description, 
                is_submittable = EXCLUDED.is_submittable
            "#,
        )
        .bind(doctype.name)
        .bind(doctype.module)
        .bind(doctype.description)
        .bind(doctype.is_submittable)
        .execute(&pool)
        .await;

        match result {
            Ok(_) => tracing::debug!("Synced DocType: {}", doctype.name),
            Err(e) => tracing::error!("Failed to sync DocType {}: {}", doctype.name, e),
        }
    }

    // JWT configuration
    let jwt_config = JwtConfig::new(config.jwt_secret.clone(), config.jwt_expiry_hours);

    // Create application state
    let state = AppState::new(pool, jwt_config, &config);

    // Start scheduler
    let _ = state.scheduler_service.start().await;

    // Spawn Production Transactional Outbox Dispatcher Worker (M1, M2-M6)
    let outbox_dispatcher = std::sync::Arc::new(
        management_system_core::infrastructure::outbox::OutboxDispatcher::new(
            state.pool.clone(),
            5,  // poll every 5 seconds
            50, // batch size of 50 events
        ),
    );
    outbox_dispatcher.start();
    tracing::info!("Production Transactional Outbox Dispatcher spawned successfully.");

    // Create application
    let app = create_app(state).await;

    // Start server
    let addr_str = format!("{}:{}", config.server_host, config.server_port);
    let addr: SocketAddr = addr_str
        .parse()
        .unwrap_or_else(|_| panic!("Invalid server address: {}", addr_str));

    // Force rebuild for migrations
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .unwrap_or_else(|_| panic!("Failed to bind to address: {}", addr));

    tracing::info!("Server listening on http://{}", addr);

    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .await
    .expect("Server error during execution");
}
