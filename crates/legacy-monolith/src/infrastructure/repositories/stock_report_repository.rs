use sqlx::PgPool;
use uuid::Uuid;
use chrono::NaiveDate;
use rust_decimal::Decimal;
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct StockLedgerRow {
    pub date: NaiveDate,
    pub voucher_type: String,
    pub voucher_no: String,
    pub item_code: String,
    pub item_name: String,
    pub warehouse_name: String,
    pub in_qty: Decimal,
    pub out_qty: Decimal,
    pub balance_qty: Decimal,
    pub incoming_rate: Decimal,
    pub valuation_rate: Decimal,
    pub balance_value: Decimal,
    pub company_id: Uuid,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StockBalanceRow {
    pub item_code: String,
    pub item_name: String,
    pub item_group: String,
    pub warehouse_name: String,
    pub balance_qty: Decimal,
    pub balance_value: Decimal,
    pub valuation_rate: Decimal,
    pub company_id: Uuid,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StockAgeingRow {
    pub item_code: String,
    pub item_name: String,
    pub warehouse_name: String,
#[derive(Serialize, Deserialize, sqlx::FromRow, Debug)]
pub struct StockProjectedQtyRow {
    pub item_code: String,
    pub item_name: String,
    pub warehouse_name: String,
    pub actual_qty: Decimal,
    pub planned_qty: Decimal,
    pub requested_qty: Decimal,
    pub ordered_qty: Decimal,
    pub reserved_qty: Decimal,
    pub projected_qty: Decimal,
    pub company_id: Uuid,
}

#[derive(Serialize, Deserialize, sqlx::FromRow, Debug)]
pub struct StockSummaryRow {
    pub item_group: String,
    pub total_qty: Decimal,
    pub total_value: Decimal,
}

#[derive(Serialize, Deserialize, sqlx::FromRow, Debug)]
pub struct BatchBalanceRow {
    pub batch_no: String,
    pub item_code: String,
    pub warehouse_name: String,
    pub balance: Decimal,
}

#[derive(Serialize, Deserialize, sqlx::FromRow, Debug)]
pub struct SerialNoStatusRow {
    pub serial_no: String,
    pub item_code: String,
    pub warehouse_name: Option<String>,
    pub status: String,
}

#[derive(Serialize, Deserialize, sqlx::FromRow, Debug)]
pub struct ItemShortageRow {
    pub item_code: String,
    pub item_name: String,
    pub actual_qty: Decimal,
    pub reorder_level: Decimal,
    pub shortage_qty: Decimal,
}

pub struct StockReportRepository {
    pool: PgPool,
}

impl StockReportRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn get_stock_ledger(&self, company_id: Uuid, start_date: Option<NaiveDate>, end_date: Option<NaiveDate>, item_id: Option<Uuid>, warehouse_id: Option<Uuid>) -> Result<Vec<StockLedgerRow>, sqlx::Error> {
        let mut query = String::from(r#"
            SELECT 
                sl.posting_date as "date",
                sl.voucher_type,
                sl.voucher_no,
                i.item_code,
                i.name as item_name,
                w.name as warehouse_name,
                CASE WHEN sl.actual_qty_delta > 0 THEN sl.actual_qty_delta ELSE 0.0000 END as in_qty,
                CASE WHEN sl.actual_qty_delta < 0 THEN ABS(sl.actual_qty_delta) ELSE 0.0000 END as out_qty,
                sl.qty_after as balance_qty,
                sl.valuation_rate as incoming_rate,
                sl.valuation_rate,
                sl.stock_value_after as balance_value,
                sl.company_id
            FROM stock_ledger_entries sl
            JOIN inventory_items i ON sl.item_id = i.id
            JOIN warehouses w ON sl.warehouse_id = w.id
            WHERE sl.company_id = $1
        "#);

        let mut params: Vec<Box<dyn sqlx::Encode<'_, sqlx::Postgres> + Send + Sync>> = vec![Box::new(company_id)];
        let mut param_index = 2;

        if let Some(sd) = start_date {
            query.push_str(&format!(" AND sl.posting_date >= ${}", param_index));
            params.push(Box::new(sd));
            param_index += 1;
        }

        if let Some(ed) = end_date {
            query.push_str(&format!(" AND sl.posting_date <= ${}", param_index));
            params.push(Box::new(ed));
            param_index += 1;
        }

        if let Some(iid) = item_id {
            query.push_str(&format!(" AND sl.item_id = ${}", param_index));
            params.push(Box::new(iid));
            param_index += 1;
        }

        if let Some(wid) = warehouse_id {
            query.push_str(&format!(" AND sl.warehouse_id = ${}", param_index));
            params.push(Box::new(wid));
            param_index += 1;
        }

        query.push_str(" ORDER BY sl.posting_date DESC, sl.created_at DESC");

        // Execute query dynamically
        // Because sqlx query! requires compile time known strings, we use query_as
        
        let mut db_query = sqlx::query_as::<_, StockLedgerRow>(&query);
        db_query = db_query.bind(company_id);
        
        if let Some(sd) = start_date { db_query = db_query.bind(sd); }
        if let Some(ed) = end_date { db_query = db_query.bind(ed); }
        if let Some(iid) = item_id { db_query = db_query.bind(iid); }
        if let Some(wid) = warehouse_id { db_query = db_query.bind(wid); }

        let rows = db_query.fetch_all(&self.pool).await?;

        // Rows are directly mapped from the view, no need for map adjustments since we use CASE WHEN
        Ok(rows)
    }

    pub async fn get_stock_balance(&self, company_id: Uuid, as_on: Option<NaiveDate>, item_id: Option<Uuid>, warehouse_id: Option<Uuid>) -> Result<Vec<StockBalanceRow>, sqlx::Error> {
        let mut query = String::from(r#"
            SELECT 
                i.item_code,
                i.name as item_name,
                c.name as item_group,
                w.name as warehouse_name,
                b.actual_qty as balance_qty,
                b.stock_value as balance_value,
                CASE WHEN b.actual_qty > 0 THEN b.stock_value / b.actual_qty ELSE 0.0000 END as valuation_rate,
                b.company_id
            FROM bins b
            JOIN inventory_items i ON b.item_id = i.id
            LEFT JOIN inventory_categories c ON i.category_id = c.id
            JOIN warehouses w ON b.warehouse_id = w.id
            WHERE b.company_id = $1 AND b.actual_qty > 0
        "#;
        
        // Let's just do current balance for MVP
        let rows = sqlx::query_as::<_, StockBalanceRow>(q)
            .bind(company_id)
            .fetch_all(&self.pool)
            .await?;
            
        Ok(rows)
    }

    pub async fn get_stock_ageing(&self, company_id: Uuid) -> Result<Vec<StockAgeingRow>, sqlx::Error> {
        // Dummy logic for ageing: based on last entry
        let q = r#"
            SELECT 
                i.item_code,
                i.name as item_name,
                w.name as warehouse_name,
                EXTRACT(DAY FROM (CURRENT_DATE - MAX(sl.posting_date)))::INTEGER as age_days,
                MAX(b.actual_qty) as balance_qty,
                MAX(b.stock_value) as balance_value,
                sl.company_id
            FROM stock_ledger_entries sl
            JOIN inventory_items i ON sl.item_id = i.id
            JOIN warehouses w ON sl.warehouse_id = w.id
            JOIN bins b ON b.item_id = sl.item_id AND b.warehouse_id = sl.warehouse_id
            WHERE sl.company_id = $1
            GROUP BY i.item_code, i.name, w.name, sl.company_id
            HAVING MAX(b.actual_qty) > 0
        "#;
        
        let rows = sqlx::query_as::<_, StockAgeingRow>(q)
            .bind(company_id)
            .fetch_all(&self.pool)
            .await?;
            
        Ok(rows)
    }

    pub async fn get_stock_projected_qty(&self, company_id: Uuid) -> Result<Vec<StockProjectedQtyRow>, sqlx::Error> {
        let q = r#"
            SELECT 
                i.item_code,
                i.name as item_name,
                w.name as warehouse_name,
                b.actual_qty,
                0.0000 as planned_qty,
                0.0000 as requested_qty,
                b.ordered_qty,
                b.reserved_qty,
                b.actual_qty + b.ordered_qty - b.reserved_qty as projected_qty,
                b.company_id
            FROM bins b
            JOIN inventory_items i ON b.item_id = i.id
            JOIN warehouses w ON b.warehouse_id = w.id
            WHERE b.company_id = $1
        "#;
        
        let rows = sqlx::query_as::<_, StockProjectedQtyRow>(q)
            .bind(company_id)
            .fetch_all(&self.pool)
            .await?;
            
        Ok(rows)
    }

    pub async fn get_stock_summary(&self, company_id: Uuid) -> Result<Vec<StockSummaryRow>, sqlx::Error> {
        let q = r#"
            SELECT 
                COALESCE(i.item_group, 'Uncategorized') as item_group,
                SUM(b.actual_qty) as total_qty,
                SUM(b.actual_qty * COALESCE(i.valuation_rate, 0)) as total_value
            FROM bins b
            JOIN inventory_items i ON b.item_id = i.id
            JOIN warehouses w ON b.warehouse_id = w.id
            WHERE w.company_id = $1
            GROUP BY i.item_group
            ORDER BY total_value DESC
        "#;
        sqlx::query_as::<_, StockSummaryRow>(q).bind(company_id).fetch_all(&self.pool).await
    }

    pub async fn get_batch_balance(&self, company_id: Uuid) -> Result<Vec<BatchBalanceRow>, sqlx::Error> {
        let q = r#"
            SELECT 
                COALESCE(b.batch_no, 'No Batch') as batch_no,
                i.item_code,
                w.warehouse_name,
                SUM(m.quantity) as balance
            FROM inventory_movements m
            JOIN inventory_items i ON m.item_id = i.id
            LEFT JOIN batches b ON m.batch_id = b.id
            JOIN warehouses w ON m.warehouse_id = w.id
            WHERE m.company_id = $1 AND m.batch_id IS NOT NULL
            GROUP BY b.batch_no, i.item_code, w.warehouse_name
            HAVING SUM(m.quantity) != 0
            ORDER BY i.item_code, b.batch_no
        "#;
        sqlx::query_as::<_, BatchBalanceRow>(q).bind(company_id).fetch_all(&self.pool).await
    }

    pub async fn get_serial_no_status(&self, company_id: Uuid) -> Result<Vec<SerialNoStatusRow>, sqlx::Error> {
        let q = r#"
            SELECT 
                sn.serial_no,
                i.item_code,
                w.warehouse_name,
                sn.status
            FROM serial_numbers sn
            JOIN inventory_items i ON sn.item_id = i.id
            LEFT JOIN warehouses w ON sn.warehouse_id = w.id
            WHERE sn.company_id = $1
            ORDER BY sn.created_at DESC
        "#;
        sqlx::query_as::<_, SerialNoStatusRow>(q).bind(company_id).fetch_all(&self.pool).await
    }

    pub async fn get_item_shortage(&self, company_id: Uuid) -> Result<Vec<ItemShortageRow>, sqlx::Error> {
        // Find items where actual_qty is less than the reorder level.
        // Assuming we have a reorder_level column in inventory_items. If not, we fall back to a default value or omit it.
        // Let's use 10.0 as a hardcoded threshold for now since we haven't added reorder_level yet, 
        // OR we can just aggregate bins and filter if < 10.
        let q = r#"
            WITH ItemBalances AS (
                SELECT 
                    i.item_code,
                    i.name as item_name,
                    SUM(b.actual_qty) as actual_qty
                FROM bins b
                JOIN inventory_items i ON b.item_id = i.id
                JOIN warehouses w ON b.warehouse_id = w.id
                WHERE w.company_id = $1
                GROUP BY i.item_code, i.name
            )
            SELECT 
                item_code, 
                item_name, 
                actual_qty, 
                10.0 as reorder_level,
                GREATEST(10.0 - actual_qty, 0) as shortage_qty
            FROM ItemBalances
            WHERE actual_qty < 10.0
            ORDER BY shortage_qty DESC
        "#;
        sqlx::query_as::<_, ItemShortageRow>(q).bind(company_id).fetch_all(&self.pool).await
    }
}
