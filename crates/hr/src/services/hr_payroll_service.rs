use chrono::Utc;
use management_system_core::shared::errors::AppError;
use rust_decimal::Decimal;
use uuid::Uuid;

use crate::domain::entities::{
    HrPayrollEntry, HrSalaryAssignment, HrSalaryComponent, HrSalarySlip, HrSalaryStructure,
};
use crate::dto::{CreateSalaryAssignmentRequest, PayrollQueryParams, RunPayrollEntryRequest};
use crate::repositories::{EmployeeRepository, HrPayrollRepository};
use crate::services::hr_tax_bpjs_engine::HrTaxBpjsEngine;

#[derive(Clone)]
pub struct HrPayrollService {
    repo: HrPayrollRepository,
    #[allow(dead_code)]
    employee_repo: EmployeeRepository,
    loans_repo: crate::repositories::HrLoansClaimsKpiRepository,
}

impl HrPayrollService {
    pub fn new(
        repo: HrPayrollRepository,
        #[allow(dead_code)] employee_repo: EmployeeRepository,
        loans_repo: crate::repositories::HrLoansClaimsKpiRepository,
    ) -> Self {
        Self {
            repo,
            employee_repo,
            loans_repo,
        }
    }

    pub async fn list_salary_components(&self) -> Result<Vec<HrSalaryComponent>, AppError> {
        self.repo.list_salary_components().await
    }

    pub async fn list_salary_structures(&self) -> Result<Vec<HrSalaryStructure>, AppError> {
        self.repo.list_salary_structures().await
    }

    pub async fn get_salary_component(&self, id: Uuid) -> Result<HrSalaryComponent, AppError> {
        self.repo.get_salary_component(id).await
    }

    pub async fn create_salary_component(
        &self,
        req: crate::dto::CreateSalaryComponentRequest,
    ) -> Result<HrSalaryComponent, AppError> {
        self.repo.create_salary_component(req).await
    }

    pub async fn update_salary_component(
        &self,
        id: Uuid,
        req: crate::dto::UpdateSalaryComponentRequest,
    ) -> Result<HrSalaryComponent, AppError> {
        self.repo.update_salary_component(id, req).await
    }

    pub async fn delete_salary_component(&self, id: Uuid) -> Result<(), AppError> {
        self.repo.delete_salary_component(id).await
    }

    pub async fn get_salary_structure(&self, id: Uuid) -> Result<HrSalaryStructure, AppError> {
        self.repo.get_salary_structure(id).await
    }

    pub async fn create_salary_structure(
        &self,
        req: crate::dto::CreateSalaryStructureRequest,
    ) -> Result<HrSalaryStructure, AppError> {
        self.repo.create_salary_structure(req).await
    }

    pub async fn update_salary_structure(
        &self,
        id: Uuid,
        req: crate::dto::UpdateSalaryStructureRequest,
    ) -> Result<HrSalaryStructure, AppError> {
        self.repo.update_salary_structure(id, req).await
    }

    pub async fn delete_salary_structure(&self, id: Uuid) -> Result<(), AppError> {
        self.repo.delete_salary_structure(id).await
    }

    pub async fn list_salary_assignments(&self) -> Result<Vec<HrSalaryAssignment>, AppError> {
        self.repo.list_salary_assignments().await
    }

    pub async fn create_salary_assignment(
        &self,
        req: CreateSalaryAssignmentRequest,
    ) -> Result<HrSalaryAssignment, AppError> {
        self.repo.create_salary_assignment(req).await
    }

    pub async fn list_payroll_entries(&self) -> Result<Vec<HrPayrollEntry>, AppError> {
        self.repo.list_payroll_entries().await
    }

    pub async fn list_salary_slips(
        &self,
        params: PayrollQueryParams,
    ) -> Result<Vec<HrSalarySlip>, AppError> {
        self.repo.list_salary_slips(params).await
    }

    pub async fn get_salary_slip(&self, id: Uuid) -> Result<HrSalarySlip, AppError> {
        self.repo.get_salary_slip(id).await
    }

