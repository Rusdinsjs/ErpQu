//! CRM Opportunity & Pipeline Repository (QCRM-002)

use sqlx::PgPool;
use uuid::Uuid;

use crate::domain::entities::opportunity::{
    Opportunity, PipelineSummary, UpdateOpportunityRequest,
};

#[derive(Clone)]
pub struct OpportunityRepository {
    pool: PgPool,
}

impl OpportunityRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, opp: &Opportunity) -> Result<Opportunity, sqlx::Error> {
        sqlx::query_as::<_, Opportunity>(
            r#"
            INSERT INTO opportunities (id, company_id, lead_id, title, estimated_value, stage, expected_closing_date, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, company_id, lead_id, title, estimated_value, stage, expected_closing_date, created_at
            "#,
        )
        .bind(opp.id)
        .bind(opp.company_id)
        .bind(opp.lead_id)
        .bind(&opp.title)
        .bind(opp.estimated_value)
        .bind(&opp.stage)
        .bind(opp.expected_closing_date)
        .bind(opp.created_at)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn find_by_id(&self, id: Uuid) -> Result<Option<Opportunity>, sqlx::Error> {
        sqlx::query_as::<_, Opportunity>(
            r#"
            SELECT id, company_id, lead_id, title, estimated_value, stage, expected_closing_date, created_at
            FROM opportunities
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
    }

    pub async fn list_by_company(&self, company_id: Uuid) -> Result<Vec<Opportunity>, sqlx::Error> {
        sqlx::query_as::<_, Opportunity>(
            r#"
            SELECT id, company_id, lead_id, title, estimated_value, stage, expected_closing_date, created_at
            FROM opportunities
            WHERE company_id = $1
            ORDER BY created_at DESC
            "#,
        )
        .bind(company_id)
        .fetch_all(&self.pool)
        .await
    }

    pub async fn update(
        &self,
        id: Uuid,
        req: &UpdateOpportunityRequest,
    ) -> Result<Option<Opportunity>, sqlx::Error> {
        sqlx::query_as::<_, Opportunity>(
            r#"
            UPDATE opportunities
            SET lead_id = COALESCE($2, lead_id),
                title = COALESCE($3, title),
                estimated_value = COALESCE($4, estimated_value),
                stage = COALESCE($5, stage),
                expected_closing_date = COALESCE($6, expected_closing_date)
            WHERE id = $1
            RETURNING id, company_id, lead_id, title, estimated_value, stage, expected_closing_date, created_at
            "#,
        )
        .bind(id)
        .bind(req.lead_id)
        .bind(&req.title)
        .bind(req.estimated_value)
        .bind(&req.stage)
        .bind(req.expected_closing_date)
        .fetch_optional(&self.pool)
        .await
    }

    pub async fn delete(&self, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM opportunities WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected() > 0)
    }

    pub async fn get_pipeline_summary(
        &self,
        company_id: Uuid,
    ) -> Result<Vec<PipelineSummary>, sqlx::Error> {
        sqlx::query_as::<_, PipelineSummary>(
            r#"
            SELECT stage, COUNT(*)::bigint AS count, COALESCE(SUM(estimated_value), 0) AS total_value
            FROM opportunities
            WHERE company_id = $1
            GROUP BY stage
            ORDER BY stage
            "#,
        )
        .bind(company_id)
        .fetch_all(&self.pool)
        .await
    }
}
