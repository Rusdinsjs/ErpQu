use sqlx::PgPool;
use uuid::Uuid;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct StockSettings {
    pub id: Uuid,
    pub company_id: Uuid,
    pub default_valuation_method: Option<String>,
    pub allow_negative_stock: Option<bool>,
    pub auto_reorder_level: Option<bool>,
    pub created_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct UpsertStockSettingsDto {
    pub default_valuation_method: Option<String>,
    pub allow_negative_stock: Option<bool>,
    pub auto_reorder_level: Option<bool>,
}

#[derive(Clone)]
pub struct StockSettingsRepository {
    pool: PgPool,
}

impl StockSettingsRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn get_settings(&self, company_id: Uuid) -> Result<StockSettings, sqlx::Error> {
        let row = sqlx::query_as::<_, StockSettings>(
            r#"
            SELECT id, company_id, default_valuation_method, allow_negative_stock, auto_reorder_level, created_at 
            FROM stock_settings 
            WHERE company_id = $1
            "#
        )
        .bind(company_id)
        .fetch_optional(&self.pool)
        .await?;

        // If settings don't exist yet, we can return default values
        if let Some(settings) = row {
            Ok(settings)
        } else {
            Ok(StockSettings {
                id: Uuid::new_v4(), // Virtual ID
                company_id,
                default_valuation_method: Some("FIFO".to_string()),
                allow_negative_stock: Some(false),
                auto_reorder_level: Some(true),
                created_at: Some(chrono::Utc::now()),
            })
        }
    }

    pub async fn upsert_settings(&self, company_id: Uuid, dto: UpsertStockSettingsDto) -> Result<StockSettings, sqlx::Error> {
        let row = sqlx::query_as::<_, StockSettings>(
            r#"
            INSERT INTO stock_settings (company_id, default_valuation_method, allow_negative_stock, auto_reorder_level)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (company_id) 
            DO UPDATE SET 
                default_valuation_method = EXCLUDED.default_valuation_method,
                allow_negative_stock = EXCLUDED.allow_negative_stock,
                auto_reorder_level = EXCLUDED.auto_reorder_level
            RETURNING id, company_id, default_valuation_method, allow_negative_stock, auto_reorder_level, created_at
            "#
        )
        .bind(company_id)
        .bind(dto.default_valuation_method.unwrap_or_else(|| "FIFO".to_string()))
        .bind(dto.allow_negative_stock.unwrap_or(false))
        .bind(dto.auto_reorder_level.unwrap_or(true))
        .fetch_one(&self.pool)
        .await?;

        Ok(row)
    }
}
