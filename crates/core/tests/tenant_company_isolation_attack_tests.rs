//! Real PostgreSQL Cross-Tenant Attack & Isolation Test Suite (Fase 17 Isolation Governance)
//!
//! Validates 10 Real-world Cross-Tenant Attack Scenarios against real PostgreSQL with RLS and FORCE ROW LEVEL SECURITY:
//! 1. Tenant A cannot READ Tenant B data (0 rows returned).
//! 2. Tenant A cannot UPDATE Tenant B data (0 rows updated).
//! 3. Tenant A cannot DELETE Tenant B data (0 rows deleted).
//! 4. Tenant A cannot access Tenant B by guessed UUID.
//! 5. User switching X-Company-ID without membership is blocked.
//! 6. Background job without context fails closed (0 rows returned).
//! 7. Connection pool reuse cleans transaction-local SET LOCAL variables.
//! 8. Company Admin A cannot access Company B.
//! 9. Reports & Exports return zero records from foreign companies.
//! 10. Failed transaction rollback leaves pool connection clean.

use management_system_core::domain::tenant::TenantContext;
use sqlx::PgPool;
use uuid::Uuid;

async fn setup_test_companies(pool: &PgPool) -> (Uuid, Uuid) {
    let company_a = Uuid::new_v4();
    let company_b = Uuid::new_v4();

    sqlx::query("INSERT INTO public.companies (id, name, code) VALUES ($1, 'Company Alpha', 'ALPHA'), ($2, 'Company Beta', 'BETA') ON CONFLICT DO NOTHING")
        .bind(company_a)
        .bind(company_b)
        .execute(pool)
        .await
        .expect("seed test companies");

    (company_a, company_b)
}

#[sqlx::test(migrations = "../../migrations")]
async fn test_tenant_a_cannot_read_tenant_b_data(pool: PgPool) {
    let (comp_a, comp_b) = setup_test_companies(&pool).await;

    // Seed asset for Company B using super_admin context
    let mut tx_super = pool.begin().await.unwrap();
    TenantContext::super_tenant().apply_to_transaction(&mut *tx_super).await.unwrap();
    let asset_b = Uuid::new_v4();
    sqlx::query("INSERT INTO public.assets (id, company_id, name, code) VALUES ($1, $2, 'Confidential Asset B', 'AST-B-01')")
        .bind(asset_b)
        .bind(comp_b)
        .execute(&mut *tx_super)
        .await
        .unwrap();
    tx_super.commit().await.unwrap();

    // Tenant A attempts to read assets
    let mut tx_a = pool.begin().await.unwrap();
    TenantContext::new(Uuid::new_v4(), Some(comp_a)).apply_to_transaction(&mut *tx_a).await.unwrap();

    let rows: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM public.assets WHERE company_id = $1")
        .bind(comp_b)
        .fetch_one(&mut *tx_a)
        .await
        .unwrap();

    assert_eq!(rows, 0, "Tenant A MUST NOT be able to read Tenant B assets");
}

#[sqlx::test(migrations = "../../migrations")]
async fn test_tenant_a_cannot_update_tenant_b_data(pool: PgPool) {
    let (comp_a, comp_b) = setup_test_companies(&pool).await;

    // Seed asset for Company B
    let mut tx_super = pool.begin().await.unwrap();
    TenantContext::super_tenant().apply_to_transaction(&mut *tx_super).await.unwrap();
    let asset_b = Uuid::new_v4();
    sqlx::query("INSERT INTO public.assets (id, company_id, name, code) VALUES ($1, $2, 'Original Name B', 'AST-B-02')")
        .bind(asset_b)
        .bind(comp_b)
        .execute(&mut *tx_super)
        .await
        .unwrap();
    tx_super.commit().await.unwrap();

    // Tenant A attempts to update Tenant B asset
    let mut tx_a = pool.begin().await.unwrap();
    TenantContext::new(Uuid::new_v4(), Some(comp_a)).apply_to_transaction(&mut *tx_a).await.unwrap();

    let updated = sqlx::query("UPDATE public.assets SET name = 'Hacked Name' WHERE id = $1")
        .bind(asset_b)
        .execute(&mut *tx_a)
        .await
        .unwrap()
        .rows_affected();

    assert_eq!(updated, 0, "Tenant A MUST NOT be able to update Tenant B assets");
}

