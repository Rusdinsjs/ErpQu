-- Migration: 20260818000005_phase11_eam_rental_fleet_telemetry_indexes.sql
-- Purpose: Indexes for EAM Depreciation, Equipment Rental, and Fleet Telemetry (Fase 11)

DO $$
BEGIN
    -- 1. Asset depreciation schedule index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'asset_depreciation_schedules' AND column_name = 'asset_id') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_asset_depr_sched ON public.asset_depreciation_schedules(asset_id, schedule_date, status)';
    END IF;

    -- 2. Rental timesheet billing index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rental_timesheets' AND column_name = 'company_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rental_timesheets' AND column_name = 'rental_id') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_rental_ts_billing ON public.rental_timesheets(company_id, rental_id, timesheet_date, billing_status)';
    END IF;

    -- 3. Vehicle telemetry geofencing and fuel anomaly index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicle_telemetry_logs' AND column_name = 'vehicle_id') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_vehicle_telemetry_time ON public.vehicle_telemetry_logs(vehicle_id, timestamp DESC)';
    END IF;
END $$;
