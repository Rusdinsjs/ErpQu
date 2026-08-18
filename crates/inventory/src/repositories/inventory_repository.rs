use rust_decimal::Decimal;
use crate::domain::entities::inventory::{InventoryCategory, InventoryItem, InventoryMovement};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Clone)]
pub struct InventoryRepository {
    pool: PgPool,
}

impl InventoryRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub fn pool(&self) -> &PgPool {
        &self.pool
    }

    // --- Categories ---

    pub async fn create_category(
        &self,
        category: &InventoryCategory,
    ) -> Result<InventoryCategory, sqlx::Error> {
        sqlx::query_as::<_, InventoryCategory>(
            "INSERT INTO inventory.inventory_categories (id, code, name, description, inventory_account_id, expense_account_id)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *"
        )
        .bind(category.id)
        .bind(&category.code)
        .bind(&category.name)
        .bind(&category.description)
        .bind(category.inventory_account_id)
        .bind(category.expense_account_id)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_categories(&self) -> Result<Vec<InventoryCategory>, sqlx::Error> {
        sqlx::query_as::<_, InventoryCategory>(
            "SELECT * FROM inventory.inventory_categories ORDER BY name",
        )
        .fetch_all(&self.pool)
        .await
    }

    pub async fn get_category(&self, id: Uuid) -> Result<Option<InventoryCategory>, sqlx::Error> {
        sqlx::query_as::<_, InventoryCategory>(
            "SELECT * FROM inventory.inventory_categories WHERE id = $1",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
    }

    pub async fn update_category(
        &self,
        id: Uuid,
        name: Option<String>,
        description: Option<String>,
        inventory_account_id: Option<Uuid>,
        expense_account_id: Option<Uuid>,
    ) -> Result<InventoryCategory, sqlx::Error> {
        sqlx::query_as::<_, InventoryCategory>(
            "UPDATE inventory.inventory_categories 
             SET name = COALESCE($2, name), 
                 description = COALESCE($3, description), 
                 inventory_account_id = COALESCE($4, inventory_account_id), 
                 expense_account_id = COALESCE($5, expense_account_id),
                 updated_at = NOW()
             WHERE id = $1 RETURNING *",
        )
        .bind(id)
        .bind(name)
        .bind(description)
        .bind(inventory_account_id)
        .bind(expense_account_id)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn delete_category(&self, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM inventory.inventory_categories WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected() > 0)
    }

    // --- Items ---

    pub async fn create_item(&self, item: &InventoryItem) -> Result<InventoryItem, sqlx::Error> {
        sqlx::query_as::<_, InventoryItem>(
            "INSERT INTO inventory.inventory_items (id, category_id, unit_id, sku, name, description, min_stock, max_stock, current_quantity, average_cost, last_purchase_price)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *"
        )
        .bind(item.id)
        .bind(item.category_id)
        .bind(item.unit_id)
        .bind(&item.sku)
        .bind(&item.name)
        .bind(&item.description)
        .bind(item.min_stock)
        .bind(item.max_stock)
        .bind(item.current_quantity)
        .bind(item.average_cost)
        .bind(item.last_purchase_price)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn get_item(&self, id: Uuid) -> Result<Option<InventoryItem>, sqlx::Error> {
        sqlx::query_as::<_, InventoryItem>("SELECT * FROM inventory.inventory_items WHERE id = $1")
            .bind(id)
            .fetch_optional(&self.pool)
            .await
    }

    pub async fn list_items(
        &self,
        category_id: Option<Uuid>,
        search: Option<String>,
    ) -> Result<Vec<InventoryItem>, sqlx::Error> {
        let mut query_builder: sqlx::QueryBuilder<sqlx::Postgres> = sqlx::QueryBuilder::new(
            "SELECT * FROM inventory.inventory_items WHERE is_active = true",
        );

        if let Some(category_id) = category_id {
            query_builder.push(" AND category_id = ");
            query_builder.push_bind(category_id);
        }

        if let Some(search) = search {
            if !search.is_empty() {
                query_builder.push(" AND (name ILIKE ");
                query_builder.push_bind(format!("%{}%", search));
                query_builder.push(" OR sku ILIKE ");
                query_builder.push_bind(format!("%{}%", search));
                query_builder.push(")");
            }
        }

        query_builder.push(" ORDER BY name");

        query_builder
            .build_query_as::<InventoryItem>()
            .fetch_all(&self.pool)
            .await
    }

    pub async fn update_stock(
        &self,
        id: Uuid,
        new_quantity: rust_decimal::Decimal,
        new_average_cost: rust_decimal::Decimal,
    ) -> Result<bool, sqlx::Error> {
        let result = sqlx::query(
            "UPDATE inventory.inventory_items SET current_quantity = $2, average_cost = $3, updated_at = NOW() WHERE id = $1"
        )
        .bind(id)
        .bind(new_quantity)
        .bind(new_average_cost)
        .execute(&self.pool)
        .await?;
        Ok(result.rows_affected() > 0)
    }

    pub async fn update_item(
        &self,
        id: Uuid,
        name: Option<String>,
        description: Option<String>,
        min_stock: Option<rust_decimal::Decimal>,
        max_stock: Option<rust_decimal::Decimal>,
        is_active: Option<bool>,
    ) -> Result<InventoryItem, sqlx::Error> {
        sqlx::query_as::<_, InventoryItem>(
            "UPDATE inventory.inventory_items 
             SET name = COALESCE($2, name), 
                 description = COALESCE($3, description), 
                 min_stock = COALESCE($4, min_stock), 
                 max_stock = COALESCE($5, max_stock),
                 is_active = COALESCE($6, is_active),
                 updated_at = NOW()
             WHERE id = $1 RETURNING *",
        )
        .bind(id)
        .bind(name)
        .bind(description)
        .bind(min_stock)
        .bind(max_stock)
        .bind(is_active)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn delete_item(&self, id: Uuid) -> Result<bool, sqlx::Error> {
        // We usually do soft delete for items that have history
        let result = sqlx::query(
            "UPDATE inventory.inventory_items SET is_active = false, updated_at = NOW() WHERE id = $1",
        )
        .bind(id)
        .execute(&self.pool)
        .await?;
        Ok(result.rows_affected() > 0)
    }

    // --- Movements ---

    pub async fn create_movement(
        &self,
        movement: &InventoryMovement,
    ) -> Result<InventoryMovement, sqlx::Error> {
        sqlx::query_as::<_, InventoryMovement>(
            "INSERT INTO inventory.inventory_movements (id, item_id, movement_type, quantity, unit_price, total_value, reference_id, reference_number, notes, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *"
        )
        .bind(movement.id)
        .bind(movement.item_id)
        .bind(&movement.movement_type)
        .bind(movement.quantity)
        .bind(movement.unit_price)
        .bind(movement.total_value)
        .bind(movement.reference_id)
        .bind(&movement.reference_number)
        .bind(&movement.notes)
        .bind(movement.created_by)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_movements(
        &self,
        item_id: Option<Uuid>,
        limit: i64,
    ) -> Result<Vec<InventoryMovement>, sqlx::Error> {
        let mut query_builder: sqlx::QueryBuilder<sqlx::Postgres> =
            sqlx::QueryBuilder::new("SELECT * FROM inventory.inventory_movements");

        if let Some(item_id) = item_id {
            query_builder.push(" WHERE item_id = ");
            query_builder.push_bind(item_id);
        }

        query_builder.push(" ORDER BY created_at DESC LIMIT ");
        query_builder.push_bind(limit);

        query_builder
            .build_query_as::<InventoryMovement>()
            .fetch_all(&self.pool)
            .await
    }

    pub async fn list_warehouses(
        &self,
        tenant_id: Uuid,
    ) -> Result<Vec<crate::domain::entities::stock_entry::Warehouse>, sqlx::Error> {
        sqlx::query_as::<_, crate::domain::entities::stock_entry::Warehouse>(
            r#"
            SELECT w.* 
            FROM public.warehouses w 
            JOIN public.companies c ON w.company_id = c.id 
            WHERE c.tenant_id = $1 
            ORDER BY w.name
            "#,
        )
        .bind(tenant_id)
        .fetch_all(&self.pool)
        .await
    }

    pub async fn create_warehouse(
        &self,
        wh: &crate::domain::entities::stock_entry::Warehouse,
    ) -> Result<crate::domain::entities::stock_entry::Warehouse, sqlx::Error> {
        sqlx::query_as::<_, crate::domain::entities::stock_entry::Warehouse>(
            r#"
            INSERT INTO public.warehouses (id, company_id, parent_id, code, name, is_active, is_group, is_frozen, warehouse_type)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
            "#
        )
        .bind(wh.id)
        .bind(wh.company_id)
        .bind(wh.parent_id)
        .bind(&wh.code)
        .bind(&wh.name)
        .bind(wh.is_active)
        .bind(wh.is_group)
        .bind(wh.is_frozen)
        .bind(&wh.warehouse_type)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn delete_warehouse(&self, id: Uuid) -> Result<(), sqlx::Error> {
        sqlx::query("DELETE FROM public.warehouses WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    // --- Product Bundle ---

    pub async fn create_product_bundle(
        &self,
        tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
        bundle: &crate::domain::entities::inventory::ProductBundle,
    ) -> Result<crate::domain::entities::inventory::ProductBundle, sqlx::Error> {
        sqlx::query_as::<_, crate::domain::entities::inventory::ProductBundle>(
            "INSERT INTO inventory.product_bundles (id, parent_item_id, description)
             VALUES ($1, $2, $3) RETURNING *",
        )
        .bind(bundle.id)
        .bind(bundle.parent_item_id)
        .bind(&bundle.description)
        .fetch_one(&mut **tx)
        .await
    }

    pub async fn add_product_bundle_item(
        &self,
        tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
        item: &crate::domain::entities::inventory::ProductBundleItem,
    ) -> Result<crate::domain::entities::inventory::ProductBundleItem, sqlx::Error> {
        sqlx::query_as::<_, crate::domain::entities::inventory::ProductBundleItem>(
            "INSERT INTO inventory.product_bundle_items (id, bundle_id, item_id, qty)
             VALUES ($1, $2, $3, $4) RETURNING *",
        )
        .bind(item.id)
        .bind(item.bundle_id)
        .bind(item.item_id)
        .bind(item.qty)
        .fetch_one(&mut **tx)
        .await
    }

    pub async fn get_product_bundle(
        &self,
        parent_item_id: Uuid,
    ) -> Result<Option<crate::domain::entities::inventory::ProductBundle>, sqlx::Error> {
        sqlx::query_as::<_, crate::domain::entities::inventory::ProductBundle>(
            "SELECT * FROM inventory.product_bundles WHERE parent_item_id = $1",
        )
        .bind(parent_item_id)
        .fetch_optional(&self.pool)
        .await
    }

    pub async fn get_product_bundle_items(
        &self,
        bundle_id: Uuid,
    ) -> Result<Vec<crate::domain::entities::inventory::ProductBundleItem>, sqlx::Error> {
        sqlx::query_as::<_, crate::domain::entities::inventory::ProductBundleItem>(
            "SELECT * FROM inventory.product_bundle_items WHERE bundle_id = $1",
        )
        .bind(bundle_id)
        .fetch_all(&self.pool)
        .await
    }

    // --- Item Alternatives ---

    pub async fn add_item_alternative(
        &self,
        alternative: &crate::domain::entities::inventory::ItemAlternative,
    ) -> Result<crate::domain::entities::inventory::ItemAlternative, sqlx::Error> {
        sqlx::query_as::<_, crate::domain::entities::inventory::ItemAlternative>(
            "INSERT INTO inventory.item_alternatives (id, item_id, alternative_item_id)
             VALUES ($1, $2, $3) RETURNING *",
        )
        .bind(alternative.id)
        .bind(alternative.item_id)
        .bind(alternative.alternative_item_id)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn get_item_alternatives(
        &self,
        item_id: Uuid,
    ) -> Result<Vec<crate::domain::entities::inventory::ItemAlternative>, sqlx::Error> {
        sqlx::query_as::<_, crate::domain::entities::inventory::ItemAlternative>(
            "SELECT * FROM inventory.item_alternatives WHERE item_id = $1",
        )
        .bind(item_id)
        .fetch_all(&self.pool)
        .await
    }

    // --- Warehouse Bins & Location Ledger ---

    pub async fn create_warehouse_bin(
        &self,
        bin: &crate::domain::entities::stock_entry::WarehouseBin,
    ) -> Result<crate::domain::entities::stock_entry::WarehouseBin, sqlx::Error> {
        sqlx::query_as::<_, crate::domain::entities::stock_entry::WarehouseBin>(
            r#"
            INSERT INTO inventory.warehouse_bins (id, warehouse_id, bin_code, description, created_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            "#,
        )
        .bind(bin.id)
        .bind(bin.warehouse_id)
        .bind(&bin.bin_code)
        .bind(&bin.description)
        .bind(bin.created_at)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn get_warehouse_bin(
        &self,
        id: Uuid,
    ) -> Result<Option<crate::domain::entities::stock_entry::WarehouseBin>, sqlx::Error> {
        sqlx::query_as::<_, crate::domain::entities::stock_entry::WarehouseBin>(
            "SELECT * FROM inventory.warehouse_bins WHERE id = $1",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
    }

    pub async fn list_warehouse_bins(
        &self,
        warehouse_id: Uuid,
    ) -> Result<Vec<crate::domain::entities::stock_entry::WarehouseBin>, sqlx::Error> {
        sqlx::query_as::<_, crate::domain::entities::stock_entry::WarehouseBin>(
            "SELECT * FROM inventory.warehouse_bins WHERE warehouse_id = $1 ORDER BY bin_code",
        )
        .bind(warehouse_id)
        .fetch_all(&self.pool)
        .await
    }

    pub async fn delete_warehouse_bin(&self, id: Uuid) -> Result<(), sqlx::Error> {
        sqlx::query("DELETE FROM inventory.warehouse_bins WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn get_item_bin_balances(
        &self,
        warehouse_bin_id: Uuid,
    ) -> Result<Vec<crate::domain::entities::stock_entry::ItemBinBalance>, sqlx::Error> {
        sqlx::query_as::<_, crate::domain::entities::stock_entry::ItemBinBalance>(
            r#"
            SELECT ibb.*, wb.bin_code, wb.warehouse_id
            FROM inventory.item_bin_balances ibb
            LEFT JOIN inventory.warehouse_bins wb ON ibb.warehouse_bin_id = wb.id
            WHERE ibb.warehouse_bin_id = $1
            "#,
        )
        .bind(warehouse_bin_id)
        .fetch_all(&self.pool)
        .await
    }

    pub async fn get_item_bin_balance(
        &self,
        warehouse_bin_id: Uuid,
        item_id: Uuid,
    ) -> Result<Option<crate::domain::entities::stock_entry::ItemBinBalance>, sqlx::Error> {
        sqlx::query_as::<_, crate::domain::entities::stock_entry::ItemBinBalance>(
            r#"
            SELECT ibb.*, wb.bin_code, wb.warehouse_id
            FROM inventory.item_bin_balances ibb
            LEFT JOIN inventory.warehouse_bins wb ON ibb.warehouse_bin_id = wb.id
            WHERE ibb.warehouse_bin_id = $1 AND ibb.item_id = $2
            "#,
        )
        .bind(warehouse_bin_id)
        .bind(item_id)
        .fetch_optional(&self.pool)
        .await
    }

    pub async fn list_bin_balances_by_item(
        &self,
        item_id: Uuid,
    ) -> Result<Vec<crate::domain::entities::stock_entry::ItemBinBalance>, sqlx::Error> {
        sqlx::query_as::<_, crate::domain::entities::stock_entry::ItemBinBalance>(
            r#"
            SELECT ibb.*, wb.bin_code, wb.warehouse_id
            FROM inventory.item_bin_balances ibb
            LEFT JOIN inventory.warehouse_bins wb ON ibb.warehouse_bin_id = wb.id
            WHERE ibb.item_id = $1
            "#,
        )
        .bind(item_id)
        .fetch_all(&self.pool)
        .await
    }
    // --- FIFO Layers Persistence (QSTK-007 / Perbaikan 3) ---

    pub async fn create_fifo_layer(
        &self,
        layer: &crate::domain::valuation::FifoLayer,
    ) -> Result<crate::domain::valuation::FifoLayer, sqlx::Error> {
        #[derive(sqlx::FromRow)]
        struct LayerRow {
            id: Uuid,
            company_id: Uuid,
            warehouse_id: Uuid,
            item_id: Uuid,
            voucher_type: String,
            voucher_no: String,
            layer_date: chrono::DateTime<chrono::Utc>,
            initial_qty: Decimal,
            remaining_qty: Decimal,
            unit_cost: Decimal,
        }

        let row = sqlx::query_as::<_, LayerRow>(
            r#"
            INSERT INTO public.stock_fifo_layers (
                id, company_id, warehouse_id, item_id, voucher_type, voucher_no,
                layer_date, initial_qty, remaining_qty, unit_cost, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
            RETURNING id, company_id, warehouse_id, item_id, voucher_type, voucher_no,
                      layer_date, initial_qty, remaining_qty, unit_cost
            "#,
        )
        .bind(layer.id)
        .bind(layer.company_id)
        .bind(layer.warehouse_id)
        .bind(layer.item_id)
        .bind(&layer.voucher_type)
        .bind(&layer.voucher_no)
        .bind(layer.layer_date)
        .bind(layer.initial_qty)
        .bind(layer.remaining_qty)
        .bind(layer.unit_cost)
        .fetch_one(&self.pool)
        .await?;

        Ok(crate::domain::valuation::FifoLayer {
            id: row.id,
            company_id: row.company_id,
            warehouse_id: row.warehouse_id,
            item_id: row.item_id,
            voucher_type: row.voucher_type,
            voucher_no: row.voucher_no,
            layer_date: row.layer_date,
            initial_qty: row.initial_qty,
            remaining_qty: row.remaining_qty,
            unit_cost: row.unit_cost,
        })
    }

    pub async fn get_available_fifo_layers(
        &self,
        company_id: Uuid,
        warehouse_id: Uuid,
        item_id: Uuid,
    ) -> Result<Vec<crate::domain::valuation::FifoLayer>, sqlx::Error> {
        #[derive(sqlx::FromRow)]
        struct LayerRow {
            id: Uuid,
            company_id: Uuid,
            warehouse_id: Uuid,
            item_id: Uuid,
            voucher_type: String,
            voucher_no: String,
            layer_date: chrono::DateTime<chrono::Utc>,
            initial_qty: Decimal,
            remaining_qty: Decimal,
            unit_cost: Decimal,
        }

        let rows = sqlx::query_as::<_, LayerRow>(
            r#"
            SELECT id, company_id, warehouse_id, item_id, voucher_type, voucher_no,
                   layer_date, initial_qty, remaining_qty, unit_cost
            FROM public.stock_fifo_layers
            WHERE company_id = $1 AND warehouse_id = $2 AND item_id = $3 AND remaining_qty > 0
            ORDER BY layer_date ASC
            "#,
        )
        .bind(company_id)
        .bind(warehouse_id)
        .bind(item_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows
            .into_iter()
            .map(|r| crate::domain::valuation::FifoLayer {
                id: r.id,
                company_id: r.company_id,
                warehouse_id: r.warehouse_id,
                item_id: r.item_id,
                voucher_type: r.voucher_type,
                voucher_no: r.voucher_no,
                layer_date: r.layer_date,
                initial_qty: r.initial_qty,
                remaining_qty: r.remaining_qty,
                unit_cost: r.unit_cost,
            })
            .collect())
    }

    pub async fn update_fifo_layer_remaining_qty(
        &self,
        layer_id: Uuid,
        new_remaining_qty: Decimal,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            UPDATE public.stock_fifo_layers
            SET remaining_qty = $1
            WHERE id = $2
            "#,
        )
        .bind(new_remaining_qty)
        .bind(layer_id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }
}
