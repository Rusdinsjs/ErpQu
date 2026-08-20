use utoipa::OpenApi;

#[derive(OpenApi)]
#[openapi(
    info(
        title = "ERPQu API",
        version = "1.0.0",
        description = "ERPQu Enterprise Resource Planning API — Production-grade modular ERP system.\n\n## Authentication\nAll protected endpoints require a Bearer JWT token in the Authorization header.\n\n## Pagination\nList endpoints support: `page`, `per_page`, `sort_by`, `sort_order`, `search`, `status`, `date_from`, `date_to`\n\n## Rate Limiting\n- Auth endpoints: 10 req/min\n- Upload endpoints: 30 req/min\n- General API: 300 req/min\n\nRate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`",
        contact(
            name = "ERPQu Team",
            email = "admin@erpqu.com"
        ),
        license(
            name = "Proprietary"
        )
    ),
    paths(
        // Auth
        crate::api::handlers::auth_handler::login,
        crate::api::handlers::auth_handler::register,
        crate::api::handlers::auth_handler::refresh_token,
        crate::api::handlers::auth_handler::logout,
        // Assets
        crate::api::handlers::asset_handler::list_assets,
        crate::api::handlers::asset_handler::search_assets,
        crate::api::handlers::asset_handler::get_asset,
        crate::api::handlers::asset_handler::create_asset,
        crate::api::handlers::asset_handler::update_asset,
        crate::api::handlers::asset_handler::delete_asset,
        // Dashboard
        crate::api::handlers::dashboard_handler::get_dashboard_stats,
        crate::api::handlers::dashboard_handler::get_recent_activities,
        crate::api::handlers::dashboard_handler::get_depreciation_summary,
        // Work Orders & Outbox
        crate::api::handlers::wo_settlement_handler::settle_work_order,
        crate::api::handlers::outbox_admin_handler::retry_outbox_event,
        crate::api::handlers::outbox_admin_handler::get_outbox_lag,
    ),
    components(
        schemas(
            // Auth
            crate::api::handlers::auth_handler::LoginRequest,
            crate::api::handlers::auth_handler::LoginResponse,
            crate::api::handlers::auth_handler::UserInfo,
            crate::api::handlers::auth_handler::RefreshResponse,
            crate::api::handlers::auth_handler::LogoutResponse,
            management_system_core::application::dto::user_dto::CreateUserRequest,
            management_system_core::domain::entities::User,

            // Asset & Common
            management_system_assets::Asset,
            management_system_assets::AssetSummary,
            management_system_assets::AssetDetail,
            management_system_core::infrastructure::repositories::approval_repository::ApprovalRequest,

            // Work Order & Outbox
            crate::api::handlers::wo_settlement_handler::SettleWorkOrderApiRequest,
            crate::api::handlers::wo_settlement_handler::WorkOrderSettlementResponse,
            crate::api::handlers::outbox_admin_handler::OutboxRetryResponse,
            crate::api::handlers::outbox_admin_handler::OutboxLagResponse,

            // Dashboard Schemas
            management_system_core::application::dto::dashboard_dto::DashboardStats,
            management_system_core::application::dto::dashboard_dto::AssetStats,
            management_system_core::application::dto::dashboard_dto::MaintenanceStats,
            management_system_core::application::dto::dashboard_dto::LoanStats,
            management_system_core::application::dto::dashboard_dto::AlertStats,
            management_system_core::application::dto::dashboard_dto::CategoryDistribution,
            management_system_core::application::dto::dashboard_dto::StatusCount,
            crate::api::handlers::dashboard_handler::RecentActivity,
            crate::api::handlers::dashboard_handler::DepreciationSummary,

            // Standardized API DTOs
            management_system_core::application::dto::common::PaginationMeta,
            management_system_core::application::dto::common::ApiErrorResponse,
            management_system_core::application::dto::common::ApiErrorDetail,
            management_system_core::application::dto::common::FieldError,
        )
    ),
    tags(
        (name = "auth", description = "Authentication & Authorization"),
        (name = "assets", description = "Asset Management"),
        (name = "dashboard", description = "Dashboard & Analytics"),
        (name = "work-orders", description = "Work Order Management"),
        (name = "employees", description = "Employee Management"),
        (name = "finance", description = "Finance & Accounting"),
        (name = "inventory", description = "Inventory Management"),
        (name = "rental", description = "Rental Management"),
        (name = "webhooks", description = "Outbound Webhook System"),
        (name = "settings", description = "System Settings"),
        (name = "rbac", description = "Role-Based Access Control")
    ),
    modifiers(&SecurityAddon)
)]
pub struct ApiDoc;

pub struct SecurityAddon;

impl utoipa::Modify for SecurityAddon {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        if let Some(components) = openapi.components.as_mut() {
            components.add_security_scheme(
                "bearer_auth",
                utoipa::openapi::security::SecurityScheme::Http(
                    utoipa::openapi::security::HttpBuilder::new()
                        .scheme(utoipa::openapi::security::HttpAuthScheme::Bearer)
                        .bearer_format("JWT")
                        .description(Some("JWT Bearer token. Obtain from POST /api/auth/login"))
                        .build(),
                ),
            );
        }
    }
}
