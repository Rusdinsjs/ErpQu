-- Migration: 20260827000001_grant_permissions_to_app_user.sql
-- Description: Automatically grant all permissions on tables and sequences across all schemas to erpqu_app

DO $$
DECLARE s text;
BEGIN
  FOR s IN SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT LIKE 'pg_%' AND schema_name != 'information_schema'
  LOOP
    EXECUTE format('GRANT ALL ON ALL TABLES IN SCHEMA %I TO erpqu_app;', s);
    EXECUTE format('GRANT ALL ON ALL SEQUENCES IN SCHEMA %I TO erpqu_app;', s);
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT ALL ON TABLES TO erpqu_app;', s);
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT ALL ON SEQUENCES TO erpqu_app;', s);
  END LOOP;
END $$;
