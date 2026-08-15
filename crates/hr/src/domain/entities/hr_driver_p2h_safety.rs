use chrono::{DateTime, NaiveDate, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct HrDriverAssignment {
    pub id: Uuid,
    pub employee_id: Uuid,
    pub asset_id: Uuid,
    pub assigned_date: NaiveDate,
    pub return_date: Option<NaiveDate>,
    pub start_odometer: Option<Decimal>,
    pub end_odometer: Option<Decimal>,
    pub sim_sio_verified: bool,
    pub status: String, // 'active', 'returned'
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[sqlx(default)]
    pub employee_name: Option<String>,
    #[sqlx(default)]
    pub employee_nik: Option<String>,
    #[sqlx(default)]
    pub asset_name: Option<String>,
    #[sqlx(default)]
    pub asset_code: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct HrP2hInspection {
    pub id: Uuid,
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
    pub overall_status: String, // 'fit_to_operate', 'needs_minor_repair', 'grounded_unsafe'
    pub notes_defect: Option<String>,
    pub inspector_signature: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[sqlx(default)]
    pub employee_name: Option<String>,
    #[sqlx(default)]
    pub employee_nik: Option<String>,
    #[sqlx(default)]
    pub asset_name: Option<String>,
    #[sqlx(default)]
    pub asset_code: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct HrDriverSafetyIncident {
    pub id: Uuid,
    pub employee_id: Uuid,
    pub asset_id: Option<Uuid>,
    pub incident_date: NaiveDate,
    pub violation_type: String, // 'overspeeding', 'fatigue_sleep', 'reckless_driving', 'collision', 'sop_k3_breach'
    pub severity: String,       // 'low', 'medium', 'high', 'critical'
    pub location_site: String,
    pub speed_kmh: Option<Decimal>,
    pub damage_cost_estimate: Option<Decimal>,
    pub description: String,
    pub disciplinary_action_id: Option<Uuid>,
    pub status: String, // 'investigating', 'action_taken', 'closed'
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[sqlx(default)]
    pub employee_name: Option<String>,
    #[sqlx(default)]
    pub employee_nik: Option<String>,
    #[sqlx(default)]
    pub asset_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct HrVehicleHandover {
    pub id: Uuid,
    pub asset_id: Uuid,
    pub from_employee_id: Uuid,
    pub to_employee_id: Uuid,
    pub handover_date: NaiveDate,
    pub odometer: Decimal,
    pub fuel_level_fraction: String,
    pub body_condition: String,
    pub toolkit_complete: bool,
    pub notes: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[sqlx(default)]
    pub from_employee_name: Option<String>,
    #[sqlx(default)]
    pub to_employee_name: Option<String>,
    #[sqlx(default)]
    pub asset_name: Option<String>,
}
