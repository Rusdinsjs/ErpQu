-- Migration: 20260818000005_phase11_eam_rental_fleet_telemetry_indexes.sql
-- Purpose: Indexes for asset depreciation, rental billing, driver licenses, and telemetry data (Fase 11)

DO $$
BEGIN
    -- 1. Asset depreciation schedules index
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'asset_depreciation_schedules') THEN
        CREATE INDEX IF NOT EXISTS idx_asset_depr_schedules 
            ON public.asset_depreciation_schedules(asset_id, schedule_date);
    END IF;

    -- 2. Rental timesheets index
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'rental_timesheets') THEN
        CREATE INDEX IF NOT EXISTS idx_rental_timesheets 
            ON public.rental_timesheets(rental_id, timesheet_date);
    END IF;

    -- 3. Telemetry sensor logs / pings index
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'telemetry_pings') THEN
        CREATE INDEX IF NOT EXISTS idx_telemetry_pings 
            ON public.telemetry_pings(device_id, recorded_at);
    END IF;

    -- 4. Fuel logs anomaly tracking index
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'fuel_logs') THEN
        CREATE INDEX IF NOT EXISTS idx_fuel_logs_asset_date 
            ON public.fuel_logs(asset_id, fuel_date);
    END IF;
END $$;
