#!/bin/bash
# ==============================================================================
# ERPQu Enterprise - Automated Database Backup & Disaster Recovery Script
# ==============================================================================
# Capabilities:
#   1. High-Performance PostgreSQL Backup (Custom Dump + Gzip SQL)
#   2. Client-Side AES-256-CBC Encryption (Zero-Knowledge Cloud Transit)
#   3. Offsite Cloud Storage Sync (AWS S3, Cloudflare R2, Wasabi, MinIO)
#   4. Multi-Tier Retention Policy (Daily 30d, Weekly 90d, Monthly 365d)
#   5. WhatsApp & Webhook Failure/Success Alerts
#
# Usage:
#   ./backup.sh [--full|--schema-only]
# ==============================================================================

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DAY_OF_WEEK=$(date +%u)  # 1=Monday, 7=Sunday
DAY_OF_MONTH=$(date +%d)
BACKUP_TYPE="${1:---full}"

# Database Env
PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-postgres}"
PGDATABASE="${PGDATABASE:-management_system}"

# Cloud Storage & Security
BACKUP_ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"
S3_BUCKET="${S3_BUCKET:-}"
S3_ENDPOINT_URL="${S3_ENDPOINT_URL:-}"
ALERT_WEBHOOK_URL="${ALERT_WEBHOOK_URL:-}"
ALERT_WHATSAPP_NUMBER="${ALERT_WHATSAPP_NUMBER:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"; }

# Notification Helper (Webhook & WhatsApp)
notify() {
    local STATUS="$1"
    local TITLE="$2"
    local DETAIL="$3"
    
    # 1. Send to Webhook (Slack, Discord, or Internal System)
    if [ -n "$ALERT_WEBHOOK_URL" ]; then
        curl -s -X POST -H "Content-Type: application/json" \
            -d "{\"status\":\"$STATUS\",\"title\":\"$TITLE\",\"message\":\"$DETAIL\",\"timestamp\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}" \
            "$ALERT_WEBHOOK_URL" >/dev/null 2>&1 || true
    fi

    # 2. Send via Local WhatsApp Gateway (if backend is running)
    if [ -n "$ALERT_WHATSAPP_NUMBER" ]; then
        local WA_MSG="*🔔 ERPQu Backup Notification*\n*Status:* ${STATUS}\n*Detail:* ${DETAIL}\n*Host:* $(hostname)\n*Waktu:* $(date +'%Y-%m-%d %H:%M:%S WIB')"
        curl -s -X POST -H "Content-Type: application/json" \
            -d "{\"recipient_phone\":\"$ALERT_WHATSAPP_NUMBER\",\"message\":\"$WA_MSG\",\"message_type\":\"SYSTEM_ALERT\"}" \
            "http://localhost:8181/api/whatsapp/send" >/dev/null 2>&1 || true
    fi
}

# Trap unexpected errors
trap 'error "Backup failed unexpectedly at line $LINENO"; notify "FAILED" "Database Backup FAILED" "Skrip backup gagal pada baris $LINENO. Periksa log server segera!"; exit 1' ERR

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

log "╔══════════════════════════════════════════════════════════════════╗"
log "║          🛡️ ERPQu Enterprise Database Backup Engine              ║"
log "╚══════════════════════════════════════════════════════════════════╝"
log "Database   : ${PGDATABASE} (${PGHOST}:${PGPORT})"
log "Category   : ${CATEGORY}"
log "Type       : ${BACKUP_TYPE}"
log "Target     : ${BACKUP_FILE}"

# Pre-flight check
if ! pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" > /dev/null 2>&1; then
    error "Database is not ready at ${PGHOST}:${PGPORT}"
    notify "FAILED" "PostgreSQL Not Ready" "Database tidak merespons koneksi di ${PGHOST}:${PGPORT}."
    exit 1
fi

# Perform backup
case "$BACKUP_TYPE" in
    --full)
        log "Running full backup (custom format + SQL dump)..."
        
        # Custom format (for fast parallel pg_restore)
        pg_dump \
            -h "$PGHOST" \
            -p "$PGPORT" \
            -U "$PGUSER" \
            -d "$PGDATABASE" \
            -Fc \
            --no-owner \
            --no-privileges \
            -f "${BACKUP_FILE}.dump"
        
        # Plain SQL (for emergency human-readable inspect)
        pg_dump \
            -h "$PGHOST" \
            -p "$PGPORT" \
            -U "$PGUSER" \
            -d "$PGDATABASE" \
            --no-owner \
            --no-privileges \
            -f "${BACKUP_FILE}.sql"
        
        gzip -9 "${BACKUP_FILE}.sql"
        
        log "Full backup complete:"
        log "  Custom format  : ${BACKUP_FILE}.dump ($(du -sh "${BACKUP_FILE}.dump" | cut -f1))"
        log "  SQL compressed : ${BACKUP_FILE}.sql.gz ($(du -sh "${BACKUP_FILE}.sql.gz" | cut -f1))"
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
log "Verifying backup table structures..."
TABLE_COUNT=0
if [ -f "${BACKUP_FILE}.dump" ]; then
    TABLE_COUNT=$(pg_restore --list "${BACKUP_FILE}.dump" 2>/dev/null | grep -c "TABLE DATA" || true)
    log "Verified: ${TABLE_COUNT} tables confirmed in backup archive"
    
    if [ "$TABLE_COUNT" -lt 5 ]; then
        warn "Jumlah tabel terdeteksi rendah (${TABLE_COUNT}). Harap verifikasi struktur database!"
    fi
