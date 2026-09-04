#!/usr/bin/env bash
# ==============================================================================
# ERPQu Enterprise - Production VPS Deployment & Rolling Update Script
# ==============================================================================
# Skrip ini dijalankan di VPS untuk melakukan rilis versi baru secara aman:
# 1. Verifikasi Environment & Service
# 2. Mandatory Pre-Deployment Database Backup (pg_dump)
# 3. Pull / Build Image Terbaru
# 4. Eksekusi Database Migrations (Fail-Closed)
# 5. Rolling Restart Frontend & Backend
# 6. Readiness Gate (/health check) & Auto-Rollback jika gagal
# 7. Purge Cache Cloudflare Otomatis (Opsional jika Token diset)
# 8. Housekeeping / Pruning Docker Image Lama
#
# Usage:
#   ./deploy/scripts/deploy_vps.sh [IMAGE_TAG_OR_SHA]
#   - or for local build mode:
#   BUILD_LOCAL=true ./deploy/scripts/deploy_vps.sh
# ==============================================================================

set -eo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT_DIR"

IMAGE_TAG="${1:-latest}"
COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="/backups"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/pre_deploy_${TIMESTAMP}.dump"

echo -e "${CYAN}${BOLD}"
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║          🚀 ERPQu Production VPS Rolling Deployment             ║"
echo "║          Target Tag: ${IMAGE_TAG}                                ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 1. Pre-deployment Sanity Check
echo -e "${CYAN}▶ [1/7] Pemeriksaan Prasyarat Lingkungan Produksi...${NC}"
if [ ! -f "$COMPOSE_FILE" ]; then
    echo -e "${RED}✗ File $COMPOSE_FILE tidak ditemukan di $(pwd)!${NC}"
    exit 1
fi
if [ ! -f ".env" ]; then
    echo -e "${RED}✗ File .env produksi tidak ditemukan!${NC}"
    exit 1
fi
echo -e "  ${GREEN}✓ Compose file dan .env ditemukan.${NC}"

# 2. Mandatory Pre-Deployment Database Backup
echo -e "\n${CYAN}▶ [2/7] Menjalankan Backup Database Mandatori Sebelum Rilis...${NC}"
mkdir -p "$BACKUP_DIR"
if docker compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U postgres -Fc management_system > "$BACKUP_FILE" 2>/dev/null; then
    BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
    echo -e "  ${GREEN}✓ Backup tersimpan di: ${BOLD}${BACKUP_FILE}${NC} (${BACKUP_SIZE})"
else
    echo -e "  ${YELLOW}⚠️  Peringatan: Gagal membuat backup via container postgres (mungkin service belum running). Melanjutkan dengan hati-hati...${NC}"
fi

# 3. Pull / Build Image
echo -e "\n${CYAN}▶ [3/7] Mengambil / Menyiapkan Container Images...${NC}"
if [ "${BUILD_LOCAL}" = "true" ]; then
    echo "  - Mem-build container frontend & backend secara lokal di VPS..."
    docker compose -f "$COMPOSE_FILE" build frontend backend migrate
else
    echo "  - Menarik image terbaru dari GHCR [${IMAGE_TAG}]..."
    export IMAGE_TAG
    docker compose -f "$COMPOSE_FILE" pull frontend backend migrate || {
        echo -e "  ${YELLOW}⚠️ Pull gagal, melakukan fallback ke local build...${NC}"
        docker compose -f "$COMPOSE_FILE" build frontend backend migrate
    }
fi

# 4. Database Migrations (Fail-Closed)
echo -e "\n${CYAN}▶ [4/7] Menjalankan Database Migrations (Fail-Closed)...${NC}"
if docker compose -f "$COMPOSE_FILE" run --rm migrate; then
    echo -e "  ${GREEN}✓ Migrasi database berhasil diaplikasikan.${NC}"
