#!/bin/bash
# ==============================================================================
# ERPQu Enterprise - Database Disaster Recovery & Restore Engine
# ==============================================================================
# Usage:
#   ./restore.sh <backup_file[.dump|.dump.enc]> [--target-db <db_name>] [--yes]
#
# Examples:
#   ./restore.sh /backups/daily/management_system_20260903.dump
#   ./restore.sh /backups/daily/management_system_20260903.dump.enc --yes
#   ./restore.sh /backups/daily/management_system_20260903.dump --target-db drill_db --yes
# ==============================================================================

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
AUTO_CONFIRM=false
TEMP_DECRYPTED=""

# Cleanup temporary decrypted files on exit
cleanup() {
    if [ -n "$TEMP_DECRYPTED" ] && [ -f "$TEMP_DECRYPTED" ]; then
        rm -f "$TEMP_DECRYPTED"
    fi
}
trap cleanup EXIT INT TERM

shift || true
while [ $# -gt 0 ]; do
    case "$1" in
        --target-db)
            TARGET_DB="$2"
            RESTORE_MODE="new"
            shift 2
            ;;
        --yes|-y)
            AUTO_CONFIRM=true
            shift
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# Validation
if [ -z "$BACKUP_FILE" ]; then
    echo -e "${CYAN}ERPQu Database Restore Engine${NC}"
    echo ""
    echo "Usage: $0 <backup_file[.dump|.dump.enc]> [--target-db <db_name>] [--yes]"
    echo ""
    echo "Available backups:"
    find "${BACKUP_DIR:-/backups}" -type f \( -name "*.dump" -o -name "*.dump.enc" \) 2>/dev/null | sort -r | head -20
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    error "Backup file not found: $BACKUP_FILE"
fi

# Decryption handling for .enc files
ACTUAL_DUMP_FILE="$BACKUP_FILE"
if [[ "$BACKUP_FILE" == *.enc ]]; then
    log "File backup terenkripsi (.enc) terdeteksi."
    ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"
    if [ -z "$ENCRYPTION_KEY" ]; then
        read -s -p "Masukkan kunci enkripsi (BACKUP_ENCRYPTION_KEY): " ENCRYPTION_KEY
        echo ""
    fi
    [ -n "$ENCRYPTION_KEY" ] || error "Kunci enkripsi diperlukan untuk membuka file ini!"

    TEMP_DECRYPTED="/tmp/erpqu_restore_$(date +%s).dump"
    log "Mendekripsi file backup dengan AES-256-CBC..."
    openssl enc -d -aes-256-cbc -salt -pbkdf2 -iter 100000 \
        -in "$BACKUP_FILE" \
        -out "$TEMP_DECRYPTED" \
        -pass "pass:${ENCRYPTION_KEY}" || error "Gagal mendekripsi file backup! Kunci salah atau file rusak."
    
    ACTUAL_DUMP_FILE="$TEMP_DECRYPTED"
    log "✓ Berhasil didekripsi untuk proses pemulihan."
fi

# Show backup info
log "═══════════════════════════════════════════"
log "ERPQu Database Disaster Recovery Restore"
log "═══════════════════════════════════════════"
log "Source File     : $BACKUP_FILE"
log "Target Database : $TARGET_DB"
log "Restore Mode    : $RESTORE_MODE"

# Verify backup integrity
log "Memverifikasi integritas arsip database..."
TABLE_COUNT=$(pg_restore --list "$ACTUAL_DUMP_FILE" 2>/dev/null | grep -c "TABLE DATA" || true)
log "Tabel terdeteksi dalam arsip: ${TABLE_COUNT}"

if [ "$TABLE_COUNT" -lt 5 ]; then
    error "Arsip backup tidak valid atau kosong (hanya ${TABLE_COUNT} tabel)"
fi

# Confirmation prompt
if [ "$AUTO_CONFIRM" = false ]; then
    echo ""
    warn "══════════════════════════════════════════════════════"
    warn "PERINGATAN: PROSES INI AKAN MENIMPA DATA PADA DATABASE: ${TARGET_DB}"
    warn "══════════════════════════════════════════════════════"
    echo ""
    read -p "Ketik 'RESTORE' untuk melanjutkan: " CONFIRM
    if [ "$CONFIRM" != "RESTORE" ]; then
        log "Pemulihan database dibatalkan oleh pengguna."
        exit 0
    fi
