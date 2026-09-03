//! Bill of Materials (BOM) & Manufacturing Service (QMFG-001, QMFG-003)

use chrono::Utc;
use management_system_core::domain::errors::{DomainError, DomainResult};
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use sqlx::PgPool;
use uuid::Uuid;

use crate::domain::manufacturing_pos::{
    Bom, BomItem, CreateBomRequest, CreateProductionOrderRequest, MaterialRequirement,
    ProductionOrder,
};
use crate::repositories::bom_repository::BomRepository;

#[derive(Clone)]
pub struct BomService {
    repo: BomRepository,
}

impl BomService {
    pub fn new(pool: PgPool) -> Self {
        Self {
            repo: BomRepository::new(pool),
        }
    }

    pub async fn create_bom(&self, company_id: Uuid, req: CreateBomRequest) -> DomainResult<Bom> {
        let bom_id = Uuid::new_v4();
        let bom = Bom {
            id: bom_id,
            company_id: req.company_id.unwrap_or(company_id),
            item_id: req.item_id,
            bom_number: req.bom_number,
            version: 1,
            quantity: req.quantity.unwrap_or(dec!(1.0)),
            is_active: true,
            created_at: Utc::now(),
        };

        let items: Vec<BomItem> = req
            .items
            .into_iter()
            .map(|item| BomItem {
                id: Uuid::new_v4(),
                bom_id,
                item_id: item.item_id,
                qty_required: item.qty_required,
                scrap_percentage: item.scrap_percentage,
            })
            .collect();

        self.repo
            .create_bom_with_items(&bom, &items)
            .await
            .map_err(|e| DomainError::internal(format!("Failed to create BOM: {}", e)))
    }

    pub async fn get_bom(&self, id: Uuid) -> DomainResult<Option<(Bom, Vec<BomItem>)>> {
        let bom = self
            .repo
            .get_bom(id)
            .await
            .map_err(|e| DomainError::internal(format!("Failed to fetch BOM: {}", e)))?;

        match bom {
            Some(b) => {
                let items = self.repo.get_bom_items(b.id).await.map_err(|e| {
                    DomainError::internal(format!("Failed to fetch BOM items: {}", e))
                })?;
                Ok(Some((b, items)))
            }
            None => Ok(None),
        }
    }

    pub async fn list_boms(&self, company_id: Uuid) -> DomainResult<Vec<Bom>> {
        self.repo
            .list_boms(company_id)
            .await
            .map_err(|e| DomainError::internal(format!("Failed to list BOMs: {}", e)))
    }

    /// Calculates required raw materials including scrap percentage (QMFG-002)
    pub async fn calculate_material_requirements(
        &self,
        bom_id: Uuid,
        target_qty: Decimal,
    ) -> DomainResult<Vec<MaterialRequirement>> {
        let (bom, items) = self
            .get_bom(bom_id)
            .await?
            .ok_or_else(|| DomainError::not_found("Bom", bom_id))?;

        if bom.quantity == Decimal::ZERO {
            return Err(DomainError::business_rule(
                "InvalidBomQuantity",
                "BOM base quantity cannot be zero",
            ));
        }

        let mut requirements = Vec::with_capacity(items.len());
        for item in items {
            let scrap_pct = item.scrap_percentage.unwrap_or(Decimal::ZERO);
            let scrap_multiplier = dec!(1.0) + (scrap_pct / dec!(100.0));
            let unit_req = item.qty_required / bom.quantity;
            let base_qty = unit_req * target_qty;
            let total_qty_required = (base_qty * scrap_multiplier).round_dp(4);

            requirements.push(MaterialRequirement {
                item_id: item.item_id,
                base_qty,
                scrap_percentage: scrap_pct,
                total_qty_required,
            });
        }

        Ok(requirements)
    }

    // --- Production Orders ---

    pub async fn create_production_order(
        &self,
        company_id: Uuid,
        req: CreateProductionOrderRequest,
    ) -> DomainResult<ProductionOrder> {
        let order = ProductionOrder {
            id: Uuid::new_v4(),
            company_id: req.company_id.unwrap_or(company_id),
            production_order_number: req.production_order_number,
            bom_id: req.bom_id,
            item_id: req.item_id,
            target_qty: req.target_qty,
            produced_qty: Decimal::ZERO,
            warehouse_id: req.warehouse_id,
            status: "DRAFT".to_string(),
            wip_account_id: req.wip_account_id,
            created_at: Utc::now(),
        };

        self.repo
            .create_production_order(&order)
            .await
            .map_err(|e| DomainError::internal(format!("Failed to create production order: {}", e)))
    }

    pub async fn get_production_order(&self, id: Uuid) -> DomainResult<Option<ProductionOrder>> {
        self.repo
            .get_production_order(id)
            .await
            .map_err(|e| DomainError::internal(format!("Failed to fetch production order: {}", e)))
    }

    pub async fn list_production_orders(
        &self,
        company_id: Uuid,
    ) -> DomainResult<Vec<ProductionOrder>> {
        self.repo
            .list_production_orders(company_id)
            .await
            .map_err(|e| DomainError::internal(format!("Failed to list production orders: {}", e)))
    }

    pub async fn update_production_order_status(
        &self,
        id: Uuid,
        status: &str,
    ) -> DomainResult<Option<ProductionOrder>> {
        self.repo
            .update_production_order_status(id, status)
            .await
            .map_err(|e| {
                DomainError::internal(format!("Failed to update production order status: {}", e))
            })
    }
}
