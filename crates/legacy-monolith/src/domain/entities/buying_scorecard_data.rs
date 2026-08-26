use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc, NaiveDate};
use uuid::Uuid;
use bigdecimal::BigDecimal;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SupplierScorecard {
    pub id: Uuid,
    pub company_id: Uuid,
    pub vendor_id: Uuid,
    pub evaluation_date: NaiveDate,
    pub score: BigDecimal,
    pub status: Option<String>,
    pub remarks: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SupplierScorecardVariable {
    pub id: Uuid,
    pub company_id: Uuid,
    pub name: String,
    pub param_type: Option<String>,
    pub weight: Option<BigDecimal>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SupplierScorecardCriteria {
    pub id: Uuid,
    pub company_id: Uuid,
    pub criteria_name: String,
    pub max_score: Option<BigDecimal>,
    pub formula: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SupplierScorecardStanding {
    pub id: Uuid,
    pub company_id: Uuid,
    pub standing_name: String,
    pub min_score: Option<BigDecimal>,
    pub max_score: Option<BigDecimal>,
    pub prevent_po: Option<bool>,
    pub created_at: DateTime<Utc>,
}

// DTOs

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSupplierScorecardRequest {
    pub vendor_id: Uuid,
    pub evaluation_date: Option<NaiveDate>,
    pub score: BigDecimal,
    pub status: Option<String>,
    pub remarks: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSupplierScorecardVariableRequest {
    pub name: String,
    pub param_type: Option<String>,
    pub weight: Option<BigDecimal>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSupplierScorecardCriteriaRequest {
    pub criteria_name: String,
    pub max_score: Option<BigDecimal>,
    pub formula: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSupplierScorecardStandingRequest {
    pub standing_name: String,
    pub min_score: Option<BigDecimal>,
    pub max_score: Option<BigDecimal>,
    pub prevent_po: Option<bool>,
}
