use sqlx::PgPool;
use uuid::Uuid;
use crate::domain::entities::sales_setup_data::*;

pub struct SalesSetupDataRepository {
    pool: PgPool,
}

impl SalesSetupDataRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    // --- Blanket Orders ---
    pub async fn create_blanket_order(&self, req: CreateBlanketOrderRequest, company_id: Uuid) -> Result<BlanketOrder, sqlx::Error> {
        sqlx::query_as!(
            BlanketOrder,
            r#"
            INSERT INTO blanket_orders (company_id, order_number, client_id, from_date, to_date, tc_name, terms, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'Active')
            RETURNING id, company_id, order_number, client_id, from_date, to_date, tc_name, terms, status, created_at, updated_at
            "#,
            company_id, req.order_number, req.client_id, req.from_date, req.to_date, req.tc_name, req.terms
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_blanket_orders(&self, company_id: Uuid) -> Result<Vec<BlanketOrder>, sqlx::Error> {
        sqlx::query_as!(
            BlanketOrder,
            "SELECT * FROM blanket_orders WHERE company_id = $1 ORDER BY created_at DESC",
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }

    // --- Shipping Rules ---
    pub async fn create_shipping_rule(&self, req: CreateShippingRuleRequest, company_id: Uuid) -> Result<ShippingRule, sqlx::Error> {
        sqlx::query_as!(
            ShippingRule,
            r#"
            INSERT INTO shipping_rules (company_id, name, shipping_amount, calculate_based_on, account_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, company_id, name, shipping_amount, calculate_based_on, account_id, created_at
            "#,
            company_id, req.name, req.shipping_amount, req.calculate_based_on, req.account_id
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_shipping_rules(&self, company_id: Uuid) -> Result<Vec<ShippingRule>, sqlx::Error> {
        sqlx::query_as!(
            ShippingRule,
            "SELECT * FROM shipping_rules WHERE company_id = $1 ORDER BY created_at DESC",
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }

    // --- Selling Settings ---
    pub async fn create_selling_settings(&self, req: CreateSellingSettingsRequest, company_id: Uuid) -> Result<SellingSettings, sqlx::Error> {
        sqlx::query_as!(
            SellingSettings,
            r#"
            INSERT INTO selling_settings (company_id, so_required, dn_required, allow_negative_stock, default_price_list_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, company_id, so_required, dn_required, allow_negative_stock, default_price_list_id, created_at
            "#,
            company_id, req.so_required, req.dn_required, req.allow_negative_stock, req.default_price_list_id
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_selling_settings(&self, company_id: Uuid) -> Result<Vec<SellingSettings>, sqlx::Error> {
        sqlx::query_as!(
            SellingSettings,
            "SELECT * FROM selling_settings WHERE company_id = $1 ORDER BY created_at DESC",
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }

    // --- Terms and Conditions Templates ---
    pub async fn create_terms_and_conditions_template(&self, req: CreateTermsAndConditionsTemplateRequest, company_id: Uuid) -> Result<TermsAndConditionsTemplate, sqlx::Error> {
        sqlx::query_as!(
            TermsAndConditionsTemplate,
            r#"
            INSERT INTO terms_and_conditions_templates (company_id, title, terms_content, disabled)
            VALUES ($1, $2, $3, COALESCE($4, false))
            RETURNING id, company_id, title, terms_content, disabled, created_at
            "#,
            company_id, req.title, req.terms_content, req.disabled
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_terms_and_conditions_templates(&self, company_id: Uuid) -> Result<Vec<TermsAndConditionsTemplate>, sqlx::Error> {
        sqlx::query_as!(
            TermsAndConditionsTemplate,
            "SELECT * FROM terms_and_conditions_templates WHERE company_id = $1 ORDER BY created_at DESC",
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }

    // --- Sales Taxes Templates ---
    pub async fn create_sales_taxes_template(&self, req: CreateSalesTaxesTemplateRequest, company_id: Uuid) -> Result<SalesTaxesTemplate, sqlx::Error> {
        sqlx::query_as!(
            SalesTaxesTemplate,
            r#"
            INSERT INTO sales_taxes_templates (company_id, title, rate, account_id, is_default)
            VALUES ($1, $2, $3, $4, COALESCE($5, false))
            RETURNING id, company_id, title, rate, account_id, is_default, created_at
            "#,
            company_id, req.title, req.rate, req.account_id, req.is_default
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_sales_taxes_templates(&self, company_id: Uuid) -> Result<Vec<SalesTaxesTemplate>, sqlx::Error> {
        sqlx::query_as!(
            SalesTaxesTemplate,
            "SELECT * FROM sales_taxes_templates WHERE company_id = $1 ORDER BY created_at DESC",
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }

    // --- UTM Sources ---
    pub async fn create_utm_source(&self, req: CreateUtmSourceRequest, company_id: Uuid) -> Result<UtmSource, sqlx::Error> {
        sqlx::query_as!(
            UtmSource,
            r#"
            INSERT INTO utm_sources (company_id, name, medium, description)
            VALUES ($1, $2, $3, $4)
            RETURNING id, company_id, name, medium, description, created_at
            "#,
            company_id, req.name, req.medium, req.description
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_utm_sources(&self, company_id: Uuid) -> Result<Vec<UtmSource>, sqlx::Error> {
        sqlx::query_as!(
            UtmSource,
            "SELECT * FROM utm_sources WHERE company_id = $1 ORDER BY created_at DESC",
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }

    // --- Campaigns ---
    pub async fn create_campaign(&self, req: CreateCampaignRequest, company_id: Uuid) -> Result<Campaign, sqlx::Error> {
        sqlx::query_as!(
            Campaign,
            r#"
            INSERT INTO campaigns (company_id, campaign_name, utm_source_id, start_date, end_date, budget, actual_cost, description)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, company_id, campaign_name, utm_source_id, start_date, end_date, budget, actual_cost, description, created_at
            "#,
            company_id, req.campaign_name, req.utm_source_id, req.start_date, req.end_date, req.budget, req.actual_cost, req.description
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_campaigns(&self, company_id: Uuid) -> Result<Vec<Campaign>, sqlx::Error> {
        sqlx::query_as!(
            Campaign,
            "SELECT * FROM campaigns WHERE company_id = $1 ORDER BY created_at DESC",
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }
}
