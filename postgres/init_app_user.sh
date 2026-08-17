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

SELECT format('CREATE SCHEMA IF NOT EXISTS %I', s) FROM unnest(ARRAY['public', 'hr', 'crm', 'rental', 'inventory', 'commercial']) s \gexec
SELECT format('GRANT USAGE, CREATE ON SCHEMA %I TO %I', s, :'app_user') FROM unnest(ARRAY['public', 'hr', 'crm', 'rental', 'inventory', 'commercial']) s \gexec
SELECT format('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA %I TO %I', s, :'app_user') FROM unnest(ARRAY['public', 'hr', 'crm', 'rental', 'inventory', 'commercial']) s \gexec
SELECT format('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA %I TO %I', s, :'app_user') FROM unnest(ARRAY['public', 'hr', 'crm', 'rental', 'inventory', 'commercial']) s \gexec
SELECT format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT ALL ON TABLES TO %I', s, :'app_user') FROM unnest(ARRAY['public', 'hr', 'crm', 'rental', 'inventory', 'commercial']) s \gexec
SELECT format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT ALL ON SEQUENCES TO %I', s, :'app_user') FROM unnest(ARRAY['public', 'hr', 'crm', 'rental', 'inventory', 'commercial']) s \gexec

SELECT format('REVOKE UPDATE, DELETE ON TABLE audit_trail FROM %I', :'app_user')
WHERE to_regclass('public.audit_trail') IS NOT NULL \gexec
SELECT format('REVOKE UPDATE, DELETE ON TABLE immutable_audit_records FROM %I', :'app_user')
WHERE to_regclass('public.immutable_audit_records') IS NOT NULL \gexec
EOSQL
