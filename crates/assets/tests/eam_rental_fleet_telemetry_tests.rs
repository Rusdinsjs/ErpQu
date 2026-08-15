//! EAM, Heavy Equipment Rental, Fleet, and Telemetry Invariant Test Suite (Fase 11)
//!
//! Validates:
//! 1. Asset depreciation schedule total matches asset depreciable value.
//! 2. Asset disposal gain/loss accounting calculation.
//! 3. Rental timesheet calculation with standby vs operating rate and minimum hours guarantee.
//! 4. Fuel consumption anomaly trigger (SFC exceeding expected threshold).
//! 5. Geofence breach detection logic.
//! 6. Operator license expiration check before dispatch.

use chrono::NaiveDate;
use management_system_assets::domain::asset_eam::AssetEamEngine;
use management_system_core::domain::errors::DomainError;
use management_system_rental::domain::rental_engine::HeavyEquipmentRentalEngine;
use management_system_telemetry::domain::fleet_telemetry::FleetTelemetryEngine;
use rust_decimal::Decimal;
use std::str::FromStr;

fn d(s: &str) -> Decimal {
    Decimal::from_str(s).unwrap()
}

#[test]
fn test_depreciation_schedule_sum_matches_depreciable_amount() {
    let cost = d("120000000.00");
    let residual = d("0.00");
    let start_date = NaiveDate::from_ymd_opt(2026, 8, 1).unwrap();
    let months = 48;

    let schedule =
        AssetEamEngine::generate_straight_line_schedule(cost, residual, start_date, months)
            .unwrap();

    assert_eq!(schedule.len(), 48);
    let total_depreciated: Decimal = schedule.iter().map(|item| item.depreciation_amount).sum();
    assert_eq!(total_depreciated, cost - residual);
    assert_eq!(schedule.last().unwrap().remaining_book_value, residual);
}

#[test]
fn test_asset_disposal_gain_calculation() {
    let cost = d("100000000.00");
    let accum_depr = d("60000000.00");
    let sale_proceeds = d("45000000.00");

    let gain_loss = AssetEamEngine::calculate_disposal_gain_loss(cost, accum_depr, sale_proceeds);
    assert_eq!(gain_loss, d("5000000.00")); // 45M - (100M - 60M) = +5M Gain
}

#[test]
fn test_rental_timesheet_with_minimum_guarantee_applied() {
    let operating_hours = d("80.00");
    let standby_hours = d("20.00"); // Total 100 HM
    let operating_rate = d("500000.00");
    let standby_rate = d("250000.00");
    let min_guarantee = d("200.00"); // Minimum 200 HM

    let calc = HeavyEquipmentRentalEngine::calculate_rental_billing(
        operating_hours,
        standby_hours,
        operating_rate,
        standby_rate,
        min_guarantee,
    )
    .unwrap();

    assert!(calc.is_minimum_guarantee_applied);
    assert_eq!(calc.billed_hours_applied, d("200.00"));
    // 200 HM * 500,000 = 100,000,000 IDR
    assert_eq!(calc.gross_amount, d("100000000.00"));
}

#[test]
fn test_rental_timesheet_exceeding_minimum_guarantee() {
    let operating_hours = d("180.00");
    let standby_hours = d("40.00"); // Total 220 HM (exceeds min 200)
    let operating_rate = d("500000.00");
    let standby_rate = d("250000.00");
    let min_guarantee = d("200.00");

    let calc = HeavyEquipmentRentalEngine::calculate_rental_billing(
        operating_hours,
        standby_hours,
        operating_rate,
        standby_rate,
        min_guarantee,
    )
    .unwrap();

    assert!(!calc.is_minimum_guarantee_applied);
    assert_eq!(calc.billed_hours_applied, d("220.00"));
    // (180 * 500k) + (40 * 250k) = 90M + 10M = 100M
    assert_eq!(calc.gross_amount, d("100000000.00"));
}

#[test]
fn test_fuel_consumption_anomaly_detection() {
    let running_hours = d("10.00");
    let normal_fuel = d("150.00"); // 15 L/HM
    let excessive_fuel = d("280.00"); // 28 L/HM
    let max_sfc = d("20.00"); // 20 L/HM threshold

    assert!(!FleetTelemetryEngine::check_fuel_consumption_anomaly(
        normal_fuel,
        running_hours,
        max_sfc
    )
    .unwrap());
    assert!(FleetTelemetryEngine::check_fuel_consumption_anomaly(
        excessive_fuel,
        running_hours,
        max_sfc
    )
    .unwrap());
}

#[test]
fn test_operator_license_expiration_rejection() {
    let license_expiry = NaiveDate::from_ymd_opt(2026, 8, 1).unwrap();
    let valid_dispatch = NaiveDate::from_ymd_opt(2026, 7, 25).unwrap();
    let expired_dispatch = NaiveDate::from_ymd_opt(2026, 8, 15).unwrap();

    // Valid dispatch before expiry
    assert!(
        FleetTelemetryEngine::validate_operator_license(license_expiry, valid_dispatch).is_ok()
    );

    // Rejection when license is expired
    let result = FleetTelemetryEngine::validate_operator_license(license_expiry, expired_dispatch);
    assert!(result.is_err());
    match result.unwrap_err() {
        DomainError::BusinessRuleViolation { rule, .. } => {
            assert_eq!(rule, "operator_license_expired");
        }
        err => panic!("Expected BusinessRuleViolation, got {:?}", err),
    }
}

#[test]
fn test_geofence_breach_detection() {
    let center_lat = -6.200000;
    let center_lon = 106.816666; // Jakarta center
    let radius_km = 10.0;

    // Point 1 km away -> Inside geofence
    let inside_lat = -6.205000;
    let inside_lon = 106.820000;
    assert!(!FleetTelemetryEngine::is_outside_geofence(
        inside_lat, inside_lon, center_lat, center_lon, radius_km
    ));

    // Point 50 km away -> Outside geofence (Breach!)
    let outside_lat = -6.600000;
    let outside_lon = 106.816666;
    assert!(FleetTelemetryEngine::is_outside_geofence(
        outside_lat,
        outside_lon,
        center_lat,
        center_lon,
        radius_km
    ));
}
