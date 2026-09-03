//! HR Tax & BPJS Deterministic Math Integration Tests (QHR-001 / PP 58/2023)

use management_system_hr::services::hr_tax_bpjs_engine::HrTaxBpjsEngine;
use rust_decimal::Decimal;

#[test]
fn test_ptkp_to_ter_category_mapping() {
    assert_eq!(HrTaxBpjsEngine::get_ter_category("TK/0"), "A");
    assert_eq!(HrTaxBpjsEngine::get_ter_category("TK/1"), "A");
    assert_eq!(HrTaxBpjsEngine::get_ter_category("K/0"), "A");

    assert_eq!(HrTaxBpjsEngine::get_ter_category("TK/2"), "B");
    assert_eq!(HrTaxBpjsEngine::get_ter_category("TK/3"), "B");
    assert_eq!(HrTaxBpjsEngine::get_ter_category("K/1"), "B");
    assert_eq!(HrTaxBpjsEngine::get_ter_category("K/2"), "B");

    assert_eq!(HrTaxBpjsEngine::get_ter_category("K/3"), "C");
}

#[test]
fn test_pph21_ter_a_zero_bracket() {
    // Under Rp 5.400.000 gross income is exempt (0% TER)
    let gross = Decimal::from(5_000_000);
    let result = HrTaxBpjsEngine::calculate_pph21_ter(gross, "TK/0");

    assert_eq!(result.category, "A");
    assert_eq!(result.rate, Decimal::ZERO);
    assert_eq!(result.tax_amount, Decimal::ZERO);
}

#[test]
fn test_pph21_ter_a_standard_brackets() {
    // Gross Rp 10.000.000 in Category A -> 2.0% rate -> Rp 200.000
    let gross = Decimal::from(10_000_000);
    let result = HrTaxBpjsEngine::calculate_pph21_ter(gross, "TK/0");

    assert_eq!(result.category, "A");
    assert_eq!(result.rate, Decimal::new(20, 3)); // 0.02
    assert_eq!(result.tax_amount, Decimal::from(200_000));
}

#[test]
fn test_pph21_ter_b_standard_brackets() {
    // Gross Rp 15.000.000 in Category B (K/1) -> 6% rate -> Rp 900.000
    let gross = Decimal::from(15_000_000);
    let result = HrTaxBpjsEngine::calculate_pph21_ter(gross, "K/1");

    assert_eq!(result.category, "B");
    assert_eq!(result.rate, Decimal::new(6, 2)); // 0.06
    assert_eq!(result.tax_amount, Decimal::from(900_000));
}

#[test]
fn test_bpjs_kesehatan_and_jp_capping() {
    // Base salary of Rp 20.000.000 (exceeds both BPJS Kes cap of 12M and JP cap of 10.547.400)
    let base = Decimal::from(20_000_000);
    let bpjs = HrTaxBpjsEngine::calculate_bpjs(base);

    // BPJS Kesehatan: 1% of 12M = 120.000 (employee), 4% of 12M = 480.000 (company)
    assert_eq!(bpjs.kes_emp, Decimal::from(120_000));
    assert_eq!(bpjs.kes_comp, Decimal::from(480_000));

    // JHT: 2% of 20M = 400.000 (employee), 3.7% of 20M = 740.000 (company)
    assert_eq!(bpjs.jht_emp, Decimal::from(400_000));
    assert_eq!(bpjs.jht_comp, Decimal::from(740_000));

    // JP: 1% of 10.547.400 = 105.474 (employee), 2% of 10.547.400 = 210.948 (company)
    assert_eq!(bpjs.jp_emp, Decimal::from(105_474));
    assert_eq!(bpjs.jp_comp, Decimal::from(210_948));

    // Total employee deduction = 120.000 + 400.000 + 105.474 = 625.474
    assert_eq!(bpjs.total_emp_deduction, Decimal::from(625_474));
}
