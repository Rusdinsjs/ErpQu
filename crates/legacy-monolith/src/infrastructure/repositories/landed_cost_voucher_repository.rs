use sqlx::PgPool;
use uuid::Uuid;
use crate::domain::entities::landed_cost_voucher::{LandedCostVoucher, LandedCostItem};

pub struct LandedCostVoucherRepository {
    pool: PgPool,
}

impl LandedCostVoucherRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create_voucher(&self, voucher: &LandedCostVoucher) -> Result<LandedCostVoucher, sqlx::Error> {
        let mut tx = self.pool.begin().await?;

        let rec = sqlx::query!(
            r#"
            INSERT INTO landed_cost_vouchers (id, company_id, voucher_number, posting_date, total_freight_charge, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, company_id, voucher_number, posting_date, total_freight_charge, status, created_at
            "#,
            voucher.id,
            voucher.company_id,
            voucher.voucher_number,
            voucher.posting_date,
            voucher.total_freight_charge,
            voucher.status,
            voucher.created_at
        )
        .fetch_one(&mut *tx)
        .await?;

        let mut items = Vec::new();
        for item in &voucher.items {
            let item_rec = sqlx::query!(
                r#"
                INSERT INTO landed_cost_items (id, voucher_id, receipt_document_type, receipt_document_id, item_id, qty, applicable_charges)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id, voucher_id, receipt_document_type, receipt_document_id, item_id, qty, applicable_charges
                "#,
                item.id,
                item.voucher_id,
                item.receipt_document_type,
                item.receipt_document_id,
                item.item_id,
                item.qty,
                item.applicable_charges
            )
            .fetch_one(&mut *tx)
            .await?;

            items.push(LandedCostItem {
                id: item_rec.id,
                voucher_id: item_rec.voucher_id,
                receipt_document_type: item_rec.receipt_document_type,
                receipt_document_id: item_rec.receipt_document_id,
                item_id: item_rec.item_id,
                qty: item_rec.qty,
                applicable_charges: item_rec.applicable_charges,
                item_name: None,
            });
        }

        tx.commit().await?;

        Ok(LandedCostVoucher {
            id: rec.id,
            company_id: rec.company_id,
            voucher_number: rec.voucher_number,
            posting_date: rec.posting_date,
            total_freight_charge: rec.total_freight_charge,
            status: rec.status,
            created_at: rec.created_at,
            items,
        })
    }

    pub async fn list_vouchers(&self, company_id: Uuid) -> Result<Vec<LandedCostVoucher>, sqlx::Error> {
        let vouchers = sqlx::query!(
            r#"
            SELECT id, company_id, voucher_number, posting_date, total_freight_charge, status, created_at
            FROM landed_cost_vouchers
            WHERE company_id = $1
            ORDER BY created_at DESC
            "#,
            company_id
        )
        .fetch_all(&self.pool)
        .await?;

        let mut result = Vec::new();
        for v in vouchers {
            let items = sqlx::query!(
                r#"
                SELECT lci.id, lci.voucher_id, lci.receipt_document_type, lci.receipt_document_id, lci.item_id, lci.qty, lci.applicable_charges, i.name as item_name
                FROM landed_cost_items lci
                JOIN inventory_items i ON lci.item_id = i.id
                WHERE lci.voucher_id = $1
                "#,
                v.id
            )
            .fetch_all(&self.pool)
            .await?;

            let mapped_items = items.into_iter().map(|row| LandedCostItem {
                id: row.id,
                voucher_id: row.voucher_id,
                receipt_document_type: row.receipt_document_type,
                receipt_document_id: row.receipt_document_id,
                item_id: row.item_id,
                qty: row.qty,
                applicable_charges: row.applicable_charges,
                item_name: Some(row.item_name),
            }).collect();

            result.push(LandedCostVoucher {
                id: v.id,
                company_id: v.company_id,
                voucher_number: v.voucher_number,
                posting_date: v.posting_date,
                total_freight_charge: v.total_freight_charge,
                status: v.status,
                created_at: v.created_at,
                items: mapped_items,
            });
        }

        Ok(result)
    }

    pub async fn delete_voucher(&self, id: Uuid) -> Result<u64, sqlx::Error> {
        let result = sqlx::query!("DELETE FROM landed_cost_vouchers WHERE id = $1", id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected())
    }
}
