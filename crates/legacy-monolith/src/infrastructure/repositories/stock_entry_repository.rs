use sqlx::{PgPool, Postgres, Transaction};
use uuid::Uuid;
use crate::domain::entities::stock_entry::{StockEntry, StockEntryItem, StockEntryWithItems};
use rust_decimal::Decimal;

pub struct StockEntryRepository {
    pool: PgPool,
}

impl StockEntryRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create_entry(&self, entry: &StockEntry, items: &[StockEntryItem]) -> Result<StockEntryWithItems, sqlx::Error> {
        let mut tx = self.pool.begin().await?;

        sqlx::query!(
            r#"
            INSERT INTO inventory.stock_entries (
                id, company_id, posting_date, posting_time, stock_entry_type, voucher_no, purpose, 
                source_warehouse_id, target_warehouse_id, status, remarks, created_at, created_by, updated_at, updated_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            "#,
            entry.id, entry.company_id, entry.posting_date, entry.posting_time, entry.stock_entry_type,
            entry.voucher_no, entry.purpose, entry.source_warehouse_id, entry.target_warehouse_id,
            entry.status, entry.remarks, entry.created_at, entry.created_by, entry.updated_at, entry.updated_by
        )
        .execute(&mut *tx)
        .await?;

        for item in items {
            sqlx::query!(
                r#"
                INSERT INTO inventory.stock_entry_items (
                    id, stock_entry_id, item_id, source_warehouse_id, target_warehouse_id,
                    qty, basic_rate, amount, batch_no, serial_no, created_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                "#,
                item.id, item.stock_entry_id, item.item_id, item.source_warehouse_id, item.target_warehouse_id,
                item.qty, item.basic_rate, item.amount, item.batch_no, item.serial_no, item.created_at
            )
            .execute(&mut *tx)
            .await?;
        }

        tx.commit().await?;

        Ok(StockEntryWithItems {
            entry: entry.clone(),
            items: items.to_vec(),
        })
    }

    pub async fn find_all(&self, company_id: Uuid) -> Result<Vec<StockEntry>, sqlx::Error> {
        sqlx::query_as!(
            StockEntry,
            r#"
            SELECT * FROM inventory.stock_entries 
            WHERE company_id = $1 
            ORDER BY created_at DESC
            "#,
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }

    pub async fn find_by_id(&self, id: Uuid) -> Result<Option<StockEntryWithItems>, sqlx::Error> {
        let entry = sqlx::query_as!(
            StockEntry,
            r#"
            SELECT * FROM inventory.stock_entries WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await?;

        if let Some(e) = entry {
            let items = sqlx::query_as!(
                StockEntryItem,
                r#"
                SELECT * FROM inventory.stock_entry_items WHERE stock_entry_id = $1
                "#,
                id
            )
            .fetch_all(&self.pool)
            .await?;

            Ok(Some(StockEntryWithItems {
                entry: e,
                items,
            }))
        } else {
            Ok(None)
        }
    }

    pub async fn update_status(&self, id: Uuid, status: &str) -> Result<(), sqlx::Error> {
        sqlx::query!(
            "UPDATE inventory.stock_entries SET status = $1, updated_at = NOW() WHERE id = $2",
            status,
            id
        )
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    pub async fn begin_transaction(&self) -> Result<Transaction<'_, Postgres>, sqlx::Error> {
        self.pool.begin().await
    }
}
