CREATE TABLE IF NOT EXISTS product_bundles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    new_item_code VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_bundle_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bundle_id UUID NOT NULL REFERENCES product_bundles(id) ON DELETE CASCADE,
    item_code VARCHAR(100) NOT NULL,
    qty NUMERIC(15,4) DEFAULT 1.0000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
