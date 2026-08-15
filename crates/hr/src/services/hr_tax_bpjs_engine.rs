use rust_decimal::prelude::*;
use rust_decimal::Decimal;

#[derive(Debug, Clone)]
pub struct BpjsResult {
    pub kes_emp: Decimal,  // 1% (Cap Rp 12.000.000)
    pub kes_comp: Decimal, // 4% (Cap Rp 12.000.000)
    pub jht_emp: Decimal,  // 2%
    pub jht_comp: Decimal, // 3.7%
    pub jp_emp: Decimal,   // 1% (Cap Rp 10.547.400)
    pub jp_comp: Decimal,  // 2% (Cap Rp 10.547.400)
    pub jkk_comp: Decimal, // 0.24% (Standar)
    pub jkm_comp: Decimal, // 0.30%
    pub total_emp_deduction: Decimal,
    pub total_comp_contribution: Decimal,
}

#[derive(Debug, Clone)]
pub struct Pph21TerResult {
    pub category: String, // 'A', 'B', 'C'
    pub rate: Decimal,    // e.g. 0.05 (5%)
    pub tax_amount: Decimal,
}

pub struct HrTaxBpjsEngine;

impl HrTaxBpjsEngine {
    /// Calculate BPJS Kesehatan & Ketenagakerjaan
    pub fn calculate_bpjs(base_salary: Decimal) -> BpjsResult {
        // Cap BPJS Kesehatan: Rp 12,000,000
        let cap_kes = Decimal::from(12_000_000);
        let salary_kes = if base_salary > cap_kes {
            cap_kes
        } else {
            base_salary
        };

        // Cap BPJS JP (Jaminan Pensiun 2026): Rp 10,547,400
        let cap_jp = Decimal::from(10_547_400);
        let salary_jp = if base_salary > cap_jp {
            cap_jp
        } else {
            base_salary
        };

        let kes_emp = (salary_kes * Decimal::new(1, 2)).round_dp(0); // 1%
        let kes_comp = (salary_kes * Decimal::new(4, 2)).round_dp(0); // 4%

        let jht_emp = (base_salary * Decimal::new(2, 2)).round_dp(0); // 2%
        let jht_comp = (base_salary * Decimal::new(37, 3)).round_dp(0); // 3.7%

        let jp_emp = (salary_jp * Decimal::new(1, 2)).round_dp(0); // 1%
        let jp_comp = (salary_jp * Decimal::new(2, 2)).round_dp(0); // 2%

        let jkk_comp = (base_salary * Decimal::new(24, 4)).round_dp(0); // 0.24%
        let jkm_comp = (base_salary * Decimal::new(30, 4)).round_dp(0); // 0.30%

        let total_emp = kes_emp + jht_emp + jp_emp;
        let total_comp = kes_comp + jht_comp + jp_comp + jkk_comp + jkm_comp;

        BpjsResult {
            kes_emp,
            kes_comp,
            jht_emp,
            jht_comp,
            jp_emp,
            jp_comp,
            jkk_comp,
            jkm_comp,
            total_emp_deduction: total_emp,
            total_comp_contribution: total_comp,
        }
    }

