1. Buat agar Menu2 di Launchpad Field Operations digabung dengan Asset Management, dan hilangkan Field Operations.
2. Saat Diklik Field Management, Sales, Buying, Inventory dan Finence...Yang muncul pertama kali workspace dari masing2 menu
3. Buat semua Menu di Sidebar sesuai dengan Menu yang ada di Workspace nya masing2 launchpad ... buat agar ber group sesuai card  nya yang ada di workspace
4. Buat agar nama menu di sidebar sma dengan di workspace

Saya mau meminta pendapatmu dan rekomendasimu mengenai : Asset Workspace, Buying Workspace, Selling Workspace, Stock Workspace dan Accounting Workspace > saya akan menjadikan home dari masing2 modul ...bukan menjadi menu dari modul dimaksud. Berikan argumentmu jika ada rekomendasimu 

### Belum Di-develop (Menggunakan Halaman Generik "Segera Hadir")

Sisa sekitar 26 fitur lainnya saat ini diarahkan ke halaman generik (`StockGenericView.tsx`) yang menandakan fiturnya belum dibuat (baik UI maupun Backend). Beberapa di antaranya adalah:

- Delivery Notes & Delivery Trip
- Pick Lists
- Landed Cost Vouchers
- Item Alternatives & Product Bundles
- Item Manufacturers & Brands
- Serial Numbers & Batches
- UOMs (Unit of Measurements) & Conversions
- Seluruh Laporan (Stock Ledger, Stock Balance, Stock Ageing, Stock Projected Qty, dll)
- Quality Inspection

-  1. Backend: Domain DTO
    -  Add `StockDashboardKpi` to `warehouse.rs`
-  2. Backend: Repository
    -  Add `get_dashboard_kpis` to `WarehouseRepository`
-  3. Backend: Service
    -  Add `get_kpis` to `WarehouseService`
-  4. Backend: API Handlers
    -  Add `get_stock_dashboard_kpi` to `warehouse_handler.rs`
    -  Register route in `inventory_routes.rs`
-  5. Frontend: React UI & API Client
    -  Add `getStockDashboardKpi` to `inventory.ts`
    -  Refactor `StockWorkspace.tsx` to use the query




Saya telah merangkum ke-26 modul sisa (termasuk _Delivery Notes_, _Serial Numbers_, _Quality Inspection_, _Landed Cost Vouchers_, hingga semua _Laporan_) ke dalam sebuah Peta Rencana Implementasi (_Implementation Plan_) yang terstruktur ke dalam 4 Fase. Anda dapat membaca dokumen lengkapnya di panel sebelah kanan.

Singkatnya, fasenya diurutkan secara hierarkis:

- **Fase 1**: Manajemen Master Data & Keterlacakan (_UOM, Batches, Serial No, Brands_)
- **Fase 2**: Logistik Distribusi & Pemenuhan (_Delivery Notes, Pick Lists, Delivery Trips, Opname_)
- **Fase 3**: Logistik Pembelian Lanjutan (_Landed Cost Vouchers, Quality Inspection_)
- **Fase 4**: Pelaporan & Analitik (_Seluruh Report: Stock Ledger, Balance, Ageing_)

Karena cakupan 26 fitur ini sangat masif, pengerjaannya secara teknis tidak mungkin digabung dalam satu kali pengerjaan sistem sekaligus. Kita harus memecahnya.

Apakah Anda setuju dengan urutan fase-fase di atas? Jika Anda setuju, kita bisa memulai mengeksekusi **Fase 1** terlebih dahulu!