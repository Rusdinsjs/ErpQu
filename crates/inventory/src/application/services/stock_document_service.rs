use crate::domain::entities::stock_entry::{
    MaterialRequest, MaterialRequestItem, StockEntry, StockEntryItem, StockPostingInstruction,
    StockPostingLineItem,
};
use crate::repositories::StockDocumentRepository;
use crate::stock_posting_engine::StockPostingEngine;
use management_system_core::domain::errors::{DomainError, DomainResult};
use rust_decimal::Decimal;
use std::sync::Arc;
use uuid::Uuid;

#[derive(Debug, Clone, serde::Deserialize)]
pub struct CreateStockEntryRequest {
    pub company_id: Uuid,
    pub posting_date: chrono::NaiveDate,
    pub posting_time: Option<chrono::NaiveTime>,
    pub stock_entry_type: String, // 'MATERIAL_RECEIPT', 'MATERIAL_ISSUE', 'MATERIAL_TRANSFER', 'REPACK'
    pub voucher_no: String,
    pub purpose: Option<String>,
    pub source_warehouse_id: Option<Uuid>,
    pub target_warehouse_id: Option<Uuid>,
    pub remarks: Option<String>,
    pub lines: Vec<CreateStockEntryItemRequest>,
}

#[derive(Debug, Clone, serde::Deserialize)]
pub struct CreateStockEntryItemRequest {
    pub item_id: Uuid,
    pub source_warehouse_id: Option<Uuid>,
    pub target_warehouse_id: Option<Uuid>,
    pub qty: Decimal,
    pub basic_rate: Decimal,
    pub batch_no: Option<String>,
    pub serial_no: Option<String>,
    pub source_bin_id: Option<Uuid>,
    pub target_bin_id: Option<Uuid>,
}

#[derive(Debug, Clone, serde::Deserialize)]
pub struct CreateMaterialRequest {
    pub company_id: Uuid,
    pub transaction_date: chrono::NaiveDate,
    pub material_request_type: String, // 'PURCHASE', 'MATERIAL_TRANSFER', 'MATERIAL_ISSUE'
    pub voucher_no: String,
    pub required_by_date: Option<chrono::NaiveDate>,
    pub remarks: Option<String>,
    pub lines: Vec<CreateMaterialRequestItemRequest>,
}

#[derive(Debug, Clone, serde::Deserialize)]
pub struct CreateMaterialRequestItemRequest {
    pub item_id: Uuid,
    pub warehouse_id: Option<Uuid>,
    pub qty: Decimal,
}

#[derive(Clone)]
pub struct StockDocumentService {
    repository: Arc<StockDocumentRepository>,
    stock_engine: StockPostingEngine,
}

impl StockDocumentService {
    pub fn new(repository: Arc<StockDocumentRepository>, stock_engine: StockPostingEngine) -> Self {
        Self {
            repository,
            stock_engine,
        }
    }

    // --- Stock Entry Service Functions ---

    pub async fn create_stock_entry(
        &self,
        req: CreateStockEntryRequest,
        created_by: Option<Uuid>,
    ) -> DomainResult<(StockEntry, Vec<StockEntryItem>)> {
        let mut tx = self
            .repository
            .pool()
            .begin()
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        let entry_id = Uuid::new_v4();
        let posting_time = req
            .posting_time
            .unwrap_or_else(|| chrono::Utc::now().time());

        let entry = StockEntry {
            id: entry_id,
            company_id: req.company_id,
            posting_date: req.posting_date,
            posting_time,
            stock_entry_type: req.stock_entry_type.clone(),
            voucher_no: req.voucher_no.clone(),
            purpose: req.purpose.clone(),
            source_warehouse_id: req.source_warehouse_id,
            target_warehouse_id: req.target_warehouse_id,
            status: "DRAFT".to_string(),
            remarks: req.remarks.clone(),
            created_at: chrono::Utc::now(),
            created_by,
            updated_at: chrono::Utc::now(),
            updated_by: None,
        };

        let saved_entry = self
            .repository
            .create_stock_entry(&mut tx, &entry)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        let mut saved_items = Vec::new();
        for item_req in req.lines {
            let item_id = Uuid::new_v4();
            let amount = item_req.qty * item_req.basic_rate;
            let item = StockEntryItem {
                id: item_id,
                stock_entry_id: entry_id,
                item_id: item_req.item_id,
                source_warehouse_id: item_req.source_warehouse_id.or(req.source_warehouse_id),
                target_warehouse_id: item_req.target_warehouse_id.or(req.target_warehouse_id),
                qty: item_req.qty,
                basic_rate: item_req.basic_rate,
                amount,
                batch_no: item_req.batch_no,
                serial_no: item_req.serial_no,
                created_at: chrono::Utc::now(),
                source_bin_id: item_req.source_bin_id,
                target_bin_id: item_req.target_bin_id,
            };

            let saved_item = self
                .repository
                .create_stock_entry_item(&mut tx, &item)
                .await
                .map_err(|e| DomainError::Database(e.to_string()))?;
            saved_items.push(saved_item);
        }

        tx.commit()
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok((saved_entry, saved_items))
    }

