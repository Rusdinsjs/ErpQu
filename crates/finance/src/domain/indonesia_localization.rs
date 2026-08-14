use chrono::{DateTime, NaiveDate, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Indonesian e-Faktur Tax Invoice Entity (QIDN-003)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IndonesianTaxInvoice {
    pub id: Uuid,
    pub company_id: Uuid,
    pub sales_invoice_id: Option<Uuid>,
    pub tax_invoice_number: String,
    pub npwp_buyer: String,
    pub name_buyer: String,
    pub tax_base: Decimal,   // DPP
    pub vat_amount: Decimal, // PPN
    pub vat_rate: Decimal,   // e.g. 11.00 or 12.00
    pub effective_date: NaiveDate,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

/// PPh Withholding Certificate Entity (QIDN-004)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WithholdingCertificate {
    pub id: Uuid,
    pub company_id: Uuid,
    pub certificate_number: String,
    pub pph_type: String, // PPH23, PPH4_2, PPH21, PPH22
    pub vendor_id: Option<Uuid>,
    pub client_id: Option<Uuid>,
    pub gross_amount: Decimal,
    pub pph_amount: Decimal,
    pub pph_rate: Decimal,
    pub posting_date: NaiveDate,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

/// Dynamic Regulatory Effective-Date Versioning for VAT (QIDN-008)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VatRateVersion {
    pub effective_date: NaiveDate,
    pub rate_percentage: Decimal,
}

impl VatRateVersion {
    /// Determine effective VAT rate for a given transaction date (QIDN-008)
    pub fn get_effective_vat_rate(posting_date: NaiveDate) -> Decimal {
        // Historical regulation schedule:
        // Prior to April 1, 2022 -> 10%
        // April 1, 2022 - Dec 31, 2024 -> 11%
        // Jan 1, 2025 onwards -> 12%
        let date_2022_04_01 = NaiveDate::from_ymd_opt(2022, 4, 1).unwrap();
        let date_2025_01_01 = NaiveDate::from_ymd_opt(2025, 1, 1).unwrap();

        if posting_date < date_2022_04_01 {
            rust_decimal_macros::dec!(10.00)
        } else if posting_date < date_2025_01_01 {
            rust_decimal_macros::dec!(11.00)
        } else {
            rust_decimal_macros::dec!(12.00)
        }
    }
}

/// Indonesian PPh 21 TER (Tarif Efektif Rata-Rata) Calculator (PMK 168/2023 / QIDN-009)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Pph21TerCalculator;

impl Pph21TerCalculator {
    /// Calculate monthly PPh 21 withholding using TER Category (A, B, C) based on PTKP status and monthly gross income
    pub fn calculate_monthly_pph21(
        category: &str, // "A", "B", "C"
        monthly_gross: Decimal,
    ) -> Decimal {
        let rate = match category {
            "A" => {
                // TK/0, TK/1, K/0
                if monthly_gross <= rust_decimal_macros::dec!(5400000.00) {
                    rust_decimal_macros::dec!(0.00)
                } else if monthly_gross <= rust_decimal_macros::dec!(5650000.00) {
                    rust_decimal_macros::dec!(0.25)
                } else if monthly_gross <= rust_decimal_macros::dec!(5950000.00) {
                    rust_decimal_macros::dec!(0.50)
                } else if monthly_gross <= rust_decimal_macros::dec!(6300000.00) {
                    rust_decimal_macros::dec!(0.75)
                } else {
                    rust_decimal_macros::dec!(1.00)
                }
            }
            "B" => {
                // TK/2, TK/3, K/1, K/2
                if monthly_gross <= rust_decimal_macros::dec!(6200000.00) {
                    rust_decimal_macros::dec!(0.00)
                } else if monthly_gross <= rust_decimal_macros::dec!(6500000.00) {
                    rust_decimal_macros::dec!(0.25)
                } else {
                    rust_decimal_macros::dec!(0.75)
                }
            }
            _ => {
                // Category C: K/3
                if monthly_gross <= rust_decimal_macros::dec!(6600000.00) {
                    rust_decimal_macros::dec!(0.00)
                } else {
                    rust_decimal_macros::dec!(0.50)
                }
            }
        };

        monthly_gross * (rate / rust_decimal_macros::dec!(100.00))
    }
}
