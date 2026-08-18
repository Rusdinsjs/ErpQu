use std::sync::Arc;
use uuid::Uuid;

use crate::domain::entities::{
    ApplyWorkflowActionPayload, ApprovalWorkflow, CreateWorkflowPayload, SaveWorkflowStatePayload,
    SaveWorkflowTransitionPayload, WorkflowDetailResponse, WorkflowStateEntity,
    WorkflowTransitionDetail, WorkflowWithDocType,
};
use crate::domain::errors::{DomainError, DomainResult};
use crate::infrastructure::repositories::ApprovalWorkflowRepository;

#[derive(Clone)]
pub struct ApprovalWorkflowService {
    repo: Arc<ApprovalWorkflowRepository>,
}

impl ApprovalWorkflowService {
    pub fn new(repo: Arc<ApprovalWorkflowRepository>) -> Self {
        Self { repo }
    }

    pub async fn list_workflows(&self) -> DomainResult<Vec<ApprovalWorkflow>> {
        self.repo.find_all().await
    }

    pub async fn get_workflow(&self, id: Uuid) -> DomainResult<ApprovalWorkflow> {
        self.repo
            .find_by_id(id)
            .await?
            .ok_or_else(|| DomainError::not_found("Approval Workflow", id))
    }

    pub async fn get_active_workflow(
        &self,
        entity_type: &str,
    ) -> DomainResult<Option<ApprovalWorkflow>> {
        self.repo.find_active_by_entity_type(entity_type).await
    }

    pub async fn create_workflow(
        &self,
        workflow: ApprovalWorkflow,
    ) -> DomainResult<ApprovalWorkflow> {
        self.repo.create(&workflow).await
    }

    pub async fn update_workflow(
        &self,
        id: Uuid,
        workflow: ApprovalWorkflow,
    ) -> DomainResult<ApprovalWorkflow> {
        self.repo.update(id, &workflow).await
    }

    pub async fn delete_workflow(&self, id: Uuid) -> DomainResult<()> {
        self.repo.delete(id).await
    }

    // === Frappe / ERPNext Style Workflow Methods ===

    pub async fn list_frappe_workflows(&self) -> DomainResult<Vec<WorkflowWithDocType>> {
        self.repo.list_frappe_workflows().await
    }

    pub async fn get_frappe_workflow_detail(&self, id: Uuid) -> DomainResult<WorkflowDetailResponse> {
        self.repo.get_frappe_workflow_detail(id).await
    }

    pub async fn create_frappe_workflow(
        &self,
        payload: CreateWorkflowPayload,
    ) -> DomainResult<WorkflowWithDocType> {
        self.repo.create_frappe_workflow(payload).await
    }

    pub async fn save_frappe_workflow_state(
        &self,
        workflow_id: Uuid,
        payload: SaveWorkflowStatePayload,
    ) -> DomainResult<WorkflowStateEntity> {
        self.repo.save_frappe_workflow_state(workflow_id, payload).await
    }

    pub async fn save_frappe_workflow_transition(
        &self,
        workflow_id: Uuid,
        payload: SaveWorkflowTransitionPayload,
    ) -> DomainResult<WorkflowTransitionDetail> {
        self.repo.save_frappe_workflow_transition(workflow_id, payload).await
    }

    pub async fn delete_frappe_workflow(&self, id: Uuid) -> DomainResult<()> {
        self.repo.delete_frappe_workflow(id).await
    }

    pub async fn apply_frappe_workflow_action(
        &self,
        payload: ApplyWorkflowActionPayload,
        user_id: Uuid,
    ) -> DomainResult<()> {
        self.repo.apply_frappe_workflow_action(payload, user_id).await
    }
}

