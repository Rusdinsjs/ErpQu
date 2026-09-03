use crate::api::handlers::{inventory_handler, stock_document_handler};
use crate::api::server::AppState;
use axum::{
    routing::{delete, get, post},
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
            "/categories/:id",
            get(inventory_handler::get_inventory_category)
                .put(inventory_handler::update_inventory_category)
                .delete(inventory_handler::delete_inventory_category),
        )
        .route(
            "/items",
            get(inventory_handler::list_items).post(inventory_handler::create_item),
        )
        .route(
            "/alerts/low-stock",
            get(inventory_handler::list_low_stock_items),
        )
        .route(
            "/analytics/abc",
            get(inventory_handler::get_abc_analysis),
        )
        .route(
            "/items/:id",
            get(inventory_handler::get_item)
                .put(inventory_handler::update_item)
                .delete(inventory_handler::delete_item),
        )
        .route("/movements", get(inventory_handler::list_movements_history))
        .route("/items/:id/adjust", post(inventory_handler::adjust_stock))
        .route("/adjust/batch", post(inventory_handler::batch_adjust_stock))
        .route(
            "/warehouses",
            get(inventory_handler::list_warehouses).post(inventory_handler::create_warehouse),
        )
        .route(
            "/warehouses/:id",
            delete(inventory_handler::delete_warehouse),
        )
        // Stock Entries
        .route(
            "/stock-entries",
            post(stock_document_handler::create_stock_entry),
        )
        .route(
            "/stock-entries/:id",
            get(stock_document_handler::get_stock_entry),
        )
        .route(
            "/stock-entries/company/:company_id",
            get(stock_document_handler::list_stock_entries),
        )
        .route(
            "/stock-entries/:id/submit",
            post(stock_document_handler::submit_stock_entry),
        )
        // Material Requests
        .route(
            "/material-requests",
            post(stock_document_handler::create_material_request),
        )
        .route(
            "/material-requests/:id",
            get(stock_document_handler::get_material_request),
        )
        .route(
            "/material-requests/company/:company_id",
            get(stock_document_handler::list_material_requests),
        )
        .route(
            "/material-requests/:id/approve",
            post(stock_document_handler::approve_material_request),
        )
        // Product Bundles
        .route(
            "/product-bundles",
            post(inventory_handler::create_product_bundle),
        )
        .route(
            "/product-bundles/parent/:parent_item_id",
            get(inventory_handler::get_product_bundle),
        )
        // Item Alternatives
        .route(
            "/item-alternatives",
            post(inventory_handler::add_item_alternative),
        )
        .route(
            "/item-alternatives/item/:item_id",
            get(inventory_handler::get_item_alternatives),
        )
        // Warehouse Bins & Location Ledger
        .route(
            "/warehouses/bins",
            post(inventory_handler::create_warehouse_bin),
        )
        .route(
            "/warehouses/bins/:id",
            get(inventory_handler::get_warehouse_bin)
                .delete(inventory_handler::delete_warehouse_bin),
        )
        .route(
            "/warehouses/:warehouse_id/bins",
            get(inventory_handler::list_warehouse_bins),
        )
        .route(
            "/warehouses/bins/:warehouse_bin_id/balances",
            get(inventory_handler::list_bin_balances),
        )
        .route(
            "/items/:item_id/bin-balances",
            get(inventory_handler::list_bin_balances_by_item),
        )
}
