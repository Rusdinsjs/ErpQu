//! Account Mapping entities for configurable account code resolution (QSEC-ACMAP-001)
//!
//! Replaces hardcoded account codes (e.g. "1-1300", "4-1100") with per-company
//! configurable mappings via symbolic keys.

use chrono::{DateTime, Utc};
use management_system_macros::DocType;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Standard mapping keys used throughout the system
pub mod mapping_keys {
    pub const ACCOUNTS_RECEIVABLE: &str = "ACCOUNTS_RECEIVABLE";
    pub const SALES_REVENUE: &str = "SALES_REVENUE";
    pub const ACCOUNTS_PAYABLE: &str = "ACCOUNTS_PAYABLE";
    pub const OPERATING_EXPENSE: &str = "OPERATING_EXPENSE";
    pub const VAT_OUTPUT: &str = "VAT_OUTPUT";
    pub const VAT_INPUT: &str = "VAT_INPUT";
    pub const RETAINED_EARNINGS: &str = "RETAINED_EARNINGS";
}

#[derive(Debug, Clone, Serialize, Deserialize, DocType)]
#[doctype(module = "Finance", description = "Entity AccountMapping")]
pub struct AccountMapping {
    pub id: Uuid,
    pub company_id: Uuid,
    pub mapping_key: String,
    pub account_id: Uuid,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, DocType)]
#[doctype(module = "Finance", description = "Entity CreateAccountMappingRequest")]
pub struct CreateAccountMappingRequest {
    pub company_id: Uuid,
    pub mapping_key: String,
    pub account_id: Uuid,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize, DocType)]
#[doctype(module = "Finance", description = "Entity UpdateAccountMappingRequest")]
pub struct UpdateAccountMappingRequest {
    pub account_id: Uuid,
    pub description: Option<String>,
}
