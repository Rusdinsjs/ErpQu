-- Migration: 20260820000007_create_outbox_dlq_and_job_executions_tables.sql
-- Description: Create Outbox Dead-Letter Queue (DLQ) and Scheduled Job Executions tracking tables

-- 1. Outbox Dead-Letter Queue (DLQ) Table
CREATE TABLE IF NOT EXISTS public.outbox_dlq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outbox_id UUID NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    aggregate_type VARCHAR(255) NOT NULL,
    aggregate_id VARCHAR(255) NOT NULL,
    payload JSONB NOT NULL,
    error_message TEXT NOT NULL,
    retry_count INTEGER NOT NULL DEFAULT 0,
    failed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tenant_id UUID,
    company_id UUID
);

CREATE INDEX IF NOT EXISTS idx_outbox_dlq_event_type ON public.outbox_dlq(event_type);
CREATE INDEX IF NOT EXISTS idx_outbox_dlq_failed_at ON public.outbox_dlq(failed_at);

-- 2. Scheduled Job Executions Log Table
CREATE TABLE IF NOT EXISTS public.scheduled_job_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name VARCHAR(255) NOT NULL,
    node_id VARCHAR(255) NOT NULL DEFAULT 'node-1',
    status VARCHAR(50) NOT NULL, -- 'running', 'completed', 'failed'
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    duration_ms BIGINT,
    records_processed INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_executions_job_name ON public.scheduled_job_executions(job_name, started_at);

-- 3. Enable RLS and Grant Permissions
ALTER TABLE public.outbox_dlq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_job_executions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'erpqu_app') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.outbox_dlq TO erpqu_app;
        GRANT SELECT, INSERT, UPDATE ON public.scheduled_job_executions TO erpqu_app;
    END IF;
END $$;
