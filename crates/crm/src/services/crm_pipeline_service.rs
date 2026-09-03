//! CRM Pipeline Service (QCRM-001, QCRM-002)

use chrono::Utc;
use management_system_core::domain::errors::{DomainError, DomainResult};
use rust_decimal::Decimal;
use sqlx::PgPool;
use uuid::Uuid;

use crate::domain::entities::lead::{CreateLeadRequest, Lead, UpdateLeadRequest};
use crate::domain::entities::opportunity::{
    CreateOpportunityRequest, Opportunity, PipelineSummary, UpdateOpportunityRequest,
};
use crate::repositories::{LeadRepository, OpportunityRepository};

#[derive(Clone)]
pub struct CrmPipelineService {
    lead_repo: LeadRepository,
    opportunity_repo: OpportunityRepository,
}

impl CrmPipelineService {
    pub fn new(pool: PgPool) -> Self {
        Self {
            lead_repo: LeadRepository::new(pool.clone()),
            opportunity_repo: OpportunityRepository::new(pool),
        }
    }

    // --- Leads ---

    pub async fn create_lead(
        &self,
        company_id: Uuid,
        req: CreateLeadRequest,
    ) -> DomainResult<Lead> {
        let lead = Lead {
            id: Uuid::new_v4(),
            company_id: req.company_id.unwrap_or(company_id),
            lead_name: req.lead_name,
            organization_name: req.organization_name,
            email: req.email,
            phone: req.phone,
            status: req.status.unwrap_or_else(|| "LEAD".to_string()),
            created_at: Utc::now(),
        };

        self.lead_repo
            .create(&lead)
            .await
            .map_err(|e| DomainError::internal(format!("Failed to create lead: {}", e)))
    }

    pub async fn get_lead(&self, id: Uuid) -> DomainResult<Option<Lead>> {
        self.lead_repo
            .find_by_id(id)
            .await
            .map_err(|e| DomainError::internal(format!("Failed to fetch lead: {}", e)))
    }

    pub async fn list_leads(&self, company_id: Uuid) -> DomainResult<Vec<Lead>> {
        self.lead_repo
            .list_by_company(company_id)
            .await
            .map_err(|e| DomainError::internal(format!("Failed to list leads: {}", e)))
    }

    pub async fn update_lead(
        &self,
        id: Uuid,
        req: UpdateLeadRequest,
    ) -> DomainResult<Option<Lead>> {
        self.lead_repo
            .update(id, &req)
            .await
            .map_err(|e| DomainError::internal(format!("Failed to update lead: {}", e)))
    }

    pub async fn delete_lead(&self, id: Uuid) -> DomainResult<bool> {
        self.lead_repo
            .delete(id)
            .await
            .map_err(|e| DomainError::internal(format!("Failed to delete lead: {}", e)))
    }

    // --- Lead Conversion ---

    pub async fn convert_lead_to_opportunity(
        &self,
        lead_id: Uuid,
        company_id: Uuid,
        title: String,
        estimated_value: Decimal,
    ) -> DomainResult<Opportunity> {
        let lead = self
            .get_lead(lead_id)
            .await?
            .ok_or_else(|| DomainError::not_found("Lead", lead_id))?;

        // Update lead status to QUALIFIED
        self.update_lead(
            lead_id,
            UpdateLeadRequest {
                lead_name: None,
                organization_name: None,
                email: None,
                phone: None,
                status: Some("QUALIFIED".to_string()),
            },
        )
        .await?;

        // Create opportunity
        let opp = Opportunity {
            id: Uuid::new_v4(),
            company_id,
            lead_id: Some(lead.id),
            title,
            estimated_value,
            stage: "QUALIFICATION".to_string(),
            expected_closing_date: None,
            created_at: Utc::now(),
        };

        self.opportunity_repo
            .create(&opp)
            .await
            .map_err(|e| DomainError::internal(format!("Failed to create opportunity from lead: {}", e)))
    }

    // --- Opportunities ---

    pub async fn create_opportunity(
        &self,
        company_id: Uuid,
        req: CreateOpportunityRequest,
    ) -> DomainResult<Opportunity> {
        let opp = Opportunity {
            id: Uuid::new_v4(),
            company_id: req.company_id.unwrap_or(company_id),
            lead_id: req.lead_id,
            title: req.title,
            estimated_value: req.estimated_value,
            stage: req.stage.unwrap_or_else(|| "PROSPECTING".to_string()),
            expected_closing_date: req.expected_closing_date,
            created_at: Utc::now(),
        };

        self.opportunity_repo
            .create(&opp)
            .await
            .map_err(|e| DomainError::internal(format!("Failed to create opportunity: {}", e)))
    }

    pub async fn get_opportunity(&self, id: Uuid) -> DomainResult<Option<Opportunity>> {
        self.opportunity_repo
            .find_by_id(id)
            .await
            .map_err(|e| DomainError::internal(format!("Failed to fetch opportunity: {}", e)))
    }

    pub async fn list_opportunities(&self, company_id: Uuid) -> DomainResult<Vec<Opportunity>> {
        self.opportunity_repo
            .list_by_company(company_id)
            .await
            .map_err(|e| DomainError::internal(format!("Failed to list opportunities: {}", e)))
    }

    pub async fn update_opportunity(
        &self,
        id: Uuid,
        req: UpdateOpportunityRequest,
    ) -> DomainResult<Option<Opportunity>> {
        self.opportunity_repo
            .update(id, &req)
            .await
            .map_err(|e| DomainError::internal(format!("Failed to update opportunity: {}", e)))
    }

    pub async fn delete_opportunity(&self, id: Uuid) -> DomainResult<bool> {
        self.opportunity_repo
            .delete(id)
            .await
            .map_err(|e| DomainError::internal(format!("Failed to delete opportunity: {}", e)))
    }

    pub async fn get_pipeline_summary(
        &self,
        company_id: Uuid,
    ) -> DomainResult<Vec<PipelineSummary>> {
        self.opportunity_repo
            .get_pipeline_summary(company_id)
            .await
            .map_err(|e| DomainError::internal(format!("Failed to fetch pipeline summary: {}", e)))
    }

    pub async fn get_win_loss_analytics(
        &self,
        company_id: Uuid,
    ) -> DomainResult<crate::domain::entities::crm_analytics::CrmWinLossReport> {
        let opportunities = self.list_opportunities(company_id).await?;

        let mut won_deals = 0;
        let mut won_value = Decimal::ZERO;
        let mut lost_deals = 0;
        let mut lost_value = Decimal::ZERO;

        for opp in opportunities {
            let stage_upper = opp.stage.to_uppercase();
            if stage_upper == "WON" || stage_upper == "CLOSED_WON" {
                won_deals += 1;
                won_value += opp.estimated_value;
            } else if stage_upper == "LOST" || stage_upper == "CLOSED_LOST" {
                lost_deals += 1;
                lost_value += opp.estimated_value;
            }
        }

        Ok(
            crate::domain::entities::crm_analytics::CrmAnalyticsEngine::calculate_win_loss(
                won_deals,
                won_value,
                lost_deals,
                lost_value,
            ),
        )
    }
}
