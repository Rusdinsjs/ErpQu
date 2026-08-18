use crate::domain::entities::{
    CustomDocPerm, DocType, Permission, Role, SaveDocPermPayload, UserRoleAssignment,
};
use sqlx::PgPool;
use uuid::Uuid;


#[derive(Clone)]
pub struct RbacRepository {
    pool: PgPool,
}

impl RbacRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    // --- Role Methods ---

    pub async fn list_roles(&self) -> Result<Vec<Role>, sqlx::Error> {
        sqlx::query_as::<_, Role>("SELECT * FROM roles ORDER BY role_level ASC, name ASC")
            .fetch_all(&self.pool)
            .await
    }

    pub async fn find_role_by_code(&self, code: &str) -> Result<Option<Role>, sqlx::Error> {
        sqlx::query_as::<_, Role>("SELECT * FROM roles WHERE code = $1")
            .bind(code)
            .fetch_optional(&self.pool)
            .await
    }

    // --- Permission Methods ---

    pub async fn list_permissions(&self) -> Result<Vec<Permission>, sqlx::Error> {
        sqlx::query_as::<_, Permission>("SELECT * FROM permissions ORDER BY resource, action")
            .fetch_all(&self.pool)
            .await
    }

    pub async fn get_role_permissions(
        &self,
        role_id: Uuid,
    ) -> Result<Vec<Permission>, sqlx::Error> {
        sqlx::query_as::<_, Permission>(
            r#"
            SELECT p.* 
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            WHERE rp.role_id = $1
            "#,
        )
        .bind(role_id)
        .fetch_all(&self.pool)
        .await
    }

    // Used by AuthService for simple code list
    pub async fn get_permissions_for_role(
        &self,
        role_id: Uuid,
    ) -> Result<Vec<String>, sqlx::Error> {
        let permissions = sqlx::query_scalar::<_, String>(
            r#"
            SELECT p.code
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            WHERE rp.role_id = $1
            "#,
        )
        .bind(role_id)
        .fetch_all(&self.pool)
        .await?;
        Ok(permissions)
    }

    // --- User Role Methods ---

    // Get roles assigned to user via user_roles table (Many-to-Many)
    // Note: Primary role is in users table, but we might support secondary roles
    pub async fn get_user_roles(&self, user_id: Uuid) -> Result<Vec<Role>, sqlx::Error> {
        // This query fetches roles from the user_roles mapping table AND the primary role from users table
        sqlx::query_as::<_, Role>(
            r#"
            SELECT r.* FROM roles r
            JOIN user_roles ur ON r.id = ur.role_id
            WHERE ur.user_id = $1
            UNION
            SELECT r.* FROM roles r
            JOIN users u ON u.role_id = r.id
            WHERE u.id = $1
            "#,
        )
        .bind(user_id)
        .fetch_all(&self.pool)
        .await
    }

    pub async fn get_user_permissions(
        &self,
        user_id: Uuid,
    ) -> Result<Vec<Permission>, sqlx::Error> {
        // Combine permissions from Primary Role and Secondary Roles
        sqlx::query_as::<_, Permission>(
            r#"
            SELECT DISTINCT p.* 
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            JOIN roles r ON rp.role_id = r.id
            LEFT JOIN users u ON u.role_id = r.id
            LEFT JOIN user_roles ur ON ur.role_id = r.id
            WHERE u.id = $1 OR ur.user_id = $1
            "#,
        )
        .bind(user_id)
        .fetch_all(&self.pool)
        .await
    }

    pub async fn user_has_permission(
        &self,
        user_id: Uuid,
        permission_code: &str,
    ) -> Result<bool, sqlx::Error> {
        let count: i64 = sqlx::query_scalar(
            r#"
            SELECT COUNT(*)
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            JOIN roles r ON rp.role_id = r.id
            LEFT JOIN users u ON u.role_id = r.id
            LEFT JOIN user_roles ur ON ur.role_id = r.id
            WHERE (u.id = $1 OR ur.user_id = $1)
            AND (p.code = $2 OR p.code = '*')
            "#,
        )
        .bind(user_id)
        .bind(permission_code)
        .fetch_one(&self.pool)
        .await?;

        Ok(count > 0)
    }

    // Assign secondary role
    pub async fn assign_role_to_user(
        &self,
        user_id: Uuid,
        role_id: Uuid,
        granted_by: Option<Uuid>,
        organization_id: Option<Uuid>,
    ) -> Result<UserRoleAssignment, sqlx::Error> {
        sqlx::query_as::<_, UserRoleAssignment>(
            r#"
            INSERT INTO user_roles (user_id, role_id, granted_by, organization_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *
            "#,
        )
        .bind(user_id)
        .bind(role_id)
        .bind(granted_by)
        .bind(organization_id)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn remove_role_from_user(
        &self,
        user_id: Uuid,
        role_id: Uuid,
    ) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2")
            .bind(user_id)
            .bind(role_id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected() > 0)
    }

    pub async fn sync_user_role(
        &self,
        user_id: Uuid,
        role_id: Uuid,
        organization_id: Option<Uuid>,
    ) -> Result<(), sqlx::Error> {
        let mut tx = self.pool.begin().await?;

        // 1. Delete existing roles for this user in user_roles
        sqlx::query("DELETE FROM user_roles WHERE user_id = $1")
            .bind(user_id)
            .execute(&mut *tx)
            .await?;

        // 2. Insert the new role assignment
        sqlx::query(
            "INSERT INTO user_roles (id, user_id, role_id, organization_id) VALUES ($1, $2, $3, $4)",
        )
        .bind(Uuid::new_v4())
        .bind(user_id)
        .bind(role_id)
        .bind(organization_id)
        .execute(&mut *tx)
        .await?;

        tx.commit().await?;
        Ok(())
    }

    /// Update role permissions in bulk (transaction-safe)
    pub async fn update_role_permissions(
        &self,
        role_id: Uuid,
        permission_ids: Vec<Uuid>,
    ) -> Result<(), sqlx::Error> {
        let mut tx = self.pool.begin().await?;

        // Delete existing permissions for this role
        sqlx::query("DELETE FROM role_permissions WHERE role_id = $1")
            .bind(role_id)
            .execute(&mut *tx)
            .await?;

        // Insert new permissions
        for perm_id in permission_ids {
            sqlx::query("INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)")
                .bind(role_id)
                .bind(perm_id)
                .execute(&mut *tx)
                .await?;
        }

        tx.commit().await?;
        Ok(())
    }

    // --- DocType & Custom DocPerm Methods ---

    pub async fn list_doctypes(&self) -> Result<Vec<DocType>, sqlx::Error> {
        sqlx::query_as::<_, DocType>("SELECT * FROM doctypes ORDER BY module ASC, name ASC")
            .fetch_all(&self.pool)
            .await
    }

    pub async fn get_docperms(
        &self,
        doctype_id: Option<Uuid>,
    ) -> Result<Vec<CustomDocPerm>, sqlx::Error> {
        let mut query_str = String::from(
            r#"
            SELECT c.*, r.name as role_name
            FROM custom_docperms c
            LEFT JOIN roles r ON c.role_id = r.id
            WHERE 1=1
            "#,
        );

        if doctype_id.is_some() {
            query_str.push_str(" AND c.doctype_id = $1");
        }
        query_str.push_str(" ORDER BY c.permlevel ASC, r.name ASC");

        if let Some(dt_id) = doctype_id {
            sqlx::query_as::<_, CustomDocPerm>(&query_str)
                .bind(dt_id)
                .fetch_all(&self.pool)
                .await
        } else {
            sqlx::query_as::<_, CustomDocPerm>(&query_str)
                .fetch_all(&self.pool)
                .await
        }
    }

    pub async fn save_docperm(
        &self,
        payload: SaveDocPermPayload,
    ) -> Result<CustomDocPerm, sqlx::Error> {
        let perm_id = payload.id.unwrap_or_else(Uuid::new_v4);
        let permlevel = payload.permlevel.unwrap_or(0);
        let read_perm = payload.read_perm.unwrap_or(true);
        let write_perm = payload.write_perm.unwrap_or(false);
        let create_perm = payload.create_perm.unwrap_or(false);
        let delete_perm = payload.delete_perm.unwrap_or(false);
        let submit_perm = payload.submit_perm.unwrap_or(false);
        let cancel_perm = payload.cancel_perm.unwrap_or(false);
        let amend_perm = payload.amend_perm.unwrap_or(false);
        let print_perm = payload.print_perm.unwrap_or(true);
        let email_perm = payload.email_perm.unwrap_or(false);
        let export_perm = payload.export_perm.unwrap_or(false);
        let import_perm = payload.import_perm.unwrap_or(false);
        let share_perm = payload.share_perm.unwrap_or(false);
        let report_perm = payload.report_perm.unwrap_or(true);
        let if_owner = payload.if_owner.unwrap_or(false);

        let row = sqlx::query_as::<_, CustomDocPerm>(
            r#"
            INSERT INTO custom_docperms (
                id, doctype_id, role_id, permlevel, read_perm, write_perm, create_perm, delete_perm,
                submit_perm, cancel_perm, amend_perm, print_perm, email_perm, export_perm, import_perm,
                share_perm, report_perm, if_owner, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8,
                $9, $10, $11, $12, $13, $14, $15,
                $16, $17, $18, NOW()
            )
            ON CONFLICT ON CONSTRAINT uq_docperm_doctype_role_level DO UPDATE SET
                read_perm = EXCLUDED.read_perm,
                write_perm = EXCLUDED.write_perm,
                create_perm = EXCLUDED.create_perm,
                delete_perm = EXCLUDED.delete_perm,
                submit_perm = EXCLUDED.submit_perm,
                cancel_perm = EXCLUDED.cancel_perm,
                amend_perm = EXCLUDED.amend_perm,
                print_perm = EXCLUDED.print_perm,
                email_perm = EXCLUDED.email_perm,
                export_perm = EXCLUDED.export_perm,
                import_perm = EXCLUDED.import_perm,
                share_perm = EXCLUDED.share_perm,
                report_perm = EXCLUDED.report_perm,
                if_owner = EXCLUDED.if_owner,
                updated_at = NOW()
            RETURNING *, (SELECT name FROM roles WHERE id = custom_docperms.role_id) as role_name
            "#,
        )
        .bind(perm_id)
        .bind(payload.doctype_id)
        .bind(payload.role_id)
        .bind(permlevel)
        .bind(read_perm)
        .bind(write_perm)
        .bind(create_perm)
        .bind(delete_perm)
        .bind(submit_perm)
        .bind(cancel_perm)
        .bind(amend_perm)
        .bind(print_perm)
        .bind(email_perm)
        .bind(export_perm)
        .bind(import_perm)
        .bind(share_perm)
        .bind(report_perm)
        .bind(if_owner)
        .fetch_one(&self.pool)
        .await?;

        Ok(row)
    }

    pub async fn delete_docperm(&self, id: Uuid) -> Result<bool, sqlx::Error> {
        let res = sqlx::query("DELETE FROM custom_docperms WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(res.rows_affected() > 0)
    }
}

