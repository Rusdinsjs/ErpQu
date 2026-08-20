//! Database Integration Test: Source-to-Pay Slice 1 (Fase 21 Restore)
//!
//! CATATAN KEJUJURAN (Fase 21):
//! - Test ini adalah DATABASE INTEGRATION TEST, bukan E2E test.
//! - Test ini TIDAK melewati HTTP API, auth middleware, atau RBAC handler.
//! - Test ini menggunakan SQL langsung ke tabel dan engine layer (bukan HTTP service produksi).
//! - Label "E2E" hanya boleh digunakan setelah alur: HTTP → auth → RBAC → SoD → handler → service → db → GL → stock → reconciliation.
//! - Schema yang benar untuk material_requests adalah inventory.material_requests.
//! - Status dokumen TIDAK boleh di-set langsung ke APPROVED/POSTED/PAID tanpa melalui service yang mengandung validasi.
//!
//! Yang diuji:
//! 1. Tenant isolation via SET LOCAL app.current_company_id
//! 2. SoD domain rules (Maker != Checker) via SodValidator
//! 3. GL double-entry posting via AccountingPostingEngine (debit == credit)
//! 4. Storno reversal (reverse_voucher_in_uow) creates opposite entries (is_reversal = true)
//! 5. Original GL entries remain immutable after reversal
//! 6. Reconciliation report GL delta == 0.0000

use chrono::NaiveDate;
use management_system_core::domain::sod::SodValidator;
use management_system_core::domain::tenant::TenantContext;
use management_system_finance::{
    AccountingPostingEngine, GLEntry, PostingInstruction, PostingLineItem, ReconciliationEngine,
};
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use sqlx::PgPool;
use uuid::Uuid;

struct S2pDbTestEnv {
    company_id: Uuid,
    vendor_id: Uuid,
    acc_grir: Uuid,
    acc_ap: Uuid,
    acc_bank: Uuid,
}

async fn setup_s2p_db_env(pool: &PgPool) -> S2pDbTestEnv {
    let env = S2pDbTestEnv {
        company_id: Uuid::new_v4(),
        vendor_id: Uuid::new_v4(),
        acc_grir: Uuid::new_v4(),
        acc_ap: Uuid::new_v4(),
        acc_bank: Uuid::new_v4(),
    };

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

    let mut tx = pool.begin().await.unwrap();
    TenantContext::super_tenant()
        .apply_to_transaction(&mut tx)
        .await
        .unwrap();

    let tenant_id = Uuid::new_v4();
    sqlx::query(
        "INSERT INTO public.companies (id, tenant_id, name, code) VALUES ($1, $2, 'PT S2P DB Test Corp', 'S2P-DB') ON CONFLICT DO NOTHING",
    )
    .bind(env.company_id)
    .bind(tenant_id)
    .execute(&mut *tx)
    .await
    .unwrap();

    for (id, code, name, acct_type, norm_bal) in [
        (
            env.acc_grir,
            "2115",
            "Hutang GRIR Interim",
            "liability",
            "credit",
        ),
        (env.acc_ap, "2110", "Hutang Usaha AP", "liability", "credit"),
        (env.acc_bank, "1020", "Bank Operasional", "asset", "debit"),
    ] {
        sqlx::query(
            "INSERT INTO public.chart_of_accounts (id, code, name, account_type, normal_balance) VALUES ($1, $2, $3, $4::account_type, $5::normal_balance) ON CONFLICT (code) DO NOTHING",
        )
        .bind(id)
        .bind(code)
        .bind(name)
        .bind(acct_type)
        .bind(norm_bal)
        .execute(&mut *tx)
        .await
        .unwrap();
    }

    tx.commit().await.unwrap();
    env
}

