use management_system_core::domain::errors::{DomainError, DomainResult};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RentalBillingCalculation {
    pub total_operating_hours: Decimal,
    pub total_standby_hours: Decimal,
    pub total_billable_hours: Decimal,
    pub billed_hours_applied: Decimal,
    pub gross_amount: Decimal,
    pub is_minimum_guarantee_applied: bool,
}

pub struct HeavyEquipmentRentalEngine;

impl HeavyEquipmentRentalEngine {
    /// Calculates rental billing with standby rate, operating rate, and minimum guarantee
    pub fn calculate_rental_billing(
        operating_hours: Decimal,
        standby_hours: Decimal,
        operating_rate_per_hour: Decimal,
        standby_rate_per_hour: Decimal,
        minimum_hours_guarantee: Decimal,
    ) -> DomainResult<RentalBillingCalculation> {
        if operating_hours < Decimal::ZERO || standby_hours < Decimal::ZERO {
            return Err(DomainError::business_rule(
                "invalid_hours",
                "Hours cannot be negative",
            ));
        }

        let total_recorded_hours = operating_hours + standby_hours;
        let standard_gross = (operating_hours * operating_rate_per_hour) + (standby_hours * standby_rate_per_hour);

        if total_recorded_hours < minimum_hours_guarantee {
            // Apply minimum guarantee billing
            let min_gross = minimum_hours_guarantee * operating_rate_per_hour;
            let gross_amount = standard_gross.max(min_gross);
            Ok(RentalBillingCalculation {
                total_operating_hours: operating_hours,
                total_standby_hours: standby_hours,
                total_billable_hours: total_recorded_hours,
                billed_hours_applied: minimum_hours_guarantee,
                gross_amount,
                is_minimum_guarantee_applied: true,
            })
        } else {
            Ok(RentalBillingCalculation {
                total_operating_hours: operating_hours,
                total_standby_hours: standby_hours,
                total_billable_hours: total_recorded_hours,
                billed_hours_applied: total_recorded_hours,
                gross_amount: standard_gross,
                is_minimum_guarantee_applied: false,
            })
        }
    }
}
