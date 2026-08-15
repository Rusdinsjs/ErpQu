use crate::domain::entities::{
    HrAttendanceDetail, HrAttendanceRequest, HrOvertimeRequest, HrShiftAssignment, HrShiftType,
};
use crate::dto::*;
use chrono::{NaiveDate, Utc};
use management_system_core::shared::errors::AppError;
use rust_decimal::Decimal;
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Clone)]
pub struct HrShiftOvertimeRepository {
    pool: PgPool,
}

impl HrShiftOvertimeRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    // ============================================================
    // SHIFT TYPES
    // ============================================================

    pub async fn list_shift_types(&self) -> Result<Vec<HrShiftType>, AppError> {
        sqlx::query_as::<_, HrShiftType>(
            "SELECT * FROM hr_shift_types WHERE is_active = TRUE ORDER BY start_time ASC",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn get_shift_type(&self, id: Uuid) -> Result<HrShiftType, AppError> {
        sqlx::query_as::<_, HrShiftType>("SELECT * FROM hr_shift_types WHERE id = $1")
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?
            .ok_or_else(|| {
                AppError::Domain(
                    management_system_core::domain::errors::DomainError::not_found(
                        "HrShiftType",
                        id,
                    ),
                )
            })
    }

    pub async fn create_shift_type(
        &self,
        req: CreateShiftTypeRequest,
    ) -> Result<HrShiftType, AppError> {
        sqlx::query_as::<_, HrShiftType>(
            "INSERT INTO hr_shift_types (
                id, name, code, start_time, end_time, late_tolerance_minutes,
                early_exit_tolerance_minutes, break_start_time, break_end_time,
                is_night_shift, color, description
             ) VALUES (
                uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
             ) RETURNING *",
        )
        .bind(&req.name)
        .bind(&req.code)
        .bind(req.start_time)
        .bind(req.end_time)
        .bind(req.late_tolerance_minutes.unwrap_or(15))
        .bind(req.early_exit_tolerance_minutes.unwrap_or(0))
        .bind(req.break_start_time)
        .bind(req.break_end_time)
        .bind(req.is_night_shift.unwrap_or(false))
        .bind(req.color.unwrap_or_else(|| "#3B82F6".to_string()))
        .bind(&req.description)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn update_shift_type(
        &self,
        id: Uuid,
        req: UpdateShiftTypeRequest,
    ) -> Result<HrShiftType, AppError> {
        let ex = self.get_shift_type(id).await?;
        sqlx::query_as::<_, HrShiftType>(
            "UPDATE hr_shift_types SET
                name = $2, code = $3, start_time = $4, end_time = $5,
                late_tolerance_minutes = $6, early_exit_tolerance_minutes = $7,
                break_start_time = $8, break_end_time = $9, is_night_shift = $10,
                color = $11, description = $12, is_active = $13, updated_at = NOW()
             WHERE id = $1
             RETURNING *",
        )
        .bind(id)
        .bind(req.name.unwrap_or(ex.name))
        .bind(req.code.or(ex.code))
        .bind(req.start_time.unwrap_or(ex.start_time))
        .bind(req.end_time.unwrap_or(ex.end_time))
        .bind(
            req.late_tolerance_minutes
                .unwrap_or(ex.late_tolerance_minutes),
        )
        .bind(
            req.early_exit_tolerance_minutes
                .unwrap_or(ex.early_exit_tolerance_minutes),
        )
        .bind(req.break_start_time.or(ex.break_start_time))
        .bind(req.break_end_time.or(ex.break_end_time))
        .bind(req.is_night_shift.unwrap_or(ex.is_night_shift))
        .bind(req.color.or(ex.color))
        .bind(req.description.or(ex.description))
        .bind(req.is_active.unwrap_or(ex.is_active))
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn delete_shift_type(&self, id: Uuid) -> Result<(), AppError> {
        sqlx::query(
            "UPDATE hr_shift_types SET is_active = FALSE, updated_at = NOW() WHERE id = $1",
        )
        .bind(id)
        .execute(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(())
    }

    // ============================================================
    // SHIFT ASSIGNMENTS
    // ============================================================

    pub async fn list_shift_assignments(
        &self,
        employee_id: Option<Uuid>,
    ) -> Result<Vec<HrShiftAssignment>, AppError> {
        sqlx::query_as::<_, HrShiftAssignment>(
            "SELECT sa.*,
                e.name as employee_name, e.nik as employee_nik,
                st.name as shift_name, st.code as shift_code,
                st.start_time as start_time, st.end_time as end_time,
                st.color as color
             FROM hr_shift_assignments sa
             JOIN employees e ON sa.employee_id = e.id
             JOIN hr_shift_types st ON sa.shift_type_id = st.id
             WHERE ($1::uuid IS NULL OR sa.employee_id = $1)
               AND sa.is_active = TRUE
             ORDER BY sa.start_date DESC",
        )
        .bind(employee_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn create_shift_assignment(
        &self,
        req: CreateShiftAssignmentRequest,
    ) -> Result<HrShiftAssignment, AppError> {
        sqlx::query_as::<_, HrShiftAssignment>(
            "INSERT INTO hr_shift_assignments (
                id, employee_id, shift_type_id, start_date, end_date, notes
             ) VALUES (
                uuid_generate_v4(), $1, $2, $3, $4, $5
             ) RETURNING *,
                NULL::text as employee_name, NULL::text as employee_nik,
                NULL::text as shift_name, NULL::text as shift_code,
                NULL::time as start_time, NULL::time as end_time,
                NULL::text as color",
        )
        .bind(req.employee_id)
        .bind(req.shift_type_id)
        .bind(req.start_date)
        .bind(req.end_date)
        .bind(&req.notes)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn delete_shift_assignment(&self, id: Uuid) -> Result<(), AppError> {
        sqlx::query(
            "UPDATE hr_shift_assignments SET is_active = FALSE, updated_at = NOW() WHERE id = $1",
        )
        .bind(id)
        .execute(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(())
    }

    // ============================================================
    // ATTENDANCE REQUESTS
    // ============================================================

    pub async fn list_attendance_requests(
        &self,
        params: AttendanceRequestQueryParams,
    ) -> Result<Vec<HrAttendanceRequest>, AppError> {
        sqlx::query_as::<_, HrAttendanceRequest>(
            "SELECT ar.*,
                e.name as employee_name, e.nik as employee_nik,
                d.name as department_name,
                u.name as approved_by_name
             FROM hr_attendance_requests ar
             JOIN employees e ON ar.employee_id = e.id
             LEFT JOIN departments d ON e.department_id = d.id
             LEFT JOIN users u ON ar.approved_by = u.id
             WHERE ($1::uuid IS NULL OR ar.employee_id = $1)
               AND ($2::text IS NULL OR ar.status = $2)
               AND ($3::text IS NULL OR ar.request_type = $3)
             ORDER BY ar.created_at DESC",
        )
        .bind(params.employee_id)
        .bind(params.status)
        .bind(params.request_type)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn create_attendance_request(
        &self,
        req: CreateAttendanceRequestPayload,
    ) -> Result<HrAttendanceRequest, AppError> {
        sqlx::query_as::<_, HrAttendanceRequest>(
            "INSERT INTO hr_attendance_requests (
                id, employee_id, request_type, attendance_date,
                requested_check_in, requested_check_out, reason, attachment_url
             ) VALUES (
                uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7
             ) RETURNING *,
                NULL::text as employee_name, NULL::text as employee_nik,
                NULL::text as department_name, NULL::text as approved_by_name",
        )
        .bind(req.employee_id)
        .bind(&req.request_type)
        .bind(req.attendance_date)
        .bind(req.requested_check_in)
        .bind(req.requested_check_out)
        .bind(&req.reason)
        .bind(&req.attachment_url)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn review_attendance_request(
        &self,
        id: Uuid,
        status: &str,
        rejection_reason: Option<String>,
        approved_by: Option<Uuid>,
    ) -> Result<HrAttendanceRequest, AppError> {
        sqlx::query_as::<_, HrAttendanceRequest>(
            "UPDATE hr_attendance_requests SET
                status = $2, approved_by = $3, approved_at = NOW(),
                rejection_reason = $4, updated_at = NOW()
             WHERE id = $1
             RETURNING *,
                NULL::text as employee_name, NULL::text as employee_nik,
                NULL::text as department_name, NULL::text as approved_by_name",
        )
        .bind(id)
        .bind(status)
        .bind(approved_by)
        .bind(rejection_reason)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    // ============================================================
    // OVERTIME REQUESTS
    // ============================================================

    pub async fn list_overtime_requests(
        &self,
        params: OvertimeQueryParams,
    ) -> Result<Vec<HrOvertimeRequest>, AppError> {
        sqlx::query_as::<_, HrOvertimeRequest>(
            "SELECT ov.*,
                e.name as employee_name, e.nik as employee_nik,
                d.name as department_name,
                u.name as approved_by_name
             FROM hr_overtime_requests ov
             JOIN employees e ON ov.employee_id = e.id
             LEFT JOIN departments d ON e.department_id = d.id
             LEFT JOIN users u ON ov.approved_by = u.id
             WHERE ($1::uuid IS NULL OR ov.employee_id = $1)
               AND ($2::text IS NULL OR ov.status = $2)
               AND ($3::date IS NULL OR ov.overtime_date >= $3)
               AND ($4::date IS NULL OR ov.overtime_date <= $4)
             ORDER BY ov.overtime_date DESC, ov.created_at DESC",
        )
        .bind(params.employee_id)
        .bind(params.status)
        .bind(params.start_date)
        .bind(params.end_date)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn get_overtime_request(&self, id: Uuid) -> Result<HrOvertimeRequest, AppError> {
        sqlx::query_as::<_, HrOvertimeRequest>(
            "SELECT ov.*,
                e.name as employee_name, e.nik as employee_nik,
                d.name as department_name,
                u.name as approved_by_name
             FROM hr_overtime_requests ov
             JOIN employees e ON ov.employee_id = e.id
             LEFT JOIN departments d ON e.department_id = d.id
             LEFT JOIN users u ON ov.approved_by = u.id
             WHERE ov.id = $1",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?
        .ok_or_else(|| {
            AppError::Domain(
                management_system_core::domain::errors::DomainError::not_found(
                    "HrOvertimeRequest",
                    id,
                ),
            )
        })
    }

    pub async fn create_overtime_request(
        &self,
        req: CreateOvertimeRequestPayload,
    ) -> Result<HrOvertimeRequest, AppError> {
        sqlx::query_as::<_, HrOvertimeRequest>(
            "INSERT INTO hr_overtime_requests (
                id, employee_id, overtime_date, start_time, end_time,
                planned_hours, reason, task_description, is_holiday
             ) VALUES (
                uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8
             ) RETURNING *,
                NULL::text as employee_name, NULL::text as employee_nik,
                NULL::text as department_name, NULL::text as approved_by_name",
        )
        .bind(req.employee_id)
        .bind(req.overtime_date)
        .bind(req.start_time)
        .bind(req.end_time)
        .bind(req.planned_hours)
        .bind(&req.reason)
        .bind(&req.task_description)
        .bind(req.is_holiday.unwrap_or(false))
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn update_overtime_approval(
        &self,
        id: Uuid,
        status: &str,
        actual_hours: Option<Decimal>,
        rate_multiplier: Option<Decimal>,
        hourly_rate: Option<Decimal>,
        calculated_overtime_pay: Option<Decimal>,
        rejection_reason: Option<String>,
        approved_by: Option<Uuid>,
    ) -> Result<HrOvertimeRequest, AppError> {
        sqlx::query_as::<_, HrOvertimeRequest>(
            "UPDATE hr_overtime_requests SET
                status = $2, actual_hours = $3, rate_multiplier = $4,
                hourly_rate = $5, calculated_overtime_pay = $6,
                rejection_reason = $7, approved_by = $8, approved_at = NOW(),
                updated_at = NOW()
             WHERE id = $1
             RETURNING *,
                NULL::text as employee_name, NULL::text as employee_nik,
                NULL::text as department_name, NULL::text as approved_by_name",
        )
        .bind(id)
        .bind(status)
        .bind(actual_hours)
        .bind(rate_multiplier)
        .bind(hourly_rate)
        .bind(calculated_overtime_pay)
        .bind(rejection_reason)
        .bind(approved_by)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    // ============================================================
    // ATTENDANCE LOGS & RECAP
    // ============================================================

    pub async fn list_attendance_details(
        &self,
        params: AttendanceLogQueryParams,
    ) -> Result<Vec<HrAttendanceDetail>, AppError> {
        sqlx::query_as::<_, HrAttendanceDetail>(
            "SELECT ar.id, ar.employee_id, ar.check_in_time, ar.check_out_time,
                ar.check_in_status, ar.check_out_status, ar.late_minutes,
                ar.early_exit_minutes, ar.work_hours, ar.overtime_hours,
                ar.attendance_status, ar.check_in_lat, ar.check_in_long,
                ar.check_out_lat, ar.check_out_long, ar.check_in_photo_url,
                ar.check_out_photo_url, ar.notes, ar.created_at,
                e.name as employee_name, e.nik as employee_nik,
                d.name as department_name,
                st.name as shift_name, st.code as shift_code
             FROM attendance_records ar
             JOIN employees e ON ar.employee_id = e.id
             LEFT JOIN departments d ON e.department_id = d.id
             LEFT JOIN hr_shift_types st ON ar.shift_type_id = st.id
             WHERE ($1::date IS NULL OR ar.check_in_time::date >= $1)
               AND ($2::date IS NULL OR ar.check_in_time::date <= $2)
               AND ($3::uuid IS NULL OR ar.employee_id = $3)
               AND ($4::uuid IS NULL OR e.department_id = $4)
               AND ($5::text IS NULL OR ar.attendance_status = $5)
             ORDER BY ar.check_in_time DESC NULLS LAST",
        )
        .bind(params.start_date)
        .bind(params.end_date)
        .bind(params.employee_id)
        .bind(params.department_id)
        .bind(params.attendance_status)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn get_attendance_recap(
        &self,
        start_date: NaiveDate,
        end_date: NaiveDate,
        department_id: Option<Uuid>,
    ) -> Result<Vec<EmployeeAttendanceRecap>, AppError> {
        #[derive(sqlx::FromRow)]
        struct RecapRow {
            employee_id: Uuid,
            employee_name: String,
            employee_nik: String,
            department_name: Option<String>,
            total_days: Option<i64>,
            total_present: Option<i64>,
            total_late: Option<i64>,
            total_late_minutes: Option<i64>,
            total_work_hours: Option<Decimal>,
            total_overtime_hours: Option<Decimal>,
            total_overtime_pay: Option<Decimal>,
        }

        let rows = sqlx::query_as::<_, RecapRow>(
            "SELECT
                e.id as employee_id,
                e.name as employee_name,
                e.nik as employee_nik,
                d.name as department_name,
                COUNT(ar.id) as total_days,
                COUNT(CASE WHEN ar.check_in_time IS NOT NULL THEN 1 END) as total_present,
                COUNT(CASE WHEN ar.late_minutes > 0 THEN 1 END) as total_late,
                COALESCE(SUM(ar.late_minutes), 0)::bigint as total_late_minutes,
                COALESCE(SUM(ar.work_hours), 0) as total_work_hours,
                COALESCE(SUM(ar.overtime_hours), 0) as total_overtime_hours,
                COALESCE((
                    SELECT SUM(calculated_overtime_pay)
                    FROM hr_overtime_requests
                    WHERE employee_id = e.id
                      AND overtime_date >= $1 AND overtime_date <= $2
                      AND status = 'approved'
                ), 0) as total_overtime_pay
             FROM employees e
             LEFT JOIN departments d ON e.department_id = d.id
             LEFT JOIN attendance_records ar ON e.id = ar.employee_id
                AND ar.check_in_time::date >= $1 AND ar.check_in_time::date <= $2
             WHERE e.is_active = TRUE
               AND ($3::uuid IS NULL OR e.department_id = $3)
             GROUP BY e.id, e.name, e.nik, d.name
             ORDER BY e.name ASC",
        )
        .bind(start_date)
        .bind(end_date)
        .bind(department_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(rows
            .into_iter()
            .map(|r| EmployeeAttendanceRecap {
                employee_id: r.employee_id,
                employee_name: r.employee_name,
                employee_nik: r.employee_nik,
                department_name: r.department_name,
                total_days: r.total_days.unwrap_or(0),
                total_present: r.total_present.unwrap_or(0),
                total_late: r.total_late.unwrap_or(0),
                total_late_minutes: r.total_late_minutes.unwrap_or(0),
                total_work_hours: r.total_work_hours.unwrap_or(Decimal::ZERO),
                total_overtime_hours: r.total_overtime_hours.unwrap_or(Decimal::ZERO),
                total_overtime_pay: r.total_overtime_pay.unwrap_or(Decimal::ZERO),
            })
            .collect())
    }
}
