use crate::domain::entities::stock_entry::{StockEntry, StockEntryItem, StockEntryWithItems};
use crate::infrastructure::repositories::stock_entry_repository::StockEntryRepository;
use uuid::Uuid;
use chrono::Utc;
use rust_decimal::Decimal;

pub struct StockEntryService {
    repo: StockEntryRepository,
}

impl StockEntryService {
    pub fn new(repo: StockEntryRepository) -> Self {
        Self { repo }
    }

    pub async fn create_entry(&self, mut entry: StockEntry, mut items: Vec<StockEntryItem>) -> Result<StockEntryWithItems, String> {
        let now = Utc::now();
        if entry.id.is_nil() {
            entry.id = Uuid::new_v4();
        }
        entry.created_at = now;
        entry.updated_at = now;
        entry.status = "DRAFT".to_string();

        for item in items.iter_mut() {
            if item.id.is_nil() {
                item.id = Uuid::new_v4();
            }
            item.stock_entry_id = entry.id;
            item.created_at = now;
            // auto calc amount
            if item.amount == Decimal::ZERO && item.basic_rate > Decimal::ZERO {
                item.amount = item.qty * item.basic_rate;
            }
        }

        self.repo.create_entry(&entry, &items).await.map_err(|e| e.to_string())
    }

    pub async fn list_entries(&self, company_id: Uuid) -> Result<Vec<StockEntry>, String> {
        self.repo.find_all(company_id).await.map_err(|e| e.to_string())
    }

    pub async fn get_entry(&self, id: Uuid) -> Result<Option<StockEntryWithItems>, String> {
        self.repo.find_by_id(id).await.map_err(|e| e.to_string())
    }

    pub async fn submit_entry(&self, id: Uuid) -> Result<bool, String> {
        let entry_opt = self.get_entry(id).await?;
        let entry_with_items = match entry_opt {
            Some(e) => e,
            None => return Err("Stock Entry not found".to_string()),
        };

        if entry_with_items.entry.status == "SUBMITTED" {
            return Err("Stock Entry is already submitted".to_string());
        }

        let mut tx = self.repo.begin_transaction().await.map_err(|e| e.to_string())?;

        // 1. Update status
        sqlx::query!(
            "UPDATE inventory.stock_entries SET status = 'SUBMITTED', updated_at = NOW() WHERE id = $1",
            id
        )
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

        // 2. Process Ledger and Bins
        let posting_date = entry_with_items.entry.posting_date;
        let posting_datetime = Utc::now();
        let voucher_type = "Stock Entry";
        let voucher_no = entry_with_items.entry.voucher_no.clone();

        for item in entry_with_items.items {
            // MATERIAL_RECEIPT (target only), MATERIAL_ISSUE (source only), MATERIAL_TRANSFER (both)
            let mut qty_delta = Decimal::ZERO;

            if let Some(target_wh) = item.target_warehouse_id {
                // Inflow
                let delta = item.qty;
                // Upsert bin for target
                let new_actual_qty = Self::upsert_bin(&mut tx, entry_with_items.entry.company_id, target_wh, item.item_id, delta).await?;
                // Insert SLE
                Self::insert_sle(&mut tx, entry_with_items.entry.company_id, target_wh, item.item_id, posting_date, posting_datetime, delta, new_actual_qty, voucher_type, &voucher_no, id).await?;
            }

            if let Some(source_wh) = item.source_warehouse_id {
                // Outflow
                let delta = -item.qty;
                // Upsert bin for source
                let new_actual_qty = Self::upsert_bin(&mut tx, entry_with_items.entry.company_id, source_wh, item.item_id, delta).await?;
                if new_actual_qty < Decimal::ZERO {
                    // Check if negative stock is allowed (optional config). For now, strict!
                    return Err(format!("Insufficient stock for item {} in warehouse {}", item.item_id, source_wh));
                }
                // Insert SLE
                Self::insert_sle(&mut tx, entry_with_items.entry.company_id, source_wh, item.item_id, posting_date, posting_datetime, delta, new_actual_qty, voucher_type, &voucher_no, id).await?;
            }
        }

        tx.commit().await.map_err(|e| e.to_string())?;

        Ok(true)
    }

    async fn upsert_bin(
        tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
        company_id: Uuid,
        warehouse_id: Uuid,
        item_id: Uuid,
        delta: Decimal,
    ) -> Result<Decimal, String> {
        let result = sqlx::query!(
            r#"
            INSERT INTO bins (company_id, warehouse_id, item_id, actual_qty, updated_at)
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (company_id, warehouse_id, item_id)
            DO UPDATE SET actual_qty = bins.actual_qty + EXCLUDED.actual_qty, updated_at = NOW()
            RETURNING actual_qty
            "#,
            company_id, warehouse_id, item_id, delta
        )
        .fetch_one(&mut **tx)
        .await
        .map_err(|e| e.to_string())?;

        Ok(result.actual_qty)
    }

    async fn insert_sle(
        tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
        company_id: Uuid,
        warehouse_id: Uuid,
        item_id: Uuid,
        posting_date: chrono::NaiveDate,
        posting_datetime: chrono::DateTime<chrono::Utc>,
        qty_delta: Decimal,
        qty_after: Decimal,
        voucher_type: &str,
        voucher_no: &str,
        voucher_id: Uuid,
    ) -> Result<(), String> {
        sqlx::query!(
            r#"
            INSERT INTO stock_ledger_entries (
                company_id, warehouse_id, item_id, posting_date, posting_datetime,
                actual_qty_delta, qty_after, voucher_type, voucher_no, voucher_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            "#,
            company_id, warehouse_id, item_id, posting_date, posting_datetime,
            qty_delta, qty_after, voucher_type, voucher_no, voucher_id
        )
        .execute(&mut **tx)
        .await
        .map_err(|e| e.to_string())?;

        Ok(())
    }
}
