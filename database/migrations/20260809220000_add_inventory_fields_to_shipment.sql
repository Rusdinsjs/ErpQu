-- Migration 20260809220000: Add Inventory Fields to Sales Shipments
ALTER TABLE sales_shipments ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES public.warehouses(id);
ALTER TABLE sales_shipment_items ADD COLUMN IF NOT EXISTS item_id UUID REFERENCES inventory.inventory_items(id);
