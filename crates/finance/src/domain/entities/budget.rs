//! Budget Domain Entities (QACC-010)
//!
//! Handles budget configurations, account allocations, and real-time variance calculations.

use chrono::{DateTime, Utc};
use management_system_macros::DocType;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, DocType)]
#[doctype(module = "Finance", description = "Entity Budget")]
pub struct Budget {
    pub id: Uuid,
    pub company_id: Option<Uuid>,
    pub cost_center_id: Option<Uuid>,
    pub fiscal_year: String,
    pub monthly_distribution: Option<String>,
    pub action_if_accumulated_monthly_budget_exceeded: Option<String>,
    pub action_if_annual_budget_exceeded: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, DocType)]
#[doctype(module = "Finance", description = "Entity BudgetAccount")]
pub struct BudgetAccount {
    pub id: Uuid,
    pub budget_id: Uuid,
    pub account_id: Option<Uuid>,
    pub budget_amount: Decimal,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, DocType)]
#[doctype(module = "Finance", description = "Entity CreateBudgetAccountItem")]
pub struct CreateBudgetAccountItem {
    pub account_id: Uuid,
    pub budget_amount: Decimal,
}

#[derive(Debug, Deserialize, DocType)]
#[doctype(module = "Finance", description = "Entity CreateBudgetRequest")]
pub struct CreateBudgetRequest {
    pub company_id: Option<Uuid>,
    pub cost_center_id: Option<Uuid>,
    pub fiscal_year: String,
    pub monthly_distribution: Option<String>,
    pub action_if_annual_budget_exceeded: Option<String>,
    pub accounts: Vec<CreateBudgetAccountItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize, DocType)]
#[doctype(module = "Finance", description = "Entity BudgetVarianceReport")]
pub struct BudgetVarianceReport {
    pub budget_id: Uuid,
    pub cost_center_name: String,
    pub fiscal_year: String,
    pub account_id: Option<Uuid>,
    pub account_code: String,
    pub account_name: String,
    pub budget_amount: Decimal,
    pub actual_spent: Decimal,
    pub variance: Decimal,
    pub utilization_percentage: Decimal,
    pub status: String,
}
