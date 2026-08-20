//! Real PostgreSQL Cross-Tenant Attack & Isolation Test Suite (Fase 17 — diperbaiki Fase 21)
//!
//! PERUBAHAN FASE 21:
//! - Header disesuaikan dengan jumlah test aktual: 10 test (6 db + 1 unit + 3 db tambahan).
//! - Ditambahkan skenario 8: INSERT dari Company A ke Company B diblok RLS.
//! - Ditambahkan skenario 9: Report/Export hanya mengembalikan data Company A.
//! - Ditambahkan skenario 10: Rollback meninggalkan pool bersih tanpa sisa SET LOCAL.
//! - Skenario 5 (X-Company-ID middleware) diuji sebagai domain boundary check unit test.
//!
//! Validates 10 Real-world Cross-Tenant Attack Scenarios:
//! 1. Tenant A cannot READ Tenant B data (0 rows returned).          -> test_tenant_a_cannot_read_tenant_b_data
//! 2. Tenant A cannot UPDATE Tenant B data (0 rows updated).         -> test_tenant_a_cannot_update_tenant_b_data
//! 3. Tenant A cannot DELETE Tenant B data (0 rows deleted).         -> test_tenant_a_cannot_delete_tenant_b_data
//! 4. Tenant A cannot access Tenant B by guessed UUID.               -> test_tenant_a_cannot_access_tenant_b_by_guessed_uuid
//! 5. X-Company-ID without membership rejected by domain rule.       -> test_company_boundary_enforcement_unit
//! 6. Background job without context fails closed (0 rows).          -> test_background_job_without_context_fails_closed
//! 7. Connection pool reuse cleans SET LOCAL variables.              -> test_connection_pool_reuse_cleans_transaction_context
//! 8. Tenant A INSERT into Company B table is RLS-blocked.           -> test_tenant_a_cannot_insert_into_tenant_b_scope
//! 9. Report/Export returns only Company A data (zero from Company B).-> test_report_export_only_returns_own_company_data
//! 10. Failed transaction rollback leaves pool connection clean.      -> test_transaction_rollback_leaves_pool_clean

use management_system_core::domain::tenant::TenantContext;
use sqlx::PgPool;
use uuid::Uuid;

async fn setup_test_companies(pool: &PgPool) -> (Uuid, Uuid, Uuid) {
    let tenant_id = Uuid::new_v4();
    let company_a = Uuid::new_v4();
    let company_b = Uuid::new_v4();
    let category_id = Uuid::new_v4();

    // Ensure erpqu_app non-superuser role exists and has DML access for RLS enforcement
    let _ = sqlx::query(
        "DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'erpqu_app') THEN CREATE ROLE erpqu_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE; END IF; END $$;"
    ).execute(pool).await;
    let _ = sqlx::query("GRANT USAGE ON SCHEMA public TO erpqu_app")
        .execute(pool)
        .await;
    let _ = sqlx::query(
        "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO erpqu_app",
    )
    .execute(pool)
    .await;

    sqlx::query("INSERT INTO public.companies (id, tenant_id, name, code) VALUES ($1, $3, 'Company Alpha', 'ALPHA'), ($2, $3, 'Company Beta', 'BETA') ON CONFLICT DO NOTHING")
        .bind(company_a)
        .bind(company_b)
        .bind(tenant_id)
        .execute(pool)
        .await
        .expect("seed test companies");

    sqlx::query("INSERT INTO public.categories (id, code, name) VALUES ($1, $2, 'Test Category') ON CONFLICT DO NOTHING")
        .bind(category_id)
        .bind(format!("CAT-{}", category_id))
        .execute(pool)
        .await
        .expect("seed test category");

    (company_a, company_b, category_id)
}

