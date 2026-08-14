use management_system_core::shared::errors::AppError;
use uuid::Uuid;

use crate::domain::entities::{
    HrDriverAssignment, HrDriverSafetyIncident, HrP2hInspection, HrVehicleHandover,
};
use crate::dto::{
    CreateDriverAssignmentRequest, CreateDriverSafetyIncidentRequest,
    CreateVehicleHandoverRequest, ReturnDriverAssignmentRequest, SubmitP2hInspectionRequest,
};
use crate::repositories::HrDriverP2hSafetyRepository;

#[derive(Clone)]
pub struct HrDriverP2hSafetyService {
    repo: HrDriverP2hSafetyRepository,
}

impl HrDriverP2hSafetyService {
    pub fn new(repo: HrDriverP2hSafetyRepository) -> Self {
        Self { repo }
    }

    // Driver Assignments
    pub async fn list_driver_assignments(&self, employee_id: Option<Uuid>, asset_id: Option<Uuid>) -> Result<Vec<HrDriverAssignment>, AppError> {
        self.repo.list_driver_assignments(employee_id, asset_id).await
    }

    pub async fn create_driver_assignment(&self, req: CreateDriverAssignmentRequest) -> Result<HrDriverAssignment, AppError> {
        self.repo.create_driver_assignment(req).await
    }

    pub async fn return_driver_assignment(&self, id: Uuid, req: ReturnDriverAssignmentRequest) -> Result<HrDriverAssignment, AppError> {
        self.repo.return_driver_assignment(id, req).await
    }

    // P2H Inspections
    pub async fn list_p2h_inspections(&self, employee_id: Option<Uuid>, asset_id: Option<Uuid>) -> Result<Vec<HrP2hInspection>, AppError> {
        self.repo.list_p2h_inspections(employee_id, asset_id).await
    }

    pub async fn submit_p2h_inspection(&self, req: SubmitP2hInspectionRequest) -> Result<HrP2hInspection, AppError> {
        // Evaluate overall status based on critical checks
        let is_critical_ok = req.brakes_ok && req.tires_ok && req.oil_coolant_ok;
        let is_all_ok = is_critical_ok && req.lights_horn_ok && req.safety_gear_ok;

        let overall_status = if is_all_ok {
            "fit_to_operate"
        } else if is_critical_ok {
            "needs_minor_repair"
        } else {
            "grounded_unsafe"
        };

        self.repo.submit_p2h_inspection(req, overall_status).await
    }

    // Driver Safety Incidents
    pub async fn list_driver_safety_incidents(&self, employee_id: Option<Uuid>) -> Result<Vec<HrDriverSafetyIncident>, AppError> {
        self.repo.list_driver_safety_incidents(employee_id).await
    }

    pub async fn create_driver_safety_incident(&self, req: CreateDriverSafetyIncidentRequest) -> Result<HrDriverSafetyIncident, AppError> {
        self.repo.create_driver_safety_incident(req).await
    }

    // Vehicle Handovers
    pub async fn list_vehicle_handovers(&self, asset_id: Option<Uuid>) -> Result<Vec<HrVehicleHandover>, AppError> {
        self.repo.list_vehicle_handovers(asset_id).await
    }

    pub async fn create_vehicle_handover(&self, req: CreateVehicleHandoverRequest) -> Result<HrVehicleHandover, AppError> {
        self.repo.create_vehicle_handover(req).await
    }
}
