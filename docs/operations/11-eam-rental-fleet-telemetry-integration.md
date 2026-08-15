# Implementasi EAM, Heavy Equipment Rental, Fleet, dan Telemetry Integration (Fase 11)

## 1. Ringkasan Implementasi
Pada Fase 11, integrasi siklus hidup Enterprise Asset Management (EAM), kalkulasi penagihan sewa alat berat (*Heavy Equipment Rental Billing*), deteksi anomali konsumsi bahan bakar armada (*Specific Fuel Consumption Anomaly*), validasi masa berlaku izin operator (*Operator License Expiry Enforcement*), dan pendeteksian pelanggaran batas wilayah (*Geofence Breach Detection*) telah diimplementasikan secara teruji.

---

## 2. Rincian Komponen yang Diterapkan

### A. Modul Domain EAM, Rental, dan Telemetry
1. **Asset & EAM Engine (`crates/assets/src/domain/asset_eam.rs`)**:
   - `AssetEamEngine::generate_straight_line_schedule`: Pembuatan tabel jadwal penyusutan garis lurus presisi 2 desimal dengan penyesuaian selisih pembulatan pada bulan terakhir sehingga total penyusutan tepat sama dengan nilai yang dapat disusutkan ($Cost - Residual$).
   - `AssetEamEngine::calculate_disposal_gain_loss`: Kalkulasi laba/rugi pelepasan atau penjualan aset tetap ($	ext{Hasil Penjualan} - 	ext{Nilai Buku Sisa}$).
2. **Rental Timesheet Engine (`crates/rental/src/domain/rental_engine.rs`)**:
   - `HeavyEquipmentRentalEngine::calculate_rental_billing`:
     - Perhitungan jam operasi (*Operating Hours*) dan jam siaga (*Standby Hours*).
     - Penegakan jaminan jam minimum tagihan (*Minimum Hours Guarantee*, misal Min 200 HM).
3. **Fleet & Telemetry Engine (`crates/telemetry/src/domain/fleet_telemetry.rs`)**:
   - `FleetTelemetryEngine::check_fuel_consumption_anomaly`: Deteksi konsumsi bahan bakar spesifik (SFC: Liter/HM) di luar ambang batas wajar.
   - `FleetTelemetryEngine::validate_operator_license`: Penolakan penugasan/dispatch armada jika masa berlaku SIO / SIM operator telah kadaluarsa.
   - `FleetTelemetryEngine::is_outside_geofence`: Deteksi pelanggaran batas geofence berdasarkan koordinat latitude/longitude dan radius operasi.

### B. Forward-Only Migration Indeks EAM, Rental, dan Telemetri
- **File**: `migrations/20260818000005_phase11_eam_rental_fleet_telemetry_indexes.sql`
- **Indeks Database**:
  - `idx_asset_depr_schedules ON asset_depreciation_schedules(asset_id, schedule_date)`
  - `idx_rental_timesheets ON rental_timesheets(rental_id, timesheet_date)`
  - `idx_telemetry_pings ON telemetry_pings(device_id, recorded_at)`
  - `idx_fuel_logs_asset_date ON fuel_logs(asset_id, fuel_date)`

---

## 3. Test Suite Invariant (Fase 11)
- File: `crates/assets/tests/eam_rental_fleet_telemetry_tests.rs` (7/7 tests LULUS):
  1. `test_depreciation_schedule_sum_matches_depreciable_amount`: **PASS**
  2. `test_asset_disposal_gain_calculation`: **PASS**
  3. `test_rental_timesheet_with_minimum_guarantee_applied`: **PASS**
  4. `test_rental_timesheet_exceeding_minimum_guarantee`: **PASS**
  5. `test_fuel_consumption_anomaly_detection`: **PASS**
  6. `test_operator_license_expiration_rejection`: **PASS**
  7. `test_geofence_breach_detection`: **PASS**