#[sqlx::test(migrations = "../../migrations")]
async fn test_tenant_a_cannot_read_tenant_b_data(pool: PgPool) {
    let (comp_a, comp_b, cat_id) = setup_test_companies(&pool).await;

    // Seed asset for Company B using super_admin context
    let mut tx_super = pool.begin().await.unwrap();
    TenantContext::super_tenant()
        .apply_to_transaction(&mut *tx_super)
        .await
        .unwrap();
    let asset_b = Uuid::new_v4();
    sqlx::query("INSERT INTO public.assets (id, company_id, name, asset_code, category_id) VALUES ($1, $2, 'Confidential Asset B', 'AST-B-01', $3)")
        .bind(asset_b)
        .bind(comp_b)
        .bind(cat_id)
        .execute(&mut *tx_super)
        .await
        .unwrap();
    tx_super.commit().await.unwrap();

    // Tenant A attempts to read assets
    let mut tx_a = pool.begin().await.unwrap();
    TenantContext::new(Uuid::new_v4(), Some(comp_a))
        .apply_to_transaction(&mut *tx_a)
        .await
        .unwrap();

    let rows: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM public.assets WHERE company_id = $1")
        .bind(comp_b)
        .fetch_one(&mut *tx_a)
        .await
        .unwrap();

    assert_eq!(rows, 0, "Tenant A MUST NOT be able to read Tenant B assets");
}

#[sqlx::test(migrations = "../../migrations")]
async fn test_tenant_a_cannot_update_tenant_b_data(pool: PgPool) {
    let (comp_a, comp_b, cat_id) = setup_test_companies(&pool).await;

    // Seed asset for Company B
    let mut tx_super = pool.begin().await.unwrap();
    TenantContext::super_tenant()
        .apply_to_transaction(&mut *tx_super)
        .await
        .unwrap();
    let asset_b = Uuid::new_v4();
    sqlx::query("INSERT INTO public.assets (id, company_id, name, asset_code, category_id) VALUES ($1, $2, 'Original Name B', 'AST-B-02', $3)")
        .bind(asset_b)
        .bind(comp_b)
        .bind(cat_id)
        .execute(&mut *tx_super)
        .await
        .unwrap();
    tx_super.commit().await.unwrap();

    // Tenant A attempts to update Tenant B asset
    let mut tx_a = pool.begin().await.unwrap();
    TenantContext::new(Uuid::new_v4(), Some(comp_a))
        .apply_to_transaction(&mut *tx_a)
        .await
        .unwrap();

    let updated = sqlx::query("UPDATE public.assets SET name = 'Hacked Name' WHERE id = $1")
        .bind(asset_b)
        .execute(&mut *tx_a)
        .await
        .unwrap()
        .rows_affected();

    assert_eq!(
        updated, 0,
        "Tenant A MUST NOT be able to update Tenant B assets"
    );
}

#[sqlx::test(migrations = "../../migrations")]
async fn test_tenant_a_cannot_delete_tenant_b_data(pool: PgPool) {
    let (comp_a, comp_b, cat_id) = setup_test_companies(&pool).await;

    // Seed asset for Company B
    let mut tx_super = pool.begin().await.unwrap();
    TenantContext::super_tenant()
        .apply_to_transaction(&mut *tx_super)
        .await
        .unwrap();
    let asset_b = Uuid::new_v4();
    sqlx::query("INSERT INTO public.assets (id, company_id, name, asset_code, category_id) VALUES ($1, $2, 'To Delete B', 'AST-B-03', $3)")
        .bind(asset_b)
        .bind(comp_b)
        .bind(cat_id)
        .execute(&mut *tx_super)
        .await
        .unwrap();
    tx_super.commit().await.unwrap();

    // Tenant A attempts to delete Tenant B asset
    let mut tx_a = pool.begin().await.unwrap();
    TenantContext::new(Uuid::new_v4(), Some(comp_a))
        .apply_to_transaction(&mut *tx_a)
        .await
        .unwrap();

    let deleted = sqlx::query("DELETE FROM public.assets WHERE id = $1")
        .bind(asset_b)
        .execute(&mut *tx_a)
        .await
        .unwrap()
        .rows_affected();

    assert_eq!(
        deleted, 0,
        "Tenant A MUST NOT be able to delete Tenant B assets"
    );
}

