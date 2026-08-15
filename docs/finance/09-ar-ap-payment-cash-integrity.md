# Implementasi AR, AP, Payment Allocation, dan Cash/Bank Integrity (Fase 9)

## 1. Ringkasan Implementasi
Pada Fase 9, kernel akuntansi sub-ledger Piutang (AR), Utang (AP), Alokasi Pembayaran Multi-Faktur FIFO, rekonsiliasi tiga arah (*Three-Way Matching*), klasifikasi umur piutang/utang (*Aging Buckets*), serta konservasi saldo transfer antar-bank telah diimplementasikan secara teruji.

---

## 2. Rincian Komponen yang Diterapkan

### A. Modul Domain Settlement
- **File**: `crates/finance/src/domain/settlement.rs`
- **Fitur & Validator**:
  1. `AgingCalculator`:
     - Mengklasifikasikan faktur ke dalam 5 tingkatan umur piutang/utang: `Current`, `Days1To30`, `Days31To60`, `Days61To90`, dan `Over90`.
  2. `ThreeWayMatchValidator`:
     - Mencocokkan Purchase Order (PO) vs Goods Receipt (GR) vs Faktur Pembelian (Invoice).
     - Menolak kelebihan kuantitas melebihi batas toleransi (`three_way_match_quantity_variance_exceeded`).
     - Menolak kelebihan harga satuan melebihi batas toleransi (`three_way_match_price_variance_exceeded`).
  3. `PaymentAllocationEngine`:
     - Alokasi pembayaran multi-faktur berbasis **FIFO Order**.
     - Penanganan kelebihan bayar otomatis sebagai **Uang Muka / Unallocated Advance**.
     - Pelarangan mutlak alokasi melebihi sisa saldo terutang (*Over-Allocation Prohibition*).
  4. `BankTransferValidator`:
     - Konservasi saldo mutasi antar-bank: $	ext{Debit (Pengeluaran)} = 	ext{Kredit (Penerimaan)} + 	ext{Biaya Admin}$.

### B. Forward-Only Migration Indeks Kinerja AR/AP & Rekonsiliasi Bank
- **File**: `migrations/20260818000003_phase9_payment_allocation_and_aging_indexes.sql`
- **Indeks Database**:
  - `idx_sales_invoices_aging ON sales_invoices(company_id, customer_id, due_date, status)`
  - `idx_purchase_invoices_aging ON purchase_invoices(company_id, vendor_id, due_date, status)`
  - `idx_payment_allocations_ref ON payment_allocations(payment_entry_id, invoice_id)`
  - `idx_bank_trans_reconciliation ON bank_transactions(company_id, bank_account_id, transaction_date, is_reconciled)`

---

## 3. Test Suite Invariant (Fase 9)
- File: `crates/finance/tests/ar_ap_payment_cash_integrity_tests.rs` (9/9 tests LULUS):
  1. `test_over_allocation_strictly_rejected`: **PASS**
  2. `test_exact_and_partial_allocation_permitted`: **PASS**
  3. `test_three_way_matching_quantity_variance_rejection`: **PASS**
  4. `test_three_way_matching_price_variance_rejection`: **PASS**
  5. `test_three_way_matching_within_tolerance_permitted`: **PASS**
  6. `test_aging_bucket_classification_tiers`: **PASS**
  7. `test_fifo_multi_invoice_allocation_and_advance`: **PASS**
  8. `test_fifo_overpayment_creates_unallocated_advance`: **PASS**
  9. `test_bank_transfer_balance_conservation`: **PASS**
