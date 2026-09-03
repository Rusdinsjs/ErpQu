//! Indonesian e-Faktur Pajak (DJP Online) Specification & CSV Generator
//!
//! Compliant with DJP e-Faktur 3.0 / 4.0 Import Schema for Faktur Pajak Keluaran (FK & OF lines).

use chrono::{DateTime, NaiveDate, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaxInvoiceRecord {
    pub id: Uuid,
    pub company_id: Uuid,
    pub sales_invoice_id: Option<Uuid>,
    pub tax_invoice_number: String,
    pub npwp_buyer: String,
    pub name_buyer: String,
    pub tax_base: Decimal,
    pub vat_amount: Decimal,
    pub vat_rate: Decimal,
    pub effective_date: NaiveDate,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaxInvoiceItem {
    pub item_code: String,
    pub item_name: String,
    pub unit_price: Decimal,
    pub quantity: Decimal,
    pub total_price: Decimal,
    pub discount: Decimal,
    pub dpp: Decimal,
    pub ppn: Decimal,
    pub ppnbm_rate: Decimal,
    pub ppnbm_amount: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaxInvoiceHeader {
    pub id: Uuid,
    pub company_id: Uuid,
    pub sales_invoice_id: Option<Uuid>,
    pub tax_invoice_number: String, // NSFP: e.g. 010.000-26.00000001
    pub transaction_type_code: String, // 01, 02, etc.
    pub is_replacement: bool,       // false = 0, true = 1
    pub tax_period_month: u32,
    pub tax_period_year: i32,
    pub invoice_date: NaiveDate,
    pub buyer_npwp: String,
    pub buyer_name: String,
    pub buyer_address: String,
    pub total_dpp: Decimal,
    pub total_ppn: Decimal,
    pub reference_number: String,
    pub items: Vec<TaxInvoiceItem>,
}

impl TaxInvoiceHeader {
    /// Cleans and formats NPWP to standard 15 or 16 digits string without punctuation
    pub fn sanitize_npwp(npwp: &str) -> String {
        npwp.chars().filter(|c| c.is_ascii_digit()).collect()
    }

    /// Cleans NSFP to numeric string for DJP import
    pub fn sanitize_nsfp(nsfp: &str) -> String {
        nsfp.chars().filter(|c| c.is_ascii_digit()).collect()
    }

    /// Validates whether NPWP is valid (15 or 16 digits)
    pub fn is_valid_npwp(npwp: &str) -> bool {
        let digits = Self::sanitize_npwp(npwp);
        digits.len() == 15 || digits.len() == 16 || digits == "000000000000000"
    }

    /// Generates the FK (Faktur Keluaran) CSV line
    pub fn to_fk_line(&self) -> String {
        let clean_nsfp = Self::sanitize_nsfp(&self.tax_invoice_number);
        let clean_npwp = Self::sanitize_npwp(&self.buyer_npwp);
        let replacement_flag = if self.is_replacement { "1" } else { "0" };
        let formatted_date = self.invoice_date.format("%d/%m/%Y").to_string();

        let dpp_rounded = self.total_dpp.round_dp(0);
        let ppn_rounded = self.total_ppn.round_dp(0);

        format!(
            "FK,{},{},{},{:02},{},{},{},\"{}\",\"{}\",{},{},0,,0,0,0,0,\"{}\",",
            self.transaction_type_code,
            replacement_flag,
            clean_nsfp,
            self.tax_period_month,
            self.tax_period_year,
            formatted_date,
            clean_npwp,
            self.buyer_name.replace('\"', "\"\""),
            self.buyer_address.replace('\"', "\"\""),
            dpp_rounded,
            ppn_rounded,
            self.reference_number.replace('\"', "\"\"")
        )
    }

    /// Generates the OF (Objek Faktur) CSV lines for all items
    pub fn to_of_lines(&self) -> Vec<String> {
        self.items
            .iter()
            .map(|item| {
                format!(
                    "OF,\"{}\",\"{}\",{},{},{},{},{},{},{},{}",
                    item.item_code.replace('\"', "\"\""),
                    item.item_name.replace('\"', "\"\""),
                    item.unit_price.round_dp(2),
                    item.quantity.round_dp(4),
                    item.total_price.round_dp(2),
                    item.discount.round_dp(2),
                    item.dpp.round_dp(0),
                    item.ppn.round_dp(0),
                    item.ppnbm_rate.round_dp(2),
                    item.ppnbm_amount.round_dp(0)
                )
            })
            .collect()
    }
}

pub struct EFakturCsvBatch {
    pub invoices: Vec<TaxInvoiceHeader>,
}

impl EFakturCsvBatch {
    pub fn new(invoices: Vec<TaxInvoiceHeader>) -> Self {
        Self { invoices }
    }

    /// Generates the complete official DJP e-Faktur CSV text
    pub fn generate_djp_csv(&self) -> String {
        let mut lines = Vec::new();

        // 1. DJP Standard Header Rows
        lines.push("FK,KD_JENIS_TRANSAKSI,FG_PENGGANTI,NOMOR_FAKTUR,MASA_PAJAK,TAHUN_PAJAK,TANGGAL_FAKTUR,NPWP,NAMA,ALAMAT_LENGKAP,JUMLAH_DPP,JUMLAH_PPN,JUMLAH_PPNBM,ID_KETERANGAN_TAMBAHAN,FG_UANG_MUKA,UANG_MUKA_DPP,UANG_MUKA_PPN,UANG_MUKA_PPNBM,REFERENSI,KODE_DOKUMEN_PENDUKUNG".to_string());
        lines.push("LT,NPWP,NAMA,JALAN,BLOK,NOMOR,RT,RW,KECAMATAN,KELURAHAN,KABUPATEN,PROPINSI,KODE_POS,NOMOR_TELEPON".to_string());
        lines.push("OF,KODE_OBJEK,NAMA,HARGA_SATUAN,JUMLAH_BARANG,HARGA_TOTAL,DISKON,DPP,PPN,TARIF_PPNBM,PPNBM".to_string());

        // 2. Body: For each Tax Invoice, write FK line then its OF lines
        for inv in &self.invoices {
            lines.push(inv.to_fk_line());
            for of_line in inv.to_of_lines() {
                lines.push(of_line);
            }
        }

        lines.join("\r\n") + "\r\n"
    }
}