#[sqlx::test(migrations = "../../migrations")]
async fn test_tenant_a_cannot_access_tenant_b_by_guessed_uuid(pool: PgPool) {
    let (comp_a, comp_b, cat_id) = setup_test_companies(&pool).await;

    let target_uuid = Uuid::new_v4();
    let mut tx_super = pool.begin().await.unwrap();
    TenantContext::super_tenant()
        .apply_to_transaction(&mut *tx_super)
        .await
        .unwrap();
    sqlx::query("INSERT INTO public.assets (id, company_id, name, asset_code, category_id) VALUES ($1, $2, 'Guessed Target', 'AST-B-04', $3)")
        .bind(target_uuid)
        .bind(comp_b)
        .bind(cat_id)
        .execute(&mut *tx_super)
        .await
        .unwrap();
    tx_super.commit().await.unwrap();

    // Tenant A queries exact guessed UUID
    let mut tx_a = pool.begin().await.unwrap();
    TenantContext::new(Uuid::new_v4(), Some(comp_a))
        .apply_to_transaction(&mut *tx_a)
        .await
        .unwrap();

    let res = sqlx::query("SELECT id FROM public.assets WHERE id = $1")
        .bind(target_uuid)
        .fetch_optional(&mut *tx_a)
        .await
        .unwrap();

    assert!(
        res.is_none(),
        "Querying Tenant B exact UUID under Tenant A context MUST return None"
    );
}

#[sqlx::test(migrations = "../../migrations")]
async fn test_background_job_without_context_fails_closed(pool: PgPool) {
    let (_comp_a, comp_b, cat_id) = setup_test_companies(&pool).await;

    let mut tx_super = pool.begin().await.unwrap();
    TenantContext::super_tenant()
        .apply_to_transaction(&mut *tx_super)
        .await
        .unwrap();
    sqlx::query("INSERT INTO public.assets (id, company_id, name, asset_code, category_id) VALUES ($1, $2, 'Background Target', 'AST-B-05', $3)")
        .bind(Uuid::new_v4())
        .bind(comp_b)
        .bind(cat_id)
        .execute(&mut *tx_super)
        .await
        .unwrap();
    tx_super.commit().await.unwrap();

    // Executing query without setting app.current_company_id or app.is_super_tenant (unscoped background job as runtime role)
    let mut tx_unscoped = pool.begin().await.unwrap();
    let _ = sqlx::query("SET ROLE erpqu_app")
        .execute(&mut *tx_unscoped)
        .await;
    let rows: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM public.assets")
        .fetch_one(&mut *tx_unscoped)
        .await
        .unwrap();

    assert_eq!(
        rows, 0,
        "Unscoped query without tenant context MUST fail-closed and return 0 rows"
    );
}

#[sqlx::test(migrations = "../../migrations")]
async fn test_connection_pool_reuse_cleans_transaction_context(pool: PgPool) {
    let (comp_a, _comp_b, _cat_id) = setup_test_companies(&pool).await;

    // Tx 1: Set Company A context and finish
    {
        let mut tx1 = pool.begin().await.unwrap();
        TenantContext::new(Uuid::new_v4(), Some(comp_a))
            .apply_to_transaction(&mut *tx1)
            .await
            .unwrap();
        tx1.commit().await.unwrap();
    }

    // Tx 2: Open new transaction without applying context
    {
        let mut tx2 = pool.begin().await.unwrap();
        let current_setting: Option<String> = sqlx::query_scalar(
            "SELECT NULLIF(current_setting('app.current_company_id', true), '')",
        )
        .fetch_one(&mut *tx2)
        .await
        .unwrap();

        assert!(
            current_setting.is_none(),
            "SET LOCAL app.current_company_id MUST NOT leak across pooled connection transactions"
        );
    }
}

/// Skenario 5 (Unit): Domain boundary check rejects cross-company access.
/// This verifies TenantContext.enforce_company_boundary() at the domain layer.
/// X-Company-ID header enforcement happens in middleware and cannot be tested here.
#[test]
fn test_company_boundary_enforcement_unit() {
    use management_system_core::domain::tenant::TenantContext;

    let company_a = Uuid::new_v4();
    let company_b = Uuid::new_v4();

    let ctx_a = TenantContext::new(Uuid::new_v4(), Some(company_a));

    // Same company: allowed
    assert!(
        ctx_a.enforce_company_boundary(Some(company_a)).is_ok(),
        "Same company access must be allowed"
    );

    // Different company: rejected at domain layer
    assert!(
        ctx_a.enforce_company_boundary(Some(company_b)).is_err(),
        "Cross-company access must be rejected by domain boundary check"
    );
}

