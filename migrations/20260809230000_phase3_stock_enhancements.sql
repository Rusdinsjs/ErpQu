-- Migration 20260809230000: Phase 3 Stock & Fleet Enhancements

-- 1. Product Bundle Tables
CREATE TABLE IF NOT EXISTS product_bundles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_bundle_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id UUID NOT NULL REFERENCES product_bundles(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    qty NUMERIC(20, 9) NOT NULL,
    CONSTRAINT uq_bundle_item UNIQUE (bundle_id, item_id)
);

-- 2. Item Alternatives Table
CREATE TABLE IF NOT EXISTS item_alternatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    alternative_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_item_alternative UNIQUE (item_id, alternative_item_id)
);

-- 3. Delivery Trips (Fleet & Logistics)
CREATE TABLE IF NOT EXISTS delivery_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    trip_number VARCHAR(100) NOT NULL,
    driver_id UUID REFERENCES employees(id),
    vehicle_id UUID REFERENCES assets(id),
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- DRAFT, IN_TRANSIT, COMPLETED, CANCELLED
    departure_time TIMESTAMPTZ,
    arrival_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_trip_number UNIQUE (company_id, trip_number)
);

CREATE TABLE IF NOT EXISTS delivery_trip_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES delivery_trips(id) ON DELETE CASCADE,
    delivery_note_id UUID NOT NULL REFERENCES sales_shipments(id) ON DELETE CASCADE,
    stop_order INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, DELIVERED, FAILED
    CONSTRAINT uq_trip_stop UNIQUE (trip_id, delivery_note_id)
);
