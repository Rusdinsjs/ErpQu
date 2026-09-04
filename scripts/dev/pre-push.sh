#!/usr/bin/env bash
# ==============================================================================
# ERPQu - Local Pre-Push Quality Gate Script
# ==============================================================================
# Jalankan skrip ini sebelum melakukan git push untuk memastikan semua tes,
# tipe TypeScript, migrasi SQL, dan build backend/frontend 100% lulus.
#
# Usage:
#   ./scripts/dev/pre-push.sh
#   - or as git pre-push hook:
#   ln -sf ../../scripts/dev/pre-push.sh .git/hooks/pre-push
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

echo -e "${CYAN}${BOLD}"
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║          🛡️  ERPQu Local Pre-Push Quality Verification           ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

FAILURES=0

# ------------------------------------------------------------------------------
# 1. Frontend TypeScript & Build Verification
# ------------------------------------------------------------------------------
echo -e "${CYAN}▶ [1/4] Verifikasi Frontend Web Admin (TypeScript & Build)...${NC}"
if [ -d "$ROOT_DIR/apps/web-admin" ]; then
    cd "$ROOT_DIR/apps/web-admin"
    echo "  - Checking TypeScript types (tsc --noEmit)..."
    if npx tsc --noEmit; then
        echo -e "  ${GREEN}✓ TypeScript Type Check: LULUS${NC}"
    else
        echo -e "  ${RED}✗ TypeScript Type Check: GAGAL${NC}"
        FAILURES=$((FAILURES + 1))
    fi

    echo "  - Checking Production Bundle (npm run build)..."
    if npm run build > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓ Production Bundle Build: LULUS${NC}"
    else
        echo -e "  ${RED}✗ Production Bundle Build: GAGAL${NC}"
        FAILURES=$((FAILURES + 1))
    fi
    cd "$ROOT_DIR"
else
    echo -e "  ${RED}✗ Directory apps/web-admin tidak ditemukan!${NC}"
    FAILURES=$((FAILURES + 1))
fi

# ------------------------------------------------------------------------------
# 2. Backend Cargo Check & Integrity Tests
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}▶ [2/4] Verifikasi Backend Rust (Compilation & Critical Tests)...${NC}"
echo "  - Checking Cargo workspace compilation (cargo check)..."
if cargo check --workspace; then
    echo -e "  ${GREEN}✓ Cargo Workspace Check: LULUS${NC}"
else
    echo -e "  ${RED}✗ Cargo Workspace Check: GAGAL${NC}"
    FAILURES=$((FAILURES + 1))
fi

echo "  - Running Accounting & Inventory Integrity Tests..."
if cargo test --package management-system-core --test accounting_inventory_integrity_tests -- --nocapture 2>&1 | tail -n 10; then
    echo -e "  ${GREEN}✓ Accounting & Inventory Integrity Tests: LULUS${NC}"
else
    echo -e "  ${RED}✗ Accounting & Inventory Integrity Tests: GAGAL${NC}"
    FAILURES=$((FAILURES + 1))
fi

# ------------------------------------------------------------------------------
# 3. Database Migration Idempotency Audit
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}▶ [3/4] Audit Idempotency Database Migrations...${NC}"
MIGRATION_ISSUES=0
if [ -d "$ROOT_DIR/database/migrations" ]; then
    for f in "$ROOT_DIR"/database/migrations/*.sql; do
        if grep -qE "^[[:space:]]*CREATE[[:space:]]+TRIGGER[[:space:]]+" "$f" 2>/dev/null; then
            TRIGGER_NAME=$(grep -E "^[[:space:]]*CREATE[[:space:]]+TRIGGER[[:space:]]+" "$f" | head -1 | awk '{print $3}')
            if ! grep -qE "DROP[[:space:]]+TRIGGER[[:space:]]+IF[[:space:]]+EXISTS[[:space:]]+$TRIGGER_NAME" "$f"; then
                echo -e "  ${YELLOW}⚠️  $(basename "$f"): Trigger '$TRIGGER_NAME' dibuat tanpa DROP TRIGGER IF EXISTS${NC}"
                MIGRATION_ISSUES=$((MIGRATION_ISSUES + 1))
            fi
        fi
    done
    if [ "$MIGRATION_ISSUES" -eq 0 ]; then
        echo -e "  ${GREEN}✓ Database Migration Triggers: AMAN & IDEMPOTENT${NC}"
    fi
fi

# ------------------------------------------------------------------------------
# 4. Staged Secrets & Sensitive Data Hygiene Check
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}▶ [4/4] Verifikasi Kebersihan Secrets & File Sensitif...${NC}"
if git diff --cached --name-only 2>/dev/null | grep -E '(\.env|\.pem|\.key)$' | grep -v '\.example'; then
    echo -e "  ${RED}✗ Peringatan: File environment/kunci rahasia ter-stage!${NC}"
    FAILURES=$((FAILURES + 1))
else
    echo -e "  ${GREEN}✓ Tidak ada file kunci/.env yang ter-stage secara tidak sengaja.${NC}"
fi

# ------------------------------------------------------------------------------
# Summary
# ------------------------------------------------------------------------------
echo ""
if [ "$FAILURES" -eq 0 ]; then
    echo -e "${GREEN}${BOLD}══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}${BOLD}✓ SEMUA VERIFIKASI LULUS! Aman untuk melakukan git commit & push. 🚀${NC}"
    echo -e "${GREEN}${BOLD}══════════════════════════════════════════════════════════════════${NC}"
    exit 0
else
    echo -e "${RED}${BOLD}══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}${BOLD}✗ DITEMUKAN $FAILURES KESALAHAN! Perbaiki sebelum melakukan git push.${NC}"
    echo -e "${RED}${BOLD}══════════════════════════════════════════════════════════════════${NC}"
    exit 1
fi
