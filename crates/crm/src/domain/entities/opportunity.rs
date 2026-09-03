//! CRM Opportunity & Pipeline Entities (QCRM-002)

use chrono::{DateTime, NaiveDate, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Opportunity {
    pub id: Uuid,
    pub company_id: Uuid,
    pub lead_id: Option<Uuid>,
    pub title: String,
    pub estimated_value: Decimal,
    pub stage: String, // PROSPECTING, QUALIFICATION, PROPOSAL, WON, LOST
    pub expected_closing_date: Option<NaiveDate>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CreateOpportunityRequest {
    pub company_id: Option<Uuid>,
    pub lead_id: Option<Uuid>,
    pub title: String,
    pub estimated_value: Decimal,
    pub stage: Option<String>,
    pub expected_closing_date: Option<NaiveDate>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct UpdateOpportunityRequest {
    pub lead_id: Option<Uuid>,
    pub title: Option<String>,
    pub estimated_value: Option<Decimal>,
    pub stage: Option<String>,
    pub expected_closing_date: Option<NaiveDate>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct PipelineSummary {
    pub stage: String,
    pub count: i64,
    pub total_value: Decimal,
}
