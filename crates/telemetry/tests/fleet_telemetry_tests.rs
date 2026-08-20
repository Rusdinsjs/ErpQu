use chrono::NaiveDate;
use management_system_telemetry::domain::fleet_telemetry::FleetTelemetryEngine;
use rust_decimal_macros::dec;

#[test]
fn test_operator_license_validation_before_dispatch() {
    let expiry = NaiveDate::from_ymd_opt(2026, 8, 1).unwrap();
    let dispatch = NaiveDate::from_ymd_opt(2026, 8, 18).unwrap();

    let result = FleetTelemetryEngine::validate_operator_license(expiry, dispatch);
    assert!(
        result.is_err(),
        "Dispatch with expired SIM/SIO must be rejected"
    );

    let valid_expiry = NaiveDate::from_ymd_opt(2027, 1, 1).unwrap();
    let valid_result = FleetTelemetryEngine::validate_operator_license(valid_expiry, dispatch);
    assert!(
        valid_result.is_ok(),
        "Valid SIM/SIO dispatch must be approved"
    );
}

#[test]
fn test_geofence_breach_detection() {
    let center_lat = -6.2000;
    let center_lon = 106.8166;
    let radius_km = 5.0;

    // Inside geofence
    let inside = FleetTelemetryEngine::is_outside_geofence(
        -6.2100, 106.8200, center_lat, center_lon, radius_km,
    );
    assert!(!inside, "Point within 5km must not trigger geofence breach");

    // Far outside geofence (bandung)
    let outside = FleetTelemetryEngine::is_outside_geofence(
        -6.9147, 107.6098, center_lat, center_lon, radius_km,
    );
    assert!(
        outside,
        "Point outside 5km radius must trigger geofence breach"
    );
}

#[test]
fn test_fuel_consumption_anomaly_detection() {
    let fuel_liters = dec!(150.0);
    let hours = dec!(5.0); // Actual 30 L/HM
    let max_allowed = dec!(20.0); // Threshold 20 L/HM

    let is_anomaly =
        FleetTelemetryEngine::check_fuel_consumption_anomaly(fuel_liters, hours, max_allowed)
            .unwrap();
    assert!(
        is_anomaly,
        "SFC 30 L/HM exceeding max threshold 20 L/HM must trigger fuel anomaly alert"
    );
}