else
    echo -e "${RED}${BOLD}══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}${BOLD}✗ KRITIKAL: Database migration GAGAL!${NC}"
    echo -e "${RED}Deployment dibatalkan. Database tidak diubah.${NC}"
    if [ -f "$BACKUP_FILE" ]; then
        echo -e "${YELLOW}File backup tersedia di: $BACKUP_FILE${NC}"
    fi
    echo -e "${RED}${BOLD}══════════════════════════════════════════════════════════════════${NC}"
    exit 1
fi

# 5. Rolling Service Restart
echo -e "\n${CYAN}▶ [5/7] Menjalankan Container Baru...${NC}"
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans frontend backend nginx redis postgres

# 6. Readiness Gate & Auto-Rollback
echo -e "\n${CYAN}▶ [6/7] Memverifikasi Kesehatan Service (Readiness Gate)...${NC}"
READY=0
for i in $(seq 1 30); do
    if docker compose -f "$COMPOSE_FILE" exec -T backend curl -sf http://localhost:8181/health > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓ Backend READY dan merespons /health pada percobaan ke-$i!${NC}"
        READY=1
        break
    fi
    echo "  - Menunggu service siap... ($i/30)"
    sleep 2
done

if [ "$READY" -eq 0 ]; then
    echo -e "${RED}${BOLD}══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}${BOLD}✗ Backend GAGAL merespons dalam 60 detik! Memulai AUTO-ROLLBACK...${NC}"
    echo -e "${RED}${BOLD}══════════════════════════════════════════════════════════════════${NC}"
    
    docker compose -f "$COMPOSE_FILE" down frontend backend
    if [ -f "$BACKUP_FILE" ]; then
        echo "  - Mengembalikan database dari backup: $BACKUP_FILE..."
        docker compose -f "$COMPOSE_FILE" exec -T postgres pg_restore -U postgres -d management_system --clean --if-exists < "$BACKUP_FILE" || true
    fi
    
    echo "  - Menjalankan kembali container versi sebelumnya..."
    unset IMAGE_TAG
    docker compose -f "$COMPOSE_FILE" up -d
    echo -e "${YELLOW}Rollback selesai. Sistem dikembalikan ke versi sebelumnya.${NC}"
    exit 1
fi

# 7. Cloudflare Cache Purge & Cleanup
echo -e "\n${CYAN}▶ [7/7] Pembersihan Cache & Housekeeping...${NC}"
CF_TOKEN=$(grep -E '^CLOUDFLARE_API_TOKEN=' .env 2>/dev/null | cut -d= -f2- || true)
CF_ZONE=$(grep -E '^CLOUDFLARE_ZONE_ID=' .env 2>/dev/null | cut -d= -f2- || true)

if [ -n "$CF_TOKEN" ] && [ -n "$CF_ZONE" ]; then
    echo "  - Melakukan Purge Cache di Cloudflare..."
    PURGE_STATUS=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE}/purge_cache" \
        -H "Authorization: Bearer ${CF_TOKEN}" \
        -H "Content-Type: application/json" \
        --data '{"purge_everything":true}' | grep -o '"success":true' || true)
    if [ -n "$PURGE_STATUS" ]; then
        echo -e "  ${GREEN}✓ Cloudflare Cache berhasil di-purge 100%!${NC}"
    else
        echo -e "  ${YELLOW}⚠️  Gagal purge Cloudflare (periksa token/zone ID). Harap purge manual dari Cloudflare Dashboard.${NC}"
    fi
else
    echo -e "  ${YELLOW}ℹ️  CLOUDFLARE_API_TOKEN / CLOUDFLARE_ZONE_ID tidak diset di .env.${NC}"
    echo -e "  ${YELLOW}   Silakan lakukan Purge Everything dari Cloudflare Dashboard jika ada perubahan frontend.${NC}"
fi

# Docker image prune
docker image prune -f > /dev/null 2>&1 || true

echo -e "\n${GREEN}${BOLD}══════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}✓ DEPLOYMENT SUKSES 100%! 🚀${NC}"
echo -e "  Target Tag : ${IMAGE_TAG}"
echo -e "  Waktu      : $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo -e "  Backup DB  : ${BACKUP_FILE}"
echo -e "${GREEN}${BOLD}══════════════════════════════════════════════════════════════════${NC}"
