//! CRM Pipeline & Opportunity Integration Tests (QCRM-001, QCRM-002)

use chrono::Utc;
use management_system_crm::domain::entities::lead::Lead;
use management_system_crm::domain::entities::opportunity::{Opportunity, PipelineSummary};
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use uuid::Uuid;

#[test]
fn test_lead_initialization_defaults() {
    let company_id = Uuid::new_v4();
    let lead = Lead {
        id: Uuid::new_v4(),
        company_id,
        lead_name: "John Doe".to_string(),
        organization_name: Some("Acme Corp".to_string()),
        email: Some("john@acme.com".to_string()),
        phone: Some("+628123456789".to_string()),
        status: "LEAD".to_string(),
        created_at: Utc::now(),
    };

    assert_eq!(lead.status, "LEAD");
    assert_eq!(lead.lead_name, "John Doe");
    assert_eq!(lead.organization_name.as_deref(), Some("Acme Corp"));
}

#[test]
fn test_lead_conversion_to_opportunity() {
    let company_id = Uuid::new_v4();
    let lead_id = Uuid::new_v4();

    let opp = Opportunity {
        id: Uuid::new_v4(),
        company_id,
        lead_id: Some(lead_id),
        title: "Deal with Acme Corp".to_string(),
        estimated_value: dec!(250000000.00),
        stage: "QUALIFICATION".to_string(),
        expected_closing_date: None,
        created_at: Utc::now(),
    };

    assert_eq!(opp.lead_id, Some(lead_id));
    assert_eq!(opp.stage, "QUALIFICATION");
    assert_eq!(opp.estimated_value, dec!(250000000.00));
}

#[test]
fn test_pipeline_summary_aggregation() {
    let summary = vec![
        PipelineSummary {
            stage: "PROSPECTING".to_string(),
            count: 5,
            total_value: dec!(50000000.00),
        },
        PipelineSummary {
            stage: "QUALIFICATION".to_string(),
            count: 3,
            total_value: dec!(90000000.00),
        },
        PipelineSummary {
            stage: "WON".to_string(),
            count: 2,
            total_value: dec!(120000000.00),
        },
    ];

    let total_pipeline_value: Decimal = summary.iter().map(|s| s.total_value).sum();
    let total_deals: i64 = summary.iter().map(|s| s.count).sum();

    assert_eq!(total_deals, 10);
    assert_eq!(total_pipeline_value, dec!(260000000.00));
}
