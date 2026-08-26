use sqlx::{PgPool, Postgres, Transaction};
use uuid::Uuid;
use crate::domain::entities::purchase_receipt::{PurchaseReceipt, PurchaseReceiptItem, PurchaseReceiptWithItems};

pub struct PurchaseReceiptRepository {
    pool: PgPool,
}

impl PurchaseReceiptRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create_receipt(&self, receipt: &PurchaseReceipt, items: &[PurchaseReceiptItem]) -> Result<PurchaseReceiptWithItems, sqlx::Error> {
        let mut tx = self.pool.begin().await?;

        sqlx::query!(
            r#"
            INSERT INTO purchase_receipts (
                id, company_id, receipt_number, purchase_order_id, vendor_id, warehouse_id, 
                posting_date, status, notes, created_at, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            "#,
            receipt.id, receipt.company_id, receipt.receipt_number, receipt.purchase_order_id,
            receipt.vendor_id, receipt.warehouse_id, receipt.posting_date, receipt.status,
            receipt.notes, receipt.created_at, receipt.created_by
        )
        .execute(&mut *tx)
        .await?;

        for item in items {
            sqlx::query!(
                r#"
                INSERT INTO purchase_receipt_items (
                    id, receipt_id, item_id, qty_received, unit_cost, total_amount, 
                    po_line_id, batch_no, serial_no
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                "#,
                item.id, item.receipt_id, item.item_id, item.qty_received, item.unit_cost,
                item.total_amount, item.po_line_id, item.batch_no, item.serial_no
            )
            .execute(&mut *tx)
            .await?;
        }

        tx.commit().await?;

        Ok(PurchaseReceiptWithItems {
            receipt: receipt.clone(),
            items: items.to_vec(),
        })
    }

    pub async fn find_all(&self, company_id: Uuid) -> Result<Vec<PurchaseReceipt>, sqlx::Error> {
        sqlx::query_as!(
            PurchaseReceipt,
            r#"
            SELECT * FROM purchase_receipts 
            WHERE company_id = $1 
            ORDER BY created_at DESC
            "#,
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }

    pub async fn find_by_id(&self, id: Uuid) -> Result<Option<PurchaseReceiptWithItems>, sqlx::Error> {
        let rec = sqlx::query_as!(
            PurchaseReceipt,
            r#"
            SELECT * FROM purchase_receipts WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await?;

        if let Some(r) = rec {
            let items = sqlx::query_as!(
                PurchaseReceiptItem,
                r#"
                SELECT * FROM purchase_receipt_items WHERE receipt_id = $1
                "#,
                id
            )
            .fetch_all(&self.pool)
            .await?;

            Ok(Some(PurchaseReceiptWithItems {
                receipt: r,
                items,
            }))
        } else {
            Ok(None)
        }
    }

    pub async fn begin_transaction(&self) -> Result<Transaction<'_, Postgres>, sqlx::Error> {
        self.pool.begin().await
    }
}
