//! Route Definitions

use axum::{
    extract::Path,
    handler::Handler,
    middleware as axum_middleware,
    routing::{delete, get, patch, post, put},
    Extension, Router,
};


use crate::api::handlers::finance_handler;
use crate::api::handlers::purchase_receipt_handler;
use crate::api::handlers::*;
use crate::api::middleware::{
    auth_middleware,
    rbac::{admin_only_middleware, require_permission},
};
use crate::api::server::AppState;
use crate::domain::entities::UserClaims;

pub fn create_router(state: AppState) -> Router {
    // Public routes
    let public_routes = Router::new()
        .route("/health", get(health_check))
        .route("/api/auth/login", post(login))
        .route("/api/auth/register", post(register))
        .route(
            "/api/upload",
            post(upload_handler::upload_file).layer(tower_http::limit::RequestBodyLimitLayer::new(
                10 * 1024 * 1024,
            )),
        )
        .route("/ws", get(notification_ws::ws_handler));

    // Lookup routes
    let lookup_routes = Router::new()
        .route("/api/lookups/currencies", get(list_currencies))
        .route("/api/lookups/units", get(list_units))
        .route("/api/lookups/conditions", get(list_conditions))
        .route(
            "/api/lookups/maintenance-types",
            get(list_maintenance_types),
        );

    // Protected routes
    
    // Fix: Instantiate missing handlers for Sales & Buying modules
    let sales_master_repo = std::sync::Arc::new(crate::infrastructure::repositories::SalesMasterDataRepository::new(state.pool.clone()));
    let sales_master_handler = crate::api::handlers::SalesMasterDataHandler::new(sales_master_repo);

    let sales_pricing_repo = std::sync::Arc::new(crate::infrastructure::repositories::SalesPricingDataRepository::new(state.pool.clone()));
    let sales_pricing_handler = crate::api::handlers::SalesPricingDataHandler::new(sales_pricing_repo);

    let sales_pos_repo = std::sync::Arc::new(crate::infrastructure::repositories::SalesPosDataRepository::new(state.pool.clone()));
    let sales_pos_handler = crate::api::handlers::SalesPosDataHandler::new(sales_pos_repo);

    let sales_setup_repo = std::sync::Arc::new(crate::infrastructure::repositories::SalesSetupDataRepository::new(state.pool.clone()));
    let sales_setup_handler = crate::api::handlers::SalesSetupDataHandler::new(sales_setup_repo);

    let buying_master_repo = std::sync::Arc::new(crate::infrastructure::repositories::BuyingMasterDataRepository::new(state.pool.clone()));
    let buying_master_handler = crate::api::handlers::BuyingMasterDataHandler::new(buying_master_repo);

    let buying_quotation_repo = std::sync::Arc::new(crate::infrastructure::repositories::BuyingQuotationDataRepository::new(state.pool.clone()));
    let buying_quotation_handler = crate::api::handlers::BuyingQuotationDataHandler::new(buying_quotation_repo);

    let buying_scorecard_repo = std::sync::Arc::new(crate::infrastructure::repositories::BuyingScorecardDataRepository::new(state.pool.clone()));
    let buying_scorecard_handler = crate::api::handlers::BuyingScorecardDataHandler::new(buying_scorecard_repo);

    let protected_routes = Router::new()
        // Assets
        .route(
            "/api/assets/expiring",
            get(get_expiring_assets
                .layer(axum_middleware::from_fn(require_permission("asset.read")))),
        )
        .route(
            "/api/assets",
            get(list_assets.layer(axum_middleware::from_fn(require_permission("asset.read"))))
                .post(
                    create_asset
                        .layer(axum_middleware::from_fn(require_permission("asset.create"))),
                ),
        )
        .route(
            "/api/assets/bulk",
            post(
                bulk_create_assets
                    .layer(axum_middleware::from_fn(require_permission("asset.create"))),
            )
            .layer(tower_http::limit::RequestBodyLimitLayer::new(
                10 * 1024 * 1024,
            )),
        )
        .route(
            "/api/assets/bulk-update",
            post(
                bulk_update_assets
                    .layer(axum_middleware::from_fn(require_permission("asset.update"))),
            )
            .layer(tower_http::limit::RequestBodyLimitLayer::new(
                10 * 1024 * 1024,
            )),
        )
        .route(
            "/api/assets/search",
            get(search_assets.layer(axum_middleware::from_fn(require_permission("asset.read")))),
        )
        .route(
            "/api/assets/:id",
            get(get_asset.layer(axum_middleware::from_fn(require_permission("asset.read"))))
                .put(
                    update_asset
                        .layer(axum_middleware::from_fn(require_permission("asset.update"))),
                )
                .delete(
                    delete_asset
                        .layer(axum_middleware::from_fn(require_permission("asset.delete"))),
                ),
        )
        .route(
            "/api/assets/:id/sell",
            post(sell_asset.layer(axum_middleware::from_fn(require_permission("asset.update")))),
        )
        .route(
            "/api/assets/export",
            get(export_assets.layer(axum_middleware::from_fn(require_permission("asset.read")))),
        )
        .route(
            "/api/assets/:id/documents",
            get(get_asset_documents
                .layer(axum_middleware::from_fn(require_permission("asset.read"))))
            .post(
                add_document_to_asset
                    .layer(axum_middleware::from_fn(require_permission("asset.update"))),
            ),
        )
        // Maintenance - Merged below
        // Work Orders
        // Work Orders
        .route(
            "/api/work-orders",
            get(list_work_orders).post(create_work_order),
        )
        .route("/api/work-orders/pending", get(list_pending_work_orders))
        .route("/api/work-orders/overdue", get(list_overdue_work_orders))
        .route("/api/work-orders/analytics", get(get_work_order_analytics))
        .route("/api/work-orders/:id", get(get_work_order))
        .route("/api/work-orders/:id/approve", post(approve_work_order))
        .route(
            "/api/work-orders/:id/assign/:technician_id",
            post(assign_work_order),
        )
        .route("/api/work-orders/:id/start", post(start_work_order))
        .route("/api/work-orders/:id/complete", post(complete_work_order))
        .route("/api/work-orders/:id/verify", post(verify_work_order))
        .route("/api/work-orders/:id/finalize", post(finalize_work_order))
        .route("/api/work-orders/:id/cancel", post(cancel_work_order))
        .route(
            "/api/work-orders/:id/signoff",
            post(work_order_handler::submit_signoff),
        )
        // Tasks
        .route(
            "/api/work-orders/:id/tasks",
            get(get_work_order_tasks).post(add_work_order_task),
        )
        .route(
            "/api/work-orders/:id/tasks/:task_id/photos",
            put(work_order_handler::update_checklist_photos),
        )
        .route(
            "/api/work-orders/:id/tasks/:task_id/complete",
            put(work_order_handler::complete_checklist_item),
        )
        .route(
            "/api/work-orders/:id/tasks/:task_id",
            put(update_work_order_task).delete(remove_work_order_task),
        )
        .route(
            "/api/work-orders/:id/apply-template/:template_id",
            post(apply_maintenance_template),
        )
        // Maintenance Templates
        .route(
            "/api/maintenance-templates",
            get(list_maintenance_templates).post(create_maintenance_template),
        )
        .route(
            "/api/maintenance-templates/:id",
            get(get_maintenance_template).delete(delete_maintenance_template),
        )
        .route(
            "/api/maintenance-templates/:id/tasks",
            post(add_template_task),
        )
        .route(
            "/api/maintenance-templates/:id/tasks/:task_id",
            delete(delete_template_task),
        )
        // Parts
        .route(
            "/api/work-orders/:id/parts",
            get(get_work_order_parts).post(add_work_order_part),
        )
        .route(
            "/api/work-orders/:id/parts/:part_id",
            put(update_work_order_part).delete(remove_work_order_part),
        )
        // Loans
        .route("/api/loans", get(list_loans).post(create_loan))
        .route("/api/loans/analytics", get(get_loan_analytics))
        .route(
            "/api/loans/my",
            get(
                |state, Extension(claims): Extension<UserClaims>| async move {
                    list_my_loans(state, Path(claims.user_id())).await
                },
            ),
        )
        .route("/api/loans/overdue", get(list_overdue_loans))
        .route("/api/loans/:id", get(get_loan))
        .route("/api/loans/:id/approve", post(approve_loan))
        .route("/api/loans/:id/checkout", post(checkout_loan))
        .route("/api/loans/:id/return", post(checkin_loan))
        .route("/api/loans/:id/reject", post(reject_loan))
        .route("/api/users/:user_id/loans", get(list_my_loans))
        // Notifications
        .route("/api/users/:user_id/notifications", get(list_notifications))
        .route(
            "/api/users/:user_id/notifications/unread",
            get(list_unread_notifications),
        )
        .route(
            "/api/users/:user_id/notifications/unread/count",
            get(count_unread_notifications),
        )
        .route(
            "/api/users/:user_id/notifications/read-all",
            post(mark_all_notifications_as_read),
        )
        .route(
            "/api/notifications/:id/read",
            post(mark_notification_as_read),
        )
        // Users (Admin Only)
        .route(
            "/api/users",
            get(list_users.layer(axum_middleware::from_fn(admin_only_middleware)))
                .post(create_user.layer(axum_middleware::from_fn(admin_only_middleware))),
        )
        // Profile Routes (Checked for protected_routes and auth_middleware coverage)
        .route(
            "/api/me",
            get(profile_handler::get_profile).put(profile_handler::update_profile),
        )
        .route("/api/me/password", put(profile_handler::change_password))
        .route("/api/me/avatar", post(profile_handler::upload_avatar))
        .route(
            "/api/users/:id",
            put(update_user.layer(axum_middleware::from_fn(admin_only_middleware)))
                .delete(delete_user.layer(axum_middleware::from_fn(admin_only_middleware))),
        )
        // Employees
        .route("/api/employees", get(list_employees).post(create_employee))
        .route(
            "/api/employees/:id",
            get(get_employee)
                .put(update_employee)
                .delete(delete_employee),
        )
        .route("/api/employees/:id/user", post(create_employee_user))
        // Employee 360 View
        .route("/api/employees/:id/360", get(hr_lifecycle_handler::get_employee_360))
        // HR Shift Management
        .route("/api/hr/shifts", get(hr_shift_overtime_handler::list_shift_types).post(hr_shift_overtime_handler::create_shift_type))
        .route("/api/hr/shifts/:id", get(hr_shift_overtime_handler::get_shift_type).put(hr_shift_overtime_handler::update_shift_type).delete(hr_shift_overtime_handler::delete_shift_type))
        // HR Shift Assignments
        .route("/api/hr/shift-assignments", get(hr_shift_overtime_handler::list_shift_assignments).post(hr_shift_overtime_handler::create_shift_assignment))
        .route("/api/hr/shift-assignments/bulk", post(hr_shift_overtime_handler::bulk_assign_shifts))
        .route("/api/hr/shift-assignments/:id", delete(hr_shift_overtime_handler::delete_shift_assignment))
        // HR Attendance Requests (Koreksi / Dinas Luar)
        .route("/api/hr/attendance-requests", get(hr_shift_overtime_handler::list_attendance_requests).post(hr_shift_overtime_handler::create_attendance_request))
        .route("/api/hr/attendance-requests/:id/review", post(hr_shift_overtime_handler::review_attendance_request))
        // HR Overtime (SPKL & Kalkulasi Lembur Depnaker)
        .route("/api/hr/overtime-requests", get(hr_shift_overtime_handler::list_overtime_requests).post(hr_shift_overtime_handler::create_overtime_request))
        .route("/api/hr/overtime-requests/:id/review", post(hr_shift_overtime_handler::review_overtime_request))
        // HR Attendance Logs & Recap
        .route("/api/hr/attendance-logs", get(hr_shift_overtime_handler::list_attendance_details))
        .route("/api/hr/attendance-recap", get(hr_shift_overtime_handler::get_attendance_recap))
        // HR Designations (Master Jabatan)
        .route("/api/hr/designations", get(hr_lifecycle_handler::list_designations).post(hr_lifecycle_handler::create_designation))
        .route("/api/hr/designations/:id", get(hr_lifecycle_handler::get_designation).put(hr_lifecycle_handler::update_designation).delete(hr_lifecycle_handler::delete_designation))
        // HR Employment Types (Tipe Kepegawaian)
        .route("/api/hr/employment-types", get(hr_lifecycle_handler::list_employment_types).post(hr_lifecycle_handler::create_employment_type))
        // HR Employee Lifecycle Events (Riwayat Karir)
        .route("/api/hr/lifecycle", get(hr_lifecycle_handler::list_lifecycle_events).post(hr_lifecycle_handler::create_lifecycle_event))
        // HR Employee Documents
        .route("/api/hr/employees/:employee_id/documents", get(hr_lifecycle_handler::list_employee_documents).post(hr_lifecycle_handler::create_employee_document))
        .route("/api/hr/documents/:id", delete(hr_lifecycle_handler::delete_employee_document))
        // HR Employee Education
        .route("/api/hr/employees/:employee_id/education", get(hr_lifecycle_handler::list_employee_education).post(hr_lifecycle_handler::create_employee_education))
        .route("/api/hr/education/:id", delete(hr_lifecycle_handler::delete_employee_education))
        // Departments
        .route("/api/departments/tree", get(list_departments_tree))
        .route(
            "/api/departments",
            get(list_departments).post(create_department),
        )
        .route(
            "/api/departments/:id",
            get(get_department)
                .put(update_department)
                .delete(delete_department),
        )
        // HRD - Attendance
        .route(
            "/api/hrd/attendance/today",
            get(attendance_handler::get_today_status),
        )
        .route(
            "/api/hrd/attendance/check-in",
            post(attendance_handler::check_in),
        )
        .route(
            "/api/hrd/attendance/check-out",
            post(attendance_handler::check_out),
        )
        .route(
            "/api/hrd/attendance/history",
            get(attendance_handler::get_my_history),
        )
        .route(
            "/api/hrd/attendance/all-today",
            get(attendance_handler::get_all_today),
        )
        .route(
            "/api/hrd/attendance/employee/:employee_id",
            get(attendance_handler::get_employee_history),
        )
        .route("/api/attendance/scan", post(attendance_handler::scan_face))
        .route("/api/attendance/logs", get(attendance_handler::list_logs))
        // Finance Routes
        .route(
            "/api/finance/accounts",
            get(finance_handler::list_accounts).post(finance_handler::create_account),
        )
        .route(
            "/api/finance/accounts/tree",
            get(finance_handler::list_accounts_tree),
        )
        .route(
            "/api/finance/accounts/:id",
            put(finance_handler::update_account),
        )
        // Journal Entries
        .route(
            "/api/finance/journals",
            get(journal_handler::list_journals).post(journal_handler::create_journal),
        )
        .route(
            "/api/finance/journals/:id",
            get(journal_handler::get_journal_details),
        )
        // Finance Reports
        .route(
            "/api/finance/reports/ledger/:account_id",
            get(finance_report_handler::get_general_ledger),
        )
        .route(
            "/api/finance/reports/trial-balance",
            get(finance_report_handler::get_trial_balance),
        )
        .route(
            "/api/finance/reports/balance-sheet",
            get(finance_report_handler::get_balance_sheet),
        )
        .route(
            "/api/finance/reports/income-statement",
            get(finance_report_handler::get_income_statement),
        )
        // Operational Finance
        .route(
            "/api/finance/sales/invoices",
            get(finance_handler::list_sales_invoices).post(finance_handler::create_sales_invoice),
        )
        .route(
            "/api/finance/sales/quotes",
            get(finance_handler::list_sales_quotes).post(finance_handler::create_sales_quote),
        )
        .route(
            "/api/finance/sales/orders",
            get(finance_handler::list_sales_orders).post(finance_handler::create_sales_order),
        )
        .route(
            "/api/finance/sales/shipments",
            get(finance_handler::list_sales_shipments).post(finance_handler::create_sales_shipment),
        )
        .route(
            "/api/finance/purchase/quotes",
            get(finance_handler::list_purchase_quotes).post(finance_handler::create_purchase_quote),
        )
        .route(
            "/api/finance/purchase/orders",
            get(finance_handler::list_purchase_orders).post(finance_handler::create_purchase_order),
        )
        .route(
            "/api/finance/purchase-receipts",
            post(purchase_receipt_handler::create_purchase_receipt),
        )
        .route(
            "/api/finance/purchase-receipts/company/:company_id",
            get(purchase_receipt_handler::list_purchase_receipts),
        )
        .route(
            "/api/finance/purchase-receipts/:id",
            get(purchase_receipt_handler::get_purchase_receipt),
        )
        .route(
            "/api/finance/purchase-receipts/:id/submit",
            post(purchase_receipt_handler::submit_purchase_receipt),
        )
        .route(
            "/api/finance/purchase/shipments",
            get(finance_handler::list_purchase_shipments)
                .post(finance_handler::create_purchase_shipment),
        )
        .route(
            "/api/finance/purchase/bills",
            get(finance_handler::list_purchase_bills).post(finance_handler::create_purchase_bill),
        )
        .route(
            "/api/finance/expenses",
            get(finance_handler::list_expenses).post(finance_handler::create_expense),
        )
        .route(
            "/api/finance/cash-bank",
            get(finance_handler::list_cash_bank_transactions)
                .post(finance_handler::create_cash_bank_transaction),
        )
        // Accounting Workspace & Extended Finance Routes
        .route(
            "/api/finance/payments",
            get(finance_handler::list_payment_entries).post(finance_handler::create_payment_entry),
        )
        .route(
            "/api/finance/payments/:id",
            get(finance_handler::get_payment_entry),
        )
        .route(
            "/api/finance/cost-centers",
            get(finance_handler::list_cost_centers).post(finance_handler::create_cost_center),
        )
        .route(
            "/api/finance/budgets",
            get(finance_handler::list_budgets).post(finance_handler::create_budget),
        )
        .route(
            "/api/finance/budgets/variance",
            get(finance_handler::get_budget_variance),
        )
        .route(
            "/api/finance/bank-accounts",
            get(finance_handler::list_bank_accounts).post(finance_handler::create_bank_account),
        )
        .route(
            "/api/finance/credit-notes",
            get(finance_handler::list_credit_notes).post(finance_handler::create_credit_note),
        )
        .route(
            "/api/finance/debit-notes",
            get(finance_handler::list_debit_notes).post(finance_handler::create_debit_note),
        )
        .route(
            "/api/finance/tax-categories",
            get(finance_handler::list_tax_categories),
        )
        .route(
            "/api/finance/reports/ar-aging",
            get(finance_report_handler::get_ar_aging),
        )
        .route(
            "/api/finance/reports/ap-aging",
            get(finance_report_handler::get_ap_aging),
        )
        .route(
            "/api/finance/reports/cash-flow",
            get(finance_report_handler::get_cash_flow_statement),
        )

        // Leave Management
        .route("/api/hrd/leaves", post(leave_handler::request_leave))
        .route("/api/hrd/leaves/my", get(leave_handler::my_leaves))
        .route(
            "/api/hrd/leaves/pending",
            get(leave_handler::pending_leaves),
        )
        .route(
            "/api/hrd/leaves/:id/approve",
            post(leave_handler::approve_leave),
        )
        .route(
            "/api/hrd/leaves/:id/reject",
            post(leave_handler::reject_leave),
        )
        // Rental Billing routes moved to rental_routes.rs to avoid conflicts
        // RBAC & DocPerms
        .route("/api/rbac/roles", get(list_roles))
        .route("/api/rbac/permissions", get(list_permissions))
        .route(
            "/api/rbac/roles/:role_id/permissions",
            get(get_role_permissions).post(update_role_permissions),
        )
        .route("/api/users/:user_id/roles", get(get_user_roles))
        .route("/api/users/:user_id/permissions", get(get_user_permissions))
        .route(
            "/api/users/:user_id/roles/:role_code",
            post(assign_role).delete(remove_role),
        )
        .route("/api/rbac/doctypes", get(list_doctypes))
        .route("/api/rbac/docperms", get(get_docperms).post(save_docperm))
        .route("/api/rbac/docperms/:id", delete(delete_docperm))

        // Frappe Workflows Builder Engine
        .route("/api/workflows", get(list_frappe_workflows).post(create_frappe_workflow))
        .route("/api/workflows/apply-action", post(apply_frappe_workflow_action))
        .route("/api/workflows/:id", get(get_frappe_workflow_detail).delete(delete_frappe_workflow))
        .route("/api/workflows/:id/states", post(save_frappe_workflow_state))
        .route("/api/workflows/:id/transitions", post(save_frappe_workflow_transition))

        // Approval Entity Types
        .route("/api/approval/entity-types", get(list_approval_entity_types).post(create_approval_entity_type))
        .route("/api/approval/entity-types/:id", patch(update_approval_entity_type).delete(delete_approval_entity_type))

        // Sensors


        .route(
            "/api/assets/:asset_id/sensors/readings",
            post(record_reading).get(get_latest_readings),
        )
        .route(
            "/api/assets/:asset_id/sensors/readings/range",
            get(get_readings_in_range),
        )
        .route(
            "/api/assets/:asset_id/sensors/thresholds",
            post(set_threshold),
        )
        .route("/api/sensors/alerts", get(list_active_alerts))
        .route(
            "/api/sensors/alerts/:id/acknowledge",
            post(acknowledge_alert),
        )
        .route("/api/reports/assets", get(report_handler::export_assets))
        .route(
            "/api/reports/assets/pdf",
            get(report_handler::export_assets_pdf),
        )
        .route(
            "/api/reports/inventory/pdf",
            get(report_handler::export_inventory_pdf),
        )
        .route(
            "/api/reports/maintenance",
            get(report_handler::export_maintenance),
        )
        .route(
            "/api/reports/finance/capex-opex",
            get(report_handler::get_capex_opex_analysis),
        )
        // Lookups (Will map old lookup to new routes soon, but keeping old for backwards compatibility temporarily)
        .route(
            "/api/lookups/maintenance-types",
            get(crate::api::handlers::maintenance_type_handler::list_maintenance_types),
        )

        // Depreciation Methods CRUD
        .route(
            "/api/depreciation-methods",
            get(crate::api::handlers::depreciation_method_handler::list_depreciation_methods)
            .post(crate::api::handlers::depreciation_method_handler::create_depreciation_method),
        )
        .route(
            "/api/depreciation-methods/:id",
            get(crate::api::handlers::depreciation_method_handler::get_depreciation_method)
            .put(crate::api::handlers::depreciation_method_handler::update_depreciation_method)
            .delete(crate::api::handlers::depreciation_method_handler::delete_depreciation_method),
        )

        // Maintenance Types CRUD
        .route(
            "/api/maintenance-types",
            get(crate::api::handlers::maintenance_type_handler::list_maintenance_types)
            .post(crate::api::handlers::maintenance_type_handler::create_maintenance_type),
        )
        .route(
            "/api/maintenance-types/:id",
            get(crate::api::handlers::maintenance_type_handler::get_maintenance_type)
            .put(crate::api::handlers::maintenance_type_handler::update_maintenance_type)
            .delete(crate::api::handlers::maintenance_type_handler::delete_maintenance_type),
        )

        // Analytics
        .route(
            "/api/analytics/asset-roi/:id",
            get(crate::api::handlers::analytics_handler::get_asset_roi),
        )
        .route(
            "/api/analytics/condition-distribution",
            get(analytics_handler::get_asset_condition_distribution),
        )
        // Analytics
        .route(
            "/api/analytics/maintenance-trends",
            get(analytics_handler::get_monthly_maintenance_trends),
        )
        .route(
            "/api/analytics/condition-distribution",
            get(analytics_handler::get_asset_condition_distribution),
        )
        .route(
            "/api/analytics/costs",
            get(analytics_handler::get_monthly_maintenance_trends),
        )
        .route(
            "/api/analytics/status",
            get(analytics_handler::get_asset_status_distribution),
        )
        // Settings
        // Settings route moved to settings_routes.rs
        .route("/api/dashboard", get(get_dashboard_stats))
        .route("/api/dashboard/activity", get(get_recent_activities))
        .route("/api/dashboard/depreciation", get(get_depreciation_summary))
        .route("/api/dashboard/export-pdf", get(export_dashboard_pdf))
        .route(
            "/api/audit/sessions",
            post(audit_handler::start_audit_session),
        )
        .route(
            "/api/audit/sessions/active",
            get(audit_handler::get_active_session),
        )
        .route(
            "/api/audit/sessions/:id/records",
            post(audit_handler::submit_audit_record),
        )
        .route(
            "/api/audit/sessions/:id/close",
            post(audit_handler::close_session),
        )
        .route(
            "/api/audit/sessions/:id/progress",
            get(audit_handler::get_audit_progress),
        )
        .route("/api/audit-logs", get(audit_handler::get_audit_logs))
        // Lifecycle routes
        .route(
            "/api/assets/:id/lifecycle/transition",
            post(lifecycle_handler::transition_asset),
        )
        .route(
            "/api/assets/:id/lifecycle/request-transition",
            post(lifecycle_handler::request_transition),
        )
        .route(
            "/api/assets/:id/lifecycle/history",
            get(lifecycle_handler::get_lifecycle_history),
        )
        .route(
            "/api/assets/:id/lifecycle/valid-transitions",
            get(lifecycle_handler::get_valid_transitions),
        )
        .route(
            "/api/assets/:id/lifecycle/valid-transitions-with-approval",
            get(lifecycle_handler::get_valid_transitions_with_approval),
        )
        .route(
            "/api/assets/:id/lifecycle/status",
            get(lifecycle_handler::get_current_status),
        )
        .route(
            "/api/lifecycle/states",
            get(lifecycle_handler::get_all_states),
        )
        .nest(
            "/api/categories",
            crate::api::routes::category_routes::category_routes(),
        )
        .merge(crate::api::routes::conversion_routes::conversion_routes(
            state.clone(),
        ))
        .merge(crate::api::routes::location_routes::location_routes())
        .merge(crate::api::routes::approval_routes::approval_routes(
            state.clone(),
        ))
        .nest(
            "/api/mobile",
            crate::api::routes::mobile_routes::mobile_routes(state.clone()),
        )
        .merge(crate::api::routes::rental_routes::rental_routes())
        .merge(crate::api::routes::client_routes::client_routes())
        .merge(crate::api::routes::timesheet_routes::timesheet_routes())
        .merge(crate::api::routes::billing_routes::billing_routes())
        .merge(crate::api::routes::asset_expense_routes::asset_expense_routes())
        .merge(crate::api::routes::fuel_routes::fuel_routes())
        .merge(crate::api::routes::contract_routes::contract_routes())
        .nest(
            "/api/quotations",
            crate::api::routes::quotation_routes::routes(state.pool.clone()),
        )
        .nest(
            "/api/vendors",
            Router::new()
                .route(
                    "/",
                    get(crate::handlers::vendors::list_vendors).post(crate::handlers::vendors::create_vendor),
                )
                .route(
                    "/:id",
                    get(crate::handlers::vendors::get_vendor)
                        .put(crate::handlers::vendors::update_vendor)
                        .delete(crate::handlers::vendors::delete_vendor),
                )
                .with_state(state.pool.clone()),
        )

        .nest(
            "/api/sales-master",
            sales_master_data_routes::sales_master_data_routes(sales_master_handler),
        )
        .nest(
            "/api/sales-pricing",
            sales_pricing_data_routes::sales_pricing_data_routes(sales_pricing_handler),
        )
        .nest(
            "/api/sales-pos",
            sales_pos_data_routes::sales_pos_data_routes(sales_pos_handler),
        )
        .nest(
            "/api/sales-setup",
            sales_setup_data_routes::sales_setup_data_routes(sales_setup_handler),
        )
        .nest(
            "/api/buying-master",
            buying_master_data_routes::buying_master_data_routes(buying_master_handler),
        )
        .nest(
            "/api/buying-quotation",
            buying_quotation_data_routes::buying_quotation_data_routes(buying_quotation_handler),
        )
        .nest(
            "/api/buying-scorecard",
            buying_scorecard_data_routes::buying_scorecard_data_routes(buying_scorecard_handler),
        )
        .nest(
            "/api/inventory",
            crate::api::routes::inventory_routes::inventory_routes(),
        )
        .nest(
            "/api/maintenance",
            crate::api::routes::maintenance_routes::maintenance_routes(),
        )
        .layer(axum_middleware::from_fn_with_state(
            state.clone(),
            auth_middleware,
        ));

    Router::new()
        .merge(public_routes)
        .merge(lookup_routes)
        .merge(protected_routes)
        .merge(crate::api::routes::settings_routes::settings_routes())
        .merge(crate::api::routes::tax_renewal_routes::tax_renewal_routes(
            state.clone(),
        ))
        .route(
            "/api/test/email",
            axum::routing::post(crate::api::handlers::test_handler::send_test_email),
        )
        .with_state(state)
}