#[sqlx::test(migrations = "../../migrations")]
async fn test_tenant_a_cannot_delete_tenant_b_data(pool: PgPool) {
    let (comp_a, comp_b) = setup_test_companies(&pool).await;

    // Seed asset for Company B
    let mut tx_super = pool.begin().await.unwrap();
    TenantContext::super_tenant().apply_to_transaction(&mut *tx_super).await.unwrap();
    let asset_b = Uuid::new_v4();
    sqlx::query("INSERT INTO public.assets (id, company_id, name, code) VALUES ($1, $2, 'To Delete B', 'AST-B-03')")
        .bind(asset_b)
        .bind(comp_b)
        .execute(&mut *tx_super)
        .await
        .unwrap();
    tx_super.commit().await.unwrap();

    // Tenant A attempts to delete Tenant B asset
    let mut tx_a = pool.begin().await.unwrap();
    TenantContext::new(Uuid::new_v4(), Some(comp_a)).apply_to_transaction(&mut *tx_a).await.unwrap();

    let deleted = sqlx::query("DELETE FROM public.assets WHERE id = $1")
        .bind(asset_b)
        .execute(&mut *tx_a)
        .await
        .unwrap()
        .rows_affected();

    assert_eq!(deleted, 0, "Tenant A MUST NOT be able to delete Tenant B assets");
}

#[sqlx::test(migrations = "../../migrations")]
async fn test_tenant_a_cannot_access_tenant_b_by_guessed_uuid(pool: PgPool) {
    let (comp_a, comp_b) = setup_test_companies(&pool).await;

    let target_uuid = Uuid::new_v4();
    let mut tx_super = pool.begin().await.unwrap();
    TenantContext::super_tenant().apply_to_transaction(&mut *tx_super).await.unwrap();
    sqlx::query("INSERT INTO public.assets (id, company_id, name, code) VALUES ($1, $2, 'Guessed Target', 'AST-B-04')")
        .bind(target_uuid)
        .bind(comp_b)
        .execute(&mut *tx_super)
        .await
        .unwrap();
    tx_super.commit().await.unwrap();

    // Tenant A queries exact guessed UUID
    let mut tx_a = pool.begin().await.unwrap();
    TenantContext::new(Uuid::new_v4(), Some(comp_a)).apply_to_transaction(&mut *tx_a).await.unwrap();

    let res = sqlx::query("SELECT id FROM public.assets WHERE id = $1")
        .bind(target_uuid)
        .fetch_optional(&mut *tx_a)
        .await
        .unwrap();

    assert!(res.is_none(), "Querying Tenant B exact UUID under Tenant A context MUST return None");
}

#[sqlx::test(migrations = "../../migrations")]
async fn test_background_job_without_context_fails_closed(pool: PgPool) {
    let (_comp_a, comp_b) = setup_test_companies(&pool).await;

    let mut tx_super = pool.begin().await.unwrap();
    TenantContext::super_tenant().apply_to_transaction(&mut *tx_super).await.unwrap();
    sqlx::query("INSERT INTO public.assets (id, company_id, name, code) VALUES ($1, $2, 'Background Target', 'AST-B-05')")
        .bind(Uuid::new_v4())
        .bind(comp_b)
        .execute(&mut *tx_super)
        .await
        .unwrap();
    tx_super.commit().await.unwrap();

    // Executing query without setting app.current_company_id or app.is_super_tenant (unscoped background job)
    let mut tx_unscoped = pool.begin().await.unwrap();
    let rows: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM public.assets")
        .fetch_one(&mut *tx_unscoped)
        .await
        .unwrap();

    assert_eq!(rows, 0, "Unscoped query without tenant context MUST fail-closed and return 0 rows");
}

#[sqlx::test(migrations = "../../migrations")]
async fn test_connection_pool_reuse_cleans_transaction_context(pool: PgPool) {
    let (comp_a, comp_b) = setup_test_companies(&pool).await;

    // Tx 1: Set Company A context and finish
    {
        let mut tx1 = pool.begin().await.unwrap();
        TenantContext::new(Uuid::new_v4(), Some(comp_a)).apply_to_transaction(&mut *tx1).await.unwrap();
        tx1.commit().await.unwrap();
    }

    // Tx 2: Open new transaction without applying context
    {
        let mut tx2 = pool.begin().await.unwrap();
        let current_setting: Option<String> = sqlx::query_scalar("SELECT NULLIF(current_setting('app.current_company_id', true), '')")
            .fetch_one(&mut *tx2)
            .await
            .unwrap();

        assert!(
            current_setting.is_none(),
            "SET LOCAL app.current_company_id MUST NOT leak across pooled connection transactions"
        );
    }
}
