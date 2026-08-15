-- Migration: Phase 3 Commercial Document Reference Graph Links (QGRAPH-001)

CREATE TABLE IF NOT EXISTS public.commercial_document_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID,
    source_type VARCHAR(100) NOT NULL, -- e.g., 'QUOTATION', 'SALES_ORDER', 'DELIVERY_NOTE', 'PURCHASE_REQUEST', 'PURCHASE_ORDER', 'ASSET', 'RENTAL_CONTRACT'
    source_id UUID NOT NULL,
    target_type VARCHAR(100) NOT NULL, -- e.g., 'SALES_INVOICE', 'PURCHASE_BILL', 'PAYMENT_ENTRY', 'GL_ENTRY', 'INVENTORY_MOVEMENT'
    target_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    CONSTRAINT uk_document_link_pair UNIQUE (source_type, source_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_doc_link_source ON public.commercial_document_links(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_doc_link_target ON public.commercial_document_links(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_doc_link_company ON public.commercial_document_links(company_id);
