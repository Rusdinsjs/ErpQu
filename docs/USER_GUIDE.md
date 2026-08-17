# ERPQu End-User Feature Guide

Welcome to **ERPQu**, the enterprise-grade integrated resource planning application.

---

## 1. Asset Management & Operations

### Asset Master
- View, create, update, and search assets with custom filter tags, categories, locations, and condition states.
- Track custody transfers with complete historical audit logs.

### Preventive Maintenance & Work Orders
- Schedule recurring maintenance templates with checklist tasks and part requirements.
- Assign technicians, track task completion, sign-off approvals, and upload work order checklist photos.

### Fuel Management
- Record fuel refills, meter readings, and calculate fuel efficiency trends (liters per hour / km per liter).

---

## 2. Finance & Accounting

### Chart of Accounts
- Manage multi-tiered Chart of Accounts with active, group, and frozen state rules.
- View General Ledger reports, Balance Sheet, Profit & Loss, and Cash Flow statements.

### Period Closing (Tutup Buku)
- **Month-End Close**: Run the pre-close checklist to verify zero GL balance variance, zero unposted draft entries, and prior period closure.
- **Year-End Close**: Automatically transfer Net Income to Retained Earnings and lock the fiscal year.
- **Period Reopen**: Super-admin only feature requiring mandatory audit justification text for compliance.

### Multi-Currency & Forex
- Maintain daily exchange rates per company.
- Automatic currency conversion for cross-border transactions and realized forex gain/loss calculation.

### Indonesian Tax Compliance
- PPh 21 TER (Tarif Efektif Rata-Rata under PP 58/2023).
- PPh 23 withholding tax calculation (2% with NPWP / 4% without NPWP).
- Effective date versioning for VAT (PPN 10% → 11% → 12%).

---

## 3. Human Resource Management

### Employee Directory & Karir
- Maintain employee profile 360, employment status, department hierarchy, and job designations.

### Attendance & Overtime
- Log daily check-in / check-out with face scan or geolocation.
- Process statutory overtime (SPKL under Kepmenakertrans No. 102/2004).

### Statutory BPJS & Payroll
- Calculate BPJS Ketenagakerjaan (JHT, JKK, JKM, JP) and BPJS Kesehatan with statutory caps.
- Generate monthly salary slips and double-entry payroll GL journal postings.

---

## 4. Outbound Webhook Integration

### Webhook Subscriptions
- Register HTTPS webhook endpoints for events such as `asset.created`, `work_order.completed`, `invoice.paid`, `period.closed`.
- Payloads are signed with `HMAC-SHA256` for receiver authenticity verification.
- Automated retry engine (up to 5 attempts) with delivery status logs.
