# Security Policy

## Supported Versions

Only the latest stable release of ERPQu Management System is supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1.0 | :x:                |

## Reporting a Vulnerability

We take the security of ERPQu Management System seriously. If you discover a security vulnerability, please follow our Responsible Disclosure Policy:

1. **Do NOT open a public issue.**
2. Send an email describing the vulnerability to `security@erpqu.internal` or contact the system administrator directly.
3. Include detailed steps to reproduce the issue, proof of concept (PoC), and potential impact.

### Response & Handling Process

- **Acknowledgement:** We will acknowledge receipt of your vulnerability report within 24–48 hours.
- **Assessment:** Our security team will review and validate the report within 5 business days.
- **Fix & Patch:** Valid vulnerabilities will be addressed in a security patch within 14 days depending on severity.
- **Disclosure:** Public disclosure will take place after a patch has been deployed and verified.

## Containment & Production Safety Guidelines

- Never run ERPQu with default credentials (`change_this_password`, `change-this-jwt-secret-in-production-min-32-chars`) in a production environment.
- Always enforce HTTPS/TLS and set `ENVIRONMENT=production`.
- Keep `.env`, log files, and database backups out of public Git repositories.
