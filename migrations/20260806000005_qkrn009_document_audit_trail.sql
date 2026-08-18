-- QKRN-009: Append-only Document Audit Trail
--
-- Records every lifecycle action on ERP documents.
-- Application role has INSERT + SELECT only — UPDATE and DELETE are revoked.

CREATE TABLE IF NOT EXISTS document_audit_trail (
    id               UUID         NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id      UUID         NOT NULL,
    document_type    TEXT         NOT NULL,   -- e.g. 'INVOICE', 'BILL', 'PURCHASE_ORDER'
    action           TEXT         NOT NULL,   -- CREATE, UPDATE, SUBMIT, POST, CANCEL, AMEND, …
    actor_id         UUID         NOT NULL,
    tenant_id        UUID         NOT NULL,
    company_id       UUID         NULL,
    from_status      TEXT         NULL,
    to_status        TEXT         NULL,
    document_version INTEGER      NOT NULL DEFAULT 1,
    reason           TEXT         NULL,
    correlation_id   TEXT         NOT NULL DEFAULT '',
    recorded_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Lookup by document (e.g. full history for INV-2026-00001)
CREATE INDEX IF NOT EXISTS idx_doc_audit_document
    ON document_audit_trail (document_id, recorded_at);

-- Lookup by actor (e.g. all actions by user X today)
CREATE INDEX IF NOT EXISTS idx_doc_audit_actor
    ON document_audit_trail (actor_id, recorded_at);

-- Lookup by tenant (for admin / compliance queries)
CREATE INDEX IF NOT EXISTS idx_doc_audit_tenant
    ON document_audit_trail (tenant_id, recorded_at);

-- Strict statement-level append-only trigger
CREATE OR REPLACE FUNCTION prevent_document_audit_trail_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'document_audit_trail table is append-only and cannot be updated or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_document_audit_trail_mutation ON document_audit_trail;
CREATE TRIGGER trg_prevent_document_audit_trail_mutation
BEFORE UPDATE OR DELETE ON document_audit_trail
FOR EACH STATEMENT EXECUTE FUNCTION prevent_document_audit_trail_mutation();
