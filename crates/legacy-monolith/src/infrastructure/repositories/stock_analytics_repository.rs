use sqlx::{PgPool, Row};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use serde::{Serialize, Deserialize};
use rust_decimal::Decimal;

#[derive(Serialize, Deserialize, Debug)]
pub struct WarehouseValuation {
    pub warehouse_id: Uuid,
    pub warehouse_name: String,
    pub total_value: Decimal,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct MovementTrend {
    pub date: String, // YYYY-MM-DD
    pub inward_qty: Decimal,
    pub outward_qty: Decimal,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ItemGroupValuation {
    pub item_group: String,
    pub total_value: Decimal,
}

pub struct StockAnalyticsRepository {
    pool: PgPool,
}

impl StockAnalyticsRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn get_warehouse_valuations(&self, company_id: Uuid) -> Result<Vec<WarehouseValuation>, sqlx::Error> {
        // Query current balance * valuation rate for all items grouped by warehouse
        let query = r#"
            SELECT 
                w.id as warehouse_id,
                w.warehouse_name,
                COALESCE(SUM(b.actual_qty * COALESCE(i.valuation_rate, 0)), 0) as total_value
            FROM warehouses w
            LEFT JOIN bins b ON w.id = b.warehouse_id
            LEFT JOIN inventory_items i ON b.item_id = i.id
            WHERE w.company_id = $1
            GROUP BY w.id, w.warehouse_name
            ORDER BY total_value DESC
        "#;

        let rows = sqlx::query(query)
            .bind(company_id)
            .fetch_all(&self.pool)
            .await?;

        let mut valuations = Vec::new();
        for row in rows {
            valuations.push(WarehouseValuation {
                warehouse_id: row.get("warehouse_id"),
                warehouse_name: row.get("warehouse_name"),
                total_value: row.get("total_value"),
            });
        }
        Ok(valuations)
    }

    pub async fn get_item_group_valuations(&self, company_id: Uuid) -> Result<Vec<ItemGroupValuation>, sqlx::Error> {
        let query = r#"
            SELECT 
                COALESCE(i.item_group, 'Uncategorized') as item_group,
                COALESCE(SUM(b.actual_qty * COALESCE(i.valuation_rate, 0)), 0) as total_value
            FROM bins b
            JOIN inventory_items i ON b.item_id = i.id
            JOIN warehouses w ON b.warehouse_id = w.id
            WHERE w.company_id = $1
            GROUP BY i.item_group
            ORDER BY total_value DESC
        "#;

        let rows = sqlx::query(query)
            .bind(company_id)
            .fetch_all(&self.pool)
            .await?;

        let mut valuations = Vec::new();
        for row in rows {
            valuations.push(ItemGroupValuation {
                item_group: row.get("item_group"),
                total_value: row.get("total_value"),
            });
        }
        Ok(valuations)
    }

    pub async fn get_movement_trends(&self, company_id: Uuid, days: i32) -> Result<Vec<MovementTrend>, sqlx::Error> {
        let query = r#"
            WITH dates AS (
                SELECT generate_series(
                    CURRENT_DATE - ($2 || ' days')::interval,
                    CURRENT_DATE,
                    '1 day'::interval
                )::date AS date
            )
            SELECT 
                TO_CHAR(d.date, 'YYYY-MM-DD') as date_str,
                COALESCE(SUM(CASE WHEN m.quantity > 0 THEN m.quantity ELSE 0 END), 0) as inward_qty,
                COALESCE(SUM(CASE WHEN m.quantity < 0 THEN ABS(m.quantity) ELSE 0 END), 0) as outward_qty
            FROM dates d
            LEFT JOIN inventory_movements m 
                ON DATE(m.created_at) = d.date 
                AND m.item_id IN (SELECT id FROM inventory_items WHERE company_id = $1)
            GROUP BY d.date
            ORDER BY d.date ASC
        "#;

        let rows = sqlx::query(query)
            .bind(company_id)
            .bind(days)
            .fetch_all(&self.pool)
            .await?;

        let mut trends = Vec::new();
        for row in rows {
            trends.push(MovementTrend {
                date: row.get("date_str"),
                inward_qty: row.get("inward_qty"),
                outward_qty: row.get("outward_qty"),
            });
        }
        Ok(trends)
    }
}
