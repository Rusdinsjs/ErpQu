# ERPQu Admin & Deployment Operations Guide

## 1. Production Deployment Prerequisites

Before deploying ERPQu to production, ensure:
- Linux Server (Ubuntu 22.04 LTS / Debian 12 / RHEL 9) with Docker 24+ and Docker Compose v2.20+ installed.
- Domain configured with DNS A-records pointing to server IP (e.g. `erp.example.com` and wildcard `*.example.com`).
- Firewall ports `80` (HTTP) and `443` (HTTPS) open.

---

## 2. Docker Compose Production Deployment

### Step 1: Clone Repository & Prepare Secrets
```bash
git clone https://github.com/Rusdinsjs/erp-system.git /opt/erpqu
cd /opt/erpqu

# Create production .env file
cp .env.production.example .env
```

### Step 2: Edit Environment Variables
Edit `.env` and fill in required strong secrets:
```ini
DB_PASSWORD=SecurePostgresRootPassword123!
DB_APP_PASSWORD=SecureAppPassword123!
REDIS_PASSWORD=SecureRedisPassword123!
JWT_SECRET=Minimum32CharacterSuperSecretSigningKey!
CORS_ALLOWED_ORIGINS=https://erp.example.com,https://admin.example.com
NGINX_HOST=erp.example.com
LOG_FORMAT=json
```

### Step 3: Run Database Migrations
```bash
docker compose -f docker-compose.prod.yml --profile migrate up
```

### Step 4: Start Full System Stack
```bash
docker compose -f docker-compose.prod.yml up -d
```

### Step 5: Verify Container Health
```bash
docker compose -f docker-compose.prod.yml ps
```
Verify that `erpqu-nginx`, `erpqu-backend`, `erpqu-db`, and `erpqu-redis` report `healthy` or `running`.

---

## 3. Kubernetes Deployment (Optional)

To deploy on a Kubernetes cluster (GKE, EKS, AKS, K3s):

```bash
# 1. Create erpqu namespace
kubectl create namespace erpqu

# 2. Apply Kustomization
kubectl apply -k ./k8s/
```

Verify deployment status:
```bash
kubectl get pods,svc,ingress -n erpqu
```

---

## 4. Backup & Restore Operations

### Automated Daily Backup
The `backup` sidecar container automatically runs daily backups at 02:00 AM.
Backups are saved to the `erpqu-backups` volume with 30-day rotation.

### Manual Backup Execution
```bash
docker exec -it erpqu-db /usr/local/bin/backup.sh
```

### Database Restore Procedure
To restore a backup file to a fresh database:
```bash
chmod +x ./scripts/restore.sh
./scripts/restore.sh /path/to/backups/erpqu_backup_20260817_020000.sql.gz
```

---

## 5. Observability & SRE Monitoring

### Prometheus Metrics
Prometheus metrics are available on the backend container at `/metrics`:
```bash
curl http://localhost:8080/metrics
```

To run Prometheus monitoring container:
```bash
docker compose -f docker-compose.prod.yml --profile monitoring up -d
```
Access Prometheus dashboard at `http://localhost:9090`.

### Health Check Endpoints
- **Liveness Probe**: `GET http://localhost:8080/health` (HTTP 200 OK)
- **Readiness Probe**: `GET http://localhost:8080/health/ready` (Checks PostgreSQL connectivity)
- **Detailed Diagnostics**: `GET http://localhost:8080/health/detailed` (Uptime, DB latency, memory)

### Production Logs
When `LOG_FORMAT=json` is set, logs are emitted in structured JSON:
```bash
docker logs -f erpqu-backend
```
Can be forwarded to Grafana Loki, ELK, or CloudWatch Logs.
