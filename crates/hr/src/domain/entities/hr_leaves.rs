use chrono::{DateTime, NaiveDate, Utc};
use management_system_macros::DocType;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, DocType)]
#[doctype(module = "HR", description = "Entity HrLeaveType")]
pub struct HrLeaveType {
    pub id: Uuid,
    pub name: String,
    pub code: String,
    pub description: Option<String>,
    pub max_days_allowed: i32,
    pub applicable_after_working_days: i32,
    pub is_carry_forward: bool,
    pub max_carry_forward_days: i32,
    pub is_encashable: bool,
    pub is_earned_leave: bool,
    pub is_unpaid: bool,
    pub allow_half_day: bool,
    pub color: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, DocType)]
#[doctype(module = "HR", description = "Entity HrLeaveAllocation")]
pub struct HrLeaveAllocation {
    pub id: Uuid,
    pub employee_id: Uuid,
    pub leave_type_id: Uuid,
    pub from_date: NaiveDate,
    pub to_date: NaiveDate,
    pub total_leaves_allocated: Decimal,
    pub carry_forwarded_leaves: Decimal,
    pub unused_leaves: Decimal,
    pub notes: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[sqlx(default)]
    pub employee_name: Option<String>,
    #[sqlx(default)]
    pub employee_nik: Option<String>,
    #[sqlx(default)]
    pub leave_type_name: Option<String>,
    #[sqlx(default)]
    pub leave_type_code: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, DocType)]
#[doctype(module = "HR", description = "Entity HrLeaveApplication")]
pub struct HrLeaveApplication {
    pub id: Uuid,
    pub employee_id: Uuid,
    pub leave_type_id: Uuid,
    pub from_date: NaiveDate,
    pub to_date: NaiveDate,
    pub total_leave_days: Decimal,
    pub is_half_day: bool,
    pub half_day_date: Option<NaiveDate>,
    pub reason: String,
    pub attachment_url: Option<String>,
    pub status: String,
    pub approved_by: Option<Uuid>,
    pub approved_at: Option<DateTime<Utc>>,
    pub rejection_reason: Option<String>,
    pub posting_date: NaiveDate,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[sqlx(default)]
    pub employee_name: Option<String>,
    #[sqlx(default)]
    pub employee_nik: Option<String>,
    #[sqlx(default)]
    pub leave_type_name: Option<String>,
    #[sqlx(default)]
    pub leave_type_color: Option<String>,
    #[sqlx(default)]
    pub approver_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, DocType)]
#[doctype(module = "HR", description = "Entity HrHolidayList")]
pub struct HrHolidayList {
    pub id: Uuid,
    pub name: String,
    pub from_date: NaiveDate,
    pub to_date: NaiveDate,
    pub is_default: bool,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[sqlx(default)]
    pub total_holidays: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, DocType)]
#[doctype(module = "HR", description = "Entity HrHoliday")]
pub struct HrHoliday {
    pub id: Uuid,
    pub holiday_list_id: Uuid,
    pub holiday_date: NaiveDate,
    pub description: String,
    pub is_weekly_off: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, DocType)]
#[doctype(module = "HR", description = "Entity HrLeaveBlockList")]
pub struct HrLeaveBlockList {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub applies_to_all_departments: bool,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, DocType)]
#[doctype(module = "HR", description = "Entity HrLeaveBlockDate")]
pub struct HrLeaveBlockDate {
    pub id: Uuid,
    pub block_list_id: Uuid,
    pub block_date: NaiveDate,
    pub reason: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, DocType)]
#[doctype(module = "HR", description = "Entity HrLeaveEncashment")]
pub struct HrLeaveEncashment {
    pub id: Uuid,
    pub employee_id: Uuid,
    pub leave_type_id: Uuid,
    pub encashment_date: NaiveDate,
    pub leave_balance: Decimal,
    pub encashable_days: Decimal,
    pub encashed_amount: Decimal,
    pub status: String,
    pub approved_by: Option<Uuid>,
    pub approved_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[sqlx(default)]
    pub employee_name: Option<String>,
    #[sqlx(default)]
    pub leave_type_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, DocType)]
#[doctype(module = "HR", description = "Entity LeaveBalanceSummary")]
pub struct LeaveBalanceSummary {
    pub leave_type_id: Uuid,
    pub leave_type_name: String,
    pub leave_type_code: String,
    pub leave_type_color: Option<String>,
    pub is_unpaid: bool,
    pub allocated_days: Decimal,
    pub used_days: Decimal,
    pub pending_days: Decimal,
    pub remaining_days: Decimal,
}
