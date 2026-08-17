//! Prometheus Metrics Exporter Handler (QSRE-001)
//!
//! Provides a `/metrics` endpoint returning Prometheus exposition format text.
//! Collects:
//! - Server uptime & start time
//! - PostgreSQL connection pool stats (size, idle, active)
//! - Application version & environment info
//! - System memory & process stats

use axum::{extract::State, response::IntoResponse};
use std::sync::LazyLock;
use std::time::Instant;

static START_TIME: LazyLock<Instant> = LazyLock::new(Instant::now);

/// Prometheus metrics handler — GET /metrics
pub async fn prometheus_metrics(
    State(state): State<crate::api::server::AppState>,
) -> impl IntoResponse {
    let uptime_secs = START_TIME.elapsed().as_secs_f64();
    let pool = &state.pool;

    let pool_size = pool.size();
    let pool_idle = pool.num_idle();
    let pool_active = pool_size.saturating_sub(pool_idle as u32);

    let mut body = String::with_capacity(2048);

    // App info
    body.push_str("# HELP erpqu_info Basic application metadata\n");
    body.push_str("# TYPE erpqu_info gauge\n");
    body.push_str(&format!(
        "erpqu_info{{version=\"{}\",env=\"{}\"}} 1\n\n",
        env!("CARGO_PKG_VERSION"),
        std::env::var("APP_ENV").unwrap_or_else(|_| "development".into())
    ));

    // Uptime
    body.push_str("# HELP erpqu_uptime_seconds Total application uptime in seconds\n");
    body.push_str("# TYPE erpqu_uptime_seconds counter\n");
    body.push_str(&format!("erpqu_uptime_seconds {:.2}\n\n", uptime_secs));

    // Database connection pool metrics
    body.push_str("# HELP erpqu_db_pool_size Total PostgreSQL connection pool size\n");
    body.push_str("# TYPE erpqu_db_pool_size gauge\n");
    body.push_str(&format!("erpqu_db_pool_size {}\n\n", pool_size));

    body.push_str("# HELP erpqu_db_pool_idle Number of idle PostgreSQL pool connections\n");
    body.push_str("# TYPE erpqu_db_pool_idle gauge\n");
    body.push_str(&format!("erpqu_db_pool_idle {}\n\n", pool_idle));

    body.push_str("# HELP erpqu_db_pool_active Number of active PostgreSQL pool connections\n");
    body.push_str("# TYPE erpqu_db_pool_active gauge\n");
    body.push_str(&format!("erpqu_db_pool_active {}\n\n", pool_active));

    // System process stats (memory usage from /proc/self/statm if Linux)
    if let Ok(statm) = std::fs::read_to_string("/proc/self/statm") {
        let parts: Vec<&str> = statm.split_whitespace().collect();
        if parts.len() >= 2 {
            let page_size = 4096; // 4KB standard page size
            let vm_size = parts[0].parse::<u64>().unwrap_or(0) * page_size;
            let rss_size = parts[1].parse::<u64>().unwrap_or(0) * page_size;

            body.push_str("# HELP erpqu_process_virtual_memory_bytes Process virtual memory size\n");
            body.push_str("# TYPE erpqu_process_virtual_memory_bytes gauge\n");
            body.push_str(&format!("erpqu_process_virtual_memory_bytes {}\n\n", vm_size));

            body.push_str("# HELP erpqu_process_resident_memory_bytes Process resident memory size (RSS)\n");
            body.push_str("# TYPE erpqu_process_resident_memory_bytes gauge\n");
            body.push_str(&format!("erpqu_process_resident_memory_bytes {}\n\n", rss_size));
        }
    }

    (
        [(
            axum::http::header::CONTENT_TYPE,
            "text/plain; version=0.0.4; charset=utf-8",
        )],
        body,
    )
}
