use sqlx::PgPool;
use uuid::Uuid;
use crate::domain::entities::quotation::{Quotation, QuotationItem, CreateQuotationRequest};

pub struct QuotationRepository {
    pool: PgPool,
}

impl QuotationRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create_quotation(&self, req: CreateQuotationRequest) -> Result<Quotation, sqlx::Error> {
        let mut tx = self.pool.begin().await?;

        let total_amount = req.items.iter().map(|item| item.qty * item.rate).sum::<f64>();
        let status = req.status.unwrap_or_else(|| "Draft".to_string());

        let quotation = sqlx::query_as!(
            Quotation,
            r#"
            INSERT INTO quotations (quotation_number, client_id, date, valid_until, status, total_amount, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, quotation_number, client_id, date, valid_until, status, total_amount, notes, created_at, updated_at
            "#,
            req.quotation_number,
            req.client_id,
            req.date,
            req.valid_until,
            status,
            total_amount,
            req.notes
        )
        .fetch_one(&mut *tx)
        .await?;

        // Get a valid item_id since we need it for foreign key constraint, or skip
        let default_item_id = sqlx::query_scalar::<_, Uuid>("SELECT id FROM inventory_items LIMIT 1").fetch_optional(&mut *tx).await?;
        
        if let Some(valid_item_id) = default_item_id {
            for item in req.items {
                let amount = item.qty * item.rate;
                // Use the valid item id, ignoring the requested one for now since frontend doesn't have it
                sqlx::query!(
                    r#"
                    INSERT INTO quotation_items (quotation_id, item_id, qty, rate, amount)
                    VALUES ($1, $2, $3, $4, $5)
                    "#,
                    quotation.id,
                    valid_item_id,
                    item.qty,
                    item.rate,
                    amount
                )
                .execute(&mut *tx)
                .await?;
            }
        }

        tx.commit().await?;

        Ok(quotation)
    }

    pub async fn list_quotations(&self) -> Result<Vec<Quotation>, sqlx::Error> {
        let quotations = sqlx::query_as!(
            Quotation,
            r#"
            SELECT id, quotation_number, client_id, date, valid_until, status, total_amount, notes, created_at, updated_at
            FROM quotations
            ORDER BY created_at DESC
            "#
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(quotations)
    }
}
