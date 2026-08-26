use crate::domain::entities::purchase_receipt::{PurchaseReceipt, PurchaseReceiptItem, PurchaseReceiptWithItems};
use crate::infrastructure::repositories::purchase_receipt_repository::PurchaseReceiptRepository;
use uuid::Uuid;
use chrono::Utc;
use rust_decimal::Decimal;

pub struct PurchaseReceiptService {
    repo: PurchaseReceiptRepository,
}

impl PurchaseReceiptService {
    pub fn new(repo: PurchaseReceiptRepository) -> Self {
        Self { repo }
    }

    pub async fn create_receipt(&self, mut receipt: PurchaseReceipt, mut items: Vec<PurchaseReceiptItem>) -> Result<PurchaseReceiptWithItems, String> {
        let now = Utc::now();
        if receipt.id.is_nil() {
            receipt.id = Uuid::new_v4();
        }
        receipt.created_at = now;
        receipt.status = "draft".to_string();

        for item in items.iter_mut() {
            if item.id.is_nil() {
                item.id = Uuid::new_v4();
            }
            item.receipt_id = receipt.id;
            
            // Calculate total amount
            if item.total_amount == Decimal::ZERO && item.unit_cost > Decimal::ZERO {
                item.total_amount = item.qty_received * item.unit_cost;
            }
        }

        self.repo.create_receipt(&receipt, &items).await.map_err(|e| e.to_string())
    }

    pub async fn list_receipts(&self, company_id: Uuid) -> Result<Vec<PurchaseReceipt>, String> {
        self.repo.find_all(company_id).await.map_err(|e| e.to_string())
    }

    pub async fn get_receipt(&self, id: Uuid) -> Result<Option<PurchaseReceiptWithItems>, String> {
        self.repo.find_by_id(id).await.map_err(|e| e.to_string())
    }

    pub async fn submit_receipt(&self, id: Uuid) -> Result<bool, String> {
        let rec_opt = self.get_receipt(id).await?;
        let rec_with_items = match rec_opt {
            Some(r) => r,
            None => return Err("Purchase Receipt not found".to_string()),
        };

        if rec_with_items.receipt.status == "SUBMITTED" {
            return Err("Purchase Receipt is already submitted".to_string());
        }

        let mut tx = self.repo.begin_transaction().await.map_err(|e| e.to_string())?;

        // 1. Update status
        sqlx::query!(
            "UPDATE purchase_receipts SET status = 'SUBMITTED' WHERE id = $1",
            id
        )
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

        // 2. Process Ledger and Bins
        let posting_date = rec_with_items.receipt.posting_date;
        let posting_datetime = Utc::now();
        let voucher_type = "Purchase Receipt";
        let voucher_no = rec_with_items.receipt.receipt_number.clone();
        let company_id = rec_with_items.receipt.company_id;
        let warehouse_id = rec_with_items.receipt.warehouse_id;

        for item in rec_with_items.items {
            let delta = item.qty_received;
            if delta <= Decimal::ZERO {
                continue;
            }

            // Inflow to warehouse
            let new_actual_qty = Self::upsert_bin(&mut tx, company_id, warehouse_id, item.item_id, delta).await?;
            Self::insert_sle(&mut tx, company_id, warehouse_id, item.item_id, posting_date, posting_datetime, delta, new_actual_qty, voucher_type, &voucher_no, id).await?;
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
