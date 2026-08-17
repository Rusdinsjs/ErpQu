use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

/// Pagination parameters
#[derive(Debug, Clone, Deserialize, ToSchema, utoipa::IntoParams)]
pub struct PaginationParams {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}

impl PaginationParams {
    pub fn page(&self) -> i64 {
        self.page.unwrap_or(1).max(1)
    }

    pub fn per_page(&self) -> i64 {
        self.per_page.unwrap_or(20).clamp(1, 100)
    }

    pub fn offset(&self) -> i64 {
        (self.page() - 1) * self.per_page()
    }
}

impl Default for PaginationParams {
    fn default() -> Self {
        Self {
            page: Some(1),
            per_page: Some(20),
        }
    }
}

/// Standardized list query parameters (QAPI-001)
/// Combines pagination + sorting + search + filtering in a single struct.
/// All API list endpoints SHOULD use this for consistency.
///
/// Usage examples:
///   GET /api/v1/assets?page=1&per_page=20&sort_by=created_at&sort_order=desc&search=excavator
///   GET /api/v1/employees?page=2&per_page=50&sort_by=name&search=John&status=active
#[derive(Debug, Clone, Deserialize, ToSchema, utoipa::IntoParams)]
pub struct ListQueryParams {
    /// Page number (1-indexed, default: 1)
    pub page: Option<i64>,
    /// Items per page (default: 20, max: 100)
    pub per_page: Option<i64>,
    /// Sort field name (e.g. "name", "created_at", "status")
    pub sort_by: Option<String>,
    /// Sort direction: "asc" or "desc" (default: "desc")
    pub sort_order: Option<String>,
    /// Full-text search query
    pub search: Option<String>,
    /// Filter by status (comma-separated for multiple: "active,maintenance")
    pub status: Option<String>,
    /// Filter by date range start (ISO 8601: "2026-01-01")
    pub date_from: Option<String>,
    /// Filter by date range end (ISO 8601: "2026-12-31")
    pub date_to: Option<String>,
}

impl ListQueryParams {
    pub fn page(&self) -> i64 {
        self.page.unwrap_or(1).max(1)
    }

    pub fn per_page(&self) -> i64 {
        self.per_page.unwrap_or(20).clamp(1, 100)
    }

    pub fn offset(&self) -> i64 {
        (self.page() - 1) * self.per_page()
    }

    /// Returns the validated sort column name.
    /// Only allows alphanumeric chars and underscores to prevent SQL injection.
    pub fn safe_sort_by(&self, allowed_columns: &[&str], default: &str) -> String {
        if let Some(ref col) = self.sort_by {
            let clean = col.trim().to_lowercase();
            if allowed_columns.contains(&clean.as_str())
                && clean.chars().all(|c| c.is_alphanumeric() || c == '_')
            {
                return clean;
            }
        }
        default.to_string()
    }

    /// Returns validated sort direction ("ASC" or "DESC")
    pub fn safe_sort_order(&self) -> &str {
        match self.sort_order.as_deref() {
            Some("asc") | Some("ASC") => "ASC",
            _ => "DESC",
        }
    }

    /// Returns the search query trimmed, or None if empty
    pub fn search_query(&self) -> Option<String> {
        self.search
            .as_ref()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
    }

    /// Parses comma-separated status filter
    pub fn status_filter(&self) -> Vec<String> {
        self.status
            .as_ref()
            .map(|s| {
                s.split(',')
                    .map(|v| v.trim().to_string())
                    .filter(|v| !v.is_empty())
                    .collect()
            })
            .unwrap_or_default()
    }

    /// Parse date_from as NaiveDate
    pub fn parse_date_from(&self) -> Option<chrono::NaiveDate> {
        self.date_from
            .as_ref()
            .and_then(|s| chrono::NaiveDate::parse_from_str(s.trim(), "%Y-%m-%d").ok())
    }

