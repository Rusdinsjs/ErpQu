use crate::application::dto::hr_lifecycle_dto::{
    CreateDesignationRequest, CreateEmployeeDocumentRequest, CreateEmployeeEducationRequest,
    CreateEmploymentTypeRequest, CreateLifecycleEventRequest, UpdateDesignationRequest,
};
use crate::domain::entities::{
    HrDesignation, HrEmployeeDocument, HrEmployeeEducation, HrEmployeeLifecycle,
    HrEmploymentType, WorkExperience,
};
use crate::shared::errors::AppError;
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Clone)]
pub struct HrLifecycleRepository {
    pool: PgPool,
}

impl HrLifecycleRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    // ---- DESIGNATIONS ----

    pub async fn list_designations(&self) -> Result<Vec<HrDesignation>, AppError> {
        sqlx::query_as::<_, HrDesignation>(
            "SELECT d.*, dept.name as department_name \
             FROM hr_designations d \
             LEFT JOIN departments dept ON d.department_id = dept.id \
             WHERE d.is_active = TRUE ORDER BY d.name ASC",
        )
        .fetch_all(&self.pool).await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn get_designation(&self, id: Uuid) -> Result<HrDesignation, AppError> {
        sqlx::query_as::<_, HrDesignation>(
            "SELECT d.*, dept.name as department_name \
             FROM hr_designations d \
             LEFT JOIN departments dept ON d.department_id = dept.id \
             WHERE d.id = $1",
        )
        .bind(id)
        .fetch_optional(&self.pool).await
        .map_err(|e| AppError::Database(e.to_string()))?
        .ok_or_else(|| AppError::Domain(crate::domain::errors::DomainError::not_found("HrDesignation", id)))
    }

    pub async fn create_designation(&self, req: CreateDesignationRequest) -> Result<HrDesignation, AppError> {
        sqlx::query_as::<_, HrDesignation>(
            "INSERT INTO hr_designations (id, name, code, description, grade, department_id, is_manager) \
             VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6) \
             RETURNING *, NULL::text as department_name",
        )
        .bind(&req.name).bind(&req.code).bind(&req.description)
        .bind(&req.grade).bind(req.department_id).bind(req.is_manager.unwrap_or(false))
        .fetch_one(&self.pool).await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn update_designation(&self, id: Uuid, req: UpdateDesignationRequest) -> Result<HrDesignation, AppError> {
        let ex = self.get_designation(id).await?;
        sqlx::query_as::<_, HrDesignation>(
            "UPDATE hr_designations \
             SET name=$2, code=$3, description=$4, grade=$5, \
                 department_id=$6, is_manager=$7, is_active=$8, updated_at=NOW() \
             WHERE id=$1 \
             RETURNING *, NULL::text as department_name",
        )
        .bind(id)
        .bind(req.name.unwrap_or(ex.name))
        .bind(req.code.or(ex.code))
        .bind(req.description.or(ex.description))
        .bind(req.grade.or(ex.grade))
        .bind(req.department_id.or(ex.department_id))
        .bind(req.is_manager.unwrap_or(ex.is_manager))
        .bind(req.is_active.unwrap_or(ex.is_active))
        .fetch_one(&self.pool).await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn delete_designation(&self, id: Uuid) -> Result<(), AppError> {
        sqlx::query("UPDATE hr_designations SET is_active=FALSE, updated_at=NOW() WHERE id=$1")
            .bind(id).execute(&self.pool).await
            .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(())
    }

    // ---- EMPLOYMENT TYPES ----

    pub async fn list_employment_types(&self) -> Result<Vec<HrEmploymentType>, AppError> {
        sqlx::query_as::<_, HrEmploymentType>(
            "SELECT * FROM hr_employment_types WHERE is_active=TRUE ORDER BY name ASC",
        )
        .fetch_all(&self.pool).await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn create_employment_type(&self, req: CreateEmploymentTypeRequest) -> Result<HrEmploymentType, AppError> {
        sqlx::query_as::<_, HrEmploymentType>(
            "INSERT INTO hr_employment_types \
             (id, name, code, description, max_contract_years, is_eligible_bpjs, is_eligible_pph21, is_eligible_leave) \
             VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7) \
             RETURNING *",
        )
        .bind(&req.name).bind(&req.code).bind(&req.description).bind(req.max_contract_years)
        .bind(req.is_eligible_bpjs.unwrap_or(true))
        .bind(req.is_eligible_pph21.unwrap_or(true))
        .bind(req.is_eligible_leave.unwrap_or(true))
        .fetch_one(&self.pool).await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    // ---- LIFECYCLE EVENTS ----

    pub async fn list_lifecycle_events(&self, employee_id: Option<Uuid>) -> Result<Vec<HrEmployeeLifecycle>, AppError> {
        sqlx::query_as::<_, HrEmployeeLifecycle>(
            "SELECT lc.*, \
                e.name as employee_name, e.nik as employee_nik, \
                fd.name as from_designation_name, td.name as to_designation_name, \
                fdept.name as from_department_name, tdept.name as to_department_name, \
                u.name as performed_by_name \
             FROM hr_employee_lifecycle lc \
             JOIN employees e ON lc.employee_id = e.id \
             LEFT JOIN hr_designations fd ON lc.from_designation_id = fd.id \
             LEFT JOIN hr_designations td ON lc.to_designation_id = td.id \
             LEFT JOIN departments fdept ON lc.from_department_id = fdept.id \
             LEFT JOIN departments tdept ON lc.to_department_id = tdept.id \
             LEFT JOIN users u ON lc.performed_by = u.id \
             WHERE ($1::uuid IS NULL OR lc.employee_id = $1) \
             ORDER BY lc.effective_date DESC, lc.created_at DESC",
        )
        .bind(employee_id).fetch_all(&self.pool).await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn create_lifecycle_event(
        &self,
        req: CreateLifecycleEventRequest,
        performed_by: Option<Uuid>,
    ) -> Result<HrEmployeeLifecycle, AppError> {
        sqlx::query_as::<_, HrEmployeeLifecycle>(
            "INSERT INTO hr_employee_lifecycle ( \
                id, employee_id, event_type, effective_date, notes, \
                from_designation_id, to_designation_id, from_department_id, to_department_id, \
                from_position, to_position, from_salary, to_salary, \
                warning_level, warning_expiry_date, warning_reason, \
                last_working_date, exit_reason, exit_interview_notes, \
                document_url, document_number, performed_by \
             ) VALUES ( \
                uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, \
                $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21 \
             ) RETURNING *, \
                NULL::text as employee_name, NULL::text as employee_nik, \
                NULL::text as from_designation_name, NULL::text as to_designation_name, \
                NULL::text as from_department_name, NULL::text as to_department_name, \
                NULL::text as performed_by_name",
        )
        .bind(req.employee_id).bind(&req.event_type).bind(req.effective_date).bind(&req.notes)
        .bind(req.from_designation_id).bind(req.to_designation_id)
        .bind(req.from_department_id).bind(req.to_department_id)
        .bind(&req.from_position).bind(&req.to_position)
        .bind(req.from_salary).bind(req.to_salary)
        .bind(&req.warning_level).bind(req.warning_expiry_date).bind(&req.warning_reason)
        .bind(req.last_working_date).bind(&req.exit_reason).bind(&req.exit_interview_notes)
        .bind(&req.document_url).bind(&req.document_number).bind(performed_by)
        .fetch_one(&self.pool).await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    // ---- EMPLOYEE DOCUMENTS ----

    pub async fn list_employee_documents(&self, employee_id: Uuid) -> Result<Vec<HrEmployeeDocument>, AppError> {
        sqlx::query_as::<_, HrEmployeeDocument>(
            "SELECT * FROM hr_employee_documents WHERE employee_id=$1 ORDER BY created_at DESC",
        )
        .bind(employee_id).fetch_all(&self.pool).await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn create_employee_document(
        &self,
        req: CreateEmployeeDocumentRequest,
        uploaded_by: Option<Uuid>,
    ) -> Result<HrEmployeeDocument, AppError> {
        sqlx::query_as::<_, HrEmployeeDocument>(
            "INSERT INTO hr_employee_documents ( \
                id, employee_id, document_type, document_name, document_number, \
                document_url, file_name, file_size, mime_type, expiry_date, notes, uploaded_by \
             ) VALUES ( \
                uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11 \
             ) RETURNING *",
        )
        .bind(req.employee_id).bind(&req.document_type).bind(&req.document_name)
        .bind(&req.document_number).bind(&req.document_url).bind(&req.file_name)
        .bind(req.file_size).bind(&req.mime_type).bind(req.expiry_date)
        .bind(&req.notes).bind(uploaded_by)
        .fetch_one(&self.pool).await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn delete_employee_document(&self, id: Uuid) -> Result<(), AppError> {
        sqlx::query("DELETE FROM hr_employee_documents WHERE id=$1")
            .bind(id).execute(&self.pool).await
            .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(())
    }

    // ---- EMPLOYEE EDUCATION ----

    pub async fn list_employee_education(&self, employee_id: Uuid) -> Result<Vec<HrEmployeeEducation>, AppError> {
        sqlx::query_as::<_, HrEmployeeEducation>(
            "SELECT * FROM hr_employee_education WHERE employee_id=$1 ORDER BY graduation_year DESC NULLS LAST",
        )
        .bind(employee_id).fetch_all(&self.pool).await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn create_employee_education(&self, req: CreateEmployeeEducationRequest) -> Result<HrEmployeeEducation, AppError> {
        sqlx::query_as::<_, HrEmployeeEducation>(
            "INSERT INTO hr_employee_education \
             (id, employee_id, level, institution_name, major, graduation_year, gpa, is_highest, attachment_url) \
             VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8) \
             RETURNING *",
        )
        .bind(req.employee_id).bind(&req.level).bind(&req.institution_name)
        .bind(&req.major).bind(req.graduation_year).bind(req.gpa)
        .bind(req.is_highest.unwrap_or(false)).bind(&req.attachment_url)
        .fetch_one(&self.pool).await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn delete_employee_education(&self, id: Uuid) -> Result<(), AppError> {
        sqlx::query("DELETE FROM hr_employee_education WHERE id=$1")
            .bind(id).execute(&self.pool).await
            .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(())
    }

    // ---- WORK EXPERIENCES (existing table from 0035) ----

    pub async fn list_work_experiences(&self, employee_id: Uuid) -> Result<Vec<WorkExperience>, AppError> {
        sqlx::query_as::<_, WorkExperience>(
            "SELECT * FROM work_experiences WHERE employee_id=$1 ORDER BY start_date DESC NULLS LAST",
        )
        .bind(employee_id).fetch_all(&self.pool).await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    // ---- HELPERS ----

    pub async fn get_designation_optional(&self, id: Uuid) -> Result<Option<HrDesignation>, AppError> {
        sqlx::query_as::<_, HrDesignation>(
            "SELECT d.*, dept.name as department_name \
             FROM hr_designations d \
             LEFT JOIN departments dept ON d.department_id = dept.id \
             WHERE d.id=$1",
        )
        .bind(id).fetch_optional(&self.pool).await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn get_employment_type_optional(&self, id: Uuid) -> Result<Option<HrEmploymentType>, AppError> {
        sqlx::query_as::<_, HrEmploymentType>("SELECT * FROM hr_employment_types WHERE id=$1")
            .bind(id).fetch_optional(&self.pool).await
            .map_err(|e| AppError::Database(e.to_string()))
    }
}
