

A. Finance dan accounting kernel
BLOCKER: Jadikan AccountingPostingEngine mandatory.
Hapus seluruh jalur posting tanpa GL.
Hapus penggunaan Uuid::nil() sebagai company.
Ambil company dari trusted request context dan dokumen sumber.
Terapkan mata uang company dan exchange rate yang benar.
Validasi accounting period sebelum posting.
Tambahkan fiscal period open, closed, dan permanently closed.
Pastikan debit sama dengan kredit di application dan database layer.
Pastikan akun aktif, postable, dan sesuai company.
Pastikan source document dan GL tersimpan dalam satu Unit of Work.
Posted journal tidak boleh dikembalikan menjadi Draft.
Hapus metode unpost untuk jurnal yang sudah Posted.
Gunakan reversal voucher.
Reversal harus merujuk original voucher.
Jangan mengabaikan kegagalan reversal.
Tambahkan route submit, approve, post, reverse, dan cancel.
Terapkan SoD pada posting.
Tambahkan idempotency key.
Cegah duplicate posting.
Terapkan append-only terhadap GL.
Audit seluruh lifecycle jurnal.
Buat Trial Balance, Balance Sheet, dan Income Statement dari GL yang sama.
Rekonsiliasi subledger AR, AP, inventory, asset, payroll dan GL.
Kriteria lulus: Tidak ada source document Posted tanpa GL, tidak ada jurnal tidak seimbang, dan reversal selalu dapat ditelusuri.

B. AR, AP, payment dan bank
Simpan payment allocation ke database.
Perbarui outstanding invoice secara atomic.
Tolak over-allocation.
Dukung partial payment, advance, refund, credit note, dan write-off.
Implementasikan AR/AP aging berdasarkan as-of date.
Terapkan customer credit limit.
Terapkan vendor invoice approval.
Hubungkan payment dengan cash/bank GL.
Perbaiki cash-bank transaction agar memakai Unit of Work yang sama.
Implementasikan bank statement import.
Implementasikan bank reconciliation.
Simpan reconciliation history.
Cegah duplicate bank transaction.
Terapkan payment release maker-checker.
Jangan mengubah status langsung menjadi Paid tanpa approval dan posting.
Kriteria lulus: Total subledger AR/AP sama dengan control account GL dan saldo bank dapat direkonsiliasi.

C. P2P, O2C dan inventory
Implementasikan alur P2P lengkap: Purchase Request -> RFQ -> PO -> Goods Receipt -> Purchase Bill -> Payment
Implementasikan three-way matching.
Konfigurasikan tolerance berdasarkan company, vendor, dan item.
Tolak invoice yang melebihi receipt atau tolerance tanpa approval khusus.
Implementasikan GR/IR clearing.
Implementasikan O2C lengkap: Quotation -> Sales Order -> Delivery -> Invoice -> Receipt
Cegah invoice melebihi quantity delivered.
Cegah delivery melebihi quantity ordered.
Integrasikan valuation engine ke stock posting.
Implementasikan FIFO layer yang sebenarnya.
Implementasikan moving average secara transactional.
Tangani backdated stock transaction dan revaluation.
Terapkan serial dan batch uniqueness di database.
Terapkan negative-stock rule dengan row locking.
Gunakan SELECT FOR UPDATE atau strategi concurrency yang setara.
Rekonsiliasi stock ledger, bin balance, dan inventory GL.
Implementasikan landed cost voucher.
Tambahkan stock closing dan stock reconciliation.
Kriteria lulus: Tidak ada lost update pada 100 transaksi paralel dan nilai inventory sama dengan GL.

Dari point A, B dan C di atas :

1. Riset dan Teliti apakah aplikasi Erpqu saat ini sudah memenuhi item2 di point A, B dan C di atas? 
2. List yang sudah dan belum memenuhi kriteria.
3. Jika belum Memenuhi, buatkan Implementation Plan-nya  
4. Jangan mengarang, mengada-ada atau berhalusinasi. Riset dan teliti dengan Jujur dan Tepat, laporkan sesuai kondisi yang sebenarnya.
5. Buatkan juga Tasks