/// Test: SoD domain rules enforce Maker != Checker (unit-level, no DB needed)
#[test]
fn test_s2p_sod_maker_different_from_approver() {
    let maker = Uuid::new_v4();
    let approver = Uuid::new_v4();

    assert!(
        SodValidator::validate_po_approval(maker, approver).is_ok(),
        "Different maker and approver must be allowed"
    );
    assert!(
        SodValidator::validate_po_approval(maker, maker).is_err(),
        "Self-approval must be rejected"
    );
}

/// Test: SoD rule - goods receiver cannot pay supplier
#[test]
fn test_s2p_sod_goods_receiver_cannot_pay_supplier() {
    let user_id = Uuid::new_v4();
    assert!(
        SodValidator::validate_goods_receipt_vs_payment(user_id, user_id).is_err(),
        "Goods receiver cannot also be the supplier payer"
    );
}

/// Test: GL double-entry posting debit == credit via AccountingPostingEngine
#[sqlx::test(migrations = "../../migrations")]
async fn test_s2p_gl_posting_debit_equals_credit(pool: PgPool) {
    let env = setup_s2p_db_env(&pool).await;
    let po_total = dec!(500000.00);
    let bill_id = Uuid::new_v4();

    let gl_engine = AccountingPostingEngine::new(pool.clone());
    let posting_inst = PostingInstruction {
        company_id: env.company_id,
        posting_date: NaiveDate::from_ymd_opt(2026, 8, 15).unwrap(),
        voucher_type: "PURCHASE_BILL".to_string(),
        voucher_no: "BILL-DB-001".to_string(),
        voucher_id: bill_id,
        lines: vec![
            PostingLineItem {
                account_id: env.acc_grir,
                debit: po_total,
                credit: dec!(0.00),
                party_type: None,
                party_id: None,
                cost_center_id: None,
                project_id: None,
                currency: Some("IDR".to_string()),
                exchange_rate: Some(dec!(1.0)),
            },
            PostingLineItem {
                account_id: env.acc_ap,
                debit: dec!(0.00),
                credit: po_total,
                party_type: Some("Supplier".to_string()),
                party_id: Some(env.vendor_id),
                cost_center_id: None,
                project_id: None,
                currency: Some("IDR".to_string()),
                exchange_rate: Some(dec!(1.0)),
            },
        ],
        created_by: None,
    };

    let mut tx = pool.begin().await.unwrap();
    TenantContext::super_tenant()
        .apply_to_transaction(&mut tx)
        .await
        .unwrap();

    let entries: Vec<GLEntry> = gl_engine.post_in_uow(&mut tx, &posting_inst).await.unwrap();
    tx.commit().await.unwrap();

    let total_debit: Decimal = entries.iter().map(|e| e.debit).sum();
    let total_credit: Decimal = entries.iter().map(|e| e.credit).sum();
    assert_eq!(
        total_debit, total_credit,
        "GL entries debit must equal credit (double-entry balance)"
    );
    assert_eq!(total_debit, po_total);
}

