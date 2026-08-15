use crate::domain::entities::{
    HrAttendanceDetail, HrAttendanceRequest, HrOvertimeRequest, HrShiftAssignment, HrShiftType,
};
use crate::dto::*;
use crate::repositories::{EmployeeRepository, HrShiftOvertimeRepository};
use chrono::NaiveDate;
use management_system_core::shared::errors::AppError;
use rust_decimal::Decimal;
use uuid::Uuid;

#[derive(Clone)]
pub struct HrShiftOvertimeService {
    repo: HrShiftOvertimeRepository,
    employee_repo: EmployeeRepository,
}

impl HrShiftOvertimeService {
    pub fn new(repo: HrShiftOvertimeRepository, employee_repo: EmployeeRepository) -> Self {
        Self {
            repo,
            employee_repo,
        }
    }

    // ---- SHIFT TYPES ----
    pub async fn list_shift_types(&self) -> Result<Vec<HrShiftType>, AppError> {
        self.repo.list_shift_types().await
    }

    pub async fn get_shift_type(&self, id: Uuid) -> Result<HrShiftType, AppError> {
        self.repo.get_shift_type(id).await
    }

    pub async fn create_shift_type(
        &self,
        req: CreateShiftTypeRequest,
    ) -> Result<HrShiftType, AppError> {
        self.repo.create_shift_type(req).await
    }

    pub async fn update_shift_type(
        &self,
        id: Uuid,
        req: UpdateShiftTypeRequest,
    ) -> Result<HrShiftType, AppError> {
        self.repo.update_shift_type(id, req).await
    }

    pub async fn delete_shift_type(&self, id: Uuid) -> Result<(), AppError> {
        self.repo.delete_shift_type(id).await
    }

    // ---- SHIFT ASSIGNMENTS ----
    pub async fn list_shift_assignments(
        &self,
        employee_id: Option<Uuid>,
    ) -> Result<Vec<HrShiftAssignment>, AppError> {
        self.repo.list_shift_assignments(employee_id).await
    }

    pub async fn create_shift_assignment(
        &self,
        req: CreateShiftAssignmentRequest,
    ) -> Result<HrShiftAssignment, AppError> {
        self.repo.create_shift_assignment(req).await
    }

    pub async fn bulk_assign_shifts(
        &self,
        req: BulkShiftAssignmentRequest,
    ) -> Result<Vec<HrShiftAssignment>, AppError> {
        let mut results = Vec::new();
        for emp_id in req.employee_ids {
            let item = self
                .repo
                .create_shift_assignment(CreateShiftAssignmentRequest {
                    employee_id: emp_id,
                    shift_type_id: req.shift_type_id,
                    start_date: req.start_date,
                    end_date: req.end_date,
                    notes: req.notes.clone(),
                })
                .await?;
            results.push(item);
        }
        Ok(results)
    }

    pub async fn delete_shift_assignment(&self, id: Uuid) -> Result<(), AppError> {
        self.repo.delete_shift_assignment(id).await
    }

    // ---- ATTENDANCE REQUESTS ----
    pub async fn list_attendance_requests(
        &self,
        params: AttendanceRequestQueryParams,
    ) -> Result<Vec<HrAttendanceRequest>, AppError> {
        self.repo.list_attendance_requests(params).await
    }

    pub async fn create_attendance_request(
        &self,
        req: CreateAttendanceRequestPayload,
    ) -> Result<HrAttendanceRequest, AppError> {
        self.repo.create_attendance_request(req).await
    }

    pub async fn review_attendance_request(
        &self,
        id: Uuid,
        payload: ReviewAttendanceRequestPayload,
        approved_by: Option<Uuid>,
    ) -> Result<HrAttendanceRequest, AppError> {
        self.repo
            .review_attendance_request(id, &payload.status, payload.rejection_reason, approved_by)
            .await
    }

    // ---- OVERTIME ENGINE (Depnaker Standard) ----
    pub async fn list_overtime_requests(
        &self,
        params: OvertimeQueryParams,
    ) -> Result<Vec<HrOvertimeRequest>, AppError> {
        self.repo.list_overtime_requests(params).await
    }

