use crate::domain::entities::stock_entry::{
    MaterialRequest, MaterialRequestItem, StockEntry, StockEntryItem,
};
use sqlx::{PgPool, Postgres, Transaction};
use uuid::Uuid;

#[derive(Clone)]
pub struct StockDocumentRepository {
    pool: PgPool,
}

impl StockDocumentRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub fn pool(&self) -> &PgPool {
        &self.pool
    }

    // --- Stock Entry ---
    pub async fn create_stock_entry(
        &self,
        tx: &mut Transaction<'_, Postgres>,
        entry: &StockEntry,
    ) -> Result<StockEntry, sqlx::Error> {
        sqlx::query_as::<_, StockEntry>(
            r#"
            INSERT INTO inventory.stock_entries (
                id, company_id, posting_date, posting_time, stock_entry_type, voucher_no,
                purpose, source_warehouse_id, target_warehouse_id, status, remarks, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
            "#,
        )
        .bind(entry.id)
        .bind(entry.company_id)
        .bind(entry.posting_date)
        .bind(entry.posting_time)
        .bind(&entry.stock_entry_type)
        .bind(&entry.voucher_no)
        .bind(&entry.purpose)
        .bind(entry.source_warehouse_id)
        .bind(entry.target_warehouse_id)
        .bind(&entry.status)
        .bind(&entry.remarks)
        .bind(entry.created_by)
        .fetch_one(&mut **tx)
        .await
    }

    pub async fn create_stock_entry_item(
        &self,
        tx: &mut Transaction<'_, Postgres>,
        item: &StockEntryItem,
    ) -> Result<StockEntryItem, sqlx::Error> {
        sqlx::query_as::<_, StockEntryItem>(
            r#"
            INSERT INTO inventory.stock_entry_items (
                id, stock_entry_id, item_id, source_warehouse_id, target_warehouse_id,
                qty, basic_rate, amount, batch_no, serial_no, source_bin_id, target_bin_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
            "#,
        )
        .bind(item.id)
        .bind(item.stock_entry_id)
        .bind(item.item_id)
        .bind(item.source_warehouse_id)
        .bind(item.target_warehouse_id)
        .bind(item.qty)
        .bind(item.basic_rate)
        .bind(item.amount)
        .bind(&item.batch_no)
        .bind(&item.serial_no)
        .bind(item.source_bin_id)
        .bind(item.target_bin_id)
        .fetch_one(&mut **tx)
        .await
    }

    pub async fn get_stock_entry(&self, id: Uuid) -> Result<Option<StockEntry>, sqlx::Error> {
        sqlx::query_as::<_, StockEntry>("SELECT * FROM inventory.stock_entries WHERE id = $1")
            .bind(id)
            .fetch_optional(&self.pool)
            .await
    }

    pub async fn get_stock_entry_items(
        &self,
        entry_id: Uuid,
    ) -> Result<Vec<StockEntryItem>, sqlx::Error> {
        sqlx::query_as::<_, StockEntryItem>(
            "SELECT * FROM inventory.stock_entry_items WHERE stock_entry_id = $1 ORDER BY created_at"
        )
        .bind(entry_id)
        .fetch_all(&self.pool)
        .await
    }

    pub async fn list_stock_entries(
        &self,
        company_id: Uuid,
    ) -> Result<Vec<StockEntry>, sqlx::Error> {
        sqlx::query_as::<_, StockEntry>(
            "SELECT * FROM inventory.stock_entries WHERE company_id = $1 ORDER BY posting_date DESC, posting_time DESC"
        )
        .bind(company_id)
        .fetch_all(&self.pool)
        .await
    }

    pub async fn update_stock_entry_status(
        &self,
        tx: &mut Transaction<'_, Postgres>,
        id: Uuid,
        status: &str,
        updated_by: Option<Uuid>,
    ) -> Result<StockEntry, sqlx::Error> {
        sqlx::query_as::<_, StockEntry>(
            r#"
            UPDATE inventory.stock_entries
            SET status = $2, updated_by = $3, updated_at = NOW()
            WHERE id = $1
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(status)
        .bind(updated_by)
        .fetch_one(&mut **tx)
        .await
    }

    // --- Material Request ---
    pub async fn create_material_request(
        &self,
        tx: &mut Transaction<'_, Postgres>,
        req: &MaterialRequest,
    ) -> Result<MaterialRequest, sqlx::Error> {
        sqlx::query_as::<_, MaterialRequest>(
            r#"
            INSERT INTO inventory.material_requests (
                id, company_id, transaction_date, material_request_type, voucher_no,
                required_by_date, status, remarks, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
            "#,
        )
        .bind(req.id)
        .bind(req.company_id)
        .bind(req.transaction_date)
        .bind(&req.material_request_type)
        .bind(&req.voucher_no)
        .bind(req.required_by_date)
        .bind(&req.status)
        .bind(&req.remarks)
        .bind(req.created_by)
        .fetch_one(&mut **tx)
        .await
    }

    pub async fn create_material_request_item(
        &self,
        tx: &mut Transaction<'_, Postgres>,
        item: &MaterialRequestItem,
    ) -> Result<MaterialRequestItem, sqlx::Error> {
        sqlx::query_as::<_, MaterialRequestItem>(
            r#"
            INSERT INTO inventory.material_request_items (
                id, material_request_id, item_id, warehouse_id, qty, ordered_qty, received_qty
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            "#,
        )
        .bind(item.id)
        .bind(item.material_request_id)
        .bind(item.item_id)
        .bind(item.warehouse_id)
        .bind(item.qty)
        .bind(item.ordered_qty)
        .bind(item.received_qty)
        .fetch_one(&mut **tx)
        .await
    }

    pub async fn get_material_request(
        &self,
        id: Uuid,
    ) -> Result<Option<MaterialRequest>, sqlx::Error> {
        sqlx::query_as::<_, MaterialRequest>(
            "SELECT * FROM inventory.material_requests WHERE id = $1",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
    }

    pub async fn get_material_request_items(
        &self,
        request_id: Uuid,
    ) -> Result<Vec<MaterialRequestItem>, sqlx::Error> {
        sqlx::query_as::<_, MaterialRequestItem>(
            "SELECT * FROM inventory.material_request_items WHERE material_request_id = $1 ORDER BY created_at"
        )
        .bind(request_id)
        .fetch_all(&self.pool)
        .await
    }

    pub async fn list_material_requests(
        &self,
        company_id: Uuid,
    ) -> Result<Vec<MaterialRequest>, sqlx::Error> {
        sqlx::query_as::<_, MaterialRequest>(
            "SELECT * FROM inventory.material_requests WHERE company_id = $1 ORDER BY transaction_date DESC"
        )
        .bind(company_id)
        .fetch_all(&self.pool)
        .await
    }

    pub async fn update_material_request_status(
        &self,
        tx: &mut Transaction<'_, Postgres>,
        id: Uuid,
        status: &str,
        updated_by: Option<Uuid>,
    ) -> Result<MaterialRequest, sqlx::Error> {
        sqlx::query_as::<_, MaterialRequest>(
            r#"
            UPDATE inventory.material_requests
            SET status = $2, updated_by = $3, updated_at = NOW()
            WHERE id = $1
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(status)
        .bind(updated_by)
        .fetch_one(&mut **tx)
        .await
    }
}