/// Skenario 8: Tenant A cannot INSERT data into Company B scope (RLS WITH CHECK).
#[sqlx::test(migrations = "../../migrations")]
async fn test_tenant_a_cannot_insert_into_tenant_b_scope(pool: PgPool) {
    let (comp_a, comp_b, cat_id) = setup_test_companies(&pool).await;

    // Tenant A attempts to INSERT an asset with company_id = Company B
    let mut tx_a = pool.begin().await.unwrap();
    TenantContext::new(Uuid::new_v4(), Some(comp_a))
        .apply_to_transaction(&mut *tx_a)
        .await
        .unwrap();

    let insert_res = sqlx::query(
        "INSERT INTO public.assets (id, company_id, name, asset_code, category_id) VALUES ($1, $2, 'Injected Asset', 'INJECT-01', $3)",
    )
    .bind(Uuid::new_v4())
    .bind(comp_b) // Attempting to write into Company B scope
    .bind(cat_id)
    .execute(&mut *tx_a)
    .await;

    // RLS WITH CHECK must block this INSERT
    assert!(
        insert_res.is_err(),
        "Tenant A inserting data with Company B scope MUST be blocked by RLS WITH CHECK policy"
    );
}

/// Skenario 9: Report/Export query under Company A context returns ONLY Company A data.
#[sqlx::test(migrations = "../../migrations")]
async fn test_report_export_only_returns_own_company_data(pool: PgPool) {
    let (comp_a, comp_b, cat_id) = setup_test_companies(&pool).await;

    // Seed 2 assets for Company A and 3 assets for Company B
    let mut tx_super = pool.begin().await.unwrap();
    TenantContext::super_tenant()
        .apply_to_transaction(&mut *tx_super)
        .await
        .unwrap();
    for (i, company) in [
        (1, comp_a),
        (2, comp_a),
        (3, comp_b),
        (4, comp_b),
        (5, comp_b),
    ] {
        sqlx::query(
            "INSERT INTO public.assets (id, company_id, name, asset_code, category_id) VALUES ($1, $2, $3, $4, $5)",
        )
        .bind(Uuid::new_v4())
        .bind(company)
        .bind(format!("Asset Report {}", i))
        .bind(format!("RPT-{:02}", i))
        .bind(cat_id)
        .execute(&mut *tx_super)
        .await
        .unwrap();
    }
    tx_super.commit().await.unwrap();

    // Query as Company A: must only see Company A's 2 assets
    let mut tx_a = pool.begin().await.unwrap();
    TenantContext::new(Uuid::new_v4(), Some(comp_a))
        .apply_to_transaction(&mut *tx_a)
        .await
        .unwrap();

    let company_a_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM public.assets")
        .fetch_one(&mut *tx_a)
        .await
        .unwrap();

    assert_eq!(
        company_a_count, 2,
        "Report under Company A context must return ONLY Company A's 2 assets, not Company B's 3"
    );
}

/// Skenario 10: Transaction rollback leaves pool connection without residual SET LOCAL variables.
#[sqlx::test(migrations = "../../migrations")]
async fn test_transaction_rollback_leaves_pool_clean(pool: PgPool) {
    let (comp_a, _comp_b, _cat_id) = setup_test_companies(&pool).await;

    // Start a transaction, set company context, then explicitly ROLLBACK
    {
        let mut tx = pool.begin().await.unwrap();
        TenantContext::new(Uuid::new_v4(), Some(comp_a))
            .apply_to_transaction(&mut *tx)
            .await
            .unwrap();
        // Verify SET LOCAL is active within this transaction
        let ctx_within: Option<String> = sqlx::query_scalar(
            "SELECT NULLIF(current_setting('app.current_company_id', true), '')",
        )
        .fetch_one(&mut *tx)
        .await
        .unwrap();
        assert!(
            ctx_within.is_some(),
            "SET LOCAL must be active within the transaction"
        );
        // Explicitly rollback (drop tx)
        tx.rollback().await.unwrap();
    }

    // After rollback: the next transaction must NOT see the previous SET LOCAL value
    let mut conn = pool.acquire().await.unwrap();
    let ctx_after_rollback: Option<String> =
        sqlx::query_scalar("SELECT NULLIF(current_setting('app.current_company_id', true), '')")
            .fetch_one(&mut *conn)
            .await
            .unwrap();

    assert!(
        ctx_after_rollback.is_none(),
        "After transaction rollback, SET LOCAL app.current_company_id MUST NOT persist in the pool connection"
    );
}
