//! Quality Control & Quarantine Gatekeeping Invariant Tests (QQLT-001, QQLT-004)

use management_system_ops::domain::quality_control::{InspectionStatus, QualityParameterCriteria};
use management_system_ops::QualityService;
use rust_decimal_macros::dec;
use uuid::Uuid;

#[test]
fn test_quality_parameter_numeric_bounds() {
    let crit = QualityParameterCriteria {
        parameter_name: "Thickness (mm)".to_string(),
        min_value: Some(dec!(10.0)),
        max_value: Some(dec!(12.0)),
        expected_text: None,
    };

    assert!(crit.evaluate_numeric(dec!(11.0)));
    assert!(crit.evaluate_numeric(dec!(10.0))); // Exact min
    assert!(crit.evaluate_numeric(dec!(12.0))); // Exact max
    assert!(!crit.evaluate_numeric(dec!(9.9))); // Below min
    assert!(!crit.evaluate_numeric(dec!(12.1))); // Above max
}

#[test]
fn test_quality_parameter_text_match() {
    let crit = QualityParameterCriteria {
        parameter_name: "Surface Finish".to_string(),
        min_value: None,
        max_value: None,
        expected_text: Some("Smooth".to_string()),
    };

    assert!(crit.evaluate_text("smooth"));
    assert!(crit.evaluate_text(" SMOOTH "));
    assert!(!crit.evaluate_text("Rough"));
}

#[test]
fn test_inspection_status_stock_release_invariants() {
    assert!(InspectionStatus::Passed.is_allowed_for_stock_release());
    assert!(!InspectionStatus::Pending.is_allowed_for_stock_release());
    assert!(!InspectionStatus::Rejected.is_allowed_for_stock_release());
    assert!(!InspectionStatus::QualityHold.is_allowed_for_stock_release());
}

#[test]
fn test_quality_service_evaluation_workflow() {
    let inspection_id = Uuid::new_v4();

    let crit1 = QualityParameterCriteria {
        parameter_name: "Weight (kg)".to_string(),
        min_value: Some(dec!(5.0)),
        max_value: Some(dec!(6.0)),
        expected_text: None,
    };

    let crit2 = QualityParameterCriteria {
        parameter_name: "Color".to_string(),
        min_value: None,
        max_value: None,
        expected_text: Some("Metallic Blue".to_string()),
    };

    // Scenario 1: All pass -> Overall status Passed
    let evaluation_passed = QualityService::evaluate_inspection_criteria(
        inspection_id,
        &[
            (crit1.clone(), Some(dec!(5.5)), None),
            (crit2.clone(), None, Some("metallic blue".to_string())),
        ],
    );

    assert_eq!(evaluation_passed.overall_status, InspectionStatus::Passed);
    assert_eq!(evaluation_passed.passed_parameters, 2);
    assert_eq!(evaluation_passed.failed_parameters, 0);

    // Scenario 2: One fails -> Overall status Rejected
    let evaluation_failed = QualityService::evaluate_inspection_criteria(
        inspection_id,
        &[
            (crit1, Some(dec!(7.2)), None), // Fails: > 6.0
            (crit2, None, Some("metallic blue".to_string())),
        ],
    );

    assert_eq!(evaluation_failed.overall_status, InspectionStatus::Rejected);
    assert_eq!(evaluation_failed.passed_parameters, 1);
    assert_eq!(evaluation_failed.failed_parameters, 1);
}
