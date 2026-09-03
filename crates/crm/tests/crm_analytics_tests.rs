//! CRM Win/Loss Funnel & Analytics Tests

use management_system_crm::domain::entities::crm_analytics::CrmAnalyticsEngine;
use rust_decimal_macros::dec;

#[test]
fn test_crm_win_loss_calculation() {
    let won_deals = 8;
    let won_value = dec!(800000000.0); // 800M IDR total won
    let lost_deals = 2;
    let lost_value = dec!(200000000.0); // 200M IDR total lost

    let report = CrmAnalyticsEngine::calculate_win_loss(won_deals, won_value, lost_deals, lost_value);

    assert_eq!(report.total_closed_deals, 10);
    assert_eq!(report.total_won_deals, 8);
    assert_eq!(report.total_lost_deals, 2);
    assert_eq!(report.win_rate_percentage, dec!(80.00));
    assert_eq!(report.average_won_deal_size, dec!(100000000.00));
}

#[test]
fn test_crm_win_loss_zero_deals() {
    let report = CrmAnalyticsEngine::calculate_win_loss(0, dec!(0.0), 0, dec!(0.0));

    assert_eq!(report.total_closed_deals, 0);
    assert_eq!(report.win_rate_percentage, dec!(0.0));
    assert_eq!(report.average_won_deal_size, dec!(0.0));
}
