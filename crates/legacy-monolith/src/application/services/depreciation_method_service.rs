use uuid::Uuid;
use crate::domain::entities::depreciation::DepreciationMethod;
use crate::infrastructure::repositories::depreciation_method_repository::DepreciationMethodRepository;

pub struct DepreciationMethodService {
    repo: DepreciationMethodRepository,
}

impl DepreciationMethodService {
    pub fn new(repo: DepreciationMethodRepository) -> Self {
        Self { repo }
    }

    pub async fn get_all_methods(&self) -> Result<Vec<DepreciationMethod>, String> {
        self.repo.find_all().await.map_err(|e| e.to_string())
    }

    pub async fn get_method_by_id(&self, id: Uuid) -> Result<Option<DepreciationMethod>, String> {
        self.repo.find_by_id(id).await.map_err(|e| e.to_string())
    }

    pub async fn create_method(&self, method: DepreciationMethod) -> Result<DepreciationMethod, String> {
        self.repo.create(method).await.map_err(|e| e.to_string())
    }

    pub async fn update_method(&self, method: DepreciationMethod) -> Result<DepreciationMethod, String> {
        self.repo.update(method).await.map_err(|e| e.to_string())
    }

    pub async fn delete_method(&self, id: Uuid) -> Result<(), String> {
        self.repo.delete(id).await.map_err(|e| e.to_string())
    }
}
