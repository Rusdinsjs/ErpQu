use crate::domain::manufacturing_pos::QualityInspection;
use crate::repositories::quality_repository::QualityRepository;
use chrono::Utc;
use management_system_core::domain::errors::DomainError;
use rust_decimal::Decimal;
use std::sync::Arc;
use uuid::Uuid;

pub type DomainResult<T> = Result<T, DomainError>;

#[derive(Debug, Clone, serde::Deserialize)]
pub struct CreateQualityInspectionRequest {
    pub company_id: Uuid,
    pub inspection_type: String, // INCOMING, IN_PROCESS, OUTGOING
    pub item_id: Uuid,
    pub batch_no: Option<String>,
    pub sample_size: Decimal,
    pub status: Option<String>, // Defaults to PENDING
    pub inspected_by: Option<Uuid>,
}

#[derive(Clone)]
pub struct QualityService {
    repository: Arc<QualityRepository>,
}

impl QualityService {
    pub fn new(repository: Arc<QualityRepository>) -> Self {
        Self { repository }
    }

    pub async fn create_quality_inspection(
        &self,
        req: CreateQualityInspectionRequest,
    ) -> DomainResult<QualityInspection> {
        let inspection_num = format!(
            "QI-{}-{}",
            Utc::now().format("%Y%m%d"),
            Uuid::new_v4().to_string()[..8].to_uppercase()
        );

        let inspection = QualityInspection {
            id: Uuid::new_v4(),
            company_id: req.company_id,
            inspection_number: inspection_num,
            inspection_type: req.inspection_type,
            item_id: req.item_id,
            batch_no: req.batch_no,
            sample_size: req.sample_size,
            status: req.status.unwrap_or_else(|| "PENDING".to_string()),
            inspected_by: req.inspected_by,
            created_at: Utc::now(),
        };

        self.repository
            .create_quality_inspection(&inspection)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))
    }

    pub async fn get_quality_inspection(
        &self,
        id: Uuid,
    ) -> DomainResult<Option<QualityInspection>> {
        self.repository
            .get_quality_inspection(id)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))
    }

    pub async fn list_quality_inspections(
        &self,
        company_id: Uuid,
    ) -> DomainResult<Vec<QualityInspection>> {
        self.repository
            .list_quality_inspections(company_id)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))
    }

    pub async fn update_quality_inspection_status(
        &self,
        id: Uuid,
        status: String,
    ) -> DomainResult<QualityInspection> {
        self.repository
            .update_quality_inspection_status(id, &status)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))
    }

    pub async fn validate_item_eligible_for_shipment(
        &self,
        item_id: Uuid,
        batch_no: Option<&str>,
    ) -> DomainResult<bool> {
        let latest = self
            .repository
            .get_latest_inspection_for_item_and_batch(item_id, batch_no)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        if let Some(inspection) = latest {
            // Block if QUALITY_HOLD or REJECTED or anything not PASSED/PENDING
            // Standard enforcement: only PASSED is eligible for standard fulfillment if inspection exists
            Ok(inspection.status == "PASSED")
        } else {
            // If no inspection exists, assume it doesn't require one or is allowed by default
            Ok(true)
        }
    }
}
