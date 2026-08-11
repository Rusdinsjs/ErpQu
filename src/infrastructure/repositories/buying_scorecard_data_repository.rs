use sqlx::PgPool;
use uuid::Uuid;
use crate::domain::entities::buying_scorecard_data::*;

pub struct BuyingScorecardDataRepository {
    pool: PgPool,
}

impl BuyingScorecardDataRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    // --- Supplier Scorecard ---
    pub async fn create_supplier_scorecard(&self, req: CreateSupplierScorecardRequest, company_id: Uuid) -> Result<SupplierScorecard, sqlx::Error> {
        sqlx::query_as!(
            SupplierScorecard,
            r#"
            INSERT INTO supplier_scorecards (company_id, vendor_id, evaluation_date, score, status, remarks)
            VALUES ($1, $2, COALESCE($3, CURRENT_DATE), $4, COALESCE($5, 'Approved'), $6)
            RETURNING id, company_id, vendor_id, evaluation_date, score, status, remarks, created_at
            "#,
            company_id, req.vendor_id, req.evaluation_date, req.score, req.status, req.remarks
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_supplier_scorecards(&self, company_id: Uuid) -> Result<Vec<SupplierScorecard>, sqlx::Error> {
        sqlx::query_as!(
            SupplierScorecard,
            "SELECT * FROM supplier_scorecards WHERE company_id = $1 ORDER BY created_at DESC",
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }

    // --- Supplier Scorecard Variable ---
    pub async fn create_supplier_scorecard_variable(&self, req: CreateSupplierScorecardVariableRequest, company_id: Uuid) -> Result<SupplierScorecardVariable, sqlx::Error> {
        sqlx::query_as!(
            SupplierScorecardVariable,
            r#"
            INSERT INTO supplier_scorecard_variables (company_id, name, param_type, weight)
            VALUES ($1, $2, COALESCE($3, 'Delivery Time'), COALESCE($4, 1.00))
            RETURNING id, company_id, name, param_type, weight, created_at
            "#,
            company_id, req.name, req.param_type, req.weight
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_supplier_scorecard_variables(&self, company_id: Uuid) -> Result<Vec<SupplierScorecardVariable>, sqlx::Error> {
        sqlx::query_as!(
            SupplierScorecardVariable,
            "SELECT * FROM supplier_scorecard_variables WHERE company_id = $1 ORDER BY created_at DESC",
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }

    // --- Supplier Scorecard Criteria ---
    pub async fn create_supplier_scorecard_criteria(&self, req: CreateSupplierScorecardCriteriaRequest, company_id: Uuid) -> Result<SupplierScorecardCriteria, sqlx::Error> {
        sqlx::query_as!(
            SupplierScorecardCriteria,
            r#"
            INSERT INTO supplier_scorecard_criteria (company_id, criteria_name, max_score, formula)
            VALUES ($1, $2, COALESCE($3, 100.00), $4)
            RETURNING id, company_id, criteria_name, max_score, formula, created_at
            "#,
            company_id, req.criteria_name, req.max_score, req.formula
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_supplier_scorecard_criteria(&self, company_id: Uuid) -> Result<Vec<SupplierScorecardCriteria>, sqlx::Error> {
        sqlx::query_as!(
            SupplierScorecardCriteria,
            "SELECT * FROM supplier_scorecard_criteria WHERE company_id = $1 ORDER BY created_at DESC",
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }

    // --- Supplier Scorecard Standing ---
    pub async fn create_supplier_scorecard_standing(&self, req: CreateSupplierScorecardStandingRequest, company_id: Uuid) -> Result<SupplierScorecardStanding, sqlx::Error> {
        sqlx::query_as!(
            SupplierScorecardStanding,
            r#"
            INSERT INTO supplier_scorecard_standings (company_id, standing_name, min_score, max_score, prevent_po)
            VALUES ($1, $2, COALESCE($3, 0.00), COALESCE($4, 100.00), COALESCE($5, false))
            RETURNING id, company_id, standing_name, min_score, max_score, prevent_po, created_at
            "#,
            company_id, req.standing_name, req.min_score, req.max_score, req.prevent_po
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_supplier_scorecard_standings(&self, company_id: Uuid) -> Result<Vec<SupplierScorecardStanding>, sqlx::Error> {
        sqlx::query_as!(
            SupplierScorecardStanding,
            "SELECT * FROM supplier_scorecard_standings WHERE company_id = $1 ORDER BY created_at DESC",
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }
}
