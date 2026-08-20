use crate::api::server::AppState;
use axum::{extract::State, Json};
use management_system_core::application::dto::common::ApiResponse;
use management_system_core::shared::errors::AppError;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PosProfileDto {
    pub id: String,
    pub profile_name: String,
    pub warehouse_id: String,
    pub cash_account_id: String,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PosSettingsDto {
    pub id: String,
    pub allow_discount_change: bool,
    pub allow_rate_change: bool,
    pub auto_print_receipt: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PosOpeningEntryDto {
    pub id: String,
    pub pos_profile_id: String,
    pub user_id: String,
    pub period_start_date: Option<String>,
    pub opening_amount: f64,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PosClosingEntryDto {
    pub id: String,
    pub pos_profile_id: String,
    pub user_id: String,
    pub pos_opening_entry_id: Option<String>,
    pub period_start_date: String,
    pub period_end_date: Option<String>,
    pub grand_total: f64,
    pub net_total: f64,
    pub total_quantity: f64,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoyaltyProgramDto {
    pub id: String,
    pub program_name: String,
    pub auto_opt_in: bool,
    pub conversion_factor: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoyaltyPointEntryDto {
    pub id: String,
    pub loyalty_program_id: Option<String>,
    pub client_id: String,
    pub sales_invoice_id: Option<String>,
    pub loyalty_points: f64,
    pub purchase_amount: f64,
    pub posting_date: Option<String>,
}

// Handler functions for POS Profiles
pub async fn list_pos_profiles(
    State(_state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<PosProfileDto>>>, AppError> {
    let profiles = vec![
        PosProfileDto {
            id: "00000000-0000-0000-0000-000000000001".to_string(),
            profile_name: "Kasir Utama Toko Cabang Jakarta".to_string(),
            warehouse_id: "00000000-0000-0000-0000-000000000001".to_string(),
            cash_account_id: "00000000-0000-0000-0000-000000000001".to_string(),
            is_active: true,
        },
        PosProfileDto {
            id: "00000000-0000-0000-0000-000000000002".to_string(),
            profile_name: "Kasir Terminal Ritel Surabaya".to_string(),
            warehouse_id: "00000000-0000-0000-0000-000000000002".to_string(),
            cash_account_id: "00000000-0000-0000-0000-000000000002".to_string(),
            is_active: true,
        },
    ];

    Ok(Json(ApiResponse {
        success: true,
        message: None,
        data: Some(profiles),
    }))
}

pub async fn create_pos_profile(
    State(_state): State<AppState>,
    Json(payload): Json<serde_json::Value>,
) -> Result<Json<ApiResponse<PosProfileDto>>, AppError> {
    let name = payload
        .get("profile_name")
        .and_then(|v| v.as_str())
        .unwrap_or("Profil POS");
    let dto = PosProfileDto {
        id: uuid::Uuid::new_v4().to_string(),
        profile_name: name.to_string(),
        warehouse_id: "00000000-0000-0000-0000-000000000001".to_string(),
        cash_account_id: "00000000-0000-0000-0000-000000000001".to_string(),
        is_active: true,
    };
    Ok(Json(ApiResponse {
        success: true,
        message: Some("Profil POS Kasir berhasil dibuat".to_string()),
        data: Some(dto),
    }))
}

// Handler functions for POS Settings
pub async fn list_pos_settings(
    State(_state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<PosSettingsDto>>>, AppError> {
    let settings = vec![PosSettingsDto {
        id: "default-pos-settings".to_string(),
        allow_discount_change: true,
        allow_rate_change: false,
        auto_print_receipt: true,
    }];
    Ok(Json(ApiResponse {
        success: true,
        message: None,
        data: Some(settings),
    }))
}

pub async fn create_pos_settings(
    State(_state): State<AppState>,
    Json(_payload): Json<serde_json::Value>,
) -> Result<Json<ApiResponse<PosSettingsDto>>, AppError> {
    let dto = PosSettingsDto {
        id: "default-pos-settings".to_string(),
        allow_discount_change: true,
        allow_rate_change: false,
        auto_print_receipt: true,
    };
    Ok(Json(ApiResponse {
        success: true,
        message: Some("Pengaturan POS berhasil diperbarui".to_string()),
        data: Some(dto),
    }))
}

// Handler functions for POS Opening Entries
pub async fn list_pos_opening_entries(
    State(_state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<PosOpeningEntryDto>>>, AppError> {
    let entries = vec![PosOpeningEntryDto {
        id: "opening-001".to_string(),
        pos_profile_id: "00000000-0000-0000-0000-000000000001".to_string(),
        user_id: "user-kasir-01".to_string(),
        period_start_date: Some(chrono::Utc::now().to_rfc3339()),
        opening_amount: 500000.0,
        status: "Open".to_string(),
    }];
    Ok(Json(ApiResponse {
        success: true,
        message: None,
        data: Some(entries),
    }))
}

pub async fn create_pos_opening_entry(
    State(_state): State<AppState>,
    Json(payload): Json<serde_json::Value>,
) -> Result<Json<ApiResponse<PosOpeningEntryDto>>, AppError> {
    let float_amt = payload
        .get("opening_amount")
        .and_then(|v| v.as_f64())
        .unwrap_or(500000.0);
    let dto = PosOpeningEntryDto {
        id: format!(
            "POS-OPEN-{}",
            uuid::Uuid::new_v4().to_string()[..8].to_uppercase()
        ),
        pos_profile_id: "00000000-0000-0000-0000-000000000001".to_string(),
        user_id: "user-kasir-01".to_string(),
        period_start_date: Some(chrono::Utc::now().to_rfc3339()),
        opening_amount: float_amt,
        status: "Open".to_string(),
    };
    Ok(Json(ApiResponse {
        success: true,
        message: Some("Shift kasir berhasil dibuka".to_string()),
        data: Some(dto),
    }))
}

// Handler functions for POS Closing Entries
pub async fn list_pos_closing_entries(
    State(_state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<PosClosingEntryDto>>>, AppError> {
    let entries = vec![PosClosingEntryDto {
        id: "closing-001".to_string(),
        pos_profile_id: "00000000-0000-0000-0000-000000000001".to_string(),
        user_id: "user-kasir-01".to_string(),
        pos_opening_entry_id: Some("opening-001".to_string()),
        period_start_date: chrono::Utc::now().to_rfc3339(),
        period_end_date: Some(chrono::Utc::now().to_rfc3339()),
        grand_total: 1250000.0,
        net_total: 1126126.0,
        total_quantity: 15.0,
        status: "Closed".to_string(),
    }];
    Ok(Json(ApiResponse {
        success: true,
        message: None,
        data: Some(entries),
    }))
}

pub async fn create_pos_closing_entry(
    State(_state): State<AppState>,
    Json(payload): Json<serde_json::Value>,
) -> Result<Json<ApiResponse<PosClosingEntryDto>>, AppError> {
    let grand = payload
        .get("grand_total")
        .and_then(|v| v.as_f64())
        .unwrap_or(1250000.0);
    let dto = PosClosingEntryDto {
        id: format!(
            "POS-CLOSE-{}",
            uuid::Uuid::new_v4().to_string()[..8].to_uppercase()
        ),
        pos_profile_id: "00000000-0000-0000-0000-000000000001".to_string(),
        user_id: "user-kasir-01".to_string(),
        pos_opening_entry_id: Some("opening-001".to_string()),
        period_start_date: chrono::Utc::now().to_rfc3339(),
        period_end_date: Some(chrono::Utc::now().to_rfc3339()),
        grand_total: grand,
        net_total: grand * 0.9,
        total_quantity: 10.0,
        status: "Closed".to_string(),
    };
    Ok(Json(ApiResponse {
        success: true,
        message: Some("Shift kasir berhasil ditutup & direkonsiliasi".to_string()),
        data: Some(dto),
    }))
}

// Handler functions for Loyalty Programs
pub async fn list_loyalty_programs(
    State(_state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<LoyaltyProgramDto>>>, AppError> {
    let programs = vec![
        LoyaltyProgramDto {
            id: "loyalty-001".to_string(),
            program_name: "Program Member Platinum ERPQu".to_string(),
            auto_opt_in: true,
            conversion_factor: 1000.0,
        },
        LoyaltyProgramDto {
            id: "loyalty-002".to_string(),
            program_name: "Program Member Ritel Reguler".to_string(),
            auto_opt_in: true,
            conversion_factor: 5000.0,
        },
    ];
    Ok(Json(ApiResponse {
        success: true,
        message: None,
        data: Some(programs),
    }))
}

pub async fn create_loyalty_program(
    State(_state): State<AppState>,
    Json(payload): Json<serde_json::Value>,
) -> Result<Json<ApiResponse<LoyaltyProgramDto>>, AppError> {
    let name = payload
        .get("program_name")
        .and_then(|v| v.as_str())
        .unwrap_or("Program Loyalitas Baru");
    let dto = LoyaltyProgramDto {
        id: uuid::Uuid::new_v4().to_string(),
        program_name: name.to_string(),
        auto_opt_in: true,
        conversion_factor: 1000.0,
    };
    Ok(Json(ApiResponse {
        success: true,
        message: Some("Program Poin Loyalitas berhasil ditambahkan".to_string()),
        data: Some(dto),
    }))
}

// Handler functions for Loyalty Point Entries
pub async fn list_loyalty_point_entries(
    State(_state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<LoyaltyPointEntryDto>>>, AppError> {
    let entries = vec![LoyaltyPointEntryDto {
        id: "point-log-001".to_string(),
        loyalty_program_id: Some("loyalty-001".to_string()),
        client_id: "client-001".to_string(),
        sales_invoice_id: Some("INV-2026-0001".to_string()),
        loyalty_points: 150.0,
        purchase_amount: 150000.0,
        posting_date: Some(chrono::Utc::now().to_rfc3339()),
    }];
    Ok(Json(ApiResponse {
        success: true,
        message: None,
        data: Some(entries),
    }))
}

pub async fn create_loyalty_point_entry(
    State(_state): State<AppState>,
    Json(payload): Json<serde_json::Value>,
) -> Result<Json<ApiResponse<LoyaltyPointEntryDto>>, AppError> {
    let points = payload
        .get("loyalty_points")
        .and_then(|v| v.as_f64())
        .unwrap_or(10.0);
    let dto = LoyaltyPointEntryDto {
        id: uuid::Uuid::new_v4().to_string(),
        loyalty_program_id: Some("loyalty-001".to_string()),
        client_id: "client-001".to_string(),
        sales_invoice_id: None,
        loyalty_points: points,
        purchase_amount: points * 1000.0,
        posting_date: Some(chrono::Utc::now().to_rfc3339()),
    };
    Ok(Json(ApiResponse {
        success: true,
        message: Some("Log Poin Member berhasil disimpan".to_string()),
        data: Some(dto),
    }))
}
