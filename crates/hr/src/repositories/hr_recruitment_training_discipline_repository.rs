use chrono::{NaiveDate, Utc};
use management_system_core::shared::errors::AppError;
use sqlx::PgPool;
use uuid::Uuid;

use crate::domain::entities::{
    HrDisciplinaryAction, HrEmployeeCertification, HrJobApplicant, HrJobOpening,
    HrTrainingEvent, HrTrainingParticipant, HrTrainingProgram,
};
use crate::dto::{
    CreateEmployeeCertificationRequest, CreateJobApplicantRequest, CreateJobOpeningRequest,
    CreateTrainingEventRequest, CreateTrainingProgramRequest, IssueDisciplinaryActionRequest,
    UpdateApplicantStageRequest,
};

#[derive(Clone)]
pub struct HrRecruitmentTrainingDisciplineRepository {
    pool: PgPool,
}

impl HrRecruitmentTrainingDisciplineRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    // ---- JOB OPENINGS ----
    pub async fn list_job_openings(&self) -> Result<Vec<HrJobOpening>, AppError> {
        sqlx::query_as::<_, HrJobOpening>(
            r#"
            SELECT j.*, dept.name as department_name, des.name as designation_name,
                   (SELECT COUNT(*) FROM hr_job_applicants a WHERE a.job_opening_id = j.id) as applicant_count
            FROM hr_job_openings j
            LEFT JOIN departments dept ON j.department_id = dept.id
            LEFT JOIN hr_designations des ON j.designation_id = des.id
            ORDER BY j.posted_date DESC
            "#,
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn get_job_opening(&self, id: Uuid) -> Result<HrJobOpening, AppError> {
        sqlx::query_as::<_, HrJobOpening>(
            r#"
            SELECT j.*, dept.name as department_name, des.name as designation_name,
                   (SELECT COUNT(*) FROM hr_job_applicants a WHERE a.job_opening_id = j.id) as applicant_count
            FROM hr_job_openings j
            LEFT JOIN departments dept ON j.department_id = dept.id
            LEFT JOIN hr_designations des ON j.designation_id = des.id
            WHERE j.id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?
        .ok_or_else(|| AppError::NotFound("Lowongan pekerjaan tidak ditemukan".into()))
    }

    pub async fn create_job_opening(&self, req: CreateJobOpeningRequest) -> Result<HrJobOpening, AppError> {
        sqlx::query_as::<_, HrJobOpening>(
            r#"
            INSERT INTO hr_job_openings (
                id, title, department_id, designation_id, employment_type, openings_count,
                min_experience_years, salary_min, salary_max, location, description, requirements, closing_date
            ) VALUES (
                uuid_generate_v4(), $1, $2, $3, COALESCE($4, 'Permanent'), COALESCE($5, 1),
                COALESCE($6, 1), $7, $8, COALESCE($9, 'Site / Head Office'), $10, $11, $12
            )
            RETURNING *, NULL::text as department_name, NULL::text as designation_name, 0::bigint as applicant_count
            "#,
        )
        .bind(&req.title)
        .bind(req.department_id)
        .bind(req.designation_id)
        .bind(&req.employment_type)
        .bind(req.openings_count)
        .bind(req.min_experience_years)
        .bind(req.salary_min)
        .bind(req.salary_max)
        .bind(&req.location)
        .bind(&req.description)
        .bind(&req.requirements)
        .bind(req.closing_date)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    // ---- JOB APPLICANTS ----
    pub async fn list_job_applicants(&self, job_opening_id: Option<Uuid>) -> Result<Vec<HrJobApplicant>, AppError> {
        sqlx::query_as::<_, HrJobApplicant>(
            r#"
            SELECT a.*, j.title as job_title
            FROM hr_job_applicants a
            JOIN hr_job_openings j ON a.job_opening_id = j.id
            WHERE ($1::uuid IS NULL OR a.job_opening_id = $1)
            ORDER BY a.created_at DESC
            "#,
        )
        .bind(job_opening_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn get_job_applicant(&self, id: Uuid) -> Result<HrJobApplicant, AppError> {
        sqlx::query_as::<_, HrJobApplicant>(
            r#"
            SELECT a.*, j.title as job_title
            FROM hr_job_applicants a
            JOIN hr_job_openings j ON a.job_opening_id = j.id
            WHERE a.id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?
        .ok_or_else(|| AppError::NotFound("Pelamar tidak ditemukan".into()))
    }

    pub async fn create_job_applicant(&self, req: CreateJobApplicantRequest) -> Result<HrJobApplicant, AppError> {
        sqlx::query_as::<_, HrJobApplicant>(
            r#"
            INSERT INTO hr_job_applicants (
                id, job_opening_id, full_name, email, phone, resume_url, portfolio_url, notes, stage
            ) VALUES (
                uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, 'applied'
            )
            RETURNING *, NULL::text as job_title
            "#,
        )
        .bind(req.job_opening_id)
        .bind(&req.full_name)
        .bind(&req.email)
        .bind(&req.phone)
        .bind(&req.resume_url)
        .bind(&req.portfolio_url)
        .bind(&req.notes)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn update_applicant_stage(&self, id: Uuid, req: UpdateApplicantStageRequest) -> Result<HrJobApplicant, AppError> {
        sqlx::query_as::<_, HrJobApplicant>(
            r#"
            UPDATE hr_job_applicants
            SET stage = $2,
                notes = COALESCE($3, notes),
                rating = COALESCE($4, rating),
                rejection_reason = $5,
                updated_at = NOW()
            WHERE id = $1
            RETURNING *, NULL::text as job_title
            "#,
        )
        .bind(id)
        .bind(&req.stage)
        .bind(&req.notes)
        .bind(req.rating)
        .bind(&req.rejection_reason)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn link_applicant_converted_employee(&self, applicant_id: Uuid, employee_id: Uuid) -> Result<(), AppError> {
        sqlx::query("UPDATE hr_job_applicants SET stage = 'hired', converted_employee_id = $2, updated_at = NOW() WHERE id = $1")
            .bind(applicant_id)
            .bind(employee_id)
            .execute(&self.pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(())
    }

    // ---- TRAINING PROGRAMS & EVENTS ----
    pub async fn list_training_programs(&self) -> Result<Vec<HrTrainingProgram>, AppError> {
        sqlx::query_as::<_, HrTrainingProgram>("SELECT * FROM hr_training_programs WHERE is_active = TRUE ORDER BY title ASC")
            .fetch_all(&self.pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn create_training_program(&self, req: CreateTrainingProgramRequest) -> Result<HrTrainingProgram, AppError> {
        sqlx::query_as::<_, HrTrainingProgram>(
            r#"
            INSERT INTO hr_training_programs (id, title, code, description, trainer_type, duration_hours, is_mandatory)
            VALUES (uuid_generate_v4(), $1, $2, $3, COALESCE($4, 'internal'), $5, COALESCE($6, FALSE))
            RETURNING *
            "#,
        )
        .bind(&req.title)
        .bind(&req.code)
        .bind(&req.description)
        .bind(&req.trainer_type)
        .bind(req.duration_hours)
        .bind(req.is_mandatory)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn list_training_events(&self) -> Result<Vec<HrTrainingEvent>, AppError> {
        sqlx::query_as::<_, HrTrainingEvent>(
            r#"
            SELECT e.*, p.title as program_title,
                   (SELECT COUNT(*) FROM hr_training_participants tp WHERE tp.event_id = e.id) as participant_count
            FROM hr_training_events e
            JOIN hr_training_programs p ON e.program_id = p.id
            ORDER BY e.start_date DESC
            "#,
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn create_training_event(&self, req: CreateTrainingEventRequest) -> Result<HrTrainingEvent, AppError> {
        sqlx::query_as::<_, HrTrainingEvent>(
            r#"
            INSERT INTO hr_training_events (id, program_id, title, start_date, end_date, location, trainer_name, total_cost)
            VALUES (uuid_generate_v4(), $1, $2, $3, $4, COALESCE($5, 'Ruang Training'), $6, $7)
            RETURNING *, NULL::text as program_title, 0::bigint as participant_count
            "#,
        )
        .bind(req.program_id)
        .bind(&req.title)
        .bind(req.start_date)
        .bind(req.end_date)
        .bind(&req.location)
        .bind(&req.trainer_name)
        .bind(req.total_cost)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn list_training_participants(&self, event_id: Uuid) -> Result<Vec<HrTrainingParticipant>, AppError> {
        sqlx::query_as::<_, HrTrainingParticipant>(
            r#"
            SELECT tp.*, emp.name as employee_name, emp.nik as employee_nik
            FROM hr_training_participants tp
            JOIN employees emp ON tp.employee_id = emp.id
            WHERE tp.event_id = $1
            ORDER BY emp.name ASC
            "#,
        )
        .bind(event_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn add_training_participant(&self, event_id: Uuid, employee_id: Uuid) -> Result<(), AppError> {
        sqlx::query(
            r#"
            INSERT INTO hr_training_participants (id, event_id, employee_id)
            VALUES (uuid_generate_v4(), $1, $2)
            ON CONFLICT (event_id, employee_id) DO NOTHING
            "#,
        )
        .bind(event_id)
        .bind(employee_id)
        .execute(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(())
    }

    // ---- EMPLOYEE CERTIFICATIONS ----
    pub async fn list_employee_certifications(&self, employee_id: Option<Uuid>) -> Result<Vec<HrEmployeeCertification>, AppError> {
        sqlx::query_as::<_, HrEmployeeCertification>(
            r#"
            SELECT c.*, emp.name as employee_name, emp.nik as employee_nik
            FROM hr_employee_certifications c
            JOIN employees emp ON c.employee_id = emp.id
            WHERE ($1::uuid IS NULL OR c.employee_id = $1)
            ORDER BY c.expiry_date ASC
            "#,
        )
        .bind(employee_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn create_employee_certification(&self, req: CreateEmployeeCertificationRequest) -> Result<HrEmployeeCertification, AppError> {
        sqlx::query_as::<_, HrEmployeeCertification>(
            r#"
            INSERT INTO hr_employee_certifications (
                id, employee_id, certificate_name, certificate_no, issuing_body, issue_date, expiry_date, document_url, status
            ) VALUES (
                uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, 'active'
            )
            RETURNING *, NULL::text as employee_name, NULL::text as employee_nik
            "#,
        )
        .bind(req.employee_id)
        .bind(&req.certificate_name)
        .bind(&req.certificate_no)
        .bind(&req.issuing_body)
        .bind(req.issue_date)
        .bind(req.expiry_date)
        .bind(&req.document_url)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    // ---- DISCIPLINARY ACTIONS ----
    pub async fn list_disciplinary_actions(&self, employee_id: Option<Uuid>) -> Result<Vec<HrDisciplinaryAction>, AppError> {
        sqlx::query_as::<_, HrDisciplinaryAction>(
            r#"
            SELECT d.*, emp.name as employee_name, emp.nik as employee_nik
            FROM hr_disciplinary_actions d
            JOIN employees emp ON d.employee_id = emp.id
            WHERE ($1::uuid IS NULL OR d.employee_id = $1)
            ORDER BY d.issue_date DESC
            "#,
        )
        .bind(employee_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn issue_disciplinary_action(&self, req: IssueDisciplinaryActionRequest, valid_until: NaiveDate, issued_by: Option<Uuid>) -> Result<HrDisciplinaryAction, AppError> {
        sqlx::query_as::<_, HrDisciplinaryAction>(
            r#"
            INSERT INTO hr_disciplinary_actions (
                id, employee_id, action_type, infraction_category, incident_date, issue_date, valid_until, reason_details, action_plan, issued_by, status
            ) VALUES (
                uuid_generate_v4(), $1, $2, $3, $4, CURRENT_DATE, $5, $6, $7, $8, 'active'
            )
            RETURNING *, NULL::text as employee_name, NULL::text as employee_nik
            "#,
        )
        .bind(req.employee_id)
        .bind(&req.action_type)
        .bind(&req.infraction_category)
        .bind(req.incident_date)
        .bind(valid_until)
        .bind(&req.reason_details)
        .bind(&req.action_plan)
        .bind(issued_by)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }
}
