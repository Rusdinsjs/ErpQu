use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApprovalWorkflow {
    pub id: Uuid,
    pub workflow_name: String,
    pub entity_type: String, // 'contract', 'rental', etc.
    pub approval_levels: i32,
    pub level_1_role: Option<String>,
    pub level_2_role: Option<String>,
    pub level_3_role: Option<String>,
    pub level_4_role: Option<String>,
    pub level_5_role: Option<String>,
    pub is_active: bool,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

impl ApprovalWorkflow {
    pub fn new(workflow_name: String, entity_type: String, approval_levels: i32) -> Self {
        Self {
            id: Uuid::new_v4(),
            workflow_name,
            entity_type,
            approval_levels,
            level_1_role: None,
            level_2_role: None,
            level_3_role: None,
            level_4_role: None,
            level_5_role: None,
            is_active: true,
            created_at: Some(Utc::now()),
            updated_at: Some(Utc::now()),
        }
    }
}

// === Frappe / ERPNext Style Workflow Builder Entities ===

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct WorkflowWithDocType {
    pub id: Uuid,
    pub workflow_name: String,
    pub doctype_id: Uuid,
    pub doctype_name: String,
    pub is_active: bool,
    pub document_status_field: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct WorkflowStateEntity {
    pub id: Uuid,
    pub workflow_id: Uuid,
    pub state_name: String,
    pub doc_status: i32,
    pub allow_edit_role_id: Option<Uuid>,
    pub style_variant: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct WorkflowTransitionDetail {
    pub id: Uuid,
    pub workflow_id: Uuid,
    pub state_id: Uuid,
    pub state_name: String,
    pub action_name: String,
    pub next_state_id: Uuid,
    pub next_state_name: String,
    pub allowed_role_id: Uuid,
    pub allowed_role_name: String,
    pub allowed_role_code: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowDetailResponse {
    pub workflow: WorkflowWithDocType,
    pub states: Vec<WorkflowStateEntity>,
    pub transitions: Vec<WorkflowTransitionDetail>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateWorkflowPayload {
    pub workflow_name: String,
    pub doctype_id: Uuid,
    pub document_status_field: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaveWorkflowStatePayload {
    pub state_name: String,
    pub doc_status: i32,
    pub allow_edit_role_id: Option<Uuid>,
    pub style_variant: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaveWorkflowTransitionPayload {
    pub state_id: Uuid,
    pub action_name: String,
    pub next_state_id: Uuid,
    pub allowed_role_id: Uuid,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApplyWorkflowActionPayload {
    pub workflow_id: Uuid,
    pub document_id: Uuid,
    pub current_state_name: String,
    pub action_name: String,
    pub comments: Option<String>,
}

