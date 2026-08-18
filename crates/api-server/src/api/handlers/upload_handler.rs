use axum::{
    extract::{Multipart, Path, State},
    http::{header, HeaderMap, HeaderValue},
    response::IntoResponse,
    Extension, Json,
};
use chrono::Utc;
use serde_json::json;
use std::path::{Path as StdPath, PathBuf};
use tokio::fs;
use uuid::Uuid;

use crate::api::server::AppState;
use management_system_core::domain::entities::UserClaims;
use management_system_core::domain::tenant::TenantContext;
use management_system_core::shared::{AppError, AppResult};

const MAX_UPLOAD_SIZE: u64 = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS: &[&str] = &["jpg", "jpeg", "png", "webp", "pdf", "csv", "xlsx", "docx"];

/// Validate real file content using Magic Bytes header inspection (Point B.1)
fn detect_and_validate_magic_bytes(data: &[u8], claimed_ext: &str) -> Result<&'static str, AppError> {
    if data.len() < 4 {
        return Err(AppError::BadRequest("File is empty or truncated".to_string()));
    }

    // JPEG: FF D8 FF
    if data.starts_with(&[0xFF, 0xD8, 0xFF]) {
        return Ok("image/jpeg");
    }
    // PNG: 89 50 4E 47
    if data.starts_with(&[0x89, 0x50, 0x4E, 0x47]) {
        return Ok("image/png");
    }
    // WebP: RIFF .... WEBP
    if data.len() >= 12 && &data[0..4] == b"RIFF" && &data[8..12] == b"WEBP" {
        return Ok("image/webp");
    }
    // PDF: %PDF-
    if data.starts_with(b"%PDF-") {
        return Ok("application/pdf");
    }
    // ZIP-based Office Open XML (DOCX / XLSX): 50 4B 03 04
    if data.starts_with(&[0x50, 0x4B, 0x03, 0x04]) {
        if claimed_ext == "docx" {
            return Ok("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        } else if claimed_ext == "xlsx" {
            return Ok("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        }
        return Ok("application/zip");
    }
    // CSV / Text: UTF-8 check without null bytes
    if claimed_ext == "csv" {
        if !data.contains(&0) && std::str::from_utf8(data).is_ok() {
            return Ok("text/csv");
        }
    }

    Err(AppError::BadRequest(
        "File signature (magic bytes) does not match permitted file types or MIME spoofing detected".to_string()
    ))
}

/// Upload a file (QSEC-006: Authenticated file upload with fail-closed metadata tracking & Magic Byte verification)
pub async fn upload_file(
    Extension(claims): Extension<UserClaims>,
    Extension(tenant_ctx): Extension<TenantContext>,
    State(state): State<AppState>,
    mut multipart: Multipart,
) -> AppResult<impl IntoResponse> {
    tracing::info!(
        ">>> [API] Authenticated file upload request from user {}...",
        claims.sub
    );
    let mut uploaded_file = None;

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| AppError::BadRequest(e.to_string()))?
    {
        let name = field.name().unwrap_or("").to_string();

        if name == "file" {
            let file_name = field.file_name().unwrap_or("unknown").to_string();
            let data = field
                .bytes()
                .await
                .map_err(|e| AppError::Internal(e.to_string()))?;

            if data.len() as u64 > MAX_UPLOAD_SIZE {
                return Err(AppError::BadRequest(
                    "File too large (max 10MB)".to_string(),
                ));
            }

            // Determine extension
            let ext = StdPath::new(&file_name)
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("bin")
                .to_lowercase();

            // Strict extension allowlist
            if !ALLOWED_EXTENSIONS.contains(&ext.as_str()) {
                return Err(AppError::BadRequest(format!(
                    "File extension '.{}' is not permitted",
                    ext
                )));
            }

            // Point B.1: Validate file magic bytes against actual payload
            let verified_content_type = detect_and_validate_magic_bytes(&data, &ext)?;

            // Point B.2: Decode and re-encode image (Reject corrupted/malicious payloads - Fail Closed)
            let (final_data, final_ext) = if ["jpg", "jpeg", "png", "webp"].contains(&ext.as_str())
            {
                let data_clone = data.clone();

                let result = tokio::task::spawn_blocking(move || {
                    let img = image::load_from_memory(&data_clone)
                        .map_err(|e| format!("Corrupted image payload or decoding failed: {}", e))?;

                    let resized = if img.width() > 1280 || img.height() > 1280 {
                        img.resize(1280, 1280, image::imageops::FilterType::Lanczos3)
                    } else {
                        img
                    };

                    let mut comp_bytes: Vec<u8> = Vec::new();
                    let mut cursor = std::io::Cursor::new(&mut comp_bytes);
                    resized
                        .write_to(&mut cursor, image::ImageFormat::WebP)
                        .map_err(|e| format!("Failed to encode image: {}", e))?;

                    Ok::<_, String>((comp_bytes, "webp".to_string()))
                })
                .await
                .map_err(|e| AppError::Internal(format!("Blocking task failed: {}", e)))?
                .map_err(|e| AppError::BadRequest(e))?;

                result
            } else {
                (data.to_vec(), ext)
            };

            // Generate path: uploads/YYYY/MM/DD/uuid.ext
            let now = Utc::now();
            let relative_dir = format!(
                "uploads/{}/{:02}/{:02}",
                now.format("%Y"),
                now.format("%m"),
                now.format("%d")
            );

            let file_id = Uuid::new_v4();
            let new_filename = format!("{}.{}", file_id, final_ext);
            let file_path = format!("{}/{}", relative_dir, new_filename);

            fs::create_dir_all(&relative_dir)
                .await
                .map_err(|e| AppError::Internal(format!("Failed to create directory: {}", e)))?;

            fs::write(&file_path, &final_data)
                .await
                .map_err(|e| AppError::Internal(format!("Failed to save file: {}", e)))?;

            // Record upload metadata in database for IDOR & authorization enforcement (Fail-Closed)
            let insert_res = sqlx::query(
                r#"
                INSERT INTO public.uploads (id, file_path, original_name, content_type, file_size, uploaded_by, company_id, role_level_required)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                "#
            )
            .bind(file_id)
            .bind(&file_path)
            .bind(&file_name)
            .bind(verified_content_type)
            .bind(final_data.len() as i32)
            .bind(claims.user_id())
            .bind(tenant_ctx.company_id)
            .bind(claims.role_level)
            .execute(&state.pool)
            .await;

            if let Err(e) = insert_res {
                // If metadata insert fails, delete written file to remain fail-closed
                let _ = fs::remove_file(&file_path).await;
                return Err(AppError::Internal(format!(
                    "Failed to register upload metadata in database: {}",
                    e
                )));
            }

            let url = format!("/api/{}", file_path);
            uploaded_file = Some(json!({
                "id": file_id,
                "url": url,
                "original_name": file_name,
                "content_type": verified_content_type,
                "size": final_data.len(),
                "uploaded_by": claims.user_id()
            }));

            break;
        }
    }

    if let Some(file_info) = uploaded_file {
        Ok(Json(file_info))
    } else {
        Err(AppError::BadRequest("No file field found".to_string()))
    }
}

/// Private file download service (QSEC-006: Authenticated file access with IDOR & tenant check)
pub async fn get_private_file(
    Extension(claims): Extension<UserClaims>,
    Extension(tenant_ctx): Extension<TenantContext>,
    State(state): State<AppState>,
    Path(file_path): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    tracing::info!(
        "Private file fetch requested by user {} for path: {}",
        claims.sub,
        file_path
    );

    // Prevent directory traversal attacks
    let safe_path = file_path.trim_start_matches('/');
    if safe_path.contains("..") || safe_path.contains('\\') {
        return Err(AppError::BadRequest("Invalid file path".to_string()));
    }

    let db_path = format!("uploads/{}", safe_path);
    let full_path = PathBuf::from(&db_path);

    if !full_path.exists() || !full_path.is_file() {
        return Err(AppError::NotFound("File not found".to_string()));
    }

    // Check authorization against DB record (Fail-Closed: Record must exist and be authorized)
    let record = sqlx::query_as::<_, (Uuid, Option<Uuid>, i32)>(
        "SELECT uploaded_by, company_id, role_level_required FROM public.uploads WHERE file_path = $1"
    )
    .bind(&db_path)
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Database error during authorization: {}", e)))?;

    let (uploaded_by, company_id, role_level_required) = match record {
        Some(r) => r,
        None => {
            return Err(AppError::NotFound(
                "File metadata not found in database".to_string(),
            ));
        }
    };

    // Point B.8: Admin TIDAK boleh otomatis mengakses file lintas company tanpa membership sah
    if tenant_ctx.enforce_company_boundary(company_id).is_err() {
        return Err(AppError::Forbidden(
            "Cross-company file access denied".to_string(),
        ));
    }

    let is_owner = uploaded_by == claims.user_id();
    let has_role_access = claims.role_level <= role_level_required;

    if !is_owner && !has_role_access {
        return Err(AppError::Forbidden(
            "Access denied to requested file".to_string(),
        ));
    }

    let contents = fs::read(&full_path)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to read file: {}", e)))?;

    let mime_type = mime_guess::from_path(&full_path)
        .first_or_octet_stream()
        .to_string();

    let mut headers = HeaderMap::new();
    if let Ok(val) = HeaderValue::from_str(&mime_type) {
        headers.insert(header::CONTENT_TYPE, val);
    } else {
        headers.insert(
            header::CONTENT_TYPE,
            HeaderValue::from_static("application/octet-stream"),
        );
    }
    headers.insert(
        header::CACHE_CONTROL,
        HeaderValue::from_static("private, no-cache, no-store, must-revalidate"),
    );

    Ok((headers, contents))
}

/// Serve file from uploads directory (Public access for images/media in <img> tags)
pub async fn get_file(
    Path(file_path): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    let clean_path = file_path.trim_start_matches('/');
    if clean_path.contains("..") || clean_path.contains('\\') {
        return Err(AppError::BadRequest("Invalid file path".to_string()));
    }

    let db_path = if clean_path.starts_with("uploads/") {
        clean_path.to_string()
    } else {
        format!("uploads/{}", clean_path)
    };
    let full_path = PathBuf::from(&db_path);

    if !full_path.exists() || !full_path.is_file() {
        return Err(AppError::NotFound("File not found".to_string()));
    }

    let contents = fs::read(&full_path)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to read file: {}", e)))?;

    let mime_type = mime_guess::from_path(&full_path)
        .first_or_octet_stream()
        .to_string();

    let mut headers = HeaderMap::new();
    if let Ok(val) = HeaderValue::from_str(&mime_type) {
        headers.insert(header::CONTENT_TYPE, val);
    } else {
        headers.insert(
            header::CONTENT_TYPE,
            HeaderValue::from_static("application/octet-stream"),
        );
    }
    headers.insert(
        header::CACHE_CONTROL,
        HeaderValue::from_static("public, max-age=86400"),
    );

    Ok((headers, contents))
}