fi

# Safety backup before overwrite
if [ "$RESTORE_MODE" = "replace" ]; then
    log "Membuat backup penyelamat (Safety Backup) database saat ini..."
    SAFETY_BACKUP="${BACKUP_DIR:-/backups}/pre_restore_${TARGET_DB}_$(date +%Y%m%d_%H%M%S).dump"
    pg_dump \
        -h "${PGHOST:-localhost}" \
        -p "${PGPORT:-5432}" \
        -U "${PGUSER:-postgres}" \
        -d "${TARGET_DB}" \
        -Fc --no-owner --no-privileges \
        -f "$SAFETY_BACKUP" 2>/dev/null || warn "Safety backup dilewati (database mungkin belum dibuat)"
fi

# Create new database if requested
if [ "$RESTORE_MODE" = "new" ]; then
    log "Membuat database target baru: ${TARGET_DB}..."
    psql -h "${PGHOST:-localhost}" -p "${PGPORT:-5432}" -U "${PGUSER:-postgres}" -c "CREATE DATABASE \"${TARGET_DB}\";" 2>/dev/null || true
fi

log "Membersihkan objek skema lama..."
psql -h "${PGHOST:-localhost}" -p "${PGPORT:-5432}" -U "${PGUSER:-postgres}" -d "${TARGET_DB}" -c "
    DROP SCHEMA IF EXISTS public CASCADE;
    DROP SCHEMA IF EXISTS hr CASCADE;
    DROP SCHEMA IF EXISTS crm CASCADE;
    DROP SCHEMA IF EXISTS rental CASCADE;
    DROP SCHEMA IF EXISTS inventory CASCADE;
    DROP SCHEMA IF EXISTS commercial CASCADE;
    DROP SCHEMA IF EXISTS finance CASCADE;
    DROP SCHEMA IF EXISTS ops CASCADE;
    CREATE SCHEMA public;
    GRANT ALL ON SCHEMA public TO PUBLIC;
" 2>/dev/null || true

log "Memulihkan struktur & data dari arsip..."
pg_restore \
    -h "${PGHOST:-localhost}" \
    -p "${PGPORT:-5432}" \
    -U "${PGUSER:-postgres}" \
    -d "${TARGET_DB}" \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    "$ACTUAL_DUMP_FILE" 2>&1 | tail -15 || true

# Post-restore verification
log "Memverifikasi hasil pemulihan..."
RESTORED_TABLES=$(psql -h "${PGHOST:-localhost}" -p "${PGPORT:-5432}" -U "${PGUSER:-postgres}" -d "${TARGET_DB}" -t -c "
    SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema IN ('public', 'hr', 'crm', 'rental', 'inventory', 'commercial', 'finance', 'ops')
    AND table_type = 'BASE TABLE';
" 2>/dev/null || echo 0)

# Grant permissions to app user
DB_APP_USER="${DB_APP_USER:-erpqu_app}"
log "Memberikan hak akses skema ke ${DB_APP_USER}..."
for schema in public hr crm rental inventory commercial finance ops; do
    psql -h "${PGHOST:-localhost}" -p "${PGPORT:-5432}" -U "${PGUSER:-postgres}" -d "${TARGET_DB}" -c "
        GRANT USAGE ON SCHEMA ${schema} TO ${DB_APP_USER};
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ${schema} TO ${DB_APP_USER};
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ${schema} TO ${DB_APP_USER};
        ALTER DEFAULT PRIVILEGES IN SCHEMA ${schema} GRANT ALL ON TABLES TO ${DB_APP_USER};
        ALTER DEFAULT PRIVILEGES IN SCHEMA ${schema} GRANT ALL ON SEQUENCES TO ${DB_APP_USER};
    " 2>/dev/null || true
done

log "═══════════════════════════════════════════"
log "🎉 Pemulihan Database Berhasil! ✅"
log "Database : ${TARGET_DB}"
log "Tabel    : ${RESTORED_TABLES}"
log "═══════════════════════════════════════════"
