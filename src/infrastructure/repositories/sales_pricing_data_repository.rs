use sqlx::PgPool;
use uuid::Uuid;
use crate::domain::entities::sales_pricing_data::*;

pub struct SalesPricingDataRepository {
    pool: PgPool,
}

impl SalesPricingDataRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    // --- Price Lists ---
    pub async fn create_price_list(&self, req: CreatePriceListRequest, company_id: Uuid) -> Result<PriceList, sqlx::Error> {
        sqlx::query_as!(
            PriceList,
            r#"
            INSERT INTO price_lists (company_id, price_list_name, currency, buying, selling, enabled)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, company_id, price_list_name, currency, buying, selling, enabled, created_at
            "#,
            company_id, req.price_list_name, req.currency, req.buying, req.selling, req.enabled
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_price_lists(&self, company_id: Uuid) -> Result<Vec<PriceList>, sqlx::Error> {
        sqlx::query_as!(
            PriceList,
            "SELECT * FROM price_lists WHERE company_id = $1 ORDER BY created_at DESC",
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }

    // --- Item Prices ---
    pub async fn create_item_price(&self, req: CreateItemPriceRequest, company_id: Uuid) -> Result<ItemPrice, sqlx::Error> {
        sqlx::query_as!(
            ItemPrice,
            r#"
            INSERT INTO item_prices (company_id, price_list_id, item_id, price_list_rate, valid_from, valid_upto)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, company_id, price_list_id, item_id, price_list_rate, valid_from, valid_upto, created_at
            "#,
            company_id, req.price_list_id, req.item_id, req.price_list_rate, req.valid_from, req.valid_upto
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_item_prices(&self, company_id: Uuid) -> Result<Vec<ItemPrice>, sqlx::Error> {
        sqlx::query_as!(
            ItemPrice,
            "SELECT * FROM item_prices WHERE company_id = $1 ORDER BY created_at DESC",
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }

    // --- Product Bundles ---
    pub async fn create_product_bundle(&self, req: CreateProductBundleRequest, company_id: Uuid) -> Result<ProductBundle, sqlx::Error> {
        sqlx::query_as!(
            ProductBundle,
            r#"
            INSERT INTO product_bundles (company_id, new_item_code, description)
            VALUES ($1, $2, $3)
            RETURNING id, company_id, new_item_code, description, created_at
            "#,
            company_id, req.new_item_code, req.description
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_product_bundles(&self, company_id: Uuid) -> Result<Vec<ProductBundle>, sqlx::Error> {
        sqlx::query_as!(
            ProductBundle,
            "SELECT * FROM product_bundles WHERE company_id = $1 ORDER BY created_at DESC",
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }

    // --- Pricing Rules ---
    pub async fn create_pricing_rule(&self, req: CreatePricingRuleRequest, company_id: Uuid) -> Result<PricingRule, sqlx::Error> {
        sqlx::query_as!(
            PricingRule,
            r#"
            INSERT INTO pricing_rules (company_id, title, apply_on, discount_percentage, margin_type, margin_rate, priority, enabled)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, company_id, title, apply_on, discount_percentage, margin_type, margin_rate, priority, enabled, created_at
            "#,
            company_id, req.title, req.apply_on, req.discount_percentage, req.margin_type, req.margin_rate, req.priority, req.enabled
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_pricing_rules(&self, company_id: Uuid) -> Result<Vec<PricingRule>, sqlx::Error> {
        sqlx::query_as!(
            PricingRule,
            "SELECT * FROM pricing_rules WHERE company_id = $1 ORDER BY created_at DESC",
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }

    // --- Promotional Schemes ---
    pub async fn create_promotional_scheme(&self, req: CreatePromotionalSchemeRequest, company_id: Uuid) -> Result<PromotionalScheme, sqlx::Error> {
        sqlx::query_as!(
            PromotionalScheme,
            r#"
            INSERT INTO promotional_schemes (company_id, name, description, discount_type, discount_value, min_qty, from_date, to_date, enabled)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, company_id, name, description, discount_type, discount_value, min_qty, from_date, to_date, enabled, created_at
            "#,
            company_id, req.name, req.description, req.discount_type, req.discount_value, req.min_qty, req.from_date, req.to_date, req.enabled
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_promotional_schemes(&self, company_id: Uuid) -> Result<Vec<PromotionalScheme>, sqlx::Error> {
        sqlx::query_as!(
            PromotionalScheme,
            "SELECT * FROM promotional_schemes WHERE company_id = $1 ORDER BY created_at DESC",
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }

    // --- Coupon Codes ---
    pub async fn create_coupon_code(&self, req: CreateCouponCodeRequest, company_id: Uuid) -> Result<CouponCode, sqlx::Error> {
        sqlx::query_as!(
            CouponCode,
            r#"
            INSERT INTO coupon_codes (company_id, coupon_name, coupon_code, discount_percentage, maximum_use, valid_from, valid_upto)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, company_id, coupon_name, coupon_code, discount_percentage, maximum_use, used_count, valid_from, valid_upto, used, created_at
            "#,
            company_id, req.coupon_name, req.coupon_code, req.discount_percentage, req.maximum_use, req.valid_from, req.valid_upto
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_coupon_codes(&self, company_id: Uuid) -> Result<Vec<CouponCode>, sqlx::Error> {
        sqlx::query_as!(
            CouponCode,
            "SELECT * FROM coupon_codes WHERE company_id = $1 ORDER BY created_at DESC",
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }
}
