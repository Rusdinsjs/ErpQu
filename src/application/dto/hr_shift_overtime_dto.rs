use chrono::{DateTime, NaiveDate, NaiveTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ---- SHIFT TYPE DTOs ----

#[derive(Debug, Deserialize)]
pub struct CreateShiftTypeRequest {
    pub name: String,
    pub code: Option<String>,
    pub start_time: NaiveTime,
    pub end_time: NaiveTime,
    pub late_tolerance_minutes: Option<i32>,
    pub early_exit_tolerance_minutes: Option<i32>,
    pub break_start_time: Option<NaiveTime>,
    pub break_end_time: Option<NaiveTime>,
    pub is_night_shift: Option<bool>,
    pub color: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateShiftTypeRequest {
    pub name: Option<String>,
    pub code: Option<String>,
    pub start_time: Option<NaiveTime>,
    pub end_time: Option<NaiveTime>,
    pub late_tolerance_minutes: Option<i32>,
    pub early_exit_tolerance_minutes: Option<i32>,
    pub break_start_time: Option<NaiveTime>,
    pub break_end_time: Option<NaiveTime>,
    pub is_night_shift: Option<bool>,
    pub color: Option<String>,
    pub description: Option<String>,
    pub is_active: Option<bool>,
}

// ---- SHIFT ASSIGNMENT DTOs ----

#[derive(Debug, Deserialize)]
pub struct CreateShiftAssignmentRequest {
    pub employee_id: Uuid,
    pub shift_type_id: Uuid,
    pub start_date: NaiveDate,
    pub end_date: Option<NaiveDate>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct BulkShiftAssignmentRequest {
    pub employee_ids: Vec<Uuid>,
    pub shift_type_id: Uuid,
    pub start_date: NaiveDate,
    pub end_date: Option<NaiveDate>,
    pub notes: Option<String>,
}

// ---- ATTENDANCE REQUEST DTOs ----

#[derive(Debug, Deserialize)]
pub struct CreateAttendanceRequestPayload {
    pub employee_id: Uuid,
    pub request_type: String,
    pub attendance_date: NaiveDate,
    pub requested_check_in: Option<DateTime<Utc>>,
    pub requested_check_out: Option<DateTime<Utc>>,
    pub reason: String,
    pub attachment_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ReviewAttendanceRequestPayload {
    pub status: String, // 'approved' or 'rejected'
    pub rejection_reason: Option<String>,
}

// ---- OVERTIME DTOs ----

#[derive(Debug, Deserialize)]
pub struct CreateOvertimeRequestPayload {
    pub employee_id: Uuid,
    pub overtime_date: NaiveDate,
    pub start_time: NaiveTime,
    pub end_time: NaiveTime,
    pub planned_hours: Decimal,
    pub reason: String,
    pub task_description: Option<String>,
    pub is_holiday: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct ReviewOvertimeRequestPayload {
    pub status: String, // 'approved' or 'rejected'
    pub actual_hours: Option<Decimal>,
    pub rejection_reason: Option<String>,
}

// ---- QUERY PARAMS ----

#[derive(Debug, Deserialize)]
pub struct AttendanceLogQueryParams {
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub employee_id: Option<Uuid>,
    pub department_id: Option<Uuid>,
    pub attendance_status: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct OvertimeQueryParams {
    pub employee_id: Option<Uuid>,
    pub status: Option<String>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
}

#[derive(Debug, Deserialize)]
pub struct AttendanceRequestQueryParams {
    pub employee_id: Option<Uuid>,
    pub status: Option<String>,
    pub request_type: Option<String>,
}

// ---- RECAP REPORT RESPONSE ----

#[derive(Debug, Serialize)]
pub struct EmployeeAttendanceRecap {
    pub employee_id: Uuid,
    pub employee_name: String,
    pub employee_nik: String,
    pub department_name: Option<String>,
    pub total_days: i64,
    pub total_present: i64,
    pub total_late: i64,
    pub total_late_minutes: i64,
    pub total_work_hours: Decimal,
    pub total_overtime_hours: Decimal,
    pub total_overtime_pay: Decimal,
}
