use sqlx::PgPool;
use uuid::Uuid;
use crate::domain::entities::quality_inspection::QualityInspection;

pub struct QualityInspectionRepository {
    pool: PgPool,
}

impl QualityInspectionRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create_inspection(&self, inspection: &QualityInspection) -> Result<QualityInspection, sqlx::Error> {
        let rec = sqlx::query!(
            r#"
            INSERT INTO quality_inspections 
            (id, company_id, inspection_number, inspection_type, item_id, batch_no, sample_size, status, inspected_by, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, company_id, inspection_number, inspection_type, item_id, batch_no, sample_size, status, inspected_by, created_at
            "#,
            inspection.id,
            inspection.company_id,
            inspection.inspection_number,
            inspection.inspection_type,
            inspection.item_id,
            inspection.batch_no,
            inspection.sample_size,
            inspection.status,
            inspection.inspected_by,
            inspection.created_at
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(QualityInspection {
            id: rec.id,
            company_id: rec.company_id,
            inspection_number: rec.inspection_number,
            inspection_type: rec.inspection_type,
            item_id: rec.item_id,
            batch_no: rec.batch_no,
            sample_size: rec.sample_size,
            status: rec.status,
            inspected_by: rec.inspected_by,
            created_at: rec.created_at,
            item_name: None,
        })
    }

    pub async fn list_inspections(&self, company_id: Uuid) -> Result<Vec<QualityInspection>, sqlx::Error> {
        let rows = sqlx::query!(
            r#"
            SELECT 
                q.id, q.company_id, q.inspection_number, q.inspection_type, 
                q.item_id, q.batch_no, q.sample_size, q.status, q.inspected_by, q.created_at,
                i.name as item_name
            FROM quality_inspections q
            JOIN inventory_items i ON q.item_id = i.id
            WHERE q.company_id = $1
            ORDER BY q.created_at DESC
            "#,
            company_id
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(|row| QualityInspection {
            id: row.id,
            company_id: row.company_id,
            inspection_number: row.inspection_number,
            inspection_type: row.inspection_type,
            item_id: row.item_id,
            batch_no: row.batch_no,
            sample_size: row.sample_size,
            status: row.status,
            inspected_by: row.inspected_by,
            created_at: row.created_at,
            item_name: Some(row.item_name),
        }).collect())
    }

    pub async fn update_status(&self, id: Uuid, status: &str) -> Result<u64, sqlx::Error> {
        let result = sqlx::query!(
            "UPDATE quality_inspections SET status = $1 WHERE id = $2",
            status,
            id
        )
        .execute(&self.pool)
        .await?;
        
        Ok(result.rows_affected())
    }
}
