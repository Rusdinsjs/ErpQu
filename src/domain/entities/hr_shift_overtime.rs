use chrono::{DateTime, NaiveDate, NaiveTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

/// Master Shift Kerja
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct HrShiftType {
    pub id: Uuid,
    pub name: String,
    pub code: Option<String>,
    pub start_time: NaiveTime,
    pub end_time: NaiveTime,
    pub late_tolerance_minutes: i32,
    pub early_exit_tolerance_minutes: i32,
    pub break_start_time: Option<NaiveTime>,
    pub break_end_time: Option<NaiveTime>,
    pub is_night_shift: bool,
    pub color: Option<String>,
    pub description: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Penugasan Shift Karyawan / Roster
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct HrShiftAssignment {
    pub id: Uuid,
    pub employee_id: Uuid,
    pub shift_type_id: Uuid,
    pub start_date: NaiveDate,
    pub end_date: Option<NaiveDate>,
    pub notes: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    // Joined fields
    #[sqlx(default)]
    pub employee_name: Option<String>,
    #[sqlx(default)]
    pub employee_nik: Option<String>,
    #[sqlx(default)]
    pub shift_name: Option<String>,
    #[sqlx(default)]
    pub shift_code: Option<String>,
    #[sqlx(default)]
    pub start_time: Option<NaiveTime>,
    #[sqlx(default)]
    pub end_time: Option<NaiveTime>,
    #[sqlx(default)]
    pub color: Option<String>,
}

/// Permohonan Koreksi Absensi / Dinas Luar / WFH
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct HrAttendanceRequest {
    pub id: Uuid,
    pub employee_id: Uuid,
    pub request_type: String, // 'correction', 'on_duty', 'wfh', 'forgot_checkout'
    pub attendance_date: NaiveDate,
    pub requested_check_in: Option<DateTime<Utc>>,
    pub requested_check_out: Option<DateTime<Utc>>,
    pub reason: String,
    pub attachment_url: Option<String>,
    pub status: String, // 'pending', 'approved', 'rejected'
    pub approved_by: Option<Uuid>,
    pub approved_at: Option<DateTime<Utc>>,
    pub rejection_reason: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    // Joined fields
    #[sqlx(default)]
    pub employee_name: Option<String>,
    #[sqlx(default)]
    pub employee_nik: Option<String>,
    #[sqlx(default)]
    pub department_name: Option<String>,
    #[sqlx(default)]
    pub approved_by_name: Option<String>,
}

/// Surat Perintah Kerja Lembur (SPKL)
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct HrOvertimeRequest {
    pub id: Uuid,
    pub employee_id: Uuid,
    pub overtime_date: NaiveDate,
    pub start_time: NaiveTime,
    pub end_time: NaiveTime,
    pub planned_hours: Decimal,
    pub actual_hours: Option<Decimal>,
    pub reason: String,
    pub task_description: Option<String>,
    pub is_holiday: bool,
    pub status: String, // 'pending', 'approved', 'rejected', 'completed'
    pub approved_by: Option<Uuid>,
    pub approved_at: Option<DateTime<Utc>>,
    pub rejection_reason: Option<String>,
    pub rate_multiplier: Option<Decimal>,
    pub hourly_rate: Option<Decimal>,
    pub calculated_overtime_pay: Option<Decimal>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    // Joined fields
    #[sqlx(default)]
    pub employee_name: Option<String>,
    #[sqlx(default)]
    pub employee_nik: Option<String>,
    #[sqlx(default)]
    pub department_name: Option<String>,
    #[sqlx(default)]
    pub approved_by_name: Option<String>,
}

/// Live Feed Kehadiran Lengkap
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct HrAttendanceDetail {
    pub id: Uuid,
    pub employee_id: Uuid,
    pub check_in_time: Option<DateTime<Utc>>,
    pub check_out_time: Option<DateTime<Utc>>,
    pub check_in_status: Option<String>,
    pub check_out_status: Option<String>,
    pub late_minutes: Option<i32>,
    pub early_exit_minutes: Option<i32>,
    pub work_hours: Option<Decimal>,
    pub overtime_hours: Option<Decimal>,
    pub attendance_status: Option<String>,
    pub check_in_lat: Option<f64>,
    pub check_in_long: Option<f64>,
    pub check_out_lat: Option<f64>,
    pub check_out_long: Option<f64>,
    pub check_in_photo_url: Option<String>,
    pub check_out_photo_url: Option<String>,
    pub notes: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    // Joined
    #[sqlx(default)]
    pub employee_name: Option<String>,
    #[sqlx(default)]
    pub employee_nik: Option<String>,
    #[sqlx(default)]
    pub department_name: Option<String>,
    #[sqlx(default)]
    pub shift_name: Option<String>,
    #[sqlx(default)]
    pub shift_code: Option<String>,
}
