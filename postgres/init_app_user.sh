#!/bin/sh
set -eu

: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"
: "${DB_APP_USER:?DB_APP_USER is required}"
: "${DB_APP_PASSWORD:?DB_APP_PASSWORD is required}"

psql -v ON_ERROR_STOP=1 \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --set=app_user="$DB_APP_USER" \
  --set=app_password="$DB_APP_PASSWORD" <<'EOSQL'
SELECT format(
  'CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION',
  :'app_user', :'app_password'
)
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'app_user') \gexec

SELECT format('GRANT CONNECT ON DATABASE %I TO %I', current_database(), :'app_user') \gexec
DO $$
DECLARE
  s text;
BEGIN
  FOR s IN SELECT unnest(ARRAY['public', 'hr', 'crm', 'rental', 'inventory', 'commercial']) LOOP
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', s);
    EXECUTE format('GRANT USAGE ON SCHEMA %I TO %I', s, :'app_user');
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA %I TO %I', s, :'app_user');
    EXECUTE format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA %I TO %I', s, :'app_user');
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO %I', s, :'app_user');
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT USAGE, SELECT ON SEQUENCES TO %I', s, :'app_user');
  END LOOP;
END $$;

-- Re-applying this bootstrap to an existing volume must not undo the audit
-- append-only invariant even when the audit migration already ran earlier.
SELECT format('REVOKE UPDATE, DELETE ON TABLE audit_trail FROM %I', :'app_user')
WHERE to_regclass('public.audit_trail') IS NOT NULL \gexec
SELECT format('REVOKE UPDATE, DELETE ON TABLE immutable_audit_records FROM %I', :'app_user')
WHERE to_regclass('public.immutable_audit_records') IS NOT NULL \gexec
EOSQL
