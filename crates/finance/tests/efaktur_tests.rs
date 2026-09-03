use chrono::NaiveDate;
use management_system_finance::domain::entities::efaktur::{
    EFakturCsvBatch, TaxInvoiceHeader, TaxInvoiceItem,
};
use rust_decimal_macros::dec;
use uuid::Uuid;

#[test]
fn test_npwp_and_nsfp_sanitization_and_validation() {
    let dirty_npwp = "01.234.567.8-012.000";
    let clean_npwp = TaxInvoiceHeader::sanitize_npwp(dirty_npwp);
    assert_eq!(clean_npwp, "012345678012000");
    assert!(TaxInvoiceHeader::is_valid_npwp(dirty_npwp));

    let dirty_nsfp = "010.000-26.00000001";
    let clean_nsfp = TaxInvoiceHeader::sanitize_nsfp(dirty_nsfp);
    assert_eq!(clean_nsfp, "0100002600000001");
}

#[test]
fn test_djp_csv_generation_fk_and_of() {
    let inv = TaxInvoiceHeader {
        id: Uuid::new_v4(),
        company_id: Uuid::new_v4(),
        sales_invoice_id: None,
        tax_invoice_number: "010.000-26.00000001".to_string(),
        transaction_type_code: "01".to_string(),
        is_replacement: false,
        tax_period_month: 9,
        tax_period_year: 2026,
        invoice_date: NaiveDate::from_ymd_opt(2026, 9, 3).unwrap(),
        buyer_npwp: "01.234.567.8-012.000".to_string(),
        buyer_name: "PT Adhi Karya (Persero) Tbk".to_string(),
        buyer_address: "Jl. MT Haryono Kav. 18, Jakarta".to_string(),
        total_dpp: dec!(100000000.00),
        total_ppn: dec!(11000000.00),
        reference_number: "INV/2026/09/001".to_string(),
        items: vec![
            TaxInvoiceItem {
                item_code: "SEWA-EXC".to_string(),
                item_name: "Sewa Excavator PC200".to_string(),
                unit_price: dec!(100000000.00),
                quantity: dec!(1.0),
                total_price: dec!(100000000.00),
                discount: dec!(0.0),
                dpp: dec!(100000000.00),
                ppn: dec!(11000000.00),
                ppnbm_rate: dec!(0.0),
                ppnbm_amount: dec!(0.0),
            }
        ],
    };

    let fk = inv.to_fk_line();
    assert!(fk.starts_with("FK,01,0,0100002600000001,09,2026,03/09/2026,012345678012000"));
    assert!(fk.contains("100000000,11000000,0"));

    let of_lines = inv.to_of_lines();
    assert_eq!(of_lines.len(), 1);
    assert!(of_lines[0].starts_with("OF,\"SEWA-EXC\",\"Sewa Excavator PC200\""));

    let batch = EFakturCsvBatch::new(vec![inv]);
    let csv = batch.generate_djp_csv();
    assert!(csv.contains("FK,KD_JENIS_TRANSAKSI"));
    assert!(csv.contains("LT,NPWP,NAMA"));
    assert!(csv.contains("OF,KODE_OBJEK,NAMA"));
}
