//! Bill of Materials (BOM) & Production Order Repository (QMFG-001, QMFG-003)

use sqlx::PgPool;
use uuid::Uuid;

use crate::domain::manufacturing_pos::{Bom, BomItem, ProductionOrder};

#[derive(Clone)]
pub struct BomRepository {
    pool: PgPool,
}

impl BomRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create_bom_with_items(
        &self,
        bom: &Bom,
        items: &[BomItem],
    ) -> Result<Bom, sqlx::Error> {
        let mut tx = self.pool.begin().await?;

        let created_bom = sqlx::query_as::<_, Bom>(
            r#"
            INSERT INTO boms (id, company_id, item_id, bom_number, version, quantity, is_active, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, company_id, item_id, bom_number, version, quantity, is_active, created_at
            "#,
        )
        .bind(bom.id)
        .bind(bom.company_id)
        .bind(bom.item_id)
        .bind(&bom.bom_number)
        .bind(bom.version)
        .bind(bom.quantity)
        .bind(bom.is_active)
        .bind(bom.created_at)
        .fetch_one(&mut *tx)
        .await?;

        for item in items {
            sqlx::query(
                r#"
                INSERT INTO bom_items (id, bom_id, item_id, qty_required, scrap_percentage)
                VALUES ($1, $2, $3, $4, $5)
                "#,
            )
            .bind(item.id)
            .bind(created_bom.id)
            .bind(item.item_id)
            .bind(item.qty_required)
            .bind(item.scrap_percentage)
            .execute(&mut *tx)
            .await?;
        }

        tx.commit().await?;
        Ok(created_bom)
    }

    pub async fn get_bom(&self, id: Uuid) -> Result<Option<Bom>, sqlx::Error> {
        sqlx::query_as::<_, Bom>(
            r#"
            SELECT id, company_id, item_id, bom_number, version, quantity, is_active, created_at
            FROM boms
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
    }

    pub async fn list_boms(&self, company_id: Uuid) -> Result<Vec<Bom>, sqlx::Error> {
        sqlx::query_as::<_, Bom>(
            r#"
            SELECT id, company_id, item_id, bom_number, version, quantity, is_active, created_at
            FROM boms
            WHERE company_id = $1
            ORDER BY created_at DESC
            "#,
        )
        .bind(company_id)
        .fetch_all(&self.pool)
        .await
    }

    pub async fn get_bom_items(&self, bom_id: Uuid) -> Result<Vec<BomItem>, sqlx::Error> {
        sqlx::query_as::<_, BomItem>(
            r#"
            SELECT id, bom_id, item_id, qty_required, scrap_percentage
            FROM bom_items
            WHERE bom_id = $1
            "#,
        )
        .bind(bom_id)
        .fetch_all(&self.pool)
        .await
    }

    // --- Production Orders ---

    pub async fn create_production_order(
        &self,
        order: &ProductionOrder,
    ) -> Result<ProductionOrder, sqlx::Error> {
        sqlx::query_as::<_, ProductionOrder>(
            r#"
            INSERT INTO production_orders (id, company_id, production_order_number, bom_id, item_id, target_qty, produced_qty, warehouse_id, status, wip_account_id, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, company_id, production_order_number, bom_id, item_id, target_qty, produced_qty, warehouse_id, status, wip_account_id, created_at
            "#,
        )
        .bind(order.id)
        .bind(order.company_id)
        .bind(&order.production_order_number)
        .bind(order.bom_id)
        .bind(order.item_id)
        .bind(order.target_qty)
        .bind(order.produced_qty)
        .bind(order.warehouse_id)
        .bind(&order.status)
        .bind(order.wip_account_id)
        .bind(order.created_at)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn get_production_order(
        &self,
        id: Uuid,
    ) -> Result<Option<ProductionOrder>, sqlx::Error> {
        sqlx::query_as::<_, ProductionOrder>(
            r#"
            SELECT id, company_id, production_order_number, bom_id, item_id, target_qty, produced_qty, warehouse_id, status, wip_account_id, created_at
            FROM production_orders
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
    }

    pub async fn list_production_orders(
        &self,
        company_id: Uuid,
    ) -> Result<Vec<ProductionOrder>, sqlx::Error> {
        sqlx::query_as::<_, ProductionOrder>(
            r#"
            SELECT id, company_id, production_order_number, bom_id, item_id, target_qty, produced_qty, warehouse_id, status, wip_account_id, created_at
            FROM production_orders
            WHERE company_id = $1
            ORDER BY created_at DESC
            "#,
        )
        .bind(company_id)
        .fetch_all(&self.pool)
        .await
    }

    pub async fn update_production_order_status(
        &self,
        id: Uuid,
        status: &str,
    ) -> Result<Option<ProductionOrder>, sqlx::Error> {
        sqlx::query_as::<_, ProductionOrder>(
            r#"
            UPDATE production_orders
            SET status = $2
            WHERE id = $1
            RETURNING id, company_id, production_order_number, bom_id, item_id, target_qty, produced_qty, warehouse_id, status, wip_account_id, created_at
            "#,
        )
        .bind(id)
        .bind(status)
        .fetch_optional(&self.pool)
        .await
    }
}
