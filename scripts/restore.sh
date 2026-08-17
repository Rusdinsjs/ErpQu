#!/bin/bash
# ERPQu Database Restore Script
# Usage: ./restore.sh <backup_file.dump> [--target-db <db_name>]
#
# Examples:
#   ./restore.sh /backups/daily/management_system_20260817_020000.dump
#   ./restore.sh /backups/monthly/management_system_20260801_020000.dump --target-db management_system_restored

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"; exit 1; }

# Parse arguments
BACKUP_FILE="${1:-}"
TARGET_DB="${PGDATABASE:-management_system}"
RESTORE_MODE="replace"

shift || true
while [ $# -gt 0 ]; do
    case "$1" in
        --target-db)
            TARGET_DB="$2"
            RESTORE_MODE="new"
            shift 2
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# Validation
if [ -z "$BACKUP_FILE" ]; then
    echo -e "${CYAN}ERPQu Database Restore Tool${NC}"
    echo ""
    echo "Usage: $0 <backup_file.dump> [--target-db <db_name>]"
    echo ""
    echo "Options:"
    echo "  --target-db <name>  Restore to a different database (safer)"
    echo ""
    echo "Available backups:"
    find "${BACKUP_DIR:-/backups}" -name "*.dump" -type f | sort -r | head -20
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    error "Backup file not found: $BACKUP_FILE"
fi

# Show backup info
log "═══════════════════════════════════════════"
log "ERPQu Database Restore"
log "═══════════════════════════════════════════"
log "Backup file: $BACKUP_FILE"
log "File size: $(du -sh "$BACKUP_FILE" | cut -f1)"
log "Target database: $TARGET_DB"
log "Restore mode: $RESTORE_MODE"

# Show backup manifest if available
MANIFEST="${BACKUP_FILE%.*}_manifest.json"
if [ -f "$MANIFEST" ]; then
    log "Backup manifest:"
    cat "$MANIFEST"
fi

# Verify backup integrity
log "Verifying backup integrity..."
TABLE_COUNT=$(pg_restore --list "$BACKUP_FILE" 2>/dev/null | grep -c "TABLE DATA" || true)
log "Tables in backup: ${TABLE_COUNT}"

if [ "$TABLE_COUNT" -lt 5 ]; then
    error "Backup appears corrupted or empty (only ${TABLE_COUNT} tables)"
fi

# Verify checksum if manifest exists
if [ -f "$MANIFEST" ] && command -v jq > /dev/null 2>&1; then
    EXPECTED_CHECKSUM=$(jq -r '.checksum_dump // "N/A"' "$MANIFEST")
    if [ "$EXPECTED_CHECKSUM" != "N/A" ]; then
        ACTUAL_CHECKSUM=$(sha256sum "$BACKUP_FILE" | cut -d' ' -f1)
        if [ "$EXPECTED_CHECKSUM" = "$ACTUAL_CHECKSUM" ]; then
            log "Checksum verified: OK ✅"
        else
            error "Checksum mismatch! Backup may be corrupted."
        fi
    fi
fi

# Confirmation
echo ""
warn "══════════════════════════════════════════════════════"
warn "THIS WILL DESTROY ALL DATA IN DATABASE: ${TARGET_DB}"
warn "══════════════════════════════════════════════════════"
echo ""
read -p "Type 'RESTORE' to confirm: " CONFIRM

if [ "$CONFIRM" != "RESTORE" ]; then
    log "Restore cancelled."
    exit 0
fi

# Pre-restore backup of current database (safety net)
log "Creating pre-restore safety backup..."
SAFETY_BACKUP="${BACKUP_DIR:-/backups}/pre_restore_${TARGET_DB}_$(date +%Y%m%d_%H%M%S).dump"
pg_dump \
    -h "${PGHOST}" \
    -p "${PGPORT}" \
    -U "${PGUSER}" \
    -d "${TARGET_DB}" \
    -Fc --no-owner --no-privileges \
    -f "$SAFETY_BACKUP" 2>/dev/null || warn "Could not create safety backup (database may not exist yet)"

if [ -f "$SAFETY_BACKUP" ]; then
    log "Safety backup saved: $SAFETY_BACKUP ($(du -sh "$SAFETY_BACKUP" | cut -f1))"
fi

# Restore
if [ "$RESTORE_MODE" = "new" ]; then
    log "Creating new database: $TARGET_DB"
    psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -c "CREATE DATABASE \"${TARGET_DB}\";" 2>/dev/null || true
fi

log "Dropping existing objects..."
psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${TARGET_DB}" -c "
    DROP SCHEMA IF EXISTS public CASCADE;
    DROP SCHEMA IF EXISTS hr CASCADE;
    DROP SCHEMA IF EXISTS crm CASCADE;
    DROP SCHEMA IF EXISTS rental CASCADE;
    DROP SCHEMA IF EXISTS inventory CASCADE;
    DROP SCHEMA IF EXISTS commercial CASCADE;
    CREATE SCHEMA public;
    GRANT ALL ON SCHEMA public TO PUBLIC;
" 2>/dev/null || true

log "Restoring from backup..."
pg_restore \
    -h "${PGHOST}" \
    -p "${PGPORT}" \
    -U "${PGUSER}" \
    -d "${TARGET_DB}" \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    --verbose \
    "$BACKUP_FILE" 2>&1 | tail -20

# Post-restore verification
log "Post-restore verification..."
RESTORED_TABLES=$(psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${TARGET_DB}" -t -c "
    SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema IN ('public', 'hr', 'crm', 'rental', 'inventory', 'commercial')
    AND table_type = 'BASE TABLE';
")
log "Tables restored: ${RESTORED_TABLES}"

# Re-grant permissions to app user
DB_APP_USER="${DB_APP_USER:-erpqu_app}"
log "Re-granting permissions to ${DB_APP_USER}..."
for schema in public hr crm rental inventory commercial; do
    psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${TARGET_DB}" -c "
        GRANT USAGE ON SCHEMA ${schema} TO ${DB_APP_USER};
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ${schema} TO ${DB_APP_USER};
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ${schema} TO ${DB_APP_USER};
        ALTER DEFAULT PRIVILEGES IN SCHEMA ${schema} GRANT ALL ON TABLES TO ${DB_APP_USER};
        ALTER DEFAULT PRIVILEGES IN SCHEMA ${schema} GRANT ALL ON SEQUENCES TO ${DB_APP_USER};
    " 2>/dev/null || true
done

log "═══════════════════════════════════════════"
log "Restore complete! ✅"
log "Database: ${TARGET_DB}"
log "Tables: ${RESTORED_TABLES}"
log "Safety backup: ${SAFETY_BACKUP:-N/A}"
log "═══════════════════════════════════════════"
