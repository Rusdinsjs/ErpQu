use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Warehouse {
    pub id: Uuid,
    pub company_id: Uuid,
    pub parent_id: Option<Uuid>,
    pub code: String,
    pub name: String,
    pub is_active: bool,
    pub is_group: bool,
    pub is_frozen: bool,
    pub warehouse_type: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StockDashboardKpi {
    pub total_stock_valuation: rust_decimal::Decimal,
    pub total_warehouses: i64,
    pub low_stock_items: i64,
}
