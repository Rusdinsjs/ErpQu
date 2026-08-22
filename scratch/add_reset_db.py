import sys

file_path = "/home/rus/Ngoding/erp-system/crates/api-server/src/api/handlers/settings_handler.rs"
with open(file_path, "r") as f:
    content = f.read()

new_content = """

/// Reset Database (Super Admin Only)
#[utoipa::path(
    post,
    path = "/api/settings/reset-database",
    tag = "Settings",
    responses(
        (status = 200, description = "Database reset successfully", body = ApiResponse<serde_json::Value>)
    ),
    security(
        ("jwt" = [])
    )
)]
pub async fn reset_database(
    State(state): State<AppState>,
    Extension(claims): Extension<UserClaims>,
) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
    if claims.role != "super_admin" {
        return Err(AppError::Forbidden("Only super_admin can reset the database".to_string()));
    }

    let sql = r#"
DO $$
DECLARE
    row RECORD;
    truncate_stmt TEXT := '';
BEGIN
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_department_id_fkey;
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_organization_id_fkey;
    ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_organization_id_fkey;
    
    UPDATE public.users SET department_id = NULL, organization_id = NULL;
    UPDATE public.user_roles SET organization_id = NULL;

    FOR row IN
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname IN ('public', 'hr', 'crm', 'rental', 'inventory', 'commercial')
          AND tablename NOT IN ('users', 'roles', 'user_roles', '_sqlx_migrations')
    LOOP
        truncate_stmt := truncate_stmt || quote_ident(row.schemaname) || '.' || quote_ident(row.tablename) || ', ';
    END LOOP;

    IF length(truncate_stmt) > 0 THEN
        truncate_stmt := 'TRUNCATE ' || rtrim(truncate_stmt, ', ') || ' CASCADE;';
        EXECUTE truncate_stmt;
    END IF;

    ALTER TABLE public.users ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE RESTRICT;
    ALTER TABLE public.users ADD CONSTRAINT users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;
    ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
END $$;
"#;

    sqlx::query(sql)
        .execute(&state.pool)
        .await
        .map_err(|e| AppError::InternalServerError(format!("Database reset failed: {}", e)))?;

    Ok(Json(ApiResponse {
        success: true,
        message: Some("Database reset successfully".to_string()),
        data: None,
    }))
}
"""

with open(file_path, "w") as f:
    f.write(content + new_content)
print("Updated settings_handler.rs")
