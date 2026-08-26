use sqlx::{PgPool, Postgres, Transaction};
use uuid::Uuid;
use crate::domain::entities::material_request::{MaterialRequest, MaterialRequestItem, MaterialRequestWithItems};

pub struct MaterialRequestRepository {
    pool: PgPool,
}

impl MaterialRequestRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create_request(&self, request: &MaterialRequest, items: &[MaterialRequestItem]) -> Result<MaterialRequestWithItems, sqlx::Error> {
        let mut tx = self.pool.begin().await?;

        sqlx::query!(
            r#"
            INSERT INTO inventory.material_requests (
                id, company_id, transaction_date, material_request_type, voucher_no, required_by_date, 
                status, remarks, created_at, created_by, updated_at, updated_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            "#,
            request.id, request.company_id, request.transaction_date, request.material_request_type,
            request.voucher_no, request.required_by_date, request.status, request.remarks,
            request.created_at, request.created_by, request.updated_at, request.updated_by
        )
        .execute(&mut *tx)
        .await?;

        for item in items {
            sqlx::query!(
                r#"
                INSERT INTO inventory.material_request_items (
                    id, material_request_id, item_id, warehouse_id,
                    qty, ordered_qty, received_qty, created_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                "#,
                item.id, item.material_request_id, item.item_id, item.warehouse_id,
                item.qty, item.ordered_qty, item.received_qty, item.created_at
            )
            .execute(&mut *tx)
            .await?;
        }

        tx.commit().await?;

        Ok(MaterialRequestWithItems {
            request: request.clone(),
            items: items.to_vec(),
        })
    }

    pub async fn find_all(&self, company_id: Uuid) -> Result<Vec<MaterialRequest>, sqlx::Error> {
        sqlx::query_as!(
            MaterialRequest,
            r#"
            SELECT * FROM inventory.material_requests 
            WHERE company_id = $1 
            ORDER BY created_at DESC
            "#,
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }

    pub async fn find_by_id(&self, id: Uuid) -> Result<Option<MaterialRequestWithItems>, sqlx::Error> {
        let req = sqlx::query_as!(
            MaterialRequest,
            r#"
            SELECT * FROM inventory.material_requests WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await?;

        if let Some(r) = req {
            let items = sqlx::query_as!(
                MaterialRequestItem,
                r#"
                SELECT * FROM inventory.material_request_items WHERE material_request_id = $1
                "#,
                id
            )
            .fetch_all(&self.pool)
            .await?;

            Ok(Some(MaterialRequestWithItems {
                request: r,
                items,
            }))
        } else {
            Ok(None)
        }
    }

    pub async fn update_status(&self, id: Uuid, status: &str) -> Result<(), sqlx::Error> {
        sqlx::query!(
            "UPDATE inventory.material_requests SET status = $1, updated_at = NOW() WHERE id = $2",
            status,
            id
        )
        .execute(&self.pool)
        .await?;
        Ok(())
    }
}
