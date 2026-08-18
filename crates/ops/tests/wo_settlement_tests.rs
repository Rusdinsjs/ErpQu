use chrono::NaiveDate;
use management_system_ops::wo_settlement_service::{
    WorkOrderSettlementEngine, WorkOrderSettlementRequest,
};
use rust_decimal_macros::dec;
use uuid::Uuid;

#[test]
fn test_work_order_cost_calculation() {
    let parts = dec!(1500000.00);
    let labor = dec!(500000.00);
    let external = dec!(250000.00);

    let total = WorkOrderSettlementEngine::calculate_total_cost(parts, labor, external);
    assert_eq!(total, dec!(2250000.00));
}

#[test]
fn test_work_order_settlement_validation() {
    let req = WorkOrderSettlementRequest {
        work_order_id: Uuid::new_v4(),
        company_id: Uuid::new_v4(),
        settlement_date: NaiveDate::from_ymd_opt(2026, 8, 18).unwrap(),
        settlement_type: "capital".to_string(),
        asset_id: Some(Uuid::new_v4()),
        target_account_id: Uuid::new_v4(),
        offset_account_id: Uuid::new_v4(),
        parts_cost: dec!(1000000.00),
        labor_cost: dec!(300000.00),
        external_cost: dec!(0.00),
        notes: Some("Engine overhaul settlement".to_string()),
    };

    let total = WorkOrderSettlementEngine::validate_settlement(&req).unwrap();
    assert_eq!(total, dec!(1300000.00));
}
