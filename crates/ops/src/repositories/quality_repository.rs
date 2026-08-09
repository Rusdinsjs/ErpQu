use crate::domain::manufacturing_pos::QualityInspection;
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Clone)]
pub struct QualityRepository {
    pool: PgPool,
}

impl QualityRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create_quality_inspection(
        &self,
        inspection: &QualityInspection,
    ) -> Result<QualityInspection, sqlx::Error> {
        sqlx::query_as::<_, QualityInspection>(
            "INSERT INTO public.quality_inspections (id, company_id, inspection_number, inspection_type, item_id, batch_no, sample_size, status, inspected_by, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *"
        )
        .bind(inspection.id)
        .bind(inspection.company_id)
        .bind(&inspection.inspection_number)
        .bind(&inspection.inspection_type)
        .bind(inspection.item_id)
        .bind(&inspection.batch_no)
        .bind(inspection.sample_size)
        .bind(&inspection.status)
        .bind(inspection.inspected_by)
        .bind(inspection.created_at)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn get_quality_inspection(&self, id: Uuid) -> Result<Option<QualityInspection>, sqlx::Error> {
        sqlx::query_as::<_, QualityInspection>(
            "SELECT * FROM public.quality_inspections WHERE id = $1"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
    }

    pub async fn list_quality_inspections(&self, company_id: Uuid) -> Result<Vec<QualityInspection>, sqlx::Error> {
        sqlx::query_as::<_, QualityInspection>(
            "SELECT * FROM public.quality_inspections WHERE company_id = $1 ORDER BY created_at DESC"
        )
        .bind(company_id)
        .fetch_all(&self.pool)
        .await
    }

    pub async fn update_quality_inspection_status(
        &self,
        id: Uuid,
        status: &str,
    ) -> Result<QualityInspection, sqlx::Error> {
        sqlx::query_as::<_, QualityInspection>(
            "UPDATE public.quality_inspections SET status = $2 WHERE id = $1 RETURNING *"
        )
        .bind(id)
        .bind(status)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn get_latest_inspection_for_item_and_batch(
        &self,
        item_id: Uuid,
        batch_no: Option<&str>,
    ) -> Result<Option<QualityInspection>, sqlx::Error> {
        if let Some(batch) = batch_no {
            sqlx::query_as::<_, QualityInspection>(
                "SELECT * FROM public.quality_inspections 
                 WHERE item_id = $1 AND batch_no = $2 
                 ORDER BY created_at DESC LIMIT 1"
            )
            .bind(item_id)
            .bind(batch)
            .fetch_optional(&self.pool)
            .await
        } else {
            sqlx::query_as::<_, QualityInspection>(
                "SELECT * FROM public.quality_inspections 
                 WHERE item_id = $1 AND batch_no IS NULL 
                 ORDER BY created_at DESC LIMIT 1"
            )
            .bind(item_id)
            .fetch_optional(&self.pool)
            .await
        }
    }
}
