#!/bin/bash
# ERPQu Automated Database Backup Script
# Runs via cron in the backup container or manually
# Usage: ./backup.sh [--full|--schema-only]
#
# Environment variables (set in docker-compose.prod.yml):
#   PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
#   BACKUP_RETENTION_DAYS (default: 30)

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DAY_OF_WEEK=$(date +%u)  # 1=Monday, 7=Sunday
DAY_OF_MONTH=$(date +%d)
BACKUP_TYPE="${1:---full}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"; }

# Create backup directories
mkdir -p "${BACKUP_DIR}/daily"
mkdir -p "${BACKUP_DIR}/weekly"
mkdir -p "${BACKUP_DIR}/monthly"

# Determine backup category
if [ "$DAY_OF_MONTH" = "01" ]; then
    CATEGORY="monthly"
elif [ "$DAY_OF_WEEK" = "7" ]; then
    CATEGORY="weekly"
else
    CATEGORY="daily"
fi

BACKUP_FILE="${BACKUP_DIR}/${CATEGORY}/${PGDATABASE}_${TIMESTAMP}"

log "Starting ${CATEGORY} backup for database: ${PGDATABASE}"
log "Backup type: ${BACKUP_TYPE}"
log "Target: ${BACKUP_FILE}"

# Pre-flight check
if ! pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" > /dev/null 2>&1; then
    error "Database is not ready at ${PGHOST}:${PGPORT}"
    exit 1
fi

# Perform backup
case "$BACKUP_TYPE" in
    --full)
        log "Running full backup (custom format + SQL dump)..."
        
        # Custom format (for selective restore)
        pg_dump \
            -h "$PGHOST" \
            -p "$PGPORT" \
            -U "$PGUSER" \
            -d "$PGDATABASE" \
            -Fc \
            --no-owner \
            --no-privileges \
            --verbose \
            -f "${BACKUP_FILE}.dump" \
            2>&1 | tail -5
        
        # Plain SQL (for human-readable emergency restore)
        pg_dump \
            -h "$PGHOST" \
            -p "$PGPORT" \
            -U "$PGUSER" \
            -d "$PGDATABASE" \
            --no-owner \
            --no-privileges \
            -f "${BACKUP_FILE}.sql" \
            2>/dev/null
        
        # Compress SQL dump
        gzip -9 "${BACKUP_FILE}.sql"
        
        log "Full backup complete:"
        log "  Custom format: ${BACKUP_FILE}.dump ($(du -sh "${BACKUP_FILE}.dump" | cut -f1))"
        log "  SQL compressed: ${BACKUP_FILE}.sql.gz ($(du -sh "${BACKUP_FILE}.sql.gz" | cut -f1))"
        ;;
    
    --schema-only)
        log "Running schema-only backup..."
        pg_dump \
            -h "$PGHOST" \
            -p "$PGPORT" \
            -U "$PGUSER" \
            -d "$PGDATABASE" \
            --schema-only \
            --no-owner \
            --no-privileges \
            -f "${BACKUP_FILE}_schema.sql"
        log "Schema backup: ${BACKUP_FILE}_schema.sql"
        ;;
esac

# Verify backup integrity
log "Verifying backup integrity..."
if [ -f "${BACKUP_FILE}.dump" ]; then
    TABLE_COUNT=$(pg_restore --list "${BACKUP_FILE}.dump" 2>/dev/null | grep -c "TABLE DATA" || true)
    log "Verified: ${TABLE_COUNT} tables found in backup"
    
    if [ "$TABLE_COUNT" -lt 10 ]; then
        warn "Low table count (${TABLE_COUNT}). Expected at least 50+ tables. Backup may be incomplete!"
    fi
fi

# Generate backup manifest
cat > "${BACKUP_FILE}_manifest.json" <<EOF
{
    "database": "${PGDATABASE}",
    "host": "${PGHOST}",
    "timestamp": "${TIMESTAMP}",
    "category": "${CATEGORY}",
    "type": "${BACKUP_TYPE}",
    "tables_backed_up": ${TABLE_COUNT:-0},
    "files": {
        "custom_format": "${BACKUP_FILE}.dump",
        "sql_compressed": "${BACKUP_FILE}.sql.gz"
    },
    "pg_version": "$(pg_dump --version | head -1)",
    "checksum_dump": "$(sha256sum "${BACKUP_FILE}.dump" 2>/dev/null | cut -d' ' -f1 || echo 'N/A')",
    "checksum_sql": "$(sha256sum "${BACKUP_FILE}.sql.gz" 2>/dev/null | cut -d' ' -f1 || echo 'N/A')"
}
EOF

# Cleanup old backups
log "Cleaning up backups older than ${RETENTION_DAYS} days..."
DELETED_COUNT=$(find "${BACKUP_DIR}/daily" -type f -mtime +${RETENTION_DAYS} -delete -print | wc -l)
log "Deleted ${DELETED_COUNT} old daily backup files"

# Keep weekly backups for 90 days
find "${BACKUP_DIR}/weekly" -type f -mtime +90 -delete 2>/dev/null || true

# Keep monthly backups for 365 days
find "${BACKUP_DIR}/monthly" -type f -mtime +365 -delete 2>/dev/null || true

# Summary
TOTAL_SIZE=$(du -sh "${BACKUP_DIR}" 2>/dev/null | cut -f1)
log "═══════════════════════════════════════════"
log "Backup complete!"
log "Category: ${CATEGORY}"
log "Total backup storage used: ${TOTAL_SIZE}"
log "═══════════════════════════════════════════"
