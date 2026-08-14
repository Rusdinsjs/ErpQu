//! Integration & Unit tests for Finance Journal Entries & Double Entry Accounting

#[cfg(test)]
mod tests {
    use rust_decimal::Decimal;
    use rust_decimal_macros::dec;

    struct JournalLine {
        debit: Decimal,
        credit: Decimal,
    }

    fn validate_journal_entry_balance(lines: &[JournalLine]) -> bool {
        let total_debit: Decimal = lines.iter().map(|l| l.debit).sum();
        let total_credit: Decimal = lines.iter().map(|l| l.credit).sum();

        total_debit == total_credit && total_debit > dec!(0)
    }

    #[test]
    fn test_balanced_journal_entry() {
        let lines = vec![
            JournalLine { debit: dec!(5000000), credit: dec!(0) }, // Kas (Debit)
            JournalLine { debit: dec!(0), credit: dec!(5000000) }, // Pendapatan (Credit)
        ];

        assert!(validate_journal_entry_balance(&lines));
    }

    #[test]
    fn test_unbalanced_journal_entry_fails() {
        let lines = vec![
            JournalLine { debit: dec!(5000000), credit: dec!(0) },
            JournalLine { debit: dec!(0), credit: dec!(4500000) }, // Discrepancy 500k
        ];

        assert!(!validate_journal_entry_balance(&lines));
    }
}
