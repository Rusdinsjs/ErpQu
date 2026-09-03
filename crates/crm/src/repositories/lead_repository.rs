//! CRM Lead Repository (QCRM-001)

use sqlx::PgPool;
use uuid::Uuid;

use crate::domain::entities::lead::{Lead, UpdateLeadRequest};

#[derive(Clone)]
pub struct LeadRepository {
    pool: PgPool,
}

impl LeadRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, lead: &Lead) -> Result<Lead, sqlx::Error> {
        sqlx::query_as::<_, Lead>(
            r#"
            INSERT INTO leads (id, company_id, lead_name, organization_name, email, phone, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, company_id, lead_name, organization_name, email, phone, status, created_at
            "#,
        )
        .bind(lead.id)
        .bind(lead.company_id)
        .bind(&lead.lead_name)
        .bind(&lead.organization_name)
        .bind(&lead.email)
        .bind(&lead.phone)
        .bind(&lead.status)
        .bind(lead.created_at)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn find_by_id(&self, id: Uuid) -> Result<Option<Lead>, sqlx::Error> {
        sqlx::query_as::<_, Lead>(
            r#"
            SELECT id, company_id, lead_name, organization_name, email, phone, status, created_at
            FROM leads
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
    }

    pub async fn list_by_company(&self, company_id: Uuid) -> Result<Vec<Lead>, sqlx::Error> {
        sqlx::query_as::<_, Lead>(
            r#"
            SELECT id, company_id, lead_name, organization_name, email, phone, status, created_at
            FROM leads
            WHERE company_id = $1
            ORDER BY created_at DESC
            "#,
        )
        .bind(company_id)
        .fetch_all(&self.pool)
        .await
    }

    pub async fn update(&self, id: Uuid, req: &UpdateLeadRequest) -> Result<Option<Lead>, sqlx::Error> {
        sqlx::query_as::<_, Lead>(
            r#"
            UPDATE leads
            SET lead_name = COALESCE($2, lead_name),
                organization_name = COALESCE($3, organization_name),
                email = COALESCE($4, email),
                phone = COALESCE($5, phone),
                status = COALESCE($6, status)
            WHERE id = $1
            RETURNING id, company_id, lead_name, organization_name, email, phone, status, created_at
            "#,
        )
        .bind(id)
        .bind(&req.lead_name)
        .bind(&req.organization_name)
        .bind(&req.email)
        .bind(&req.phone)
        .bind(&req.status)
        .fetch_optional(&self.pool)
        .await
    }

    pub async fn delete(&self, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM leads WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected() > 0)
    }
}
