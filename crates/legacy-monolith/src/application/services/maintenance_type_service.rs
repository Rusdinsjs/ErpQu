use crate::domain::entities::maintenance::MaintenanceType;
use crate::infrastructure::repositories::maintenance_type_repository::MaintenanceTypeRepository;

pub struct MaintenanceTypeService {
    repo: MaintenanceTypeRepository,
}

impl MaintenanceTypeService {
    pub fn new(repo: MaintenanceTypeRepository) -> Self {
        Self { repo }
    }

    pub async fn get_all_types(&self) -> Result<Vec<MaintenanceType>, String> {
        self.repo.find_all().await.map_err(|e| e.to_string())
    }

    pub async fn get_type_by_id(&self, id: i32) -> Result<Option<MaintenanceType>, String> {
        self.repo.find_by_id(id).await.map_err(|e| e.to_string())
    }

    pub async fn create_type(&self, m_type: MaintenanceType) -> Result<MaintenanceType, String> {
        self.repo.create(m_type).await.map_err(|e| e.to_string())
    }

    pub async fn update_type(&self, m_type: MaintenanceType) -> Result<MaintenanceType, String> {
        self.repo.update(m_type).await.map_err(|e| e.to_string())
    }

    pub async fn delete_type(&self, id: i32) -> Result<(), String> {
        self.repo.delete(id).await.map_err(|e| e.to_string())
    }
}
