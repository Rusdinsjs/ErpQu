-- Migration: 20260818000007_phase13_outbox_locks_observability_indexes.sql
-- Purpose: Indexes for Outbox Event Processing, Job Locks, and Backup Logs (Fase 13)

DO $$
BEGIN
    -- 1. Outbox processing index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'outbox' AND column_name = 'company_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'outbox' AND column_name = 'status') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'outbox' AND column_name = 'next_retry_at') THEN
            EXECUTE 'CREATE INDEX IF NOT EXISTS idx_outbox_processing ON public.outbox(company_id, status, next_retry_at, created_at)';
        ELSE
            EXECUTE 'CREATE INDEX IF NOT EXISTS idx_outbox_processing ON public.outbox(company_id, status, created_at)';
        END IF;
    END IF;

    -- 2. System job locks active index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_job_locks' AND column_name = 'job_name') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_job_locks_active ON public.system_job_locks(job_name, expires_at)';
    END IF;

    -- 3. System backup verification logs index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_backup_logs' AND column_name = 'backup_id') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_backup_logs_verification ON public.system_backup_logs(backup_id, verification_status, created_at DESC)';
    END IF;
END $$;
