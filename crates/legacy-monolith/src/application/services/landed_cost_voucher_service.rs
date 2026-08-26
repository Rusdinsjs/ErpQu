use uuid::Uuid;
use crate::domain::entities::landed_cost_voucher::LandedCostVoucher;
use crate::infrastructure::repositories::landed_cost_voucher_repository::LandedCostVoucherRepository;

pub struct LandedCostVoucherService {
    repo: LandedCostVoucherRepository,
}

impl LandedCostVoucherService {
    pub fn new(repo: LandedCostVoucherRepository) -> Self {
        Self { repo }
    }

    pub async fn create_voucher(&self, voucher: LandedCostVoucher) -> Result<LandedCostVoucher, String> {
        // TODO: In the future, this should also create retrospective IN_ADJUSTMENT movements
        // to update the average_cost of the items associated with the receipt_document_id
        
        self.repo.create_voucher(&voucher).await.map_err(|e| e.to_string())
    }

    pub async fn list_vouchers(&self, company_id: Uuid) -> Result<Vec<LandedCostVoucher>, String> {
        self.repo.list_vouchers(company_id).await.map_err(|e| e.to_string())
    }

    pub async fn delete_voucher(&self, id: Uuid) -> Result<u64, String> {
        self.repo.delete_voucher(id).await.map_err(|e| e.to_string())
    }
}
