use chrono::{Datelike, NaiveDate, Weekday};
use management_system_core::shared::errors::AppError;
use rust_decimal::Decimal;
use uuid::Uuid;

use crate::domain::entities::{
    HrHoliday, HrHolidayList, HrLeaveAllocation, HrLeaveApplication, HrLeaveBlockList, HrLeaveType,
    LeaveBalanceSummary,
};
use crate::dto::{
    AddHolidayRequest, BulkLeaveAllocationRequest, CreateHolidayListRequest,
    CreateLeaveAllocationRequest, CreateLeaveApplicationRequest, CreateLeaveBlockListRequest,
    CreateLeaveTypeRequest, LeaveQueryParams, ReviewLeaveApplicationRequest,
    UpdateLeaveTypeRequest,
};
use crate::repositories::{EmployeeRepository, HrLeavesRepository};

#[derive(Clone)]
pub struct HrLeavesService {
    repo: HrLeavesRepository,
    employee_repo: EmployeeRepository,
}

impl HrLeavesService {
    pub fn new(repo: HrLeavesRepository, employee_repo: EmployeeRepository) -> Self {
        Self {
            repo,
            employee_repo,
        }
    }

    // ---- LEAVE TYPES ----
    pub async fn list_leave_types(&self) -> Result<Vec<HrLeaveType>, AppError> {
        self.repo.list_leave_types().await
    }

    pub async fn get_leave_type(&self, id: Uuid) -> Result<HrLeaveType, AppError> {
        self.repo.get_leave_type(id).await
    }

    pub async fn create_leave_type(
        &self,
        req: CreateLeaveTypeRequest,
    ) -> Result<HrLeaveType, AppError> {
        self.repo.create_leave_type(req).await
    }

    pub async fn update_leave_type(
        &self,
        id: Uuid,
        req: UpdateLeaveTypeRequest,
    ) -> Result<HrLeaveType, AppError> {
        self.repo.update_leave_type(id, req).await
    }

    pub async fn delete_leave_type(&self, id: Uuid) -> Result<(), AppError> {
        self.repo.delete_leave_type(id).await
    }

    // ---- ALLOCATIONS ----
    pub async fn list_allocations(
        &self,
        employee_id: Option<Uuid>,
    ) -> Result<Vec<HrLeaveAllocation>, AppError> {
        self.repo.list_allocations(employee_id).await
    }

    pub async fn create_allocation(
        &self,
        req: CreateLeaveAllocationRequest,
    ) -> Result<HrLeaveAllocation, AppError> {
        self.repo.create_allocation(req).await
    }

    pub async fn bulk_allocate(
        &self,
        req: BulkLeaveAllocationRequest,
    ) -> Result<Vec<HrLeaveAllocation>, AppError> {
        let mut results = Vec::new();
        for emp_id in req.employee_ids {
            let alloc = self
                .repo
                .create_allocation(CreateLeaveAllocationRequest {
                    employee_id: emp_id,
                    leave_type_id: req.leave_type_id,
                    from_date: req.from_date,
                    to_date: req.to_date,
                    total_leaves_allocated: req.total_leaves_allocated,
                    carry_forwarded_leaves: None,
                    notes: req.notes.clone(),
                })
                .await?;
            results.push(alloc);
        }
        Ok(results)
    }

    pub async fn get_leave_balance(
        &self,
        employee_id: Uuid,
    ) -> Result<Vec<LeaveBalanceSummary>, AppError> {
        self.repo.get_leave_balance(employee_id).await
    }

    // ---- APPLICATIONS & WORKFLOW ENGINE ----
    pub async fn list_applications(
        &self,
        params: LeaveQueryParams,
    ) -> Result<Vec<HrLeaveApplication>, AppError> {
        self.repo.list_applications(params).await
    }

    pub async fn get_application(&self, id: Uuid) -> Result<HrLeaveApplication, AppError> {
        self.repo.get_application(id).await
    }

    /// Calculate effective leave days (excluding Sundays and official Holidays)
    pub async fn calculate_effective_leave_days(
        &self,
        from_date: NaiveDate,
        to_date: NaiveDate,
        is_half_day: bool,
    ) -> Result<Decimal, AppError> {
        if is_half_day {
            return Ok(Decimal::new(5, 1)); // 0.5 day
        }

        if from_date > to_date {
            return Err(AppError::BadRequest(
                "Tanggal mulai cuti tidak boleh lebih besar dari tanggal selesai".into(),
            ));
        }

        let mut current = from_date;
        let mut days_count = 0;

        while current <= to_date {
            let is_sunday = current.weekday() == Weekday::Sun;
            let is_hol = self.repo.is_holiday(current).await?;

            if !is_sunday && !is_hol {
                days_count += 1;
            }

            if let Some(next) = current.succ_opt() {
                current = next;
            } else {
                break;
            }
        }

        Ok(Decimal::from(days_count))
    }

    pub async fn create_application(
        &self,
        req: CreateLeaveApplicationRequest,
    ) -> Result<HrLeaveApplication, AppError> {
        // 1. Check blackout date
        if let Some(reason) = self.repo.is_date_blocked(req.from_date).await? {
            return Err(AppError::BadRequest(format!(
                "Tanggal {} masuk dalam periode larangan cuti (Blackout Date): {}",
                req.from_date, reason
            )));
        }

        // 2. Calculate effective days
        let effective_days = self
            .calculate_effective_leave_days(
                req.from_date,
                req.to_date,
                req.is_half_day.unwrap_or(false),
            )
            .await?;

        if effective_days == Decimal::ZERO {
            return Err(AppError::BadRequest(
                "Semua tanggal yang dipilih jatuh pada hari libur / akhir pekan. Tidak ada saldo cuti yang terpakai.".into(),
            ));
        }

        // 3. Check leave balance
        let balances = self.get_leave_balance(req.employee_id).await?;
        let leave_type = self.get_leave_type(req.leave_type_id).await?;

        if !leave_type.is_unpaid {
            if let Some(bal) = balances
                .iter()
                .find(|b| b.leave_type_id == req.leave_type_id)
            {
                if bal.remaining_days < effective_days {
                    return Err(AppError::BadRequest(format!(
                        "Saldo cuti tidak mencukupi. Sisa saldo: {} hari, pengajuan: {} hari",
                        bal.remaining_days, effective_days
                    )));
                }
            }
        }

        self.repo.create_application(req, effective_days).await
    }

    pub async fn review_application(
        &self,
        id: Uuid,
        req: ReviewLeaveApplicationRequest,
        approved_by: Option<Uuid>,
    ) -> Result<HrLeaveApplication, AppError> {
        self.repo
            .review_application(id, &req.status, approved_by, req.rejection_reason)
            .await
    }

    // ---- HOLIDAYS ----
    pub async fn list_holiday_lists(&self) -> Result<Vec<HrHolidayList>, AppError> {
        self.repo.list_holiday_lists().await
    }

    pub async fn list_holidays(&self, holiday_list_id: Uuid) -> Result<Vec<HrHoliday>, AppError> {
        self.repo.list_holidays(holiday_list_id).await
    }

    pub async fn add_holiday(
        &self,
        holiday_list_id: Uuid,
        req: AddHolidayRequest,
    ) -> Result<HrHoliday, AppError> {
        self.repo.add_holiday(holiday_list_id, req).await
    }

    // ---- BLOCK LISTS ----
    pub async fn list_block_lists(&self) -> Result<Vec<HrLeaveBlockList>, AppError> {
        self.repo.list_block_lists().await
    }
}
