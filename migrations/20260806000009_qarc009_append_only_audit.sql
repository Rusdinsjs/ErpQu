-- QARC-009: Append-only Audit DB Enforcement
--
-- Revokes UPDATE and DELETE permissions on document_audit_trail and audit_logs
-- and installs strict append-only trigger enforcement.

DO $$
BEGIN
    -- Revoke permissions for erpqu_app if the role exists
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'erpqu_app') THEN
        EXECUTE 'REVOKE ALL ON TABLE document_audit_trail FROM erpqu_app';
        EXECUTE 'REVOKE ALL ON TABLE audit_logs FROM erpqu_app';
        EXECUTE 'GRANT SELECT, INSERT ON TABLE document_audit_trail TO erpqu_app';
        EXECUTE 'GRANT SELECT, INSERT ON TABLE audit_logs TO erpqu_app';
    END IF;

    -- Revoke permissions for app_role if the role exists
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_role') THEN
        EXECUTE 'REVOKE ALL ON TABLE document_audit_trail FROM app_role';
        EXECUTE 'REVOKE ALL ON TABLE audit_logs FROM app_role';
        EXECUTE 'GRANT SELECT, INSERT ON TABLE document_audit_trail TO app_role';
        EXECUTE 'GRANT SELECT, INSERT ON TABLE audit_logs TO app_role';
    END IF;
END $$;

REVOKE UPDATE, DELETE, TRUNCATE ON TABLE document_audit_trail FROM PUBLIC;
REVOKE UPDATE, DELETE, TRUNCATE ON TABLE audit_logs FROM PUBLIC;

-- Append-only trigger enforcement on audit_logs
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'audit_logs table is append-only and cannot be updated or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_log_update ON audit_logs;
CREATE TRIGGER trg_prevent_audit_log_update
BEFORE UPDATE ON audit_logs
FOR EACH STATEMENT EXECUTE FUNCTION prevent_audit_log_mutation();

DROP TRIGGER IF EXISTS trg_prevent_audit_log_delete ON audit_logs;
CREATE TRIGGER trg_prevent_audit_log_delete
BEFORE DELETE ON audit_logs
FOR EACH STATEMENT EXECUTE FUNCTION prevent_audit_log_mutation();

-- Append-only trigger enforcement on document_audit_trail
CREATE OR REPLACE FUNCTION prevent_document_audit_trail_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'document_audit_trail table is append-only and cannot be updated or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_doc_audit_update ON document_audit_trail;
CREATE TRIGGER trg_prevent_doc_audit_update
BEFORE UPDATE ON document_audit_trail
FOR EACH STATEMENT EXECUTE FUNCTION prevent_document_audit_trail_mutation();

DROP TRIGGER IF EXISTS trg_prevent_doc_audit_delete ON document_audit_trail;
CREATE TRIGGER trg_prevent_doc_audit_delete
BEFORE DELETE ON document_audit_trail
FOR EACH STATEMENT EXECUTE FUNCTION prevent_document_audit_trail_mutation();
