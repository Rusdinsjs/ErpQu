use crate::api::handlers::{
    inventory_handler, warehouse_handler, stock_entry_handler, material_request_handler, uom_handler, item_tracking_handler, master_data_extended_handler, outbound_logistics_handler, quality_inspection_handler, landed_cost_voucher_handler, stock_report_handler, stock_settings_handler, stock_analytics_handler,
};
use crate::api::server::AppState;
use axum::{
    routing::{delete, get, post, put},
    Router,
};

pub fn inventory_routes() -> Router<AppState> {
    Router::new()
        .route(
            "/categories",
            get(inventory_handler::list_inventory_categories)
                .post(inventory_handler::create_inventory_category),
        )
        .route(
            "/items",
            get(inventory_handler::list_items).post(inventory_handler::create_item),
        )
        .route("/items/bulk", post(inventory_handler::bulk_create_items))
        .route("/items/:id", get(inventory_handler::get_item))
        .route("/items/:id/adjust", post(inventory_handler::adjust_stock))
        .route(
            "/items/:id/documents",
            get(inventory_handler::list_documents).post(inventory_handler::create_document),
        )
        .route("/adjust/batch", post(inventory_handler::batch_adjust_stock))
        .route(
            "/warehouses",
            get(warehouse_handler::list_warehouses).post(warehouse_handler::create_warehouse),
        )
        .route(
            "/warehouses/:id",
            axum::routing::delete(warehouse_handler::delete_warehouse),
        )
        .route(
            "/warehouses/bins/:bin_id/balances",
            get(warehouse_handler::list_bin_balances),
        )
        .route(
            "/warehouses/company/:company_id/kpi",
            get(warehouse_handler::get_stock_dashboard_kpi),
        )
        .route(
            "/stock-entries",
            post(stock_entry_handler::create_stock_entry),
        )
        .route(
            "/stock-entries/company/:company_id",
            get(stock_entry_handler::list_stock_entries),
        )
        .route(
            "/stock-entries/:id",
            get(stock_entry_handler::get_stock_entry),
        )
        .route(
            "/stock-entries/:id/submit",
            post(stock_entry_handler::submit_stock_entry),
        )
        // UOM Routes
        .route("/uoms", post(uom_handler::create_uom))
        .route("/uoms/company/:company_id", get(uom_handler::list_uoms))
        .route("/uoms/:id", delete(uom_handler::delete_uom))
        // UOM Conversion Routes
        .route("/uom-conversions", post(uom_handler::create_conversion))
        .route("/uom-conversions/company/:company_id", get(uom_handler::list_conversions))
        .route("/uom-conversions/:id", delete(uom_handler::delete_conversion))
        // Serial Number Routes
        .route("/serial-numbers", post(item_tracking_handler::create_serial_number))
        .route("/serial-numbers/company/:company_id", get(item_tracking_handler::list_serial_numbers))
        .route("/serial-numbers/:id", delete(item_tracking_handler::delete_serial_number))
        // Batch Routes
        .route("/batches", post(item_tracking_handler::create_batch))
        .route("/batches/company/:company_id", get(item_tracking_handler::list_batches))
        .route("/batches/:id", delete(item_tracking_handler::delete_batch))
        // Brands Routes
        .route("/brands", post(master_data_extended_handler::create_brand))
        .route("/brands/company/:company_id", get(master_data_extended_handler::list_brands))
        .route("/brands/:id", delete(master_data_extended_handler::delete_brand))
        // Manufacturer Routes
        .route("/manufacturers", post(master_data_extended_handler::create_manufacturer))
        .route("/manufacturers/company/:company_id", get(master_data_extended_handler::list_manufacturers))
        .route("/manufacturers/:id", delete(master_data_extended_handler::delete_manufacturer))
        // Item Attributes Routes
        .route("/item-attributes", post(master_data_extended_handler::create_attribute))
        .route("/item-attributes/company/:company_id", get(master_data_extended_handler::list_attributes))
        .route("/item-attributes/:id", delete(master_data_extended_handler::delete_attribute))
        // Item Alternatives Routes
        .route("/item-alternatives-new", post(master_data_extended_handler::create_alternative))
        .route("/item-alternatives-new/company/:company_id", get(master_data_extended_handler::list_alternatives))
        .route("/item-alternatives-new/:id", delete(master_data_extended_handler::delete_alternative))
        // Product Bundles Routes
        .route("/product-bundles", post(master_data_extended_handler::create_product_bundle))
        .route("/product-bundles/company/:company_id", get(master_data_extended_handler::list_product_bundles))
        .route("/product-bundles/:id", delete(master_data_extended_handler::delete_product_bundle))
        
        .route("/item-tax-templates", post(master_data_extended_handler::create_item_tax_template))
        .route("/item-tax-templates/company/:company_id", get(master_data_extended_handler::list_item_tax_templates))
        .route("/item-tax-templates/:id", delete(master_data_extended_handler::delete_item_tax_template))
        
        .route("/item-manufacturers", post(master_data_extended_handler::create_item_manufacturer))
        .route("/item-manufacturers/item/:item_id", get(master_data_extended_handler::list_item_manufacturers))
        .route("/item-manufacturers/:id", delete(master_data_extended_handler::delete_item_manufacturer))
        .route(
            "/material-requests",
            post(material_request_handler::create_material_request),
        )
        .route(
            "/material-requests/company/:company_id",
            get(material_request_handler::list_material_requests),
        )
        .route(
            "/material-requests/:id",
            get(material_request_handler::get_material_request),
        )
        .route(
            "/material-requests/:id/approve",
            post(material_request_handler::approve_material_request),
        )
        // Outbound Logistics Routes
        .route("/delivery-notes", post(outbound_logistics_handler::create_delivery_note))
        .route("/delivery-notes/company/:company_id", get(outbound_logistics_handler::list_delivery_notes))
        .route("/delivery-notes/:id", delete(outbound_logistics_handler::delete_delivery_note))
        .route("/delivery-notes/:id/submit", post(outbound_logistics_handler::submit_delivery_note))
        
        .route("/pick-lists", post(outbound_logistics_handler::create_pick_list))
        .route("/pick-lists/company/:company_id", get(outbound_logistics_handler::list_pick_lists))
        .route("/pick-lists/:id", delete(outbound_logistics_handler::delete_pick_list))
        
        .route("/delivery-trips", post(outbound_logistics_handler::create_delivery_trip))
        .route("/delivery-trips/company/:company_id", get(outbound_logistics_handler::list_delivery_trips))
        .route("/delivery-trips/:id", delete(outbound_logistics_handler::delete_delivery_trip))
        
        .route("/installation-notes", post(outbound_logistics_handler::create_installation_note))
        .route("/installation-notes/company/:company_id", get(outbound_logistics_handler::list_installation_notes))
        .route("/installation-notes/:id", delete(outbound_logistics_handler::delete_installation_note))
        
        .route("/stock-reconciliations", post(outbound_logistics_handler::create_stock_reconciliation))
        .route("/stock-reconciliations/company/:company_id", get(outbound_logistics_handler::list_stock_reconciliations))
        .route("/stock-reconciliations/:id", delete(outbound_logistics_handler::delete_stock_reconciliation))
        
        // Quality Inspections
        .route("/quality-inspections", post(quality_inspection_handler::create_inspection))
        .route("/quality-inspections/company/:company_id", get(quality_inspection_handler::list_inspections))
        .route("/quality-inspections/:id/status", put(quality_inspection_handler::update_status))
        
        // Landed Cost Vouchers
        .route("/landed-cost-vouchers", post(landed_cost_voucher_handler::create_voucher))
        .route("/landed-cost-vouchers/company/:company_id", get(landed_cost_voucher_handler::list_vouchers))
        .route("/landed-cost-vouchers/:id", delete(landed_cost_voucher_handler::delete_voucher))
        
        // Stock Reports
        .route("/reports/stock-ledger/company/:company_id", get(stock_report_handler::get_stock_ledger))
        .route("/reports/stock-balance/company/:company_id", get(stock_report_handler::get_stock_balance))
        .route("/reports/stock-ageing/company/:company_id", get(stock_report_handler::get_stock_ageing))
        .route("/reports/stock-projected-qty/company/:company_id", get(stock_report_handler::get_stock_projected_qty))
        .route("/reports/stock-summary/company/:company_id", get(stock_report_handler::get_stock_summary))
        .route("/reports/batch-wise-balance/company/:company_id", get(stock_report_handler::get_batch_balance))
        .route("/reports/serial-no-status/company/:company_id", get(stock_report_handler::get_serial_no_status))
        .route("/reports/item-shortage/company/:company_id", get(stock_report_handler::get_item_shortage))

        // Stock Analytics
        .route("/analytics/warehouse-valuations/company/:company_id", get(stock_analytics_handler::get_warehouse_valuations))
        .route("/analytics/item-group-valuations/company/:company_id", get(stock_analytics_handler::get_item_group_valuations))
        .route("/analytics/movement-trends/company/:company_id", get(stock_analytics_handler::get_movement_trends))
        
        // Stock Settings
        .route("/stock-settings/company/:company_id", get(stock_settings_handler::get_stock_settings).put(stock_settings_handler::upsert_stock_settings))
}