    pub async fn get_stock_entry(
        &self,
        id: Uuid,
    ) -> DomainResult<(StockEntry, Vec<StockEntryItem>)> {
        let entry = self
            .repository
            .get_stock_entry(id)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?
            .ok_or_else(|| DomainError::not_found("StockEntry", id.to_string()))?;

        let items = self
            .repository
            .get_stock_entry_items(id)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok((entry, items))
    }

    pub async fn list_stock_entries(&self, company_id: Uuid) -> DomainResult<Vec<StockEntry>> {
        self.repository
            .list_stock_entries(company_id)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))
    }

    pub async fn submit_stock_entry(
        &self,
        id: Uuid,
        updated_by: Option<Uuid>,
    ) -> DomainResult<(StockEntry, Vec<StockEntryItem>)> {
        let mut tx = self
            .repository
            .pool()
            .begin()
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        let entry = self
            .repository
            .get_stock_entry(id)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?
            .ok_or_else(|| DomainError::not_found("StockEntry", id.to_string()))?;

        if entry.status != "DRAFT" {
            return Err(DomainError::business_rule(
                "StockEntryNotDraft",
                "Only DRAFT stock entries can be submitted",
            ));
        }

        let items = self
            .repository
            .get_stock_entry_items(id)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        if items.is_empty() {
            return Err(DomainError::business_rule(
                "StockEntryEmpty",
                "Cannot submit stock entry without items",
            ));
        }

        // Build Stock Posting Instruction
        let mut posting_lines = Vec::new();
        for item in &items {
            match entry.stock_entry_type.as_str() {
                "MATERIAL_RECEIPT" => {
                    let target_wh = item.target_warehouse_id.ok_or_else(|| {
                        DomainError::business_rule(
                            "MissingTargetWarehouse",
                            "Material Receipt requires target warehouse",
                        )
                    })?;
                    posting_lines.push(StockPostingLineItem {
                        warehouse_id: target_wh,
                        item_id: item.item_id,
                        actual_qty_delta: item.qty,
                        unit_cost: Some(item.basic_rate),
                        voucher_line_id: Some(item.id),
                        batch_no: item.batch_no.clone(),
                        serial_no: item.serial_no.clone(),
                        allow_negative_stock: Some(false),
                        warehouse_bin_id: item.target_bin_id,
                    });
                }
                "MATERIAL_ISSUE" => {
                    let source_wh = item.source_warehouse_id.ok_or_else(|| {
                        DomainError::business_rule(
                            "MissingSourceWarehouse",
                            "Material Issue requires source warehouse",
                        )
                    })?;
                    posting_lines.push(StockPostingLineItem {
                        warehouse_id: source_wh,
                        item_id: item.item_id,
                        actual_qty_delta: -item.qty,
                        unit_cost: None,
                        voucher_line_id: Some(item.id),
                        batch_no: item.batch_no.clone(),
                        serial_no: item.serial_no.clone(),
                        allow_negative_stock: Some(false),
                        warehouse_bin_id: item.source_bin_id,
                    });
                }
                "MATERIAL_TRANSFER" | "REPACK" => {
                    let source_wh = item.source_warehouse_id.ok_or_else(|| {
                        DomainError::business_rule(
                            "MissingSourceWarehouse",
                            "Stock movement requires source warehouse",
                        )
                    })?;
                    let target_wh = item.target_warehouse_id.ok_or_else(|| {
                        DomainError::business_rule(
                            "MissingTargetWarehouse",
                            "Stock movement requires target warehouse",
                        )
                    })?;

                    // Outbound first
                    posting_lines.push(StockPostingLineItem {
                        warehouse_id: source_wh,
                        item_id: item.item_id,
                        actual_qty_delta: -item.qty,
                        unit_cost: None,
                        voucher_line_id: Some(item.id),
                        batch_no: item.batch_no.clone(),
                        serial_no: item.serial_no.clone(),
                        allow_negative_stock: Some(false),
                        warehouse_bin_id: item.source_bin_id,
                    });

                    // Inbound second (Engine will use outbound value if we don't pass unit_cost)
                    posting_lines.push(StockPostingLineItem {
                        warehouse_id: target_wh,
                        item_id: item.item_id,
                        actual_qty_delta: item.qty,
                        unit_cost: Some(item.basic_rate),
                        voucher_line_id: Some(item.id),
                        batch_no: item.batch_no.clone(),
                        serial_no: item.serial_no.clone(),
                        allow_negative_stock: Some(false),
                        warehouse_bin_id: item.target_bin_id,
                    });
                }
                _ => {
                    return Err(DomainError::business_rule(
                        "InvalidStockEntryType",
                        &format!("Unknown stock entry type: {}", entry.stock_entry_type),
                    ));
                }
            }
        }

        let posting_instruction = StockPostingInstruction {
            company_id: entry.company_id,
            posting_date: entry.posting_date,
            voucher_type: format!("STOCK_ENTRY_{}", entry.stock_entry_type),
            voucher_no: entry.voucher_no.clone(),
            voucher_id: entry.id,
            lines: posting_lines,
            created_by: entry.created_by,
        };

        // Post stock ledger and update bins
        self.stock_engine
            .post_in_uow(&mut tx, &posting_instruction)
            .await?;

        // Update status to SUBMITTED
        let updated_entry = self
            .repository
            .update_stock_entry_status(&mut tx, id, "SUBMITTED", updated_by)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        tx.commit()
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok((updated_entry, items))
    }

    // --- Material Request Service Functions ---

    pub async fn create_material_request(
        &self,
        req: CreateMaterialRequest,
        created_by: Option<Uuid>,
    ) -> DomainResult<(MaterialRequest, Vec<MaterialRequestItem>)> {
        let mut tx = self
            .repository
            .pool()
            .begin()
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        let req_id = Uuid::new_v4();

        let material_req = MaterialRequest {
            id: req_id,
            company_id: req.company_id,
            transaction_date: req.transaction_date,
            material_request_type: req.material_request_type.clone(),
            voucher_no: req.voucher_no.clone(),
            required_by_date: req.required_by_date,
            status: "DRAFT".to_string(),
            remarks: req.remarks.clone(),
            created_at: chrono::Utc::now(),
            created_by,
            updated_at: chrono::Utc::now(),
            updated_by: None,
        };

        let saved_req = self
            .repository
            .create_material_request(&mut tx, &material_req)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        let mut saved_items = Vec::new();
        for item_req in req.lines {
            let item_id = Uuid::new_v4();
            let item = MaterialRequestItem {
                id: item_id,
                material_request_id: req_id,
                item_id: item_req.item_id,
                warehouse_id: item_req.warehouse_id,
                qty: item_req.qty,
                ordered_qty: Decimal::ZERO,
                received_qty: Decimal::ZERO,
                created_at: chrono::Utc::now(),
            };

            let saved_item = self
                .repository
                .create_material_request_item(&mut tx, &item)
                .await
                .map_err(|e| DomainError::Database(e.to_string()))?;
            saved_items.push(saved_item);
        }

        tx.commit()
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok((saved_req, saved_items))
    }

    pub async fn get_material_request(
        &self,
        id: Uuid,
    ) -> DomainResult<(MaterialRequest, Vec<MaterialRequestItem>)> {
        let req = self
            .repository
            .get_material_request(id)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?
            .ok_or_else(|| DomainError::not_found("MaterialRequest", id.to_string()))?;

        let items = self
            .repository
            .get_material_request_items(id)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok((req, items))
    }

    pub async fn list_material_requests(
        &self,
        company_id: Uuid,
    ) -> DomainResult<Vec<MaterialRequest>> {
        self.repository
            .list_material_requests(company_id)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))
    }

    pub async fn approve_material_request(
        &self,
        id: Uuid,
        updated_by: Option<Uuid>,
    ) -> DomainResult<MaterialRequest> {
        let mut tx = self
            .repository
            .pool()
            .begin()
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        let req = self
            .repository
            .get_material_request(id)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?
            .ok_or_else(|| DomainError::not_found("MaterialRequest", id.to_string()))?;

        if req.status != "DRAFT" {
            return Err(DomainError::business_rule(
                "MaterialRequestNotDraft",
                "Only DRAFT material requests can be approved",
            ));
        }

        let updated_req = self
            .repository
            .update_material_request_status(&mut tx, id, "APPROVED", updated_by)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        tx.commit()
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(updated_req)
    }

    pub async fn submit_purchase_receipt(
        &self,
        id: Uuid,
        updated_by: Option<Uuid>,
    ) -> DomainResult<()> {
        let mut tx = self
            .repository
            .pool()
            .begin()
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        let finance_repo = management_system_finance::repositories::FinanceRepository::new(
            self.repository.pool().clone(),
        );

        let receipt = finance_repo
            .get_purchase_receipt(id)
            .await?
            .ok_or_else(|| DomainError::not_found("PurchaseReceipt", id.to_string()))?;

        if receipt.status != "draft" {
            return Err(DomainError::business_rule(
                "PurchaseReceiptNotDraft",
                "Only draft purchase receipts can be submitted",
            ));
        }

        let items = finance_repo.get_purchase_receipt_items(id).await?;
        if items.is_empty() {
            return Err(DomainError::business_rule(
                "PurchaseReceiptEmpty",
                "Cannot submit purchase receipt without items",
            ));
        }

        let mut posting_lines = Vec::new();
        for item in &items {
            posting_lines.push(StockPostingLineItem {
                warehouse_id: receipt.warehouse_id,
                item_id: item.item_id,
                actual_qty_delta: item.qty_received,
                unit_cost: Some(item.unit_cost),
                voucher_line_id: Some(item.id),
                batch_no: item.batch_no.clone(),
                serial_no: item.serial_no.clone(),
                allow_negative_stock: Some(false),
                warehouse_bin_id: None,
            });
        }

        let instruction = StockPostingInstruction {
            company_id: receipt.company_id,
            posting_date: receipt.posting_date,
            voucher_type: "Purchase Receipt".to_string(),
            voucher_no: receipt.receipt_number.clone(),
            voucher_id: receipt.id,
            lines: posting_lines,
            created_by: updated_by,
        };

        self.stock_engine.post_in_uow(&mut tx, &instruction).await?;

        sqlx::query("UPDATE purchase_receipts SET status = 'SUBMITTED' WHERE id = $1")
            .bind(receipt.id)
            .execute(&mut *tx)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        tx.commit()
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(())
    }

    pub async fn submit_sales_shipment(
        &self,
        id: Uuid,
        updated_by: Option<Uuid>,
    ) -> DomainResult<()> {
        let mut tx = self
            .repository
            .pool()
            .begin()
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        let finance_repo = management_system_finance::repositories::FinanceRepository::new(
            self.repository.pool().clone(),
        );

        let shipment = finance_repo
            .get_sales_shipment(id)
            .await?
            .ok_or_else(|| DomainError::not_found("SalesShipment", id.to_string()))?;

        if shipment.status != "pending" {
            return Err(DomainError::business_rule(
                "SalesShipmentNotPending",
                "Only pending shipments can be submitted",
            ));
        }

        let warehouse_id = shipment.warehouse_id.ok_or_else(|| {
            DomainError::business_rule(
                "MissingWarehouse",
                "Sales shipment requires a warehouse to ship from",
            )
        })?;

        let items = finance_repo.get_sales_shipment_items(id).await?;
        if items.is_empty() {
            return Err(DomainError::business_rule(
                "SalesShipmentEmpty",
                "Cannot submit shipment without items",
            ));
        }

        let mut posting_lines = Vec::new();
        for item in &items {
            let item_id = item.item_id.ok_or_else(|| {
                DomainError::business_rule(
                    "MissingItemId",
                    "Each shipment item must have an item_id selected",
                )
            })?;

            // Quality Inspection Check: Block if status is QUALITY_HOLD or REJECTED
            let latest_quality_status: Option<String> = sqlx::query_scalar(
                "SELECT status FROM quality_inspections 
                 WHERE item_id = $1 
                 ORDER BY created_at DESC LIMIT 1",
            )
            .bind(item_id)
            .fetch_optional(&mut *tx)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

            if let Some(status) = latest_quality_status {
                if status == "QUALITY_HOLD" || status == "REJECTED" {
                    let msg = format!(
                        "Item cannot be shipped because its quality inspection status is {}",
                        status
                    );
                    return Err(DomainError::business_rule("QualityInspectionHold", &msg));
                }
            }

            posting_lines.push(StockPostingLineItem {
                warehouse_id,
                item_id,
                actual_qty_delta: -item.quantity_shipped,
                unit_cost: None,
                voucher_line_id: Some(item.id),
                batch_no: None,
                serial_no: None,
                allow_negative_stock: Some(false),
                warehouse_bin_id: None,
            });
        }

        let company_id: Uuid =
            sqlx::query_scalar("SELECT company_id FROM sales_orders WHERE id = $1")
                .bind(shipment.sales_order_id)
                .fetch_one(&mut *tx)
                .await
                .map_err(|e| DomainError::Database(e.to_string()))?;

        let instruction = StockPostingInstruction {
            company_id,
            posting_date: shipment.date,
            voucher_type: "Sales Shipment".to_string(),
            voucher_no: shipment.shipment_number.clone(),
            voucher_id: shipment.id,
            lines: posting_lines,
            created_by: updated_by,
        };

        self.stock_engine.post_in_uow(&mut tx, &instruction).await?;

        sqlx::query(
            "UPDATE sales_shipments SET status = 'SUBMITTED', updated_at = NOW() WHERE id = $1",
        )
        .bind(shipment.id)
        .execute(&mut *tx)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        tx.commit()
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(())
    }
}
