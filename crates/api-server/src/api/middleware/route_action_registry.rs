//! Explicit Route-Action Registry (Fase 18 RBAC & SoD Governance)
//!
//! Replaces blind HTTP verb mapping with explicit granular action contracts:
//! 1. create
//! 2. submit
//! 3. approve
//! 4. reject
//! 5. post
//! 6. reverse
//! 7. release
//! 8. disburse
//! 9. cancel

use axum::http::Method;

pub fn resolve_route_permission(method: &Method, path: &str) -> Option<String> {
    let module = get_module_prefix(path)?;

    // 1. Explicit Action Endpoints (Exact or suffix matches)
    if path.ends_with("/approve") {
        return Some(format!("{}.approve", module));
    }
    if path.ends_with("/reject") {
        return Some(format!("{}.reject", module));
    }
    if path.ends_with("/submit") {
        return Some(format!("{}.submit", module));
    }
    if path.ends_with("/post") {
        return Some(format!("{}.post", module));
    }
    if path.ends_with("/reverse") || path.contains("/cancel-and-reverse") {
        return Some(format!("{}.reverse", module));
    }
    if path.ends_with("/release") {
        return Some(format!("{}.release", module));
    }
    if path.ends_with("/disburse") {
        return Some(format!("{}.disburse", module));
    }
    if path.ends_with("/cancel") {
        return Some(format!("{}.cancel", module));
    }

    // 2. Standard Granular CRUD actions
    let action = match *method {
        Method::GET => "view",
        Method::POST => "create",
        Method::PUT | Method::PATCH => "edit",
        Method::DELETE => "delete",
        _ => "view",
    };

    Some(format!("{}.{}", module, action))
}

fn get_module_prefix(path: &str) -> Option<&'static str> {
    if path.starts_with("/api/assets") {
        Some("asset")
    } else if path.starts_with("/api/categories") {
        Some("asset_category")
    } else if path.starts_with("/api/locations") {
        Some("location")
    } else if path.starts_with("/api/conversions") {
        Some("asset_conversion")
    } else if path.starts_with("/api/work-orders") {
        Some("work_order")
    } else if path.starts_with("/api/maintenance-templates") {
        Some("maintenance_template")
    } else if path.starts_with("/api/maintenance-teams") {
        Some("maintenance_team")
    } else if path.starts_with("/api/loans") {
        Some("asset_loan")
    } else if path.starts_with("/api/approvals") || path.starts_with("/api/approval") {
        Some("approval")
    } else if path.starts_with("/api/notifications") || path.contains("/notifications") {
        Some("notification")
    } else if path.starts_with("/api/users") {
        Some("user")
    } else if path.starts_with("/api/employees") {
        Some("employee")
    } else if path.starts_with("/api/departments") {
        Some("department")
    } else if path.starts_with("/api/hrd/attendance") || path.starts_with("/api/attendance") {
        Some("attendance")
    } else if path.starts_with("/api/hrd/leaves") {
        Some("leave")
    } else if path.starts_with("/api/hr") {
        Some("hr")
    } else if path.starts_with("/api/finance") {
        Some("finance")
    } else if path.starts_with("/api/rental") {
        Some("rental")
    } else if path.starts_with("/api/client") {
        Some("customer")
    } else if path.starts_with("/api/timesheet") {
        Some("timesheet")
    } else if path.starts_with("/api/billing") {
        Some("billing")
    } else if path.starts_with("/api/asset-expenses") {
        Some("asset_expense")
    } else if path.starts_with("/api/fuel") {
        Some("fuel")
    } else if path.starts_with("/api/contracts") {
        Some("contract")
    } else if path.starts_with("/api/inventory") {
        Some("inventory")
    } else if path.starts_with("/api/ops") {
        Some("ops")
    } else if path.starts_with("/api/maintenance") {
        Some("maintenance")
    } else if path.starts_with("/api/metadata") {
        Some("metadata")
    } else if path.starts_with("/api/tax-renewals") {
        Some("tax_renewal")
    } else if path.starts_with("/api/companies") {
        Some("company")
    } else if path.starts_with("/api/reports") {
        Some("report")
    } else if path.starts_with("/api/analytics") {
        Some("analytics")
    } else if path.starts_with("/api/dashboard") {
        Some("dashboard")
    } else if path.starts_with("/api/audit") {
        Some("audit")
    } else if path.starts_with("/api/workflows") {
        Some("workflow")
    } else if path.starts_with("/api/data-imports") {
        Some("data_import")
    } else if path.starts_with("/api/sensors") {
        Some("sensor")
    } else {
        None
    }
}
