use sqlx::PgPool;
use uuid::Uuid;
use crate::domain::entities::uom::{Uom, UomConversionFactor};

pub struct UomRepository {
    pool: PgPool,
}

impl UomRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    // UOM Methods
    pub async fn create_uom(&self, uom: &Uom) -> Result<Uom, sqlx::Error> {
        sqlx::query_as!(
            Uom,
            r#"
            INSERT INTO uoms (id, company_id, uom_name, must_be_whole_number, created_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            "#,
            uom.id,
            uom.company_id,
            uom.uom_name,
            uom.must_be_whole_number,
            uom.created_at
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_uoms(&self, company_id: Uuid) -> Result<Vec<Uom>, sqlx::Error> {
        sqlx::query_as!(
            Uom,
            r#"
            SELECT * FROM uoms
            WHERE company_id = $1
            ORDER BY uom_name ASC
            "#,
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }

    pub async fn delete_uom(&self, id: Uuid) -> Result<u64, sqlx::Error> {
        let result = sqlx::query!(
            r#"
            DELETE FROM uoms WHERE id = $1
            "#,
            id
        )
        .execute(&self.pool)
        .await?;
        Ok(result.rows_affected())
    }

    // UOM Conversion Factor Methods
    pub async fn create_conversion(&self, conversion: &UomConversionFactor) -> Result<UomConversionFactor, sqlx::Error> {
        let rec = sqlx::query!(
            r#"
            INSERT INTO uom_conversion_factors (id, company_id, from_uom_id, to_uom_id, value, created_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, company_id, from_uom_id, to_uom_id, value, created_at
            "#,
            conversion.id,
            conversion.company_id,
            conversion.from_uom_id,
            conversion.to_uom_id,
            conversion.value,
            conversion.created_at
        )
        .fetch_one(&self.pool)
        .await?;
        
        Ok(UomConversionFactor {
            id: rec.id,
            company_id: rec.company_id,
            from_uom_id: rec.from_uom_id,
            to_uom_id: rec.to_uom_id,
            value: rec.value,
            created_at: rec.created_at,
            from_uom_name: None,
            to_uom_name: None,
        })
    }

    pub async fn list_conversions(&self, company_id: Uuid) -> Result<Vec<UomConversionFactor>, sqlx::Error> {
        let rows = sqlx::query!(
            r#"
            SELECT 
                c.id, c.company_id, c.from_uom_id, c.to_uom_id, c.value, c.created_at,
                f.uom_name as from_name,
                t.uom_name as to_name
            FROM uom_conversion_factors c
            JOIN uoms f ON c.from_uom_id = f.id
            JOIN uoms t ON c.to_uom_id = t.id
            WHERE c.company_id = $1
            ORDER BY c.created_at DESC
            "#,
            company_id
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(|row| UomConversionFactor {
            id: row.id,
            company_id: row.company_id,
            from_uom_id: row.from_uom_id,
            to_uom_id: row.to_uom_id,
            value: row.value,
            created_at: row.created_at,
            from_uom_name: Some(row.from_name),
            to_uom_name: Some(row.to_name),
        }).collect())
    }

    pub async fn delete_conversion(&self, id: Uuid) -> Result<u64, sqlx::Error> {
        let result = sqlx::query!(
            r#"
            DELETE FROM uom_conversion_factors WHERE id = $1
            "#,
            id
        )
        .execute(&self.pool)
        .await?;
        Ok(result.rows_affected())
    }
}