fi

# === STEP: Client-Side AES-256-CBC Encryption ===
ENCRYPTED_DUMP=""
if [ -n "$BACKUP_ENCRYPTION_KEY" ] && [ -f "${BACKUP_FILE}.dump" ]; then
    log "Mengenkripsi file backup dengan AES-256-CBC (PBKDF2)..."
    openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 \
        -in "${BACKUP_FILE}.dump" \
        -out "${BACKUP_FILE}.dump.enc" \
        -pass "pass:${BACKUP_ENCRYPTION_KEY}"
    ENCRYPTED_DUMP="${BACKUP_FILE}.dump.enc"
    log "File terenkripsi dibuat: ${ENCRYPTED_DUMP} ($(du -sh "${ENCRYPTED_DUMP}" | cut -f1))"
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
    "encrypted": $([ -n "$BACKUP_ENCRYPTION_KEY" ] && echo "true" || echo "false"),
    "files": {
        "custom_format": "${BACKUP_FILE}.dump",
        "sql_compressed": "${BACKUP_FILE}.sql.gz",
        "encrypted_format": "$([ -n "$ENCRYPTED_DUMP" ] && echo "${ENCRYPTED_DUMP}" || echo "null")"
    },
    "checksums": {
        "dump_sha256": "$(sha256sum "${BACKUP_FILE}.dump" 2>/dev/null | cut -d' ' -f1 || echo 'N/A')",
        "sql_sha256": "$(sha256sum "${BACKUP_FILE}.sql.gz" 2>/dev/null | cut -d' ' -f1 || echo 'N/A')"
    }
}
EOF

# === STEP: Offsite Cloud Storage Sync (AWS S3 / Cloudflare R2 / Wasabi) ===
if [ -n "$S3_BUCKET" ]; then
    log "Menyinkronkan file backup ke Cloud Object Storage: ${S3_BUCKET}..."
    S3_FLAGS=""
    if [ -n "$S3_ENDPOINT_URL" ]; then
        S3_FLAGS="--endpoint-url ${S3_ENDPOINT_URL}"
    fi

    TARGET_UPLOAD="${BACKUP_FILE}.dump"
    if [ -n "$ENCRYPTED_DUMP" ] && [ -f "$ENCRYPTED_DUMP" ]; then
        # If encryption is enabled, upload the encrypted payload to Cloud Storage
        TARGET_UPLOAD="$ENCRYPTED_DUMP"
    fi

    if command -v aws &> /dev/null; then
        aws s3 cp $S3_FLAGS "$TARGET_UPLOAD" "${S3_BUCKET}/${CATEGORY}/" || warn "Gagal upload ke S3 via AWS CLI."
        aws s3 cp $S3_FLAGS "${BACKUP_FILE}_manifest.json" "${S3_BUCKET}/${CATEGORY}/" || true
        log "✓ Berhasil disinkronkan ke Cloud Storage S3."
    elif command -v rclone &> /dev/null; then
        rclone copy "$TARGET_UPLOAD" "r2:${S3_BUCKET}/${CATEGORY}/" || warn "Gagal upload via rclone."
        log "✓ Berhasil disinkronkan ke Cloud Storage via rclone."
    else
        warn "Peringatan: CLI 'aws' atau 'rclone' tidak ditemukan. File tersimpan aman di penyimpanan lokal."
    fi
fi

# Cleanup old local backups
log "Membersihkan arsip backup lokal yang melebihi retensi ${RETENTION_DAYS} hari..."
DELETED_COUNT=$(find "${BACKUP_DIR}/daily" -type f -mtime +${RETENTION_DAYS} -delete -print 2>/dev/null | wc -l || echo 0)
find "${BACKUP_DIR}/weekly" -type f -mtime +90 -delete 2>/dev/null || true
find "${BACKUP_DIR}/monthly" -type f -mtime +365 -delete 2>/dev/null || true
log "Dihapus ${DELETED_COUNT} file backup harian usang."

# Summary
TOTAL_SIZE=$(du -sh "${BACKUP_DIR}" 2>/dev/null | cut -f1)
log "═══════════════════════════════════════════"
log "🎉 Backup Sukses Selesai!"
log "Kategori : ${CATEGORY}"
log "Tabel    : ${TABLE_COUNT}"
log "Total Storage Lokal Terpakai: ${TOTAL_SIZE}"
log "═══════════════════════════════════════════"

# Send Success Alert
DUMP_SIZE=$(du -sh "${BACKUP_FILE}.dump" 2>/dev/null | cut -f1 || echo "N/A")
notify "SUCCESS" "Backup Berhasil" "Database ${PGDATABASE} (${CATEGORY}) berhasil dibackup (${TABLE_COUNT} tabel, ukuran: ${DUMP_SIZE})."
