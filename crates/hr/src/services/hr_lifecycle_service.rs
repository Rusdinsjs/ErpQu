use crate::domain::entities::{
    HrDesignation, HrEmployeeDocument, HrEmployeeEducation, HrEmployeeLifecycle, HrEmploymentType,
    WorkExperience,
};
use crate::dto::*;
use crate::repositories::{EmployeeRepository, HrLifecycleRepository};
use management_system_core::shared::errors::AppError;
use uuid::Uuid;

#[derive(Clone)]
pub struct HrLifecycleService {
    repo: HrLifecycleRepository,
    employee_repo: EmployeeRepository,
}

impl HrLifecycleService {
    pub fn new(repo: HrLifecycleRepository, employee_repo: EmployeeRepository) -> Self {
        Self {
            repo,
            employee_repo,
        }
    }

    // ---- DESIGNATIONS ----
    pub async fn list_designations(&self) -> Result<Vec<HrDesignation>, AppError> {
        self.repo.list_designations().await
    }

    pub async fn get_designation(&self, id: Uuid) -> Result<HrDesignation, AppError> {
        self.repo.get_designation(id).await
    }

    pub async fn create_designation(
        &self,
        req: CreateDesignationRequest,
    ) -> Result<HrDesignation, AppError> {
        self.repo.create_designation(req).await
    }

    pub async fn update_designation(
        &self,
        id: Uuid,
        req: UpdateDesignationRequest,
    ) -> Result<HrDesignation, AppError> {
        self.repo.update_designation(id, req).await
    }

    pub async fn delete_designation(&self, id: Uuid) -> Result<(), AppError> {
        self.repo.delete_designation(id).await
    }

    // ---- EMPLOYMENT TYPES ----
    pub async fn list_employment_types(&self) -> Result<Vec<HrEmploymentType>, AppError> {
        self.repo.list_employment_types().await
    }

    pub async fn create_employment_type(
        &self,
        req: CreateEmploymentTypeRequest,
    ) -> Result<HrEmploymentType, AppError> {
        self.repo.create_employment_type(req).await
    }

    // ---- LIFECYCLE EVENTS ----
    pub async fn list_lifecycle_events(
        &self,
        employee_id: Option<Uuid>,
    ) -> Result<Vec<HrEmployeeLifecycle>, AppError> {
        self.repo.list_lifecycle_events(employee_id).await
    }

    pub async fn create_lifecycle_event(
        &self,
        req: CreateLifecycleEventRequest,
        performed_by: Option<Uuid>,
    ) -> Result<HrEmployeeLifecycle, AppError> {
        self.repo.create_lifecycle_event(req, performed_by).await
    }

    // ---- EMPLOYEE DOCUMENTS ----
    pub async fn list_employee_documents(
        &self,
        employee_id: Uuid,
    ) -> Result<Vec<HrEmployeeDocument>, AppError> {
        self.repo.list_employee_documents(employee_id).await
    }

    pub async fn create_employee_document(
        &self,
        req: CreateEmployeeDocumentRequest,
        uploaded_by: Option<Uuid>,
    ) -> Result<HrEmployeeDocument, AppError> {
        self.repo.create_employee_document(req, uploaded_by).await
    }

    pub async fn delete_employee_document(&self, id: Uuid) -> Result<(), AppError> {
        self.repo.delete_employee_document(id).await
    }

    // ---- EMPLOYEE EDUCATION ----
    pub async fn list_employee_education(
        &self,
        employee_id: Uuid,
    ) -> Result<Vec<HrEmployeeEducation>, AppError> {
        self.repo.list_employee_education(employee_id).await
    }

    pub async fn create_employee_education(
        &self,
        req: CreateEmployeeEducationRequest,
    ) -> Result<HrEmployeeEducation, AppError> {
        self.repo.create_employee_education(req).await
    }

    pub async fn delete_employee_education(&self, id: Uuid) -> Result<(), AppError> {
        self.repo.delete_employee_education(id).await
    }

    // ---- WORK EXPERIENCES ----
    pub async fn list_work_experiences(
        &self,
        employee_id: Uuid,
    ) -> Result<Vec<WorkExperience>, AppError> {
        self.repo.list_work_experiences(employee_id).await
    }

    // ---- EMPLOYEE 360 VIEW ----
    pub async fn get_employee_360(
        &self,
        employee_id: Uuid,
    ) -> Result<Employee360Response, AppError> {
        let employee = self.employee_repo.get_by_id(employee_id).await?;

        let designation = if let Some(did) = employee.designation_id {
            self.repo.get_designation_optional(did).await?
        } else {
            None
        };

        let employment_type = if let Some(etid) = employee.employment_type_id {
            self.repo.get_employment_type_optional(etid).await?
        } else {
            None
        };

        let lifecycle_history = self.repo.list_lifecycle_events(Some(employee_id)).await?;
        let documents = self.repo.list_employee_documents(employee_id).await?;
        let education = self.repo.list_employee_education(employee_id).await?;
        let work_experiences = self.repo.list_work_experiences(employee_id).await?;

        Ok(Employee360Response {
            employee,
            designation,
            employment_type,
            lifecycle_history,
            documents,
            education,
            work_experiences,
        })
    }
}
