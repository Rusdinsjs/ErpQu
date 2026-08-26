use uuid::Uuid;
use crate::domain::entities::item_tracking::{SerialNumber, Batch};
use crate::infrastructure::repositories::item_tracking_repository::ItemTrackingRepository;

pub struct ItemTrackingService {
    repo: ItemTrackingRepository,
}

impl ItemTrackingService {
    pub fn new(repo: ItemTrackingRepository) -> Self {
        Self { repo }
    }

    pub async fn create_serial_number(&self, sn: SerialNumber) -> Result<SerialNumber, String> {
        self.repo.create_serial_number(&sn).await.map_err(|e| e.to_string())
    }

    pub async fn list_serial_numbers(&self, company_id: Uuid) -> Result<Vec<SerialNumber>, String> {
        self.repo.list_serial_numbers(company_id).await.map_err(|e| e.to_string())
    }

    pub async fn delete_serial_number(&self, id: Uuid) -> Result<u64, String> {
        self.repo.delete_serial_number(id).await.map_err(|e| e.to_string())
    }

    pub async fn create_batch(&self, batch: Batch) -> Result<Batch, String> {
        self.repo.create_batch(&batch).await.map_err(|e| e.to_string())
    }

    pub async fn list_batches(&self, company_id: Uuid) -> Result<Vec<Batch>, String> {
        self.repo.list_batches(company_id).await.map_err(|e| e.to_string())
    }

    pub async fn delete_batch(&self, id: Uuid) -> Result<u64, String> {
        self.repo.delete_batch(id).await.map_err(|e| e.to_string())
    }
}
