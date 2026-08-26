use uuid::Uuid;
use crate::domain::entities::quality_inspection::QualityInspection;
use crate::infrastructure::repositories::quality_inspection_repository::QualityInspectionRepository;

pub struct QualityInspectionService {
    repo: QualityInspectionRepository,
}

impl QualityInspectionService {
    pub fn new(repo: QualityInspectionRepository) -> Self {
        Self { repo }
    }

    pub async fn create_inspection(&self, inspection: QualityInspection) -> Result<QualityInspection, String> {
        self.repo.create_inspection(&inspection).await.map_err(|e| e.to_string())
    }

    pub async fn list_inspections(&self, company_id: Uuid) -> Result<Vec<QualityInspection>, String> {
        self.repo.list_inspections(company_id).await.map_err(|e| e.to_string())
    }

    pub async fn update_status(&self, id: Uuid, status: &str) -> Result<u64, String> {
        self.repo.update_status(id, status).await.map_err(|e| e.to_string())
    }
}
