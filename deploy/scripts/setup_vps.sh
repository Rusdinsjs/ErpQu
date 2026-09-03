#!/usr/bin/env bash

# ==============================================================================
# ERPQu Enterprise - Production VPS Auto-Provisioning Script
# ==============================================================================
# Supported OS: Ubuntu 22.04 LTS, Ubuntu 24.04 LTS, Debian 12
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/Rusdinsjs/erp-system/main/deploy/scripts/setup_vps.sh | sudo bash
#   - or -
#   chmod +x deploy/scripts/setup_vps.sh && sudo ./deploy/scripts/setup_vps.sh
# ==============================================================================

set -eo pipefail

# Text Formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}${BOLD}"
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║          🚀 ERPQu Production VPS Automated Provisioning          ║"
echo "║     Enterprise Hardening, Docker, UFW, Fail2ban & Deployment     ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 1. Root Check
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Skrip ini harus dijalankan sebagai ROOT (gunakan: sudo bash setup_vps.sh)${NC}"
  exit 1
fi

# Detect Public IP
SERVER_IP=$(curl -s4 https://ifconfig.me || curl -s4 https://api.ipify.org || echo "IP_SERVER_ANDA")
echo -e "${GREEN}✓ Terdeteksi IP Publik Server: ${BOLD}${SERVER_IP}${NC}\n"

# 2. Update System Packages
echo -e "${CYAN}▶ [1/7] Memperbarui Repositori Paket Sistem...${NC}"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get install -y \
  apt-transport-https \
  ca-certificates \
  curl \
  wget \
  gnupg \
  lsb-release \
  git \
  ufw \
  fail2ban \
  openssl \
  jq \
  htop \
  net-tools \
  tar \
  gzip

# Set Timezone to Asia/Jakarta (WIB)
timedatectl set-timezone Asia/Jakarta
echo -e "${GREEN}✓ Paket sistem diperbarui dan timezone ditetapkan ke Asia/Jakarta (WIB).${NC}\n"

# 3. Setup 4GB Swap Space (Prevent OOM during spikes)
echo -e "${CYAN}▶ [2/7] Mengonfigurasi Swap Memory (4GB)...${NC}"
if [ $(swapon --show | wc -l) -le 1 ]; then
  echo "  Membuat file swap 4GB di /swapfile..."
  fallocate -l 4G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=4096
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  if ! grep -q '/swapfile' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
  sysctl vm.swappiness=10
  echo 'vm.swappiness=10' >> /etc/sysctl.d/99-swappiness.conf
  echo -e "${GREEN}✓ Swap 4GB berhasil diaktifkan.${NC}\n"
else
  echo -e "${YELLOW}✓ Swap memory sudah terpasang, melewati langkah ini.${NC}\n"
fi

# 4. Install Docker Engine & Docker Compose
echo -e "${CYAN}▶ [3/7] Memasang Docker Engine & Docker Compose v2...${NC}"
if ! command -v docker &> /dev/null; then
  echo "  Menginstal Docker resmi..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
  echo -e "${GREEN}✓ Docker Engine berhasil dipasang.${NC}\n"
else
  echo -e "${YELLOW}✓ Docker sudah terpasang: $(docker --version)${NC}\n"
fi

# 5. Security & Firewall Hardening (UFW & Fail2ban)
echo -e "${CYAN}▶ [4/7] Hardening Keamanan (Firewall UFW & Fail2ban)...${NC}"
# UFW setup
ufw --force reset >/dev/null 2>&1 || true
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH Port'
ufw allow 80/tcp comment 'HTTP Web'
ufw allow 443/tcp comment 'HTTPS SSL'
ufw --force enable
echo -e "${GREEN}✓ Firewall UFW aktif: Port 22, 80, 443 terbuka (Database & Redis terlindungi internal).${NC}"

# Fail2ban configuration
cat << 'EOF' > /etc/fail2ban/jail.local
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
EOF

systemctl restart fail2ban || true
echo -e "${GREEN}✓ Fail2ban aktif memproteksi serangan brute-force SSH.${NC}\n"

# 6. Setup ERPQu Directory & Clone Repository
echo -e "${CYAN}▶ [5/7] Menyiapkan Direktori & Kode Aplikasi (/opt/erpqu)...${NC}"
mkdir -p /opt/erpqu
mkdir -p /backups
cd /opt/erpqu

if [ ! -d "/opt/erpqu/.git" ]; then
  echo "  Mengkloning repositori ERPQu..."
  git clone https://github.com/Rusdinsjs/erp-system.git /opt/erpqu
else
  echo "  Repositori sudah ada, menarik commit terbaru..."
  git fetch --all --prune
  git checkout main
  git pull origin main
fi
echo -e "${GREEN}✓ Repositori ERPQu siap di /opt/erpqu.${NC}\n"

# 7. Generate Secure Production .env File
echo -e "${CYAN}▶ [6/7] Menyiapkan Konfigurasi Lingkungan Produksi (.env)...${NC}"
if [ ! -f "/opt/erpqu/.env" ]; then
  echo "  Menghasilkan kata sandi aman acak (Strong Random Secrets)..."
  DB_PASS=$(openssl rand -hex 20)
  APP_PASS=$(openssl rand -hex 20)
  REDIS_PASS=$(openssl rand -hex 20)
  JWT_SEC=$(openssl rand -base64 36 | tr -d '\n')

  cat << EOF > /opt/erpqu/.env
# ==============================================================================
# ERPQu Production Environment Configuration
# Generated automatically by setup_vps.sh on $(date)
# ==============================================================================
NGINX_HOST=${SERVER_IP}
IMAGE_TAG=latest

# Database
DB_USER=postgres
DB_PASSWORD=${DB_PASS}
DB_NAME=management_system
DB_APP_USER=erpqu_app
DB_APP_PASSWORD=${APP_PASS}

# Redis
REDIS_PASSWORD=${REDIS_PASS}

# Security & Authentication
JWT_SECRET=${JWT_SEC}
JWT_EXPIRATION_HOURS=24

# Server & Runtime
SERVER_HOST=0.0.0.0
SERVER_PORT=8181
ENVIRONMENT=production
RUST_LOG=management_system=info,tower_http=info,sqlx=warn
LOG_FORMAT=json

# Access Control
CORS_ALLOWED_ORIGINS=http://${SERVER_IP},https://${SERVER_IP}
ALLOW_PUBLIC_REGISTRATION=false
ALLOW_DEV_TEST_ROUTES=false
UPLOAD_MAX_SIZE_MB=15

# SMTP (Isi jika ingin mengaktifkan email)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@erpqu.com
EOF

  chmod 600 /opt/erpqu/.env
  echo -e "${GREEN}✓ Berkas /opt/erpqu/.env berhasil dibuat dengan kata sandi acak kuat.${NC}\n"
else
  echo -e "${YELLOW}✓ Berkas .env sudah ada di /opt/erpqu/.env, mempertahankan konfigurasi eksisting.${NC}\n"
fi

# 8. Generate SSH Deploy Key for GitHub Actions CD
echo -e "${CYAN}▶ [7/7] Menyiapkan Kunci SSH untuk Otomatisasi GitHub Actions (CD)...${NC}"
SSH_KEY_PATH="/root/.ssh/id_erpqu_github_actions"

if [ ! -f "$SSH_KEY_PATH" ]; then
  ssh-keygen -t ed25519 -C "github-actions-cd@erpqu" -f "$SSH_KEY_PATH" -N "" >/dev/null 2>&1
  # Add public key to authorized_keys
  touch /root/.ssh/authorized_keys
  chmod 600 /root/.ssh/authorized_keys
  cat "${SSH_KEY_PATH}.pub" >> /root/.ssh/authorized_keys
  echo -e "${GREEN}✓ SSH Deploy Key baru berhasil digenerate.${NC}\n"
else
  echo -e "${YELLOW}✓ SSH Deploy Key sudah tersedia.${NC}\n"
fi

echo -e "${GREEN}${BOLD}"
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║          🎉 SERVER VPS BERHASIL DIPROVISI & SIAP PAKAI!          ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${YELLOW}${BOLD}Langkah Selanjutnya: Hubungkan dengan GitHub Repository Secrets${NC}"
echo -e "Buka: ${CYAN}https://github.com/Rusdinsjs/erp-system/settings/secrets/actions${NC}"
echo -e "Tambahkan 3 Secret berikut:\n"

echo -e "${BOLD}1. VPS_HOST${NC}"
echo -e "   Value: ${CYAN}${SERVER_IP}${NC}\n"

echo -e "${BOLD}2. VPS_USERNAME${NC}"
echo -e "   Value: ${CYAN}root${NC}\n"

echo -e "${BOLD}3. VPS_SSH_KEY${NC}"
echo -e "   Value (Salin seluruh blok di bawah termasuk BEGIN dan END):"
echo -e "${YELLOW}------------------------------------------------------------------${NC}"
cat "$SSH_KEY_PATH"
echo -e "${YELLOW}------------------------------------------------------------------${NC}\n"

echo -e "${CYAN}💡 Tips: Untuk menyalakan stack aplikasi sekarang juga secara manual:${NC}"
echo -e "   cd /opt/erpqu && docker compose -f docker-compose.prod.yml up -d --build\n"