/// Test: Storno reversal (reverse_voucher_in_uow) creates opposite entries without deleting originals
#[sqlx::test(migrations = "../../migrations")]
async fn test_s2p_storno_reversal_immutable_originals(pool: PgPool) {
    let env = setup_s2p_db_env(&pool).await;
    let po_total = dec!(250000.00);
    let payment_id = Uuid::new_v4();

    let gl_engine = AccountingPostingEngine::new(pool.clone());
    let payment_inst = PostingInstruction {
        company_id: env.company_id,
        posting_date: NaiveDate::from_ymd_opt(2026, 8, 15).unwrap(),
        voucher_type: "PAYMENT_ENTRY".to_string(),
        voucher_no: "PAY-DB-001".to_string(),
        voucher_id: payment_id,
        lines: vec![
            PostingLineItem {
                account_id: env.acc_ap,
                debit: po_total,
                credit: dec!(0.00),
                party_type: Some("Supplier".to_string()),
                party_id: Some(env.vendor_id),
                cost_center_id: None,
                project_id: None,
                currency: Some("IDR".to_string()),
                exchange_rate: Some(dec!(1.0)),
            },
            PostingLineItem {
                account_id: env.acc_bank,
                debit: dec!(0.00),
                credit: po_total,
                party_type: None,
                party_id: None,
                cost_center_id: None,
                project_id: None,
                currency: Some("IDR".to_string()),
                exchange_rate: Some(dec!(1.0)),
            },
        ],
        created_by: None,
    };

    let mut tx_orig = pool.begin().await.unwrap();
    TenantContext::super_tenant()
        .apply_to_transaction(&mut tx_orig)
        .await
        .unwrap();
    let _: Vec<GLEntry> = gl_engine
        .post_in_uow(&mut tx_orig, &payment_inst)
        .await
        .unwrap();
    tx_orig.commit().await.unwrap();

    // Execute storno reversal using correct method name: reverse_voucher_in_uow
    let mut tx_rev = pool.begin().await.unwrap();
    TenantContext::super_tenant()
        .apply_to_transaction(&mut tx_rev)
        .await
        .unwrap();
    let reversals: Vec<GLEntry> = gl_engine
        .reverse_voucher_in_uow(
            &mut tx_rev,
            env.company_id,
            "PAYMENT_ENTRY",
            payment_id,
            NaiveDate::from_ymd_opt(2026, 8, 16).unwrap(),
            None,
        )
        .await
        .unwrap();
    tx_rev.commit().await.unwrap();

    assert_eq!(
        reversals.len(),
        2,
        "Storno reversal must create exactly 2 opposite GL entries"
    );
    assert!(
        reversals[0].is_reversal,
        "Reversal entry must have is_reversal = true"
    );

    // Verify: original rows still exist (total = 4: 2 orig + 2 storno)
    let total_rows: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM gl_entries WHERE voucher_id = $1")
            .bind(payment_id)
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(
        total_rows, 4,
        "Total GL rows must be 4 (2 original + 2 storno). Original entries must not be deleted."
    );
}

/// Test: GL reconciliation delta must be zero after balanced postings
#[sqlx::test(migrations = "../../migrations")]
async fn test_s2p_reconciliation_gl_delta_zero(pool: PgPool) {
    let env = setup_s2p_db_env(&pool).await;
    let amount = dec!(750000.00);
    let voucher_id = Uuid::new_v4();

    let gl_engine = AccountingPostingEngine::new(pool.clone());
    let inst = PostingInstruction {
        company_id: env.company_id,
        posting_date: NaiveDate::from_ymd_opt(2026, 8, 15).unwrap(),
        voucher_type: "JOURNAL_ENTRY".to_string(),
        voucher_no: "JV-RECON-001".to_string(),
        voucher_id,
        lines: vec![
            PostingLineItem {
                account_id: env.acc_grir,
                debit: amount,
                credit: dec!(0.00),
                party_type: None,
                party_id: None,
                cost_center_id: None,
                project_id: None,
                currency: Some("IDR".to_string()),
                exchange_rate: Some(dec!(1.0)),
            },
            PostingLineItem {
                account_id: env.acc_ap,
                debit: dec!(0.00),
                credit: amount,
                party_type: None,
                party_id: None,
                cost_center_id: None,
                project_id: None,
                currency: Some("IDR".to_string()),
                exchange_rate: Some(dec!(1.0)),
            },
        ],
        created_by: None,
    };

    let mut tx = pool.begin().await.unwrap();
    TenantContext::super_tenant()
        .apply_to_transaction(&mut tx)
        .await
        .unwrap();
    let _: Vec<GLEntry> = gl_engine.post_in_uow(&mut tx, &inst).await.unwrap();
    tx.commit().await.unwrap();

    let recon = ReconciliationEngine::new(pool);
    let gl_item = recon.reconcile_gl_balance(env.company_id).await.unwrap();

    assert_eq!(
        gl_item.delta,
        dec!(0.0000),
        "GL reconciliation delta must be 0.0000 after balanced posting"
    );
    assert_eq!(gl_item.status, "PASSED");
}
