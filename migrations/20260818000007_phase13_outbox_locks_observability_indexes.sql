-- Migration: 20260818000007_phase13_outbox_locks_observability_indexes.sql
-- Purpose: Indexes for outbox queue lag, distributed job locks, and backup verification (Fase 13)

DO $$
BEGIN
    -- 1. Outbox Entries processing index
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'outbox_entries') THEN
        CREATE INDEX IF NOT EXISTS idx_outbox_status_scheduled 
            ON public.outbox_entries(status, scheduled_at, attempt_count);
    END IF;

    -- 2. System Job Locks TTL index
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'system_job_locks') THEN
        CREATE INDEX IF NOT EXISTS idx_job_locks_ttl 
            ON public.system_job_locks(lock_name, locked_until);
    END IF;

    -- 3. System Backup Logs tenant index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'system_backup_logs' AND column_name = 'tenant_id') THEN
        CREATE INDEX IF NOT EXISTS idx_backup_logs_tenant 
            ON public.system_backup_logs(tenant_id, created_at);
    END IF;
END $$;