    /// Process Batch Monthly Payroll Run
    pub async fn run_payroll(
        &self,
        req: RunPayrollEntryRequest,
        processed_by: Option<Uuid>,
    ) -> Result<HrPayrollEntry, AppError> {
        let entry = self.repo.create_payroll_entry(req, processed_by).await?;
        let assignments = self.repo.list_salary_assignments().await?;

        let mut total_gross = Decimal::ZERO;
        let mut total_deductions = Decimal::ZERO;
        let mut total_net = Decimal::ZERO;
        let mut count = 0;

        for assign in assignments {
            // Calculate Gross
            let base = assign.base_salary;
            let tj_jabatan = assign.tunjangan_jabatan;
            let tj_transport = assign.tunjangan_transport;
            let tj_makan = assign.tunjangan_makan;
            let overtime_pay = Decimal::ZERO; // integrated from overtime requests
            let other_earnings = Decimal::ZERO;

            let gross = base + tj_jabatan + tj_transport + tj_makan + overtime_pay + other_earnings;

            // BPJS Engine
            let bpjs = HrTaxBpjsEngine::calculate_bpjs(base);

            // PPh 21 TER Engine (PP 58/2023)
            let pph21 = HrTaxBpjsEngine::calculate_pph21_ter(gross, &assign.ptkp_status);

            // Deductions & Auto-deduct Active Loan Installment (Fase 5)
            let mut kasbon = Decimal::ZERO;
            let mut matched_schedule = None;
            if let Ok(Some((sched_id, sched_amt, loan_id))) = self
                .loans_repo
                .get_due_loan_installment(assign.employee_id, entry.end_date)
                .await
            {
                kasbon = sched_amt;
                matched_schedule = Some((sched_id, sched_amt, loan_id));
            }
            let unpaid_leave = Decimal::ZERO;
            let deductions = bpjs.total_emp_deduction + pph21.tax_amount + kasbon + unpaid_leave;
            let net = gross - deductions;

            let slip = HrSalarySlip {
                id: Uuid::new_v4(),
                payroll_entry_id: Some(entry.id),
                employee_id: assign.employee_id,
                posting_date: entry.posting_date,
                start_date: entry.start_date,
                end_date: entry.end_date,
                base_salary: base,
                tunjangan_jabatan: tj_jabatan,
                tunjangan_transport: tj_transport,
                tunjangan_makan: tj_makan,
                overtime_hours: Decimal::ZERO,
                overtime_pay,
                other_earnings,
                gross_pay: gross,
                bpjs_kes_employee: bpjs.kes_emp,
                bpjs_kes_company: bpjs.kes_comp,
                bpjs_jht_employee: bpjs.jht_emp,
                bpjs_jht_company: bpjs.jht_comp,
                bpjs_jp_employee: bpjs.jp_emp,
                bpjs_jp_company: bpjs.jp_comp,
                bpjs_jkk_company: bpjs.jkk_comp,
                bpjs_jkm_company: bpjs.jkm_comp,
                ptkp_status: assign.ptkp_status.clone(),
                pph21_ter_category: pph21.category,
                pph21_ter_rate: pph21.rate,
                pph21_amount: pph21.tax_amount,
                kasbon_deduction: kasbon,
                unpaid_leave_deduction: unpaid_leave,
                total_deductions: deductions,
                net_pay: net,
                status: "submitted".to_string(),
                bank_name: assign.bank_name.clone(),
                bank_account: assign.bank_account.clone(),
                bank_account_holder: assign.bank_account_holder.clone(),
                payment_date: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
                employee_name: assign.employee_name.clone(),
                employee_nik: assign.employee_nik.clone(),
                department_name: assign.department_name.clone(),
            };

            self.repo.save_salary_slip(&slip).await?;

            if let Some((sched_id, sched_amt, loan_id)) = matched_schedule {
                let _ = self
                    .loans_repo
                    .mark_schedule_paid_by_payroll(sched_id, loan_id, sched_amt, entry.id)
                    .await;
            }

            total_gross += gross;
            total_deductions += deductions;
            total_net += net;
            count += 1;
        }

        self.repo
            .update_payroll_entry_totals(entry.id, total_gross, total_deductions, total_net, count)
            .await?;

        Ok(entry)
    }
}