    /// Determine TER Category based on PTKP Status (PP 58/2023)
    pub fn get_ter_category(ptkp_status: &str) -> &'static str {
        match ptkp_status.to_uppercase().as_str() {
            "TK/0" | "TK/1" | "K/0" => "A",
            "TK/2" | "TK/3" | "K/1" | "K/2" => "B",
            "K/3" => "C",
            _ => "A",
        }
    }

    /// Calculate PPh 21 TER Monthly (PP No. 58/2023)
    pub fn calculate_pph21_ter(gross_pay: Decimal, ptkp_status: &str) -> Pph21TerResult {
        let cat = Self::get_ter_category(ptkp_status);
        let gross_f = gross_pay.to_f64().unwrap_or(0.0);

        let rate_f = match cat {
            "A" => {
                if gross_f <= 5_400_000.0 {
                    0.0
                } else if gross_f <= 5_650_000.0 {
                    0.0025
                } else if gross_f <= 5_950_000.0 {
                    0.005
                } else if gross_f <= 6_300_000.0 {
                    0.0075
                } else if gross_f <= 6_750_000.0 {
                    0.01
                } else if gross_f <= 7_500_000.0 {
                    0.0125
                } else if gross_f <= 8_550_000.0 {
                    0.015
                } else if gross_f <= 9_650_000.0 {
                    0.0175
                } else if gross_f <= 10_050_000.0 {
                    0.02
                } else if gross_f <= 10_350_000.0 {
                    0.0225
                } else if gross_f <= 10_700_000.0 {
                    0.025
                } else if gross_f <= 11_050_000.0 {
                    0.03
                } else if gross_f <= 11_600_000.0 {
                    0.035
                } else if gross_f <= 12_500_000.0 {
                    0.04
                } else if gross_f <= 13_750_000.0 {
                    0.05
                } else if gross_f <= 15_100_000.0 {
                    0.06
                } else if gross_f <= 16_950_000.0 {
                    0.07
                } else if gross_f <= 19_750_000.0 {
                    0.08
                } else if gross_f <= 24_150_000.0 {
                    0.09
                } else if gross_f <= 26_450_000.0 {
                    0.10
                } else if gross_f <= 28_000_000.0 {
                    0.11
                } else if gross_f <= 30_050_000.0 {
                    0.12
                } else {
                    0.15
                }
            }
            "B" => {
                if gross_f <= 6_200_000.0 {
                    0.0
                } else if gross_f <= 6_500_000.0 {
                    0.0025
                } else if gross_f <= 6_850_000.0 {
                    0.005
                } else if gross_f <= 7_300_000.0 {
                    0.0075
                } else if gross_f <= 9_200_000.0 {
                    0.01
                } else if gross_f <= 10_750_000.0 {
                    0.015
                } else if gross_f <= 11_250_000.0 {
                    0.02
                } else if gross_f <= 11_600_000.0 {
                    0.025
                } else if gross_f <= 12_600_000.0 {
                    0.03
                } else if gross_f <= 13_600_000.0 {
                    0.04
                } else if gross_f <= 14_950_000.0 {
                    0.05
                } else if gross_f <= 16_400_000.0 {
                    0.06
                } else if gross_f <= 18_450_000.0 {
                    0.07
                } else if gross_f <= 21_850_000.0 {
                    0.08
                } else if gross_f <= 26_000_000.0 {
                    0.09
                } else {
                    0.12
                }
            }
            _ => {
                // C
                if gross_f <= 6_600_000.0 {
                    0.0
                } else if gross_f <= 6_950_000.0 {
                    0.0025
                } else if gross_f <= 7_350_000.0 {
                    0.005
                } else if gross_f <= 7_800_000.0 {
                    0.0075
                } else if gross_f <= 8_850_000.0 {
                    0.01
                } else if gross_f <= 9_800_000.0 {
                    0.0125
                } else if gross_f <= 10_950_000.0 {
                    0.015
                } else if gross_f <= 11_200_000.0 {
                    0.0175
                } else if gross_f <= 12_050_000.0 {
                    0.02
                } else if gross_f <= 12_950_000.0 {
                    0.03
                } else if gross_f <= 14_150_000.0 {
                    0.04
                } else if gross_f <= 15_550_000.0 {
                    0.05
                } else if gross_f <= 17_050_000.0 {
                    0.06
                } else {
                    0.10
                }
            }
        };

        let rate = Decimal::from_f64_retain(rate_f).unwrap_or(Decimal::ZERO);
        let tax_amount = (gross_pay * rate).round_dp(0);

        Pph21TerResult {
            category: cat.to_string(),
            rate,
            tax_amount,
        }
    }
}
