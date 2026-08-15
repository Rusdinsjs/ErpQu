use chrono::NaiveDate;
use management_system_core::domain::errors::{DomainError, DomainResult};
use rust_decimal::Decimal;

pub struct FleetTelemetryEngine;

impl FleetTelemetryEngine {
    /// Validates Specific Fuel Consumption (SFC: Liter/HM or KM/Liter) against expected threshold
    pub fn check_fuel_consumption_anomaly(
        fuel_liters: Decimal,
        running_hours: Decimal,
        max_allowed_sfc: Decimal,
    ) -> DomainResult<bool> {
        if running_hours <= Decimal::ZERO {
            return Err(DomainError::business_rule(
                "invalid_running_hours",
                "Running hours must be strictly positive",
            ));
        }

        let actual_sfc = fuel_liters / running_hours;
        let is_anomaly = actual_sfc > max_allowed_sfc;
        Ok(is_anomaly)
    }

    /// Validates Operator / Driver License (SIO / SIM) validity before dispatch
    pub fn validate_operator_license(
        license_expiry_date: NaiveDate,
        dispatch_date: NaiveDate,
    ) -> DomainResult<()> {
        if dispatch_date > license_expiry_date {
            return Err(DomainError::business_rule(
                "operator_license_expired",
                &format!(
                    "Operator license expired on {}. Cannot dispatch on {}",
                    license_expiry_date, dispatch_date
                ),
            ));
        }
        Ok(())
    }

    /// Calculates Euclidean/Bounding Geofence breach
    pub fn is_outside_geofence(
        current_lat: f64,
        current_lon: f64,
        center_lat: f64,
        center_lon: f64,
        radius_km: f64,
    ) -> bool {
        // Approximate flat distance: 1 deg lat ~ 111 km
        let d_lat = (current_lat - center_lat) * 111.0;
        let d_lon = (current_lon - center_lon) * 111.0 * (center_lat.to_radians().cos());
        let distance_km = (d_lat * d_lat + d_lon * d_lon).sqrt();
        distance_km > radius_km
    }
}
