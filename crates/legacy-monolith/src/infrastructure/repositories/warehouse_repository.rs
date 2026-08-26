use sqlx::PgPool;
use uuid::Uuid;
use crate::domain::entities::warehouse::{Warehouse, StockDashboardKpi};

pub struct WarehouseRepository {
    pool: PgPool,
}

impl WarehouseRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, warehouse: &Warehouse) -> Result<Warehouse, sqlx::Error> {
        sqlx::query_as!(
            Warehouse,
            r#"
            INSERT INTO warehouses (
                id, company_id, parent_id, code, name, is_active, is_group, is_frozen, warehouse_type, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
            "#,
            warehouse.id,
            warehouse.company_id,
            warehouse.parent_id,
            warehouse.code,
            warehouse.name,
            warehouse.is_active,
            warehouse.is_group,
            warehouse.is_frozen,
            warehouse.warehouse_type,
            warehouse.created_at,
            warehouse.updated_at
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn find_all(&self) -> Result<Vec<Warehouse>, sqlx::Error> {
        sqlx::query_as!(
            Warehouse,
            r#"
            SELECT * FROM warehouses ORDER BY name ASC
            "#
        )
        .fetch_all(&self.pool)
        .await
    }

    pub async fn find_by_id(&self, id: Uuid) -> Result<Option<Warehouse>, sqlx::Error> {
        sqlx::query_as!(
            Warehouse,
            r#"
            SELECT * FROM warehouses WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
    }

    pub async fn delete(&self, id: Uuid) -> Result<u64, sqlx::Error> {
        let result = sqlx::query!(
            r#"
            DELETE FROM warehouses WHERE id = $1
            "#,
            id
        )
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected())
    }

    pub async fn get_dashboard_kpis(&self, company_id: Uuid) -> Result<StockDashboardKpi, sqlx::Error> {
        let rec = sqlx::query!(
            r#"
            SELECT 
                (SELECT COUNT(*) FROM warehouses WHERE company_id = $1 AND is_active = true) as total_warehouses,
                COALESCE((
                    SELECT SUM(b.actual_qty * i.average_cost) 
                    FROM bins b 
                    JOIN inventory_items i ON b.item_id = i.id 
                    WHERE b.company_id = $1
                ), 0) as total_stock_valuation,
                (SELECT COUNT(*) FROM (
                    SELECT b.item_id, SUM(b.actual_qty) as total_qty, i.min_stock 
                    FROM bins b 
                    JOIN inventory_items i ON b.item_id = i.id 
                    WHERE b.company_id = $1 
                    GROUP BY b.item_id, i.min_stock
                    HAVING SUM(b.actual_qty) <= i.min_stock
                ) as low_stock_items_query) as low_stock_items
            "#,
            company_id
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(StockDashboardKpi {
            total_stock_valuation: rec.total_stock_valuation.unwrap_or_default(),
            total_warehouses: rec.total_warehouses.unwrap_or(0) as i64,
            low_stock_items: rec.low_stock_items.unwrap_or(0) as i64,
        })
    }
}
