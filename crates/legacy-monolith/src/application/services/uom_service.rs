use uuid::Uuid;
use crate::domain::entities::uom::{Uom, UomConversionFactor};
use crate::infrastructure::repositories::uom_repository::UomRepository;

pub struct UomService {
    repo: UomRepository,
}

impl UomService {
    pub fn new(repo: UomRepository) -> Self {
        Self { repo }
    }

    pub async fn create_uom(&self, uom: Uom) -> Result<Uom, String> {
        self.repo.create_uom(&uom).await.map_err(|e| e.to_string())
    }

    pub async fn list_uoms(&self, company_id: Uuid) -> Result<Vec<Uom>, String> {
        self.repo.list_uoms(company_id).await.map_err(|e| e.to_string())
    }

    pub async fn delete_uom(&self, id: Uuid) -> Result<u64, String> {
        self.repo.delete_uom(id).await.map_err(|e| e.to_string())
    }

    pub async fn create_conversion(&self, conversion: UomConversionFactor) -> Result<UomConversionFactor, String> {
        self.repo.create_conversion(&conversion).await.map_err(|e| e.to_string())
    }

    pub async fn list_conversions(&self, company_id: Uuid) -> Result<Vec<UomConversionFactor>, String> {
        self.repo.list_conversions(company_id).await.map_err(|e| e.to_string())
    }

    pub async fn delete_conversion(&self, id: Uuid) -> Result<u64, String> {
        self.repo.delete_conversion(id).await.map_err(|e| e.to_string())
    }
}
