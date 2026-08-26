use crate::domain::entities::warehouse::{Warehouse, StockDashboardKpi};
use crate::infrastructure::repositories::warehouse_repository::WarehouseRepository;
use uuid::Uuid;

pub struct WarehouseService {
    repo: WarehouseRepository,
}

impl WarehouseService {
    pub fn new(repo: WarehouseRepository) -> Self {
        Self { repo }
    }

    pub async fn create_warehouse(&self, mut warehouse: Warehouse) -> Result<Warehouse, String> {
        if warehouse.id.is_nil() {
            warehouse.id = Uuid::new_v4();
        }
        
        // Optional validation: if parent_id is provided, check if parent exists and is_group = true
        if let Some(parent_id) = warehouse.parent_id {
            let parent = self.repo.find_by_id(parent_id).await.map_err(|e| e.to_string())?;
            if let Some(p) = parent {
                if !p.is_group {
                    return Err("Parent warehouse must be a group (is_group = true)".to_string());
                }
            } else {
                return Err("Parent warehouse not found".to_string());
            }
        }

        self.repo.create(&warehouse).await.map_err(|e| e.to_string())
    }

    pub async fn list_warehouses(&self) -> Result<Vec<Warehouse>, String> {
        self.repo.find_all().await.map_err(|e| e.to_string())
    }

    pub async fn get_kpis(&self, company_id: Uuid) -> Result<StockDashboardKpi, String> {
        self.repo.get_dashboard_kpis(company_id).await.map_err(|e| e.to_string())
    }

    pub async fn get_warehouse(&self, id: Uuid) -> Result<Option<Warehouse>, String> {
        self.repo.find_by_id(id).await.map_err(|e| e.to_string())
    }

    pub async fn delete_warehouse(&self, id: Uuid) -> Result<bool, String> {
        // Optional: Check if it has child warehouses
        let all = self.list_warehouses().await?;
        if all.iter().any(|w| w.parent_id == Some(id)) {
            return Err("Cannot delete warehouse because it has child warehouses (bins/sub-locations).".to_string());
        }

        let deleted = self.repo.delete(id).await.map_err(|e| e.to_string())?;
        Ok(deleted > 0)
    }
}
