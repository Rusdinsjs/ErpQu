use uuid::Uuid;
use crate::domain::entities::outbound_logistics::{
    DeliveryNote, PickList, DeliveryTrip, InstallationNote, StockReconciliation,
};
use crate::infrastructure::repositories::outbound_logistics_repository::OutboundLogisticsRepository;

pub struct OutboundLogisticsService {
    repo: OutboundLogisticsRepository,
}

impl OutboundLogisticsService {
    pub fn new(repo: OutboundLogisticsRepository) -> Self {
        Self { repo }
    }

    // Delivery Notes
    pub async fn create_delivery_note(&self, note: DeliveryNote) -> Result<DeliveryNote, String> {
        self.repo.create_delivery_note(&note).await.map_err(|e| e.to_string())
    }

    pub async fn list_delivery_notes(&self, company_id: Uuid) -> Result<Vec<DeliveryNote>, String> {
        self.repo.list_delivery_notes(company_id).await.map_err(|e| e.to_string())
    }

    pub async fn delete_delivery_note(&self, id: Uuid) -> Result<u64, String> {
        self.repo.delete_delivery_note(id).await.map_err(|e| e.to_string())
    }

    pub async fn submit_delivery_note(&self, id: Uuid) -> Result<DeliveryNote, String> {
        self.repo.submit_delivery_note(id).await
    }

    // Pick Lists
    pub async fn create_pick_list(&self, pl: PickList) -> Result<PickList, String> {
        self.repo.create_pick_list(&pl).await.map_err(|e| e.to_string())
    }

    pub async fn list_pick_lists(&self, company_id: Uuid) -> Result<Vec<PickList>, String> {
        self.repo.list_pick_lists(company_id).await.map_err(|e| e.to_string())
    }

    pub async fn delete_pick_list(&self, id: Uuid) -> Result<u64, String> {
        self.repo.delete_pick_list(id).await.map_err(|e| e.to_string())
    }

    // Delivery Trips
    pub async fn create_delivery_trip(&self, trip: DeliveryTrip) -> Result<DeliveryTrip, String> {
        self.repo.create_delivery_trip(&trip).await.map_err(|e| e.to_string())
    }

    pub async fn list_delivery_trips(&self, company_id: Uuid) -> Result<Vec<DeliveryTrip>, String> {
        self.repo.list_delivery_trips(company_id).await.map_err(|e| e.to_string())
    }

    pub async fn delete_delivery_trip(&self, id: Uuid) -> Result<u64, String> {
        self.repo.delete_delivery_trip(id).await.map_err(|e| e.to_string())
    }

    // Installation Notes
    pub async fn create_installation_note(&self, note: InstallationNote) -> Result<InstallationNote, String> {
        self.repo.create_installation_note(&note).await.map_err(|e| e.to_string())
    }

    pub async fn list_installation_notes(&self, company_id: Uuid) -> Result<Vec<InstallationNote>, String> {
        self.repo.list_installation_notes(company_id).await.map_err(|e| e.to_string())
    }

    pub async fn delete_installation_note(&self, id: Uuid) -> Result<u64, String> {
        self.repo.delete_installation_note(id).await.map_err(|e| e.to_string())
    }

    // Stock Reconciliations
    pub async fn create_stock_reconciliation(&self, rec: StockReconciliation) -> Result<StockReconciliation, String> {
        self.repo.create_stock_reconciliation(&rec).await.map_err(|e| e.to_string())
    }

    pub async fn list_stock_reconciliations(&self, company_id: Uuid) -> Result<Vec<StockReconciliation>, String> {
        self.repo.list_stock_reconciliations(company_id).await.map_err(|e| e.to_string())
    }

    pub async fn delete_stock_reconciliation(&self, id: Uuid) -> Result<u64, String> {
        self.repo.delete_stock_reconciliation(id).await.map_err(|e| e.to_string())
    }
}
