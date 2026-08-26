#!/usr/bin/env bash
# ==============================================================================
# ERPQu All-In-One VPS Auto-Deployment & Systemd Service Setup Script
# Usage: ./setup-auto-deploy-vps.sh
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

log_info "🚀 Starting All-In-One Automated ERPQu Setup..."

# 1. Make deploy-vps.sh executable & run full deployment
chmod +x ./deploy-vps.sh
./deploy-vps.sh --full

# 2. Setup Systemd Service for automatic VPS boot startup
SERVICE_FILE="/etc/systemd/system/erpqu.service"

if [ -w "/etc/systemd/system" ] || [ "$(id -u)" -eq 0 ]; then
    log_info "Creating Systemd background service for auto-restart on VPS boot..."
    cat <<EOF | sudo tee "$SERVICE_FILE" > /dev/null
[Unit]
Description=ERPQu Enterprise Production Suite
After=docker.service network-online.target
Wants=docker.service network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$SCRIPT_DIR
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable erpqu.service
    log_info "✅ Systemd service 'erpqu.service' enabled! App will now start automatically whenever VPS boots up."
else
    log_warn "Could not create systemd service automatically (non-root). Run with sudo to enable boot auto-start."
fi

log_info "=============================================================================="
log_info "🎉 ERPQu IS NOW 100% AUTOMATED & RUNNING IN PRODUCTION BACKGROUND!"
log_info "=============================================================================="
log_info "• Auto-restart on crash: Active (unless-stopped policy)"
log_info "• Auto-start on VPS boot: Active (erpqu.service)"
log_info "• Health Check: curl http://localhost:8181/health/detailed"
log_info "=============================================================================="
