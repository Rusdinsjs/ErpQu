use chrono::NaiveDate;
use management_system_core::shared::errors::AppError;
use rust_decimal::Decimal;
use sqlx::PgPool;
use uuid::Uuid;

use crate::domain::entities::{
    HrHoliday, HrHolidayList, HrLeaveAllocation, HrLeaveApplication, HrLeaveBlockList, HrLeaveType,
    LeaveBalanceSummary,
};
use crate::dto::{
    AddHolidayRequest, CreateLeaveAllocationRequest, CreateLeaveApplicationRequest,
    CreateLeaveTypeRequest, LeaveQueryParams, UpdateLeaveTypeRequest,
};

#[derive(Clone)]
pub struct HrLeavesRepository {
    pool: PgPool,
}

impl HrLeavesRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    // ---- LEAVE TYPES ----
    pub async fn list_leave_types(&self) -> Result<Vec<HrLeaveType>, AppError> {
        sqlx::query_as::<_, HrLeaveType>(
            "SELECT * FROM hr_leave_types WHERE is_active = TRUE ORDER BY name ASC",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn get_leave_type(&self, id: Uuid) -> Result<HrLeaveType, AppError> {
        sqlx::query_as::<_, HrLeaveType>("SELECT * FROM hr_leave_types WHERE id = $1")
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?
            .ok_or_else(|| AppError::NotFound("Jenis Cuti tidak ditemukan".into()))
    }

    pub async fn create_leave_type(
        &self,
        req: CreateLeaveTypeRequest,
    ) -> Result<HrLeaveType, AppError> {
        sqlx::query_as::<_, HrLeaveType>(
            r#"
            INSERT INTO hr_leave_types (
                id, name, code, description, max_days_allowed,
                applicable_after_working_days, is_carry_forward, max_carry_forward_days,
                is_encashable, is_earned_leave, is_unpaid, allow_half_day, color
            ) VALUES (
                uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
            )
            RETURNING *
            "#,
        )
        .bind(&req.name)
        .bind(&req.code)
        .bind(&req.description)
        .bind(req.max_days_allowed.unwrap_or(12))
        .bind(req.applicable_after_working_days.unwrap_or(0))
        .bind(req.is_carry_forward.unwrap_or(false))
        .bind(req.max_carry_forward_days.unwrap_or(0))
        .bind(req.is_encashable.unwrap_or(false))
        .bind(req.is_earned_leave.unwrap_or(false))
        .bind(req.is_unpaid.unwrap_or(false))
        .bind(req.allow_half_day.unwrap_or(true))
        .bind(req.color.as_deref().unwrap_or("#10B981"))
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn update_leave_type(
        &self,
        id: Uuid,
        req: UpdateLeaveTypeRequest,
    ) -> Result<HrLeaveType, AppError> {
        let cur = self.get_leave_type(id).await?;
        sqlx::query_as::<_, HrLeaveType>(
            r#"
            UPDATE hr_leave_types SET
                name = $2, description = $3, max_days_allowed = $4,
                applicable_after_working_days = $5, is_carry_forward = $6,
                max_carry_forward_days = $7, is_encashable = $8, is_earned_leave = $9,
                is_unpaid = $10, allow_half_day = $11, color = $12, is_active = $13,
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(req.name.unwrap_or(cur.name))
        .bind(req.description.or(cur.description))
        .bind(req.max_days_allowed.unwrap_or(cur.max_days_allowed))
        .bind(
            req.applicable_after_working_days
                .unwrap_or(cur.applicable_after_working_days),
        )
        .bind(req.is_carry_forward.unwrap_or(cur.is_carry_forward))
        .bind(
            req.max_carry_forward_days
                .unwrap_or(cur.max_carry_forward_days),
        )
        .bind(req.is_encashable.unwrap_or(cur.is_encashable))
        .bind(req.is_earned_leave.unwrap_or(cur.is_earned_leave))
        .bind(req.is_unpaid.unwrap_or(cur.is_unpaid))
        .bind(req.allow_half_day.unwrap_or(cur.allow_half_day))
        .bind(req.color.or(cur.color))
        .bind(req.is_active.unwrap_or(cur.is_active))
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn delete_leave_type(&self, id: Uuid) -> Result<(), AppError> {
        sqlx::query(
            "UPDATE hr_leave_types SET is_active = FALSE, updated_at = NOW() WHERE id = $1",
        )
        .bind(id)
        .execute(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(())
    }

    // ---- LEAVE ALLOCATIONS ----
    pub async fn list_allocations(
        &self,
        employee_id: Option<Uuid>,
    ) -> Result<Vec<HrLeaveAllocation>, AppError> {
        sqlx::query_as::<_, HrLeaveAllocation>(
            r#"
            SELECT a.*, e.name as employee_name, e.nik as employee_nik,
                   lt.name as leave_type_name, lt.code as leave_type_code
            FROM hr_leave_allocations a
            JOIN employees e ON a.employee_id = e.id
            JOIN hr_leave_types lt ON a.leave_type_id = lt.id
            WHERE ($1::uuid IS NULL OR a.employee_id = $1) AND a.is_active = TRUE
            ORDER BY a.from_date DESC, e.name ASC
            "#,
        )
        .bind(employee_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn create_allocation(
        &self,
        req: CreateLeaveAllocationRequest,
    ) -> Result<HrLeaveAllocation, AppError> {
        sqlx::query_as::<_, HrLeaveAllocation>(
            r#"
            INSERT INTO hr_leave_allocations (
                id, employee_id, leave_type_id, from_date, to_date,
                total_leaves_allocated, carry_forwarded_leaves, unused_leaves, notes
            ) VALUES (
                uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $5 + $6, $7
            )
            RETURNING *, NULL::text as employee_name, NULL::text as employee_nik,
                      NULL::text as leave_type_name, NULL::text as leave_type_code
            "#,
        )
        .bind(req.employee_id)
        .bind(req.leave_type_id)
        .bind(req.from_date)
        .bind(req.to_date)
        .bind(req.total_leaves_allocated)
        .bind(req.carry_forwarded_leaves.unwrap_or(Decimal::ZERO))
        .bind(&req.notes)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    // ---- LEAVE BALANCE CALCULATION ----
    pub async fn get_leave_balance(
        &self,
        employee_id: Uuid,
    ) -> Result<Vec<LeaveBalanceSummary>, AppError> {
        let types = self.list_leave_types().await?;
        let mut summaries = Vec::new();

        for lt in types {
            let allocated: Option<Decimal> = sqlx::query_scalar(
                r#"
                SELECT COALESCE(SUM(total_leaves_allocated + carry_forwarded_leaves), 0)
                FROM hr_leave_allocations
                WHERE employee_id = $1 AND leave_type_id = $2
                  AND CURRENT_DATE BETWEEN from_date AND to_date
                  AND is_active = TRUE
                "#,
            )
            .bind(employee_id)
            .bind(lt.id)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;

            let used: Option<Decimal> = sqlx::query_scalar(
                r#"
                SELECT COALESCE(SUM(total_leave_days), 0)
                FROM hr_leave_applications
                WHERE employee_id = $1 AND leave_type_id = $2
                  AND status = 'approved'
                  AND EXTRACT(YEAR FROM from_date) = EXTRACT(YEAR FROM CURRENT_DATE)
                "#,
            )
            .bind(employee_id)
            .bind(lt.id)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;

            let pending: Option<Decimal> = sqlx::query_scalar(
                r#"
                SELECT COALESCE(SUM(total_leave_days), 0)
                FROM hr_leave_applications
                WHERE employee_id = $1 AND leave_type_id = $2
                  AND status = 'pending'
                  AND EXTRACT(YEAR FROM from_date) = EXTRACT(YEAR FROM CURRENT_DATE)
                "#,
            )
            .bind(employee_id)
            .bind(lt.id)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;

            let alloc = allocated.unwrap_or(Decimal::ZERO);
            let u = used.unwrap_or(Decimal::ZERO);
            let p = pending.unwrap_or(Decimal::ZERO);
            let rem = if lt.is_unpaid {
                Decimal::from(lt.max_days_allowed) - u
            } else {
                alloc - u - p
            };

            summaries.push(LeaveBalanceSummary {
                leave_type_id: lt.id,
                leave_type_name: lt.name,
                leave_type_code: lt.code,
                leave_type_color: lt.color,
                is_unpaid: lt.is_unpaid,
                allocated_days: alloc,
                used_days: u,
                pending_days: p,
                remaining_days: rem,
            });
        }

        Ok(summaries)
    }

    // ---- LEAVE APPLICATIONS ----
    pub async fn list_applications(
        &self,
        params: LeaveQueryParams,
    ) -> Result<Vec<HrLeaveApplication>, AppError> {
        sqlx::query_as::<_, HrLeaveApplication>(
            r#"
            SELECT a.*, e.name as employee_name, e.nik as employee_nik,
                   lt.name as leave_type_name, lt.color as leave_type_color,
                   u.email as approver_name
            FROM hr_leave_applications a
            JOIN employees e ON a.employee_id = e.id
            JOIN hr_leave_types lt ON a.leave_type_id = lt.id
            LEFT JOIN users u ON a.approved_by = u.id
            WHERE ($1::uuid IS NULL OR a.employee_id = $1)
              AND ($2::uuid IS NULL OR a.leave_type_id = $2)
              AND ($3::text IS NULL OR a.status = $3)
              AND ($4::date IS NULL OR a.from_date >= $4)
              AND ($5::date IS NULL OR a.to_date <= $5)
            ORDER BY a.created_at DESC
            "#,
        )
        .bind(params.employee_id)
        .bind(params.leave_type_id)
        .bind(params.status)
        .bind(params.from_date)
        .bind(params.to_date)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn get_application(&self, id: Uuid) -> Result<HrLeaveApplication, AppError> {
        sqlx::query_as::<_, HrLeaveApplication>(
            r#"
            SELECT a.*, e.name as employee_name, e.nik as employee_nik,
                   lt.name as leave_type_name, lt.color as leave_type_color,
                   u.email as approver_name
            FROM hr_leave_applications a
            JOIN employees e ON a.employee_id = e.id
            JOIN hr_leave_types lt ON a.leave_type_id = lt.id
            LEFT JOIN users u ON a.approved_by = u.id
            WHERE a.id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?
        .ok_or_else(|| AppError::NotFound("Pengajuan cuti tidak ditemukan".into()))
    }

    pub async fn create_application(
        &self,
        req: CreateLeaveApplicationRequest,
        days: Decimal,
    ) -> Result<HrLeaveApplication, AppError> {
        sqlx::query_as::<_, HrLeaveApplication>(
            r#"
            INSERT INTO hr_leave_applications (
                id, employee_id, leave_type_id, from_date, to_date,
                total_leave_days, is_half_day, half_day_date, reason, attachment_url, status
            ) VALUES (
                uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending'
            )
            RETURNING *, NULL::text as employee_name, NULL::text as employee_nik,
                      NULL::text as leave_type_name, NULL::text as leave_type_color,
                      NULL::text as approver_name
            "#,
        )
        .bind(req.employee_id)
        .bind(req.leave_type_id)
        .bind(req.from_date)
        .bind(req.to_date)
        .bind(days)
        .bind(req.is_half_day.unwrap_or(false))
        .bind(req.half_day_date)
        .bind(&req.reason)
        .bind(&req.attachment_url)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn review_application(
        &self,
        id: Uuid,
        status: &str,
        approved_by: Option<Uuid>,
        rejection_reason: Option<String>,
    ) -> Result<HrLeaveApplication, AppError> {
        sqlx::query_as::<_, HrLeaveApplication>(
            r#"
            UPDATE hr_leave_applications
            SET status = $2, approved_by = $3, approved_at = NOW(), rejection_reason = $4, updated_at = NOW()
            WHERE id = $1
            RETURNING *, NULL::text as employee_name, NULL::text as employee_nik,
                      NULL::text as leave_type_name, NULL::text as leave_type_color,
                      NULL::text as approver_name
            "#,
        )
        .bind(id)
        .bind(status)
        .bind(approved_by)
        .bind(rejection_reason)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    // ---- HOLIDAYS ----
    pub async fn list_holiday_lists(&self) -> Result<Vec<HrHolidayList>, AppError> {
        sqlx::query_as::<_, HrHolidayList>(
            r#"
            SELECT hl.*, COUNT(h.id) as total_holidays
            FROM hr_holiday_lists hl
            LEFT JOIN hr_holidays h ON hl.id = h.holiday_list_id
            WHERE hl.is_active = TRUE
            GROUP BY hl.id
            ORDER BY hl.from_date DESC
            "#,
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn list_holidays(&self, holiday_list_id: Uuid) -> Result<Vec<HrHoliday>, AppError> {
        sqlx::query_as::<_, HrHoliday>(
            "SELECT * FROM hr_holidays WHERE holiday_list_id = $1 ORDER BY holiday_date ASC",
        )
        .bind(holiday_list_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn add_holiday(
        &self,
        holiday_list_id: Uuid,
        req: AddHolidayRequest,
    ) -> Result<HrHoliday, AppError> {
        sqlx::query_as::<_, HrHoliday>(
            r#"
            INSERT INTO hr_holidays (id, holiday_list_id, holiday_date, description, is_weekly_off)
            VALUES (uuid_generate_v4(), $1, $2, $3, $4)
            ON CONFLICT (holiday_list_id, holiday_date) DO UPDATE SET description = EXCLUDED.description
            RETURNING *
            "#,
        )
        .bind(holiday_list_id)
        .bind(req.holiday_date)
        .bind(&req.description)
        .bind(req.is_weekly_off.unwrap_or(false))
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn is_holiday(&self, date: NaiveDate) -> Result<bool, AppError> {
        let count: i64 =
            sqlx::query_scalar("SELECT COUNT(*) FROM hr_holidays WHERE holiday_date = $1")
                .bind(date)
                .fetch_one(&self.pool)
                .await
                .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(count > 0)
    }

    // ---- LEAVE BLOCK LISTS ----
    pub async fn list_block_lists(&self) -> Result<Vec<HrLeaveBlockList>, AppError> {
        sqlx::query_as::<_, HrLeaveBlockList>(
            "SELECT * FROM hr_leave_block_lists WHERE is_active = TRUE",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn is_date_blocked(&self, date: NaiveDate) -> Result<Option<String>, AppError> {
        let reason: Option<String> = sqlx::query_scalar(
            "SELECT reason FROM hr_leave_block_dates WHERE block_date = $1 LIMIT 1",
        )
        .bind(date)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(reason)
    }
}