    pub async fn create_overtime_request(
        &self,
        req: CreateOvertimeRequestPayload,
    ) -> Result<HrOvertimeRequest, AppError> {
        self.repo.create_overtime_request(req).await
    }

    /// Calculate Indonesian Depnaker overtime pay:
    /// - Regular Workday: 1st hour = 1.5x, next hours = 2.0x
    /// - Holiday: 1st to 7th hr = 2.0x, 8th hr = 3.0x, 9th+ hr = 4.0x
    /// - Hourly rate = basic_salary / 173
    pub async fn review_overtime_request(
        &self,
        id: Uuid,
        payload: ReviewOvertimeRequestPayload,
        approved_by: Option<Uuid>,
    ) -> Result<HrOvertimeRequest, AppError> {
        let overtime = self.repo.get_overtime_request(id).await?;
        let employee = self.employee_repo.get_by_id(overtime.employee_id).await?;

        if payload.status == "approved" {
            let hours = payload.actual_hours.unwrap_or(overtime.planned_hours);
            let multiplier = Self::calculate_depnaker_multiplier(hours, overtime.is_holiday);

            // Gaji pokok standar atau fallback Rp 3.500.000 (UMR minimal)
            let basic_salary = employee.basic_salary.unwrap_or(Decimal::from(3_500_000));
            let hourly_rate = (basic_salary / Decimal::from(173)).round_dp(2);
            let pay = (multiplier * hourly_rate).round_dp(2);

            self.repo
                .update_overtime_approval(
                    id,
                    &payload.status,
                    Some(hours),
                    Some(multiplier),
                    Some(hourly_rate),
                    Some(pay),
                    payload.rejection_reason,
                    approved_by,
                )
                .await
        } else {
            self.repo
                .update_overtime_approval(
                    id,
                    &payload.status,
                    None,
                    None,
                    None,
                    None,
                    payload.rejection_reason,
                    approved_by,
                )
                .await
        }
    }

    fn calculate_depnaker_multiplier(hours: Decimal, is_holiday: bool) -> Decimal {
        let h = hours.to_string().parse::<f64>().unwrap_or(0.0);
        if is_holiday {
            // Hari Libur Resmi / Istirahat Mingguan (Kepmenak No. 102/2004)
            // 7 jam pertama: 2x
            // Jam ke-8: 3x
            // Jam ke-9 & ke-10: 4x
            let total_mult;
            if h <= 7.0 {
                total_mult = h * 2.0;
            } else if h <= 8.0 {
                total_mult = (7.0 * 2.0) + ((h - 7.0) * 3.0);
            } else {
                total_mult = (7.0 * 2.0) + (1.0 * 3.0) + ((h - 8.0) * 4.0);
            }
            Decimal::from_str_exact(&format!("{:.2}", total_mult)).unwrap_or(Decimal::ZERO)
        } else {
            // Hari Kerja Biasa:
            // 1 jam pertama: 1.5x
            // Jam ke-2 dan seterusnya: 2.0x
            let total_mult = if h <= 1.0 {
                h * 1.5
            } else {
                1.5 + ((h - 1.0) * 2.0)
            };
            Decimal::from_str_exact(&format!("{:.2}", total_mult)).unwrap_or(Decimal::ZERO)
        }
    }

    // ---- ATTENDANCE LOGS & RECAP ----
    pub async fn list_attendance_details(
        &self,
        params: AttendanceLogQueryParams,
    ) -> Result<Vec<HrAttendanceDetail>, AppError> {
        self.repo.list_attendance_details(params).await
    }

    pub async fn get_attendance_recap(
        &self,
        start_date: NaiveDate,
        end_date: NaiveDate,
        department_id: Option<Uuid>,
    ) -> Result<Vec<EmployeeAttendanceRecap>, AppError> {
        self.repo
            .get_attendance_recap(start_date, end_date, department_id)
            .await
    }
}
