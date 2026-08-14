use sqlx::PgPool;
use uuid::Uuid;
use crate::domain::entities::depreciation::DepreciationMethod;

pub struct DepreciationMethodRepository {
    pool: PgPool,
}

impl DepreciationMethodRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn find_all(&self) -> Result<Vec<DepreciationMethod>, sqlx::Error> {
        sqlx::query_as!(
            DepreciationMethod,
            r#"
            SELECT id, code, method_name, annual_rate, frequency_months, description, is_active, created_at, updated_at
            FROM depreciation_methods
            ORDER BY created_at ASC
            "#
        )
        .fetch_all(&self.pool)
        .await
    }

    pub async fn find_by_id(&self, id: Uuid) -> Result<Option<DepreciationMethod>, sqlx::Error> {
        sqlx::query_as!(
            DepreciationMethod,
            r#"
            SELECT id, code, method_name, annual_rate, frequency_months, description, is_active, created_at, updated_at
            FROM depreciation_methods
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
    }

    pub async fn create(&self, method: DepreciationMethod) -> Result<DepreciationMethod, sqlx::Error> {
        sqlx::query_as!(
            DepreciationMethod,
            r#"
            INSERT INTO depreciation_methods (id, code, method_name, annual_rate, frequency_months, description, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, code, method_name, annual_rate, frequency_months, description, is_active, created_at, updated_at
            "#,
            method.id,
            method.code,
            method.method_name,
            method.annual_rate,
            method.frequency_months,
            method.description,
            method.is_active
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn update(&self, method: DepreciationMethod) -> Result<DepreciationMethod, sqlx::Error> {
        sqlx::query_as!(
            DepreciationMethod,
            r#"
            UPDATE depreciation_methods
            SET method_name = $1, annual_rate = $2, frequency_months = $3, description = $4, is_active = $5, updated_at = CURRENT_TIMESTAMP
            WHERE id = $6
            RETURNING id, code, method_name, annual_rate, frequency_months, description, is_active, created_at, updated_at
            "#,
            method.method_name,
            method.annual_rate,
            method.frequency_months,
            method.description,
            method.is_active,
            method.id
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn delete(&self, id: Uuid) -> Result<(), sqlx::Error> {
        sqlx::query!(
            r#"
            DELETE FROM depreciation_methods
            WHERE id = $1
            "#,
            id
        )
        .execute(&self.pool)
        .await?;
        Ok(())
    }
}
