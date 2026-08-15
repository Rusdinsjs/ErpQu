use chrono::Utc;
use management_system_core::shared::errors::AppError;
use sqlx::PgPool;
use uuid::Uuid;

use crate::domain::entities::{
    HrDriverAssignment, HrDriverSafetyIncident, HrP2hInspection, HrVehicleHandover,
};
use crate::dto::{
    CreateDriverAssignmentRequest, CreateDriverSafetyIncidentRequest, CreateVehicleHandoverRequest,
    ReturnDriverAssignmentRequest, SubmitP2hInspectionRequest,
};

#[derive(Clone)]
pub struct HrDriverP2hSafetyRepository {
    pool: PgPool,
}

impl HrDriverP2hSafetyRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    // ---- DRIVER ASSIGNMENTS ----
    pub async fn list_driver_assignments(
        &self,
        employee_id: Option<Uuid>,
        asset_id: Option<Uuid>,
    ) -> Result<Vec<HrDriverAssignment>, AppError> {
        sqlx::query_as::<_, HrDriverAssignment>(
            r#"
            SELECT da.*, emp.name as employee_name, emp.nik as employee_nik, ast.name as asset_name, ast.asset_code as asset_code
            FROM hr_driver_assignments da
            JOIN employees emp ON da.employee_id = emp.id
            JOIN assets ast ON da.asset_id = ast.id
            WHERE ($1::uuid IS NULL OR da.employee_id = $1)
              AND ($2::uuid IS NULL OR da.asset_id = $2)
            ORDER BY da.assigned_date DESC
            "#,
        )
        .bind(employee_id)
        .bind(asset_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn create_driver_assignment(
        &self,
        req: CreateDriverAssignmentRequest,
    ) -> Result<HrDriverAssignment, AppError> {
        sqlx::query_as::<_, HrDriverAssignment>(
            r#"
            WITH inserted AS (
                INSERT INTO hr_driver_assignments (id, employee_id, asset_id, assigned_date, start_odometer, sim_sio_verified, status, notes)
                VALUES (uuid_generate_v4(), $1, $2, $3, $4, TRUE, 'active', $5)
                RETURNING *
            )
            SELECT ins.*, emp.name as employee_name, emp.nik as employee_nik, ast.name as asset_name, ast.asset_code as asset_code
            FROM inserted ins
            LEFT JOIN employees emp ON ins.employee_id = emp.id
            LEFT JOIN assets ast ON ins.asset_id = ast.id
            "#,
        )
        .bind(req.employee_id)
        .bind(req.asset_id)
        .bind(req.assigned_date)
        .bind(req.start_odometer)
        .bind(&req.notes)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn return_driver_assignment(
        &self,
        id: Uuid,
        req: ReturnDriverAssignmentRequest,
    ) -> Result<HrDriverAssignment, AppError> {
        sqlx::query_as::<_, HrDriverAssignment>(
            r#"
            WITH updated AS (
                UPDATE hr_driver_assignments
                SET return_date = $2, end_odometer = $3, status = 'returned', notes = COALESCE($4, notes), updated_at = NOW()
                WHERE id = $1
                RETURNING *
            )
            SELECT up.*, emp.name as employee_name, emp.nik as employee_nik, ast.name as asset_name, ast.asset_code as asset_code
            FROM updated up
            LEFT JOIN employees emp ON up.employee_id = emp.id
            LEFT JOIN assets ast ON up.asset_id = ast.id
            "#,
        )
        .bind(id)
        .bind(req.return_date)
        .bind(req.end_odometer)
        .bind(&req.notes)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    // ---- P2H INSPECTIONS ----
    pub async fn list_p2h_inspections(
        &self,
        employee_id: Option<Uuid>,
        asset_id: Option<Uuid>,
    ) -> Result<Vec<HrP2hInspection>, AppError> {
        sqlx::query_as::<_, HrP2hInspection>(
            r#"
            SELECT p.*, emp.name as employee_name, emp.nik as employee_nik, ast.name as asset_name, ast.asset_code as asset_code
            FROM hr_p2h_inspections p
            JOIN employees emp ON p.employee_id = emp.id
            JOIN assets ast ON p.asset_id = ast.id
            WHERE ($1::uuid IS NULL OR p.employee_id = $1)
              AND ($2::uuid IS NULL OR p.asset_id = $2)
            ORDER BY p.inspection_date DESC, p.created_at DESC
            "#,
        )
        .bind(employee_id)
        .bind(asset_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn submit_p2h_inspection(
        &self,
        req: SubmitP2hInspectionRequest,
        overall_status: &str,
    ) -> Result<HrP2hInspection, AppError> {
        sqlx::query_as::<_, HrP2hInspection>(
            r#"
            INSERT INTO hr_p2h_inspections (
                id, assignment_id, employee_id, asset_id, inspection_date, odometer_reading, hour_meter_reading,
                oil_coolant_ok, brakes_ok, tires_ok, lights_horn_ok, safety_gear_ok, overall_status, notes_defect, inspector_signature
            ) VALUES (
                uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
            )
            RETURNING *, NULL::text as employee_name, NULL::text as employee_nik, NULL::text as asset_name, NULL::text as asset_code
            "#,
        )
        .bind(req.assignment_id)
        .bind(req.employee_id)
        .bind(req.asset_id)
        .bind(req.inspection_date)
        .bind(req.odometer_reading)
        .bind(req.hour_meter_reading)
        .bind(req.oil_coolant_ok)
        .bind(req.brakes_ok)
        .bind(req.tires_ok)
        .bind(req.lights_horn_ok)
        .bind(req.safety_gear_ok)
        .bind(overall_status)
        .bind(&req.notes_defect)
        .bind(&req.inspector_signature)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    // ---- DRIVER SAFETY INCIDENTS ----
    pub async fn list_driver_safety_incidents(
        &self,
        employee_id: Option<Uuid>,
    ) -> Result<Vec<HrDriverSafetyIncident>, AppError> {
        sqlx::query_as::<_, HrDriverSafetyIncident>(
            r#"
            SELECT s.*, emp.name as employee_name, emp.nik as employee_nik, ast.name as asset_name
            FROM hr_driver_safety_incidents s
            JOIN employees emp ON s.employee_id = emp.id
            LEFT JOIN assets ast ON s.asset_id = ast.id
            WHERE ($1::uuid IS NULL OR s.employee_id = $1)
            ORDER BY s.incident_date DESC
            "#,
        )
        .bind(employee_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn create_driver_safety_incident(
        &self,
        req: CreateDriverSafetyIncidentRequest,
    ) -> Result<HrDriverSafetyIncident, AppError> {
        sqlx::query_as::<_, HrDriverSafetyIncident>(
            r#"
            INSERT INTO hr_driver_safety_incidents (
                id, employee_id, asset_id, incident_date, violation_type, severity, location_site, speed_kmh, damage_cost_estimate, description, status
            ) VALUES (
                uuid_generate_v4(), $1, $2, $3, $4, COALESCE($5, 'medium'), COALESCE($6, 'Hauling Road Site'), $7, $8, $9, 'action_taken'
            )
            RETURNING *, NULL::text as employee_name, NULL::text as employee_nik, NULL::text as asset_name
            "#,
        )
        .bind(req.employee_id)
        .bind(req.asset_id)
        .bind(req.incident_date)
        .bind(&req.violation_type)
        .bind(&req.severity)
        .bind(&req.location_site)
        .bind(req.speed_kmh)
        .bind(req.damage_cost_estimate)
        .bind(&req.description)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    // ---- VEHICLE HANDOVERS ----
    pub async fn list_vehicle_handovers(
        &self,
        asset_id: Option<Uuid>,
    ) -> Result<Vec<HrVehicleHandover>, AppError> {
        sqlx::query_as::<_, HrVehicleHandover>(
            r#"
            SELECT vh.*, f_emp.name as from_employee_name, t_emp.name as to_employee_name, ast.name as asset_name
            FROM hr_vehicle_handovers vh
            JOIN employees f_emp ON vh.from_employee_id = f_emp.id
            JOIN employees t_emp ON vh.to_employee_id = t_emp.id
            JOIN assets ast ON vh.asset_id = ast.id
            WHERE ($1::uuid IS NULL OR vh.asset_id = $1)
            ORDER BY vh.handover_date DESC
            "#,
        )
        .bind(asset_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn create_vehicle_handover(
        &self,
        req: CreateVehicleHandoverRequest,
    ) -> Result<HrVehicleHandover, AppError> {
        sqlx::query_as::<_, HrVehicleHandover>(
            r#"
            INSERT INTO hr_vehicle_handovers (
                id, asset_id, from_employee_id, to_employee_id, handover_date, odometer, fuel_level_fraction, body_condition, toolkit_complete, notes, status
            ) VALUES (
                uuid_generate_v4(), $1, $2, $3, $4, $5, COALESCE($6, '1/1'), COALESCE($7, 'Normal / Bersih'), COALESCE($8, TRUE), $9, 'completed'
            )
            RETURNING *, NULL::text as from_employee_name, NULL::text as to_employee_name, NULL::text as asset_name
            "#,
        )
        .bind(req.asset_id)
        .bind(req.from_employee_id)
        .bind(req.to_employee_id)
        .bind(req.handover_date)
        .bind(req.odometer)
        .bind(&req.fuel_level_fraction)
        .bind(&req.body_condition)
        .bind(req.toolkit_complete)
        .bind(&req.notes)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }
}
