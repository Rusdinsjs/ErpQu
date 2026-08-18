# ERPQu Incident Response Runbook

## Overview
This runbook provides step-by-step procedures for SREs, Operators, and System Administrators to diagnose, mitigate, and resolve production incidents in ERPQu using Correlation IDs and system diagnostics.

---

## 1. Initial Triage via Correlation ID

When a user or automated alert reports an error (e.g. HTTP 500 or failed transaction), obtain the **Correlation ID** from:
- API HTTP Response Header: `X-Correlation-ID`
- User Error Screen / UI Error Toast
- Alertmanager notification payload

### Step 1: Trace Logs using Correlation ID
Execute the following SSH command on the production server (`srv1870100` / `187.77.156.109`):

```bash
docker logs erpqu-backend 2>&1 | grep "<CORRELATION_ID>"
```

*Example Output:*
```json
{"timestamp":"2026-08-18T10:00:00Z","level":"ERROR","message":"Failed to post journal entry: GL Imbalance","correlation_id":"corr-abc-123","target":"management_system_finance"}
```

---

## 2. Standard Incident Scenarios & Remediation

### Scenario A: Outbox Processing Lag / Event Backlog
- **Alert**: `OutboxProcessingLag`
- **Symptom**: Outbox pending event count exceeds threshold (> 50 events).
- **Diagnosis Command**:
  ```bash
  ssh root@187.77.156.109 "docker exec erpqu-db psql -U postgres -d management_system -c 'SELECT status, count(*) FROM outbox GROUP BY status;'"
  ```
- **Remediation**:
  1. Check backend worker logs: `docker logs --tail 100 erpqu-backend | grep outbox`
  2. If events are stuck in `FAILED`, trigger manual retry via API:
     ```bash
     curl -X POST http://localhost:8181/api/admin/outbox/<EVENT_ID>/retry \
       -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
     ```

---

### Scenario B: Database Connection Saturation
- **Alert**: `DatabaseSaturation`
- **Symptom**: Postgres connection pool reaches max connections (200).
- **Diagnosis Command**:
  ```bash
  ssh root@187.77.156.109 "docker exec erpqu-db psql -U postgres -d management_system -c 'SELECT state, count(*) FROM pg_stat_activity GROUP BY state;'"
  ```
- **Remediation**:
  1. Terminate idle connection spikes if necessary:
     ```sql
     SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND state_change < NOW() - INTERVAL '5 minutes';
     ```
  2. Restart backend container gracefully to reset active pools:
     ```bash
     docker compose -f /opt/erpqu/docker-compose.prod.yml restart backend
     ```

---

### Scenario C: General Ledger (GL) Imbalance
- **Alert**: `GeneralLedgerImbalance`
- **Symptom**: Financial invariant breached (Debit sum != Credit sum).
- **Diagnosis Command**:
  ```bash
  ssh root@187.77.156.109 "docker exec erpqu-db psql -U postgres -d management_system -c 'SELECT journal_entry_id, SUM(debit) as total_debit, SUM(credit) as total_credit FROM journal_lines GROUP BY journal_entry_id HAVING SUM(debit) != SUM(credit);'"
  ```
- **Remediation**:
  1. Identify the failing journal entry ID and correlation ID.
  2. Quarantine the affected transaction and initiate accounting reversal voucher.

---

## 3. System Health Probes & Emergency Restarts

| Probe Endpoint | Purpose | Target Response |
|---|---|---|
| `GET /health` | Liveness Probe | `HTTP 200 {"status":"ok"}` |
| `GET /ready` | Readiness Probe (DB + Redis) | `HTTP 200 {"status":"ready"}` |
| `GET /metrics` | Prometheus Metrics Exporter | `HTTP 200 (Prometheus text format)` |

### Emergency Service Restart Protocol
```bash
cd /opt/erpqu
docker compose -f docker-compose.prod.yml restart backend
```
