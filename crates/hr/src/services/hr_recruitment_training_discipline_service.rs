use chrono::{Datelike, NaiveDate, Utc};
use management_system_core::shared::errors::AppError;
use uuid::Uuid;

use crate::domain::entities::{
    HrDisciplinaryAction, HrEmployeeCertification, HrJobApplicant, HrJobOpening, HrTrainingEvent,
    HrTrainingParticipant, HrTrainingProgram,
};
use crate::dto::{
    ConvertApplicantRequest, CreateEmployeeCertificationRequest, CreateJobApplicantRequest,
    CreateJobOpeningRequest, CreateTrainingEventRequest, CreateTrainingProgramRequest,
    IssueDisciplinaryActionRequest, UpdateApplicantStageRequest,
};
use crate::repositories::{EmployeeRepository, HrRecruitmentTrainingDisciplineRepository};

#[derive(Clone)]
pub struct HrRecruitmentTrainingDisciplineService {
    repo: HrRecruitmentTrainingDisciplineRepository,
    emp_repo: EmployeeRepository,
}

impl HrRecruitmentTrainingDisciplineService {
    pub fn new(
        repo: HrRecruitmentTrainingDisciplineRepository,
        emp_repo: EmployeeRepository,
    ) -> Self {
        Self { repo, emp_repo }
    }

    // ---- RECRUITMENT ATS ----
    pub async fn list_job_openings(&self) -> Result<Vec<HrJobOpening>, AppError> {
        self.repo.list_job_openings().await
    }

    pub async fn create_job_opening(
        &self,
        req: CreateJobOpeningRequest,
    ) -> Result<HrJobOpening, AppError> {
        self.repo.create_job_opening(req).await
    }

    pub async fn list_job_applicants(
        &self,
        job_opening_id: Option<Uuid>,
    ) -> Result<Vec<HrJobApplicant>, AppError> {
        self.repo.list_job_applicants(job_opening_id).await
    }

    pub async fn create_job_applicant(
        &self,
        req: CreateJobApplicantRequest,
    ) -> Result<HrJobApplicant, AppError> {
        self.repo.create_job_applicant(req).await
    }

    pub async fn update_applicant_stage(
        &self,
        id: Uuid,
        req: UpdateApplicantStageRequest,
    ) -> Result<HrJobApplicant, AppError> {
        self.repo.update_applicant_stage(id, req).await
    }

    pub async fn convert_applicant_to_employee(
        &self,
        applicant_id: Uuid,
        req: ConvertApplicantRequest,
    ) -> Result<Uuid, AppError> {
        let applicant = self.repo.get_job_applicant(applicant_id).await?;
        let job = self.repo.get_job_opening(applicant.job_opening_id).await?;

        // Create new employee
        let emp = crate::domain::entities::Employee {
            id: Uuid::new_v4(),
            nik: req.nik,
            name: applicant.full_name,
            email: applicant.email,
            phone: Some(applicant.phone),
            department_id: job.department_id,
            position: Some(job.title),
            employment_status: "pkwt".into(),
            user_id: None,
            is_active: true,
            ktp_number: None,
            place_of_birth: None,
            date_of_birth: None,
            gender: None,
            marital_status: None,
            religion: None,
            address: None,
            blood_type: None,
            children_count: None,
            residence_status: None,
            emergency_contact_name: None,
            emergency_contact_phone: None,
            emergency_contact_relation: None,
            start_date: Some(req.date_of_joining),
            end_contract_date: None,
            is_manager: false,
            manager_id: None,
            is_evaluator: None,
            designation_id: job.designation_id,
            employment_type_id: None,
            grade: None,
            probation_end_date: None,
            confirmation_date: None,
            resignation_date: None,
            resignation_reason: None,
            is_account_requested: None,
            bank_account: None,
            bank_name: None,
            npwp: None,
            bpjs_kesehatan: None,
            bpjs_tenaga_kerja: None,
            basic_salary: Some(req.base_salary),
            is_allowance: None,
            allowances: None,
            education: None,
            competencies: None,
            competency_attachments: None,
            leave_balance: 12,
            leave_used: 0,
            photo_url: None,
            face_embeddings: None,
            face_verification_status: None,
            office_location_id: None,
            allowed_radius: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            department_name: None,
            assigned_asset_id: None,
            work_area_id: None,
        };

        let created_emp = self.emp_repo.create(&emp).await?;
        self.repo
            .link_applicant_converted_employee(applicant_id, created_emp.id)
            .await?;

        Ok(created_emp.id)
    }

    // ---- TRAINING & CERTIFICATIONS ----
    pub async fn list_training_programs(&self) -> Result<Vec<HrTrainingProgram>, AppError> {
        self.repo.list_training_programs().await
    }

    pub async fn create_training_program(
        &self,
        req: CreateTrainingProgramRequest,
    ) -> Result<HrTrainingProgram, AppError> {
        self.repo.create_training_program(req).await
    }

    pub async fn list_training_events(&self) -> Result<Vec<HrTrainingEvent>, AppError> {
        self.repo.list_training_events().await
    }

    pub async fn create_training_event(
        &self,
        req: CreateTrainingEventRequest,
    ) -> Result<HrTrainingEvent, AppError> {
        self.repo.create_training_event(req).await
    }

    pub async fn list_training_participants(
        &self,
        event_id: Uuid,
    ) -> Result<Vec<HrTrainingParticipant>, AppError> {
        self.repo.list_training_participants(event_id).await
    }

    pub async fn add_training_participant(
        &self,
        event_id: Uuid,
        employee_id: Uuid,
    ) -> Result<(), AppError> {
        self.repo
            .add_training_participant(event_id, employee_id)
            .await
    }

    pub async fn list_employee_certifications(
        &self,
        employee_id: Option<Uuid>,
    ) -> Result<Vec<HrEmployeeCertification>, AppError> {
        self.repo.list_employee_certifications(employee_id).await
    }

    pub async fn create_employee_certification(
        &self,
        req: CreateEmployeeCertificationRequest,
    ) -> Result<HrEmployeeCertification, AppError> {
        self.repo.create_employee_certification(req).await
    }

    // ---- DISCIPLINARY ACTIONS ----
    pub async fn list_disciplinary_actions(
        &self,
        employee_id: Option<Uuid>,
    ) -> Result<Vec<HrDisciplinaryAction>, AppError> {
        self.repo.list_disciplinary_actions(employee_id).await
    }

    pub async fn issue_disciplinary_action(
        &self,
        req: IssueDisciplinaryActionRequest,
        issued_by: Option<Uuid>,
    ) -> Result<HrDisciplinaryAction, AppError> {
        // Standard Indonesian Labor Rule: 6 months validity
        let today = Utc::now().date_naive();
        let mut year = today.year();
        let mut month = today.month() + 6;
        while month > 12 {
            year += 1;
            month -= 12;
        }
        let valid_until =
            NaiveDate::from_ymd_opt(year, month, today.day().min(28)).unwrap_or(today);

        self.repo
            .issue_disciplinary_action(req, valid_until, issued_by)
            .await
    }
}
