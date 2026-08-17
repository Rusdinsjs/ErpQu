#!/usr/bin/env bash
# ==============================================================================
# ERPQu VPS Automated Production Deployment Script
# Usage: ./deploy-vps.sh [--migrate-only|--full|--status]
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_NC='\033[0m'

log_info() { echo -e "${COLOR_GREEN}[INFO]${COLOR_NC} $1"; }
log_warn() { echo -e "${COLOR_YELLOW}[WARN]${COLOR_NC} $1"; }
log_error() { echo -e "${COLOR_RED}[ERROR]${COLOR_NC} $1"; }

# 1. Check prerequisites
log_info "Checking deployment prerequisites..."
command -v docker >/dev/null 2>&1 || { log_error "Docker is required but not installed."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || command -v "docker compose" >/dev/null 2>&1 || { log_error "Docker Compose is required."; exit 1; }

# 2. Check .env file
if [ ! -f ".env" ]; then
    if [ -f ".env.production.example" ]; then
        log_warn ".env file missing. Copying from .env.production.example..."
        cp .env.production.example .env
        log_warn "PLEASE EDIT .env AND SET STRONG SECRETS BEFORE PROCEEDING!"
        exit 1
    else
        log_error "No .env or .env.production.example found!"
        exit 1
    fi
fi

# 3. Create required host data directories
log_info "Creating data directories..."
mkdir -p uploads backups postgres_data redis_data

# 4. Handle command line flags
ACTION="${1:---full}"

case "$ACTION" in
    --migrate-only)
        log_info "Running database migrations..."
        docker compose -f docker-compose.prod.yml --profile migrate up --build
        log_info "Migrations completed."
        ;;
    --status)
        log_info "System Container Status:"
        docker compose -f docker-compose.prod.yml ps
        ;;
    --full|*)
        log_info "Running pre-deployment database migration..."
        docker compose -f docker-compose.prod.yml --profile migrate up --build

        log_info "Starting full production container stack..."
        docker compose -f docker-compose.prod.yml up -d --build

        log_info "Verifying health status..."
        sleep 5
        docker compose -f docker-compose.prod.yml ps

        log_info "ERPQu Production Deployment Successful!"
        log_info "Health Check:  curl http://localhost:8181/health/detailed"
        log_info "Prometheus:    curl http://localhost:8181/metrics"
        ;;
esac
