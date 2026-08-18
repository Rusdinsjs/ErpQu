pub mod domain;
pub mod repositories;

pub use domain::*;
pub use repositories::*;

pub mod fuel_service;
pub mod geofence_service;
pub mod loan_service;
pub mod maintenance_service;
pub mod maintenance_team_service;
pub mod maintenance_template_service;
pub mod tax_renewal_service;
pub mod work_order_service;

pub mod delivery_trip_service;
pub mod quality_service;

pub use delivery_trip_service::{CreateDeliveryTripRequest, DeliveryTripService};
pub use fuel_service::{FuelRequest, FuelService};
pub use geofence_service::GeofenceService;
pub use loan_service::LoanService;
pub use maintenance_service::{MaintenanceOperationResult, MaintenanceService};
pub use maintenance_team_service::MaintenanceTeamService;
pub use maintenance_template_service::MaintenanceTemplateService;
pub use management_system_telemetry::{SensorRepository, SensorService};
pub use quality_service::{CreateQualityInspectionRequest, QualityService};
pub use tax_renewal_service::TaxRenewalService;
pub use work_order_service::{CreateWorkOrderRequest, WorkOrderService};
pub mod wo_settlement_service;
pub use wo_settlement_service::*;
