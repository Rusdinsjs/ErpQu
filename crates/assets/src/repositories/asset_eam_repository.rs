//! Asset EAM Repository
//!
//! Persistence for Asset Depreciation Schedules, Asset Transfers,
//! Asset Impairments, Asset Disposals, and Custody History (Append-Only).

use chrono::NaiveDate;
use rust_decimal::Decimal;
use sqlx::PgPool;
use uuid::Uuid;

use crate::domain::asset_eam::{AssetCustodyHistory, DepreciationScheduleItem};
use management_system_core::domain::errors::{DomainError, DomainResult};

#[derive(Clone)]
pub struct AssetEamRepository {
    pool: PgPool,
}

impl AssetEamRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Save depreciation schedule items for an asset
    pub async fn create_depreciation_schedules(
        &self,
        asset_id: Uuid,
        company_id: Option<Uuid>,
        items: &[DepreciationScheduleItem],
    ) -> DomainResult<()> {
        for item in items {
            sqlx::query(
                r#"
                INSERT INTO asset_depreciation_schedules
                    (id, asset_id, company_id, schedule_date, depreciation_amount,
                     accumulated_depreciation, remaining_book_value, status, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled', NOW())
                "#,
            )
            .bind(Uuid::new_v4())
            .bind(asset_id)
            .bind(company_id)
            .bind(item.schedule_date)
            .bind(item.depreciation_amount)
            .bind(item.accumulated_depreciation)
            .bind(item.remaining_book_value)
            .execute(&self.pool)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;
        }
        Ok(())
    }

    /// Record asset transfer and log custody history append-only
    pub async fn record_transfer(
        &self,
        asset_id: Uuid,
        company_id: Option<Uuid>,
        from_loc: Option<Uuid>,
        to_loc: Option<Uuid>,
        from_dept: Option<Uuid>,
        to_dept: Option<Uuid>,
        from_custodian: Option<Uuid>,
        to_custodian: Option<Uuid>,
        transferred_by: Option<Uuid>,
        notes: Option<String>,
    ) -> DomainResult<Uuid> {
        let transfer_id = Uuid::new_v4();

        let mut tx = self
            .pool
            .begin()
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        // 1. Insert into asset_transfers
        sqlx::query(
            r#"
            INSERT INTO asset_transfers
                (id, asset_id, company_id, from_location_id, to_location_id,
                 from_department_id, to_department_id, from_custodian_id, to_custodian_id,
                 transferred_at, transferred_by, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, $11)
            "#,
        )
        .bind(transfer_id)
        .bind(asset_id)
        .bind(company_id)
        .bind(from_loc)
        .bind(to_loc)
        .bind(from_dept)
        .bind(to_dept)
        .bind(from_custodian)
        .bind(to_custodian)
        .bind(transferred_by)
        .bind(&notes)
        .execute(&mut *tx)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        // 2. Append to asset_custody_histories (Append-Only)
        sqlx::query(
            r#"
            INSERT INTO asset_custody_histories
                (id, asset_id, custodian_user_id, department_id, location_id, assigned_at, assigned_by, notes)
            VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7)
            "#,
        )
        .bind(Uuid::new_v4())
        .bind(asset_id)
        .bind(to_custodian)
        .bind(to_dept)
        .bind(to_loc)
        .bind(transferred_by)
        .bind(&notes)
        .execute(&mut *tx)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        // 3. Update asset current location & department
        sqlx::query(
            r#"
            UPDATE assets
            SET location_id = COALESCE($1, location_id),
                department_id = COALESCE($2, department_id),
                updated_at = NOW()
            WHERE id = $3
            "#,
        )
        .bind(to_loc)
        .bind(to_dept)
        .bind(asset_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        tx.commit()
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(transfer_id)
    }

    /// Record asset impairment (IAS 36)
    pub async fn record_impairment(
        &self,
        asset_id: Uuid,
        company_id: Option<Uuid>,
        impairment_date: NaiveDate,
        amount: Decimal,
        journal_entry_id: Option<Uuid>,
        reason: &str,
        created_by: Option<Uuid>,
    ) -> DomainResult<Uuid> {
        let id = Uuid::new_v4();
        sqlx::query(
            r#"
            INSERT INTO asset_impairments
                (id, asset_id, company_id, impairment_date, impairment_amount, journal_entry_id, reason, created_by, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            "#,
        )
        .bind(id)
        .bind(asset_id)
        .bind(company_id)
        .bind(impairment_date)
        .bind(amount)
        .bind(journal_entry_id)
        .bind(reason)
        .bind(created_by)
        .execute(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(id)
    }

    /// Record asset disposal/sale
    pub async fn record_disposal(
        &self,
        asset_id: Uuid,
        company_id: Option<Uuid>,
        disposal_date: NaiveDate,
        disposal_type: &str,
        sale_amount: Decimal,
        book_value: Decimal,
        gain_loss_amount: Decimal,
        destination_account_id: Option<Uuid>,
        journal_entry_id: Option<Uuid>,
        reason: Option<String>,
        created_by: Option<Uuid>,
    ) -> DomainResult<Uuid> {
        let id = Uuid::new_v4();

        let mut tx = self
            .pool
            .begin()
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        sqlx::query(
            r#"
            INSERT INTO asset_disposals
                (id, asset_id, company_id, disposal_date, disposal_type, sale_amount,
                 book_value, gain_loss_amount, destination_account_id, journal_entry_id, reason, created_by, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
            "#,
        )
        .bind(id)
        .bind(asset_id)
        .bind(company_id)
        .bind(disposal_date)
        .bind(disposal_type)
        .bind(sale_amount)
        .bind(book_value)
        .bind(gain_loss_amount)
        .bind(destination_account_id)
        .bind(journal_entry_id)
        .bind(&reason)
        .bind(created_by)
        .execute(&mut *tx)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        // Update asset status to 'disposed' or 'sold'
        let new_status = if disposal_type == "sale" {
            "sold"
        } else {
            "disposed"
        };
        sqlx::query("UPDATE assets SET status = $1, updated_at = NOW() WHERE id = $2")
            .bind(new_status)
            .bind(asset_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        tx.commit()
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(id)
    }

    /// List append-only custody history for an asset
    pub async fn get_custody_history(
        &self,
        asset_id: Uuid,
    ) -> DomainResult<Vec<AssetCustodyHistory>> {
        let rows = sqlx::query_as::<_, AssetCustodyHistory>(
            r#"
            SELECT id, asset_id, custodian_user_id, department_id, location_id, assigned_at, assigned_by, notes
            FROM asset_custody_histories
            WHERE asset_id = $1
            ORDER BY assigned_at DESC
            "#,
        )
        .bind(asset_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e: sqlx::Error| DomainError::Database(e.to_string()))?;

        Ok(rows)
    }
}
