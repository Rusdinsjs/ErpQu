use chrono::{DateTime, NaiveDate, Utc};
use management_system_core::domain::errors::{DomainError, DomainResult};
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
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

/// PPh 23 Withholding Calculator
pub struct Pph23Calculator;

impl Pph23Calculator {
    /// Calculate PPh 23 withholding (2% if has NPWP, 4% if no NPWP)
    pub fn calculate_pph23(gross_amount: Decimal, has_npwp: bool) -> Decimal {
        let rate = if has_npwp { dec!(0.02) } else { dec!(0.04) };
        (gross_amount * rate).round_dp(2)
    }
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
        let date_2022_04_01 = NaiveDate::from_ymd_opt(2022, 4, 1).unwrap();
        let date_2025_01_01 = NaiveDate::from_ymd_opt(2025, 1, 1).unwrap();

        if posting_date < date_2022_04_01 {
            dec!(10.00)
        } else if posting_date < date_2025_01_01 {
            dec!(11.00)
        } else {
            dec!(12.00)
        }
    }
}

/// Indonesian PPh 21 TER (Tarif Efektif Rata-Rata) Calculator (PP 58/2023 & PMK 168/2023 / QIDN-009)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Pph21TerCalculator;

impl Pph21TerCalculator {
    /// Calculate monthly PPh 21 withholding using TER Category (A, B, C)
    pub fn calculate_monthly_pph21(
        category: &str, // "A", "B", "C"
        monthly_gross: Decimal,
    ) -> Decimal {
        let rate = match category {
            "A" => {
                if monthly_gross <= dec!(5400000.00) {
                    dec!(0.00)
                } else if monthly_gross <= dec!(5650000.00) {
                    dec!(0.25)
                } else if monthly_gross <= dec!(5950000.00) {
                    dec!(0.50)
                } else if monthly_gross <= dec!(6300000.00) {
                    dec!(0.75)
                } else if monthly_gross <= dec!(6750000.00) {
                    dec!(1.00)
                } else if monthly_gross <= dec!(7500000.00) {
                    dec!(1.25)
                } else {
                    dec!(1.50)
                }
            }
            "B" => {
                if monthly_gross <= dec!(6200000.00) {
                    dec!(0.00)
                } else if monthly_gross <= dec!(6500000.00) {
                    dec!(0.25)
                } else if monthly_gross <= dec!(6850000.00) {
                    dec!(0.50)
                } else if monthly_gross <= dec!(7300000.00) {
                    dec!(0.75)
                } else {
                    dec!(1.00)
                }
            }
            _ => {
                // Category C: K/3
                if monthly_gross <= dec!(6600000.00) {
                    dec!(0.00)
                } else if monthly_gross <= dec!(6950000.00) {
                    dec!(0.25)
                } else {
                    dec!(0.50)
                }
            }
        };

        (monthly_gross * (rate / dec!(100.00))).round_dp(2)
    }
}

/// BPJS Contribution Calculation Structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BpjsContributions {
    // BPJS Ketenagakerjaan
    pub jht_company: Decimal,  // 3.7%
    pub jht_employee: Decimal, // 2.0%
    pub jkk_company: Decimal,  // 0.24%
    pub jkm_company: Decimal,  // 0.30%
    pub jp_company: Decimal,   // 2.0% (capped)
    pub jp_employee: Decimal,  // 1.0% (capped)

    // BPJS Kesehatan
    pub bpjs_kes_company: Decimal,  // 4.0% (capped)
    pub bpjs_kes_employee: Decimal, // 1.0% (capped)

    pub total_company_cost: Decimal,
    pub total_employee_deduction: Decimal,
}

pub struct BpjsCalculator;

impl BpjsCalculator {
    /// Calculate Indonesian statutory BPJS contributions
    pub fn calculate(base_salary: Decimal) -> BpjsContributions {
        let jp_ceiling = dec!(10042300.00); // 2024 JP salary cap
        let bpjs_kes_ceiling = dec!(12000000.00); // 12M ceiling

        // JHT
        let jht_company = (base_salary * dec!(0.037)).round_dp(2);
        let jht_employee = (base_salary * dec!(0.020)).round_dp(2);

        // JKK & JKM
        let jkk_company = (base_salary * dec!(0.0024)).round_dp(2);
        let jkm_company = (base_salary * dec!(0.0030)).round_dp(2);

        // JP (capped)
        let jp_basis = base_salary.min(jp_ceiling);
        let jp_company = (jp_basis * dec!(0.020)).round_dp(2);
        let jp_employee = (jp_basis * dec!(0.010)).round_dp(2);

        // BPJS Kesehatan (capped)
        let kes_basis = base_salary.min(bpjs_kes_ceiling);
        let bpjs_kes_company = (kes_basis * dec!(0.040)).round_dp(2);
        let bpjs_kes_employee = (kes_basis * dec!(0.010)).round_dp(2);

        let total_company_cost = jht_company + jkk_company + jkm_company + jp_company + bpjs_kes_company;
        let total_employee_deduction = jht_employee + jp_employee + bpjs_kes_employee;

        BpjsContributions {
            jht_company,
            jht_employee,
            jkk_company,
            jkm_company,
            jp_company,
            jp_employee,
            bpjs_kes_company,
            bpjs_kes_employee,
            total_company_cost,
            total_employee_deduction,
        }
    }
}

/// Indonesian Statutory Overtime Calculator (Kepmenakertrans No. 102/2004)
pub struct IndonesianOvertimeCalculator;

impl IndonesianOvertimeCalculator {
    /// Calculates overtime pay for workdays: 1st hour = 1.5x, 2nd+ hours = 2.0x
    pub fn calculate_workday_overtime(monthly_base_salary: Decimal, overtime_hours: Decimal) -> Decimal {
        if overtime_hours <= Decimal::ZERO {
            return Decimal::ZERO;
        }

        // Upah sejam = 1 / 173 x Upah sebulan
        let hourly_rate = monthly_base_salary / dec!(173.00);

        let first_hour = overtime_hours.min(dec!(1.0));
        let remaining_hours = (overtime_hours - dec!(1.0)).max(Decimal::ZERO);

        let pay_first_hour = first_hour * dec!(1.5) * hourly_rate;
        let pay_remaining_hours = remaining_hours * dec!(2.0) * hourly_rate;

        (pay_first_hour + pay_remaining_hours).round_dp(2)
    }
}

/// Payroll Accounting GL Bridge Validator
pub struct PayrollJournalValidator;

impl PayrollJournalValidator {
    /// Validates that payroll journal debits (Salaries + Company BPJS) exactly equal credits (Take Home Pay + Taxes + Deductions)
    pub fn validate_payroll_journal(
        basic_salary: Decimal,
        overtime_pay: Decimal,
        company_bpjs: Decimal,
        pph21_withholding: Decimal,
        employee_bpjs: Decimal,
        net_pay: Decimal,
    ) -> DomainResult<()> {
        let total_debit = basic_salary + overtime_pay + company_bpjs;
        let total_credit = net_pay + pph21_withholding + employee_bpjs + company_bpjs;

        if total_debit != total_credit {
            return Err(DomainError::business_rule(
                "payroll_journal_unbalanced",
                &format!(
                    "Total debit ({}) must equal total credit ({})",
                    total_debit, total_credit
                ),
            ));
        }

        Ok(())
    }
}
