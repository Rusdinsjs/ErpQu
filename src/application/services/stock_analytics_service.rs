use uuid::Uuid;
use crate::infrastructure::repositories::stock_analytics_repository::{
    StockAnalyticsRepository, WarehouseValuation, ItemGroupValuation, MovementTrend
};

pub struct StockAnalyticsService {
    repo: StockAnalyticsRepository,
}

impl StockAnalyticsService {
    pub fn new(repo: StockAnalyticsRepository) -> Self {
        Self { repo }
    }

    pub async fn get_warehouse_valuations(&self, company_id: Uuid) -> Result<Vec<WarehouseValuation>, String> {
        self.repo.get_warehouse_valuations(company_id).await.map_err(|e| e.to_string())
    }

    pub async fn get_item_group_valuations(&self, company_id: Uuid) -> Result<Vec<ItemGroupValuation>, String> {
        self.repo.get_item_group_valuations(company_id).await.map_err(|e| e.to_string())
    }

    pub async fn get_movement_trends(&self, company_id: Uuid, days: i32) -> Result<Vec<MovementTrend>, String> {
        self.repo.get_movement_trends(company_id, days).await.map_err(|e| e.to_string())
    }
}
