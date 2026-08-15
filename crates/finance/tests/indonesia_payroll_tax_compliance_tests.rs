//! Indonesian Payroll, Tax Localization, and Statutory Compliance Test Suite (Fase 12)
//!
//! Validates:
//! 1. PPh 21 TER calculation on Categories A, B, and C.
//! 2. BPJS Ketenagakerjaan and Kesehatan employer & employee contribution precision.
//! 3. Overtime pay calculation according to Kepmenakertrans No. 102/2004.
//! 4. e-Faktur DPP and PPN rate schedule (11% vs 12%).
//! 5. PPh 23 withholding tax (2% with NPWP vs 4% without NPWP).
//! 6. Balanced payroll journal vouchers.

use chrono::NaiveDate;
use management_system_finance::domain::indonesia_localization::{
    BpjsCalculator, IndonesianOvertimeCalculator, PayrollJournalValidator, Pph21TerCalculator,
    Pph23Calculator, VatRateVersion,
};
use rust_decimal_macros::dec;

#[test]
fn test_pph21_ter_category_a_calculation() {
    // Category A (TK/0, TK/1, K/0)
    // 5.000.000 (<= 5.4M) -> 0%
    assert_eq!(
        Pph21TerCalculator::calculate_monthly_pph21("A", dec!(5000000.00)),
        dec!(0.00)
    );

    // 5.500.000 (<= 5.65M) -> 0.25% = 13,750
    assert_eq!(
        Pph21TerCalculator::calculate_monthly_pph21("A", dec!(5500000.00)),
        dec!(13750.00)
    );

    // 6.000.000 (<= 6.30M) -> 0.75% = 45,000
    assert_eq!(
        Pph21TerCalculator::calculate_monthly_pph21("A", dec!(6000000.00)),
        dec!(45000.00)
    );
}

#[test]
fn test_pph21_ter_category_b_and_c_calculation() {
    // Category B (TK/2, TK/3, K/1, K/2)
    // 6.000.000 (<= 6.2M) -> 0%
    assert_eq!(
        Pph21TerCalculator::calculate_monthly_pph21("B", dec!(6000000.00)),
        dec!(0.00)
    );

    // 6.400.000 (<= 6.5M) -> 0.25% = 16,000
    assert_eq!(
        Pph21TerCalculator::calculate_monthly_pph21("B", dec!(6400000.00)),
        dec!(16000.00)
    );

    // Category C (K/3)
    // 6.500.000 (<= 6.6M) -> 0%
    assert_eq!(
        Pph21TerCalculator::calculate_monthly_pph21("C", dec!(6500000.00)),
        dec!(0.00)
    );

    // 7.000.000 (> 6.95M) -> 0.50% = 35,000
    assert_eq!(
        Pph21TerCalculator::calculate_monthly_pph21("C", dec!(7000000.00)),
        dec!(35000.00)
    );
}

#[test]
fn test_bpjs_contributions_precision() {
    let salary = dec!(10000000.00); // 10.000.000 IDR
    let bpjs = BpjsCalculator::calculate(salary);

    // JHT: Co 3.7% = 370,000, Emp 2.0% = 200,000
    assert_eq!(bpjs.jht_company, dec!(370000.00));
    assert_eq!(bpjs.jht_employee, dec!(200000.00));

    // JKK: 0.24% = 24,000, JKM: 0.30% = 30,000
    assert_eq!(bpjs.jkk_company, dec!(24000.00));
    assert_eq!(bpjs.jkm_company, dec!(30000.00));

    // JP: Co 2.0% = 200,000, Emp 1.0% = 100,000
    assert_eq!(bpjs.jp_company, dec!(200000.00));
    assert_eq!(bpjs.jp_employee, dec!(100000.00));

    // BPJS Kes: Co 4.0% = 400,000, Emp 1.0% = 100,000
    assert_eq!(bpjs.bpjs_kes_company, dec!(400000.00));
    assert_eq!(bpjs.bpjs_kes_employee, dec!(100000.00));

    // Totals
    assert_eq!(bpjs.total_company_cost, dec!(1024000.00));
    assert_eq!(bpjs.total_employee_deduction, dec!(400000.00));
}

#[test]
fn test_indonesian_overtime_calculation_kepmenaker_102() {
    let base_salary = dec!(5190000.00); // Hourly rate = 5,190,000 / 173 = 30,000
    let overtime_hours = dec!(3.0);

    // 1st hour: 1.5 * 30,000 = 45,000
    // 2nd & 3rd hours (2 hours): 2.0 * 30,000 * 2 = 120,000
    // Total overtime pay = 165,000
    let overtime_pay =
        IndonesianOvertimeCalculator::calculate_workday_overtime(base_salary, overtime_hours);
    assert_eq!(overtime_pay, dec!(165000.00));
}

#[test]
fn test_pph23_withholding_npwp_difference() {
    let service_fee = dec!(10000000.00);

    // With NPWP -> 2% = 200,000
    assert_eq!(
        Pph23Calculator::calculate_pph23(service_fee, true),
        dec!(200000.00)
    );

    // Without NPWP -> 4% = 400,000
    assert_eq!(
        Pph23Calculator::calculate_pph23(service_fee, false),
        dec!(400000.00)
    );
}

#[test]
fn test_vat_rate_schedule_evolution() {
    let date_2023 = NaiveDate::from_ymd_opt(2023, 6, 15).unwrap();
    let date_2025 = NaiveDate::from_ymd_opt(2025, 3, 1).unwrap();

    assert_eq!(
        VatRateVersion::get_effective_vat_rate(date_2023),
        dec!(11.00)
    );
    assert_eq!(
        VatRateVersion::get_effective_vat_rate(date_2025),
        dec!(12.00)
    );
}

#[test]
fn test_balanced_payroll_journal_generation() {
    let basic_salary = dec!(8000000.00);
    let overtime_pay = dec!(500000.00);
    let bpjs = BpjsCalculator::calculate(basic_salary);
    let gross_pay = basic_salary + overtime_pay;
    let pph21 = Pph21TerCalculator::calculate_monthly_pph21("A", gross_pay);
    let net_pay = gross_pay - bpjs.total_employee_deduction - pph21;

    // Validate journal
    assert!(PayrollJournalValidator::validate_payroll_journal(
        basic_salary,
        overtime_pay,
        bpjs.total_company_cost,
        pph21,
        bpjs.total_employee_deduction,
        net_pay,
    )
    .is_ok());
}
