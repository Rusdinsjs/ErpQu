use sqlx::PgPool;
use uuid::Uuid;
use crate::domain::entities::item_tracking::{SerialNumber, Batch};

pub struct ItemTrackingRepository {
    pool: PgPool,
}

impl ItemTrackingRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    // Serial Numbers
    pub async fn create_serial_number(&self, sn: &SerialNumber) -> Result<SerialNumber, sqlx::Error> {
        let rec = sqlx::query!(
            r#"
            INSERT INTO serial_numbers (id, company_id, serial_no, item_id, warehouse_id, status, warranty_expiry_date, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, company_id, serial_no, item_id, warehouse_id, status, warranty_expiry_date, created_at
            "#,
            sn.id,
            sn.company_id,
            sn.serial_no,
            sn.item_id,
            sn.warehouse_id,
            sn.status,
            sn.warranty_expiry_date,
            sn.created_at
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(SerialNumber {
            id: rec.id,
            company_id: rec.company_id,
            serial_no: rec.serial_no,
            item_id: rec.item_id,
            warehouse_id: rec.warehouse_id,
            status: rec.status,
            warranty_expiry_date: rec.warranty_expiry_date,
            created_at: rec.created_at,
            item_name: None,
            warehouse_name: None,
        })
    }

    pub async fn list_serial_numbers(&self, company_id: Uuid) -> Result<Vec<SerialNumber>, sqlx::Error> {
        let rows = sqlx::query!(
            r#"
            SELECT 
                s.id, s.company_id, s.serial_no, s.item_id, s.warehouse_id, s.status, s.warranty_expiry_date, s.created_at,
                i.name as item_name,
                w.name as warehouse_name
            FROM serial_numbers s
            JOIN inventory_items i ON s.item_id = i.id
            LEFT JOIN warehouses w ON s.warehouse_id = w.id
            WHERE s.company_id = $1
            ORDER BY s.created_at DESC
            "#,
            company_id
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(|row| SerialNumber {
            id: row.id,
            company_id: row.company_id,
            serial_no: row.serial_no,
            item_id: row.item_id,
            warehouse_id: row.warehouse_id,
            status: row.status,
            warranty_expiry_date: row.warranty_expiry_date,
            created_at: row.created_at,
            item_name: Some(row.item_name),
            warehouse_name: row.warehouse_name,
        }).collect())
    }

    pub async fn delete_serial_number(&self, id: Uuid) -> Result<u64, sqlx::Error> {
        let result = sqlx::query!(
            r#"
            DELETE FROM serial_numbers WHERE id = $1
            "#,
            id
        )
        .execute(&self.pool)
        .await?;
        Ok(result.rows_affected())
    }

    // Batches
    pub async fn create_batch(&self, batch: &Batch) -> Result<Batch, sqlx::Error> {
        let rec = sqlx::query!(
            r#"
            INSERT INTO batches (id, company_id, batch_no, item_id, manufacturing_date, expiry_date, qty, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, company_id, batch_no, item_id, manufacturing_date, expiry_date, qty, status, created_at
            "#,
            batch.id,
            batch.company_id,
            batch.batch_no,
            batch.item_id,
            batch.manufacturing_date,
            batch.expiry_date,
            batch.qty,
            batch.status,
            batch.created_at
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(Batch {
            id: rec.id,
            company_id: rec.company_id,
            batch_no: rec.batch_no,
            item_id: rec.item_id,
            manufacturing_date: rec.manufacturing_date,
            expiry_date: rec.expiry_date,
            qty: rec.qty,
            status: rec.status,
            created_at: rec.created_at,
            item_name: None,
        })
    }

    pub async fn list_batches(&self, company_id: Uuid) -> Result<Vec<Batch>, sqlx::Error> {
        let rows = sqlx::query!(
            r#"
            SELECT 
                b.id, b.company_id, b.batch_no, b.item_id, b.manufacturing_date, b.expiry_date, b.qty, b.status, b.created_at,
                i.name as item_name
            FROM batches b
            JOIN inventory_items i ON b.item_id = i.id
            WHERE b.company_id = $1
            ORDER BY b.created_at DESC
            "#,
            company_id
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(|row| Batch {
            id: row.id,
            company_id: row.company_id,
            batch_no: row.batch_no,
            item_id: row.item_id,
            manufacturing_date: row.manufacturing_date,
            expiry_date: row.expiry_date,
            qty: row.qty,
            status: row.status,
            created_at: row.created_at,
            item_name: Some(row.item_name),
        }).collect())
    }

    pub async fn delete_batch(&self, id: Uuid) -> Result<u64, sqlx::Error> {
        let result = sqlx::query!(
            r#"
            DELETE FROM batches WHERE id = $1
            "#,
            id
        )
        .execute(&self.pool)
        .await?;
        Ok(result.rows_affected())
    }
}
