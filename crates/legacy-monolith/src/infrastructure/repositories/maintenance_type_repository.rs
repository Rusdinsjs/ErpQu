use sqlx::PgPool;
use crate::domain::entities::maintenance::MaintenanceType;

pub struct MaintenanceTypeRepository {
    pool: PgPool,
}

impl MaintenanceTypeRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn find_all(&self) -> Result<Vec<MaintenanceType>, sqlx::Error> {
        sqlx::query_as!(
            MaintenanceType,
            r#"
            SELECT id, code, name, is_preventive, description, is_active
            FROM maintenance_types
            ORDER BY id ASC
            "#
        )
        .fetch_all(&self.pool)
        .await
    }

    pub async fn find_by_id(&self, id: i32) -> Result<Option<MaintenanceType>, sqlx::Error> {
        sqlx::query_as!(
            MaintenanceType,
            r#"
            SELECT id, code, name, is_preventive, description, is_active
            FROM maintenance_types
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
    }

    pub async fn create(&self, m_type: MaintenanceType) -> Result<MaintenanceType, sqlx::Error> {
        // id is serial, we ignore the passed id for creation unless we really want it.
        sqlx::query_as!(
            MaintenanceType,
            r#"
            INSERT INTO maintenance_types (code, name, is_preventive, description, is_active)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, code, name, is_preventive, description, is_active
            "#,
            m_type.code,
            m_type.name,
            m_type.is_preventive,
            m_type.description,
            m_type.is_active
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn update(&self, m_type: MaintenanceType) -> Result<MaintenanceType, sqlx::Error> {
        sqlx::query_as!(
            MaintenanceType,
            r#"
            UPDATE maintenance_types
            SET name = $1, is_preventive = $2, description = $3, is_active = $4
            WHERE id = $5
            RETURNING id, code, name, is_preventive, description, is_active
            "#,
            m_type.name,
            m_type.is_preventive,
            m_type.description,
            m_type.is_active,
            m_type.id
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn delete(&self, id: i32) -> Result<(), sqlx::Error> {
        sqlx::query!(
            r#"
            DELETE FROM maintenance_types
            WHERE id = $1
            "#,
            id
        )
        .execute(&self.pool)
        .await?;
        Ok(())
    }
}
