use crate::domain::entities::PurchaseBill;
use crate::repositories::PurchaseBillRepository;
use management_system_core::{DomainError, DomainResult};
use uuid::Uuid;

#[derive(Clone)]
pub struct ProcurementService {
    purchase_bill_repo: PurchaseBillRepository,
}

impl ProcurementService {
    pub fn new(purchase_bill_repo: PurchaseBillRepository) -> Self {
        Self { purchase_bill_repo }
    }

    pub async fn get_purchase_bill(&self, id: Uuid) -> DomainResult<Option<PurchaseBill>> {
        self.purchase_bill_repo
            .find_by_id(id)
            .await
            .map_err(|e: sqlx::Error| DomainError::internal(e.to_string()))
    }

    pub async fn list_purchase_bills(
        &self,
        limit: i64,
        offset: i64,
    ) -> DomainResult<Vec<PurchaseBill>> {
        self.purchase_bill_repo
            .find_all(limit, offset)
            .await
            .map_err(|e: sqlx::Error| DomainError::internal(e.to_string()))
    }
}
