# Implementasi Indonesian Payroll, Tax Localization, and Compliance (Fase 12)

## 1. Ringkasan Implementasi
Pada Fase 12, integrasi kepatuhan ketenagakerjaan dan perpajakan Republik Indonesia mencakup perhitungan PPh 21 TER (PP 58/2023 & PMK 168/2023), iuran BPJS Ketenagakerjaan (JHT, JKK, JKM, JP) & BPJS Kesehatan, perhitungan upah kerja lembur (Kepmenakertrans No. 102/2004), pemotongan PPh 23 (2% dengan NPWP vs 4% tanpa NPWP), evolusi tarif PPN e-Faktur (11% vs 12%), serta validasi keseimbangan jurnal penggajian telah diimplementasikan secara teruji.

---

## 2. Rincian Komponen yang Diterapkan

### A. Modul Domain Indonesian Localization
- **File**: `crates/finance/src/domain/indonesia_localization.rs`
- **Fitur & Validator**:
  1. `Pph21TerCalculator`:
     - Perhitungan bulanan PPh 21 TER Kategori A (TK/0, TK/1, K/0), Kategori B (TK/2, TK/3, K/1, K/2), dan Kategori C (K/3).
  2. `BpjsCalculator`:
     - Kontribusi Perusahaan: JHT 3.7%, JKK 0.24%, JKM 0.30%, JP 2.0% (plafon upah), BPJS Kesehatan 4.0% (plafon upah).
     - Potongan Karyawan: JHT 2.0%, JP 1.0% (plafon upah), BPJS Kesehatan 1.0% (plafon upah).
  3. `IndonesianOvertimeCalculator`:
     - Formula Kepmenakertrans 102/2004: Upah sejam $= \frac{1}{173} \times \text{Gaji Pokok Sebulan}$.
     - Jam ke-1: $1.5 \times \text{upah sejam}$, Jam ke-2 dst: $2.0 \times \text{upah sejam}$.
  4. `Pph23Calculator`:
     - Pemotongan 2.0% jika vendor memiliki NPWP valid, dan 4.0% jika tanpa NPWP (sanksi kenaikan 100%).
  5. `VatRateVersion`:
     - Penjadwalan regulasi PPN otomatis (11% untuk transaksi 1 April 2022 - 31 Des 2024, 12% mulai 1 Januari 2025).
  6. `PayrollJournalValidator`:
     - Validasi matematis bahwa Total Beban Payroll (Debit) persis sama dengan Total Kewajiban & Kas Keluar (Credit).

### B. Forward-Only Migration Indeks Payroll & Perpajakan Indonesia
- **File**: `migrations/20260818000006_phase12_indonesia_payroll_and_tax_indexes.sql`
- **Indeks Database**:
  - `idx_tax_invoices_comp_num ON tax_invoices(company_id, tax_invoice_number)`
  - `idx_payroll_entries_period ON payroll_entries(company_id, posting_date, status)`
  - `idx_withholding_cert_type ON withholding_certificates(company_id, pph_type, posting_date)`

---

## 3. Test Suite Invariant (Fase 12)
- File: `crates/finance/tests/indonesia_payroll_tax_compliance_tests.rs` (7/7 tests LULUS):
  1. `test_pph21_ter_category_a_calculation`: **PASS**
  2. `test_pph21_ter_category_b_and_c_calculation`: **PASS**
  3. `test_bpjs_contributions_precision`: **PASS**
  4. `test_indonesian_overtime_calculation_kepmenaker_102`: **PASS**
  5. `test_pph23_withholding_npwp_difference`: **PASS**
  6. `test_vat_rate_schedule_evolution`: **PASS**
  7. `test_balanced_payroll_journal_generation`: **PASS**
