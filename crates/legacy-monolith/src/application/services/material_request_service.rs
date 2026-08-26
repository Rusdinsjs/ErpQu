use crate::domain::entities::material_request::{MaterialRequest, MaterialRequestItem, MaterialRequestWithItems};
use crate::infrastructure::repositories::material_request_repository::MaterialRequestRepository;
use uuid::Uuid;
use chrono::Utc;
use rust_decimal::Decimal;

pub struct MaterialRequestService {
    repo: MaterialRequestRepository,
}

impl MaterialRequestService {
    pub fn new(repo: MaterialRequestRepository) -> Self {
        Self { repo }
    }

    pub async fn create_request(&self, mut request: MaterialRequest, mut items: Vec<MaterialRequestItem>) -> Result<MaterialRequestWithItems, String> {
        let now = Utc::now();
        if request.id.is_nil() {
            request.id = Uuid::new_v4();
        }
        request.created_at = now;
        request.updated_at = now;
        request.status = "DRAFT".to_string();

        for item in items.iter_mut() {
            if item.qty <= Decimal::ZERO {
                return Err("Quantity must be greater than zero".to_string());
            }
            if item.id.is_nil() {
                item.id = Uuid::new_v4();
            }
            item.material_request_id = request.id;
            item.created_at = now;
            item.ordered_qty = Decimal::ZERO;
            item.received_qty = Decimal::ZERO;
        }

        self.repo.create_request(&request, &items).await.map_err(|e| e.to_string())
    }

    pub async fn list_requests(&self, company_id: Uuid) -> Result<Vec<MaterialRequest>, String> {
        self.repo.find_all(company_id).await.map_err(|e| e.to_string())
    }

    pub async fn get_request(&self, id: Uuid) -> Result<Option<MaterialRequestWithItems>, String> {
        self.repo.find_by_id(id).await.map_err(|e| e.to_string())
    }

    pub async fn approve_request(&self, id: Uuid) -> Result<bool, String> {
        let req_opt = self.get_request(id).await?;
        let _req_with_items = match req_opt {
            Some(r) => r,
            None => return Err("Material Request not found".to_string()),
        };

        if _req_with_items.request.status != "DRAFT" {
            return Err("Only DRAFT Material Requests can be approved".to_string());
        }

        self.repo.update_status(id, "APPROVED").await.map_err(|e| e.to_string())?;

        Ok(true)
    }
}
