#!/usr/bin/env python3
# DEPRECATED & REMOVED (Migration Governance Fase 16)
# Direct execution of SQL migration files bypassing _sqlx_migrations tracking is forbidden.
# Use standard sqlx migration runner (--check-migration) instead.
import sys
print("ERROR: Direct un-tracked SQL execution is deprecated. Use binary runner with --check-migration instead.")
sys.exit(1)
