CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_number VARCHAR(100) UNIQUE NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id),
    date DATE NOT NULL,
    valid_until DATE,
    status VARCHAR(50) DEFAULT 'Draft',
    total_amount NUMERIC(20,4) DEFAULT 0.0000,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    qty NUMERIC(15,4) NOT NULL DEFAULT 1.0000,
    rate NUMERIC(20,4) NOT NULL DEFAULT 0.0000,
    amount NUMERIC(20,4) NOT NULL DEFAULT 0.0000
);

CREATE INDEX IF NOT EXISTS idx_quotations_client ON quotations(client_id);
CREATE INDEX IF NOT EXISTS idx_quotations_date ON quotations(date);
