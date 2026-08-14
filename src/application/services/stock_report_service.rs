use uuid::Uuid;
use chrono::NaiveDate;
use crate::infrastructure::repositories::stock_report_repository::{
    StockReportRepository, StockLedgerRow, StockBalanceRow, StockAgeingRow, StockProjectedQtyRow,
    StockSummaryRow, BatchBalanceRow, SerialNoStatusRow, ItemShortageRow
};

pub struct StockReportService {
    repo: StockReportRepository,
}

impl StockReportService {
    pub fn new(repo: StockReportRepository) -> Self {
        Self { repo }
    }

    pub async fn get_stock_ledger(&self, company_id: Uuid, start_date: Option<NaiveDate>, end_date: Option<NaiveDate>, item_id: Option<Uuid>, warehouse_id: Option<Uuid>) -> Result<Vec<StockLedgerRow>, String> {
        self.repo.get_stock_ledger(company_id, start_date, end_date, item_id, warehouse_id).await.map_err(|e| e.to_string())
    }

    pub async fn get_stock_balance(&self, company_id: Uuid, as_on: Option<NaiveDate>, item_id: Option<Uuid>, warehouse_id: Option<Uuid>) -> Result<Vec<StockBalanceRow>, String> {
        self.repo.get_stock_balance(company_id, as_on, item_id, warehouse_id).await.map_err(|e| e.to_string())
    }

    pub async fn get_stock_ageing(&self, company_id: Uuid) -> Result<Vec<StockAgeingRow>, String> {
        self.repo.get_stock_ageing(company_id).await.map_err(|e| e.to_string())
    }

    pub async fn get_stock_projected_qty(&self, company_id: Uuid) -> Result<Vec<StockProjectedQtyRow>, String> {
        self.repo.get_stock_projected_qty(company_id).await.map_err(|e| e.to_string())
    }

    pub async fn get_stock_summary(&self, company_id: Uuid) -> Result<Vec<StockSummaryRow>, String> {
        self.repo.get_stock_summary(company_id).await.map_err(|e| e.to_string())
    }

    pub async fn get_batch_balance(&self, company_id: Uuid) -> Result<Vec<BatchBalanceRow>, String> {
        self.repo.get_batch_balance(company_id).await.map_err(|e| e.to_string())
    }

    pub async fn get_serial_no_status(&self, company_id: Uuid) -> Result<Vec<SerialNoStatusRow>, String> {
        self.repo.get_serial_no_status(company_id).await.map_err(|e| e.to_string())
    }

    pub async fn get_item_shortage(&self, company_id: Uuid) -> Result<Vec<ItemShortageRow>, String> {
        self.repo.get_item_shortage(company_id).await.map_err(|e| e.to_string())
    }
}
