use sqlx::PgPool;
use uuid::Uuid;
use crate::domain::entities::buying_master_data::*;

pub struct BuyingMasterDataRepository {
    pool: PgPool,
}

impl BuyingMasterDataRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    // --- Supplier Groups ---
    pub async fn create_supplier_group(&self, req: CreateSupplierGroupRequest, company_id: Uuid) -> Result<SupplierGroup, sqlx::Error> {
        sqlx::query_as!(
            SupplierGroup,
            r#"
            INSERT INTO supplier_groups (company_id, group_name, parent_group_id)
            VALUES ($1, $2, $3)
            RETURNING id, company_id, group_name, parent_group_id, created_at
            "#,
            company_id, req.group_name, req.parent_group_id
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_supplier_groups(&self, company_id: Uuid) -> Result<Vec<SupplierGroup>, sqlx::Error> {
        sqlx::query_as!(
            SupplierGroup,
            "SELECT * FROM supplier_groups WHERE company_id = $1 ORDER BY created_at DESC",
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }

    // --- Supplier Contacts ---
    pub async fn create_supplier_contact(&self, req: CreateSupplierContactRequest) -> Result<SupplierContact, sqlx::Error> {
        sqlx::query_as!(
            SupplierContact,
            r#"
            INSERT INTO supplier_contacts (vendor_id, first_name, last_name, email, phone, is_primary)
            VALUES ($1, $2, $3, $4, $5, COALESCE($6, false))
            RETURNING id, vendor_id, first_name, last_name, email, phone, is_primary, created_at
            "#,
            req.vendor_id, req.first_name, req.last_name, req.email, req.phone, req.is_primary
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_supplier_contacts(&self) -> Result<Vec<SupplierContact>, sqlx::Error> {
        sqlx::query_as!(
            SupplierContact,
            "SELECT * FROM supplier_contacts ORDER BY created_at DESC"
        )
        .fetch_all(&self.pool)
        .await
    }

    // --- Supplier Addresses ---
    pub async fn create_supplier_address(&self, req: CreateSupplierAddressRequest) -> Result<SupplierAddress, sqlx::Error> {
        sqlx::query_as!(
            SupplierAddress,
            r#"
            INSERT INTO supplier_addresses (vendor_id, address_title, address_line1, address_line2, city, state, country, pincode, is_primary)
            VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'Indonesia'), $8, COALESCE($9, false))
            RETURNING id, vendor_id, address_title, address_line1, address_line2, city, state, country, pincode, is_primary, created_at
            "#,
            req.vendor_id, req.address_title, req.address_line1, req.address_line2, req.city, req.state, req.country, req.pincode, req.is_primary
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_supplier_addresses(&self) -> Result<Vec<SupplierAddress>, sqlx::Error> {
        sqlx::query_as!(
            SupplierAddress,
            "SELECT * FROM supplier_addresses ORDER BY created_at DESC"
        )
        .fetch_all(&self.pool)
        .await
    }

    // --- Buying Settings ---
    pub async fn create_buying_settings(&self, req: CreateBuyingSettingsRequest, company_id: Uuid) -> Result<BuyingSettings, sqlx::Error> {
        sqlx::query_as!(
            BuyingSettings,
            r#"
            INSERT INTO buying_settings (company_id, po_required, pr_required, maintain_same_rate)
            VALUES ($1, $2, $3, $4)
            RETURNING id, company_id, po_required, pr_required, maintain_same_rate, created_at
            "#,
            company_id, req.po_required, req.pr_required, req.maintain_same_rate
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_buying_settings(&self, company_id: Uuid) -> Result<Vec<BuyingSettings>, sqlx::Error> {
        sqlx::query_as!(
            BuyingSettings,
            "SELECT * FROM buying_settings WHERE company_id = $1 ORDER BY created_at DESC",
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }

    // --- Purchase Taxes Templates ---
    pub async fn create_purchase_taxes_template(&self, req: CreatePurchaseTaxesTemplateRequest, company_id: Uuid) -> Result<PurchaseTaxesTemplate, sqlx::Error> {
        sqlx::query_as!(
            PurchaseTaxesTemplate,
            r#"
            INSERT INTO purchase_taxes_templates (company_id, title, rate, account_id, is_default)
            VALUES ($1, $2, $3, $4, COALESCE($5, false))
            RETURNING id, company_id, title, rate, account_id, is_default, created_at
            "#,
            company_id, req.title, req.rate, req.account_id, req.is_default
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_purchase_taxes_templates(&self, company_id: Uuid) -> Result<Vec<PurchaseTaxesTemplate>, sqlx::Error> {
        sqlx::query_as!(
            PurchaseTaxesTemplate,
            "SELECT * FROM purchase_taxes_templates WHERE company_id = $1 ORDER BY created_at DESC",
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }
}