    /// Parse date_to as NaiveDate
    pub fn parse_date_to(&self) -> Option<chrono::NaiveDate> {
        self.date_to
            .as_ref()
            .and_then(|s| chrono::NaiveDate::parse_from_str(s.trim(), "%Y-%m-%d").ok())
    }

    /// Convert to legacy PaginationParams for backward compatibility
    pub fn to_pagination(&self) -> PaginationParams {
        PaginationParams {
            page: Some(self.page()),
            per_page: Some(self.per_page()),
        }
    }

    /// Build SQL ORDER BY clause string safely
    pub fn order_by_clause(&self, allowed_columns: &[&str], default: &str) -> String {
        format!(
            "{} {}",
            self.safe_sort_by(allowed_columns, default),
            self.safe_sort_order()
        )
    }
}

impl Default for ListQueryParams {
    fn default() -> Self {
        Self {
            page: Some(1),
            per_page: Some(20),
            sort_by: None,
            sort_order: None,
            search: None,
            status: None,
            date_from: None,
            date_to: None,
        }
    }
}

/// Paginated response wrapper
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub pagination: PaginationMeta,
}

#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct PaginationMeta {
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
    pub total_pages: i64,
    pub has_next: bool,
    pub has_prev: bool,
}

impl PaginationMeta {
    pub fn new(total: i64, page: i64, per_page: i64) -> Self {
        let total_pages = if per_page > 0 {
            (total as f64 / per_page as f64).ceil() as i64
        } else {
            0
        };
        Self {
            total,
            page,
            per_page,
            total_pages,
            has_next: page < total_pages,
            has_prev: page > 1,
        }
    }
}

impl<T> PaginatedResponse<T> {
    pub fn new(data: Vec<T>, total: i64, page: i64, per_page: i64) -> Self {
        Self {
            data,
            pagination: PaginationMeta::new(total, page, per_page),
        }
    }
}

/// API response wrapper
#[derive(Debug, Clone, Serialize, ToSchema)]
#[aliases(ApiResponseApprovalRequest = ApiResponse<crate::infrastructure::repositories::approval_repository::ApprovalRequest>)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub message: Option<String>,
    pub data: Option<T>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            message: None,
            data: Some(data),
        }
    }

    pub fn success_with_message(data: T, message: &str) -> Self {
        Self {
            success: true,
            message: Some(message.to_string()),
            data: Some(data),
        }
    }

    pub fn error(message: &str) -> Self {
        Self {
            success: false,
            message: Some(message.to_string()),
            data: None,
        }
    }
}

/// Standardized API error response body (QAPI-002)
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct ApiErrorResponse {
    pub success: bool,
    pub error: ApiErrorDetail,
}

#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct ApiErrorDetail {
    /// Machine-readable error code (e.g. "VALIDATION_ERROR", "NOT_FOUND")
    pub code: String,
    /// Human-readable error message
    pub message: String,
    /// Field-level validation errors (only for validation failures)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fields: Option<Vec<FieldError>>,
    /// Request trace ID for debugging
    #[serde(skip_serializing_if = "Option::is_none")]
    pub trace_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct FieldError {
    pub field: String,
    pub message: String,
}

impl ApiErrorResponse {
    pub fn new(code: &str, message: &str) -> Self {
        Self {
            success: false,
            error: ApiErrorDetail {
                code: code.to_string(),
                message: message.to_string(),
                fields: None,
                trace_id: None,
            },
        }
    }

    pub fn validation(message: &str, fields: Vec<FieldError>) -> Self {
        Self {
            success: false,
            error: ApiErrorDetail {
                code: "VALIDATION_ERROR".to_string(),
                message: message.to_string(),
                fields: Some(fields),
                trace_id: None,
            },
        }
    }

    pub fn not_found(resource: &str, id: &str) -> Self {
        Self::new(
            "NOT_FOUND",
            &format!("{} with id '{}' not found", resource, id),
        )
    }
}
