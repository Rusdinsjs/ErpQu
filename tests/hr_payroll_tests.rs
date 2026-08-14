//! Integration & Unit tests for HR Payroll Service & Calculations

#[cfg(test)]
mod tests {
    use rust_decimal::Decimal;
    use rust_decimal_macros::dec;

    /// Calculate Net Salary based on Basic Salary, Allowances, Deductions, and BPJS
    fn calculate_net_salary(
        basic_salary: Decimal,
        allowances: Decimal,
        deductions: Decimal,
        bpjs_kesehatan_pct: Decimal,
        bpjs_tk_pct: Decimal,
    ) -> Decimal {
        let bpjs_kesehatan = basic_salary * (bpjs_kesehatan_pct / dec!(100));
        let bpjs_tk = basic_salary * (bpjs_tk_pct / dec!(100));
        let total_bpjs = bpjs_kesehatan + bpjs_tk;
        
        let gross_salary = basic_salary + allowances;
        let total_deductions = deductions + total_bpjs;

        gross_salary - total_deductions
    }

    #[test]
    fn test_payroll_net_salary_calculation() {
        let basic = dec!(10000000); // 10,000,000 IDR
        let allowance = dec!(2000000); // 2,000,000 IDR
        let deduction = dec!(500000); // 500,000 IDR
        let bpjs_kes_pct = dec!(1); // 1% employee portion
        let bpjs_tk_pct = dec!(2); // 2% JHT employee portion

        let net_salary = calculate_net_salary(basic, allowance, deduction, bpjs_kes_pct, bpjs_tk_pct);

        // Expected:
        // Gross = 10,000,000 + 2,000,000 = 12,000,000
        // BPJS Kes = 100,000
        // BPJS TK = 200,000
        // Total Deductions = 500,000 + 300,000 = 800,000
        // Net = 12,000,000 - 800,000 = 11,200,000
        assert_eq!(net_salary, dec!(11200000));
    }

    #[test]
    fn test_pph21_ter_bracket_estimation() {
        let gross_monthly = dec!(15000000);
        // Category A TER for 15M is ~6%
        let ter_rate = dec!(6);
        let pph21_monthly = gross_monthly * (ter_rate / dec!(100));

        assert_eq!(pph21_monthly, dec!(900000));
    }
}
