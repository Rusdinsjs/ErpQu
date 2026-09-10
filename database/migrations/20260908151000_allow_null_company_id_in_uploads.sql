-- Migration: 20260908151000_allow_null_company_id_in_uploads.sql
-- Purpose: Allow NULL company_id in public.uploads for global, public, or pre-company creation assets (e.g. company logos, user avatars).

ALTER TABLE public.uploads ALTER COLUMN company_id DROP NOT NULL;
