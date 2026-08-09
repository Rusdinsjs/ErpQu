//! Data Service for Asset Export/Import Operations

use csv::WriterBuilder;

use crate::repositories::AssetRepository;
use management_system_core::domain::errors::{DomainError, DomainResult};

/// Data service for bulk asset operations
#[derive(Clone)]
pub struct DataService {
    pub asset_repository: AssetRepository,
}

impl DataService {
    pub fn new(asset_repository: AssetRepository) -> Self {
        Self { asset_repository }
    }

    /// Export assets to CSV using batching for memory efficiency
    pub async fn export_assets_csv(&self) -> DomainResult<String> {
        let batch_size = 500;
        let mut offset = 0;
        let mut wtr = WriterBuilder::new().from_writer(vec![]);

        // Write header
        wtr.write_record([
            "ID",
            "Code",
            "Name",
            "Status",
            "Brand",
            "Model",
            "Serial Number",
            "Purchase Price",
        ])
        .map_err(|e: csv::Error| DomainError::ExternalServiceError {
            service: "csv_export".to_string(),
            message: e.to_string(),
        })?;

        loop {
            let assets = self
                .asset_repository
                .list(batch_size, offset, None)
                .await
                .map_err(|e: sqlx::Error| DomainError::ExternalServiceError {
                    service: "database".to_string(),
                    message: e.to_string(),
                })?;

            if assets.is_empty() {
                break;
            }

            // Write records
            for asset in &assets {
                wtr.write_record([
                    asset.id.to_string(),
                    asset.asset_code.clone(),
                    asset.name.clone(),
                    asset.status.clone(),
                    asset.brand.clone().unwrap_or_default(),
                    asset.model.clone().unwrap_or_default(),
                    asset.serial_number.clone().unwrap_or_default(),
                    asset
                        .purchase_price
                        .map(|p: rust_decimal::Decimal| p.to_string())
                        .unwrap_or_default(),
                ])
                .map_err(|e: csv::Error| DomainError::ExternalServiceError {
                    service: "csv_export".to_string(),
                    message: e.to_string(),
                })?;
            }

            if assets.len() < batch_size as usize {
                break;
            }
            offset += batch_size;
        }

        let inner_writer = wtr.into_inner().map_err(|e| DomainError::ExternalServiceError {
            service: "csv_export".to_string(),
            message: e.to_string(),
        })?;

        let data = String::from_utf8(inner_writer).map_err(|e: std::string::FromUtf8Error| DomainError::ExternalServiceError {
            service: "csv_export".to_string(),
            message: e.to_string(),
        })?;

        Ok(data)
    }
}
