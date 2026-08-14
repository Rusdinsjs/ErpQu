use chrono::NaiveDate;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreateLeaveTypeRequest {
    pub name: String,
    pub code: String,
    pub description: Option<String>,
    pub max_days_allowed: Option<i32>,
    pub applicable_after_working_days: Option<i32>,
    pub is_carry_forward: Option<bool>,
    pub max_carry_forward_days: Option<i32>,
    pub is_encashable: Option<bool>,
    pub is_earned_leave: Option<bool>,
    pub is_unpaid: Option<bool>,
    pub allow_half_day: Option<bool>,
    pub color: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateLeaveTypeRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub max_days_allowed: Option<i32>,
    pub applicable_after_working_days: Option<i32>,
    pub is_carry_forward: Option<bool>,
    pub max_carry_forward_days: Option<i32>,
    pub is_encashable: Option<bool>,
    pub is_earned_leave: Option<bool>,
    pub is_unpaid: Option<bool>,
    pub allow_half_day: Option<bool>,
    pub color: Option<String>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct CreateLeaveAllocationRequest {
    pub employee_id: Uuid,
    pub leave_type_id: Uuid,
    pub from_date: NaiveDate,
    pub to_date: NaiveDate,
    pub total_leaves_allocated: Decimal,
    pub carry_forwarded_leaves: Option<Decimal>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct BulkLeaveAllocationRequest {
    pub employee_ids: Vec<Uuid>,
    pub leave_type_id: Uuid,
    pub from_date: NaiveDate,
    pub to_date: NaiveDate,
    pub total_leaves_allocated: Decimal,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateLeaveApplicationRequest {
    pub employee_id: Uuid,
    pub leave_type_id: Uuid,
    pub from_date: NaiveDate,
    pub to_date: NaiveDate,
    pub is_half_day: Option<bool>,
    pub half_day_date: Option<NaiveDate>,
    pub reason: String,
    pub attachment_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ReviewLeaveApplicationRequest {
    pub status: String, // approved, rejected, cancelled
    pub rejection_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct LeaveQueryParams {
    pub employee_id: Option<Uuid>,
    pub leave_type_id: Option<Uuid>,
    pub status: Option<String>,
    pub from_date: Option<NaiveDate>,
    pub to_date: Option<NaiveDate>,
}

#[derive(Debug, Deserialize)]
pub struct CreateHolidayListRequest {
    pub name: String,
    pub from_date: NaiveDate,
    pub to_date: NaiveDate,
    pub is_default: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct AddHolidayRequest {
    pub holiday_date: NaiveDate,
    pub description: String,
    pub is_weekly_off: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct CreateLeaveBlockListRequest {
    pub name: String,
    pub description: Option<String>,
    pub applies_to_all_departments: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct AddBlockDateRequest {
    pub block_date: NaiveDate,
    pub reason: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateLeaveEncashmentRequest {
    pub employee_id: Uuid,
    pub leave_type_id: Uuid,
    pub encashable_days: Decimal,
}
