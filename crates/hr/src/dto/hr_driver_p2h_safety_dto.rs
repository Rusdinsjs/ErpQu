use chrono::NaiveDate;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateDriverAssignmentRequest {
    pub employee_id: Uuid,
    pub asset_id: Uuid,
    pub assigned_date: NaiveDate,
    pub start_odometer: Option<Decimal>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ReturnDriverAssignmentRequest {
    pub return_date: NaiveDate,
    pub end_odometer: Decimal,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct SubmitP2hInspectionRequest {
    pub assignment_id: Option<Uuid>,
    pub employee_id: Uuid,
    pub asset_id: Uuid,
    pub inspection_date: NaiveDate,
    pub odometer_reading: Option<Decimal>,
    pub hour_meter_reading: Option<Decimal>,
    pub oil_coolant_ok: bool,
    pub brakes_ok: bool,
    pub tires_ok: bool,
    pub lights_horn_ok: bool,
    pub safety_gear_ok: bool,
    pub notes_defect: Option<String>,
    pub inspector_signature: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateDriverSafetyIncidentRequest {
    pub employee_id: Uuid,
    pub asset_id: Option<Uuid>,
    pub incident_date: NaiveDate,
    pub violation_type: String,
    pub severity: Option<String>,
    pub location_site: Option<String>,
    pub speed_kmh: Option<Decimal>,
    pub damage_cost_estimate: Option<Decimal>,
    pub description: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateVehicleHandoverRequest {
    pub asset_id: Uuid,
    pub from_employee_id: Uuid,
    pub to_employee_id: Uuid,
    pub handover_date: NaiveDate,
    pub odometer: Decimal,
    pub fuel_level_fraction: Option<String>,
    pub body_condition: Option<String>,
    pub toolkit_complete: Option<bool>,
    pub notes: Option<String>,
}
