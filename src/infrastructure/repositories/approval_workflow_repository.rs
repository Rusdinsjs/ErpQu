use chrono::Utc;
use sqlx::PgPool;
use uuid::Uuid;

use crate::domain::entities::{
    ApplyWorkflowActionPayload, ApprovalWorkflow, CreateWorkflowPayload, SaveWorkflowStatePayload,
    SaveWorkflowTransitionPayload, WorkflowDetailResponse, WorkflowStateEntity,
    WorkflowTransitionDetail, WorkflowWithDocType,
};
use crate::domain::errors::{DomainError, DomainResult};


#[derive(Clone)]
pub struct ApprovalWorkflowRepository {
    pool: PgPool,
}

impl ApprovalWorkflowRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, workflow: &ApprovalWorkflow) -> DomainResult<ApprovalWorkflow> {
        let rec = sqlx::query_as!(
            ApprovalWorkflow,
            r#"
            INSERT INTO approval_workflows (
                id, workflow_name, entity_type, approval_levels,
                level_1_role, level_2_role, level_3_role, level_4_role, level_5_role,
                is_active, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING 
                id, workflow_name, entity_type, approval_levels,
                level_1_role, level_2_role, level_3_role, level_4_role, level_5_role,
                is_active as "is_active!", created_at, updated_at
            "#,
            workflow.id,
            workflow.workflow_name,
            workflow.entity_type,
            workflow.approval_levels,
            workflow.level_1_role,
            workflow.level_2_role,
            workflow.level_3_role,
            workflow.level_4_role,
            workflow.level_5_role,
            workflow.is_active,
            workflow.created_at,
            workflow.updated_at
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(rec)
    }

    pub async fn find_by_id(&self, id: Uuid) -> DomainResult<Option<ApprovalWorkflow>> {
        let rec = sqlx::query_as!(
            ApprovalWorkflow,
            r#"
            SELECT 
                id, workflow_name, entity_type, approval_levels,
                level_1_role, level_2_role, level_3_role, level_4_role, level_5_role,
                is_active as "is_active!", created_at, updated_at
            FROM approval_workflows WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(rec)
    }

    pub async fn find_active_by_entity_type(
        &self,
        entity_type: &str,
    ) -> DomainResult<Option<ApprovalWorkflow>> {
        let rec = sqlx::query_as!(
            ApprovalWorkflow,
            r#"
            SELECT 
                id, workflow_name, entity_type, approval_levels,
                level_1_role, level_2_role, level_3_role, level_4_role, level_5_role,
                is_active as "is_active!", created_at, updated_at
            FROM approval_workflows 
            WHERE entity_type = $1 AND is_active = true
            LIMIT 1
            "#,
            entity_type
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(rec)
    }

    pub async fn find_all(&self) -> DomainResult<Vec<ApprovalWorkflow>> {
        let recs = sqlx::query_as!(
            ApprovalWorkflow,
            r#"
            SELECT 
                id, workflow_name, entity_type, approval_levels,
                level_1_role, level_2_role, level_3_role, level_4_role, level_5_role,
                is_active as "is_active!", created_at, updated_at
            FROM approval_workflows ORDER BY created_at DESC
            "#
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(recs)
    }

    pub async fn update(
        &self,
        id: Uuid,
        workflow: &ApprovalWorkflow,
    ) -> DomainResult<ApprovalWorkflow> {
        let rec = sqlx::query_as!(
            ApprovalWorkflow,
            r#"
            UPDATE approval_workflows
            SET 
                workflow_name = $1,
                entity_type = $2,
                approval_levels = $3,
                level_1_role = $4,
                level_2_role = $5,
                level_3_role = $6,
                level_4_role = $7,
                level_5_role = $8,
                is_active = $9,
                updated_at = $10
            WHERE id = $11
            RETURNING 
                id, workflow_name, entity_type, approval_levels,
                level_1_role, level_2_role, level_3_role, level_4_role, level_5_role,
                is_active as "is_active!", created_at, updated_at
            "#,
            workflow.workflow_name,
            workflow.entity_type,
            workflow.approval_levels,
            workflow.level_1_role,
            workflow.level_2_role,
            workflow.level_3_role,
            workflow.level_4_role,
            workflow.level_5_role,
            workflow.is_active,
            Some(Utc::now()),
            id
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(rec)
    }

    pub async fn delete(&self, id: Uuid) -> DomainResult<()> {
        sqlx::query!(
            r#"
            DELETE FROM approval_workflows WHERE id = $1
            "#,
            id
        )
        .execute(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(())
    }

    // === Frappe / ERPNext Style Workflow Methods ===

    pub async fn list_frappe_workflows(&self) -> DomainResult<Vec<WorkflowWithDocType>> {
        let recs = sqlx::query_as::<_, WorkflowWithDocType>(
            r#"
            SELECT w.id, w.workflow_name, w.doctype_id, d.name as doctype_name, w.is_active,
                   w.document_status_field, w.created_at, w.updated_at
            FROM workflows w
            JOIN doctypes d ON w.doctype_id = d.id
            ORDER BY w.workflow_name ASC
            "#,
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(recs)
    }

    pub async fn get_frappe_workflow_detail(&self, id: Uuid) -> DomainResult<WorkflowDetailResponse> {
        let wf = sqlx::query_as::<_, WorkflowWithDocType>(
            r#"
            SELECT w.id, w.workflow_name, w.doctype_id, d.name as doctype_name, w.is_active,
                   w.document_status_field, w.created_at, w.updated_at
            FROM workflows w
            JOIN doctypes d ON w.doctype_id = d.id
            WHERE w.id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?
        .ok_or_else(|| DomainError::not_found("Workflow", id))?;

        let states = sqlx::query_as::<_, WorkflowStateEntity>(
            r#"
            SELECT id, workflow_id, state_name, doc_status, allow_edit_role_id, style_variant, created_at
            FROM workflow_states
            WHERE workflow_id = $1
            ORDER BY doc_status ASC, state_name ASC
            "#,
        )
        .bind(id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        let transitions = sqlx::query_as::<_, WorkflowTransitionDetail>(
            r#"
            SELECT wt.id, wt.workflow_id, wt.state_id, s1.state_name, wt.action_name,
                   wt.next_state_id, s2.state_name as next_state_name,
                   wt.allowed_role_id, r.name as allowed_role_name, r.code as allowed_role_code
            FROM workflow_transitions wt
            JOIN workflow_states s1 ON wt.state_id = s1.id
            JOIN workflow_states s2 ON wt.next_state_id = s2.id
            JOIN roles r ON wt.allowed_role_id = r.id
            WHERE wt.workflow_id = $1
            ORDER BY s1.state_name ASC, wt.action_name ASC
            "#,
        )
        .bind(id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(WorkflowDetailResponse {
            workflow: wf,
            states,
            transitions,
        })
    }

    pub async fn create_frappe_workflow(
        &self,
        payload: CreateWorkflowPayload,
    ) -> DomainResult<WorkflowWithDocType> {
        let wf_id = Uuid::new_v4();
        let status_field = payload
            .document_status_field
            .unwrap_or_else(|| "workflow_state".to_string());

        let wf = sqlx::query_as::<_, WorkflowWithDocType>(
            r#"
            INSERT INTO workflows (id, workflow_name, doctype_id, is_active, document_status_field)
            VALUES ($1, $2, $3, true, $4)
            RETURNING id, workflow_name, doctype_id,
                      (SELECT name FROM doctypes WHERE id = workflows.doctype_id) as doctype_name,
                      is_active, document_status_field, created_at, updated_at
            "#,
        )
        .bind(wf_id)
        .bind(payload.workflow_name)
        .bind(payload.doctype_id)
        .bind(status_field)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(wf)
    }

    pub async fn save_frappe_workflow_state(
        &self,
        workflow_id: Uuid,
        payload: SaveWorkflowStatePayload,
    ) -> DomainResult<WorkflowStateEntity> {
        let state_id = Uuid::new_v4();
        let style = payload.style_variant.unwrap_or_else(|| "info".to_string());

        let state = sqlx::query_as::<_, WorkflowStateEntity>(
            r#"
            INSERT INTO workflow_states (id, workflow_id, state_name, doc_status, allow_edit_role_id, style_variant)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT ON CONSTRAINT uq_workflow_state_name DO UPDATE SET
                doc_status = EXCLUDED.doc_status,
                allow_edit_role_id = EXCLUDED.allow_edit_role_id,
                style_variant = EXCLUDED.style_variant
            RETURNING id, workflow_id, state_name, doc_status, allow_edit_role_id, style_variant, created_at
            "#,
        )
        .bind(state_id)
        .bind(workflow_id)
        .bind(payload.state_name)
        .bind(payload.doc_status)
        .bind(payload.allow_edit_role_id)
        .bind(style)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(state)
    }

    pub async fn save_frappe_workflow_transition(
        &self,
        workflow_id: Uuid,
        payload: SaveWorkflowTransitionPayload,
    ) -> DomainResult<WorkflowTransitionDetail> {
        let transition_id = Uuid::new_v4();

        let tr = sqlx::query_as::<_, WorkflowTransitionDetail>(
            r#"
            INSERT INTO workflow_transitions (id, workflow_id, state_id, action_name, next_state_id, allowed_role_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT ON CONSTRAINT uq_workflow_transition DO UPDATE SET
                next_state_id = EXCLUDED.next_state_id,
                allowed_role_id = EXCLUDED.allowed_role_id
            RETURNING id, workflow_id, state_id,
                (SELECT state_name FROM workflow_states WHERE id = workflow_transitions.state_id) as state_name,
                action_name, next_state_id,
                (SELECT state_name FROM workflow_states WHERE id = workflow_transitions.next_state_id) as next_state_name,
                allowed_role_id,
                (SELECT name FROM roles WHERE id = workflow_transitions.allowed_role_id) as allowed_role_name,
                (SELECT code FROM roles WHERE id = workflow_transitions.allowed_role_id) as allowed_role_code
            "#,
        )
        .bind(transition_id)
        .bind(workflow_id)
        .bind(payload.state_id)
        .bind(payload.action_name)
        .bind(payload.next_state_id)
        .bind(payload.allowed_role_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(tr)
    }

    pub async fn delete_frappe_workflow(&self, id: Uuid) -> DomainResult<()> {
        sqlx::query("DELETE FROM workflows WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(())
    }

    pub async fn apply_frappe_workflow_action(
        &self,
        payload: ApplyWorkflowActionPayload,
        user_id: Uuid,
    ) -> DomainResult<()> {
        let mut tx = self.pool.begin().await.map_err(|e| DomainError::Database(e.to_string()))?;

        // 1. Find matching transition
        let transition = sqlx::query!(
            r#"
            SELECT wt.action_name, s2.state_name as next_state_name
            FROM workflow_transitions wt
            JOIN workflow_states s1 ON wt.state_id = s1.id
            JOIN workflow_states s2 ON wt.next_state_id = s2.id
            WHERE wt.workflow_id = $1 AND s1.state_name = $2 AND wt.action_name = $3
            "#,
            payload.workflow_id,
            payload.current_state_name,
            payload.action_name
        )
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?
        .ok_or_else(|| DomainError::validation("Aksi workflow tidak valid dari status saat ini"))?;

        // 2. Log action
        sqlx::query!(
            r#"
            INSERT INTO workflow_action_logs (id, workflow_id, document_id, action_by_user_id, from_state, action_name, to_state, comments)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
            Uuid::new_v4(),
            payload.workflow_id,
            payload.document_id,
            user_id,
            payload.current_state_name,
            payload.action_name,
            transition.next_state_name,
            payload.comments
        )
        .execute(&mut *tx)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        tx.commit().await.map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(())
    }
}

