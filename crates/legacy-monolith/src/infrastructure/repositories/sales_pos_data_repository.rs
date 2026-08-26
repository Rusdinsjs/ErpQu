use sqlx::PgPool;
use uuid::Uuid;
use crate::domain::entities::sales_pos_data::*;

pub struct SalesPosDataRepository {
    pool: PgPool,
}

impl SalesPosDataRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    // --- POS Profiles ---
    pub async fn create_pos_profile(&self, req: CreatePosProfileRequest, company_id: Uuid) -> Result<PosProfile, sqlx::Error> {
        sqlx::query_as!(
            PosProfile,
            r#"
            INSERT INTO pos_profiles (company_id, profile_name, warehouse_id, cash_account_id, is_active)
            VALUES ($1, $2, $3, $4, COALESCE($5, true))
            RETURNING id, company_id, profile_name, warehouse_id, cash_account_id, is_active, created_at
            "#,
            company_id, req.profile_name, req.warehouse_id, req.cash_account_id, req.is_active
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_pos_profiles(&self, company_id: Uuid) -> Result<Vec<PosProfile>, sqlx::Error> {
        sqlx::query_as!(
            PosProfile,
            "SELECT * FROM pos_profiles WHERE company_id = $1 ORDER BY created_at DESC",
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }

    // --- POS Settings ---
    pub async fn create_pos_settings(&self, req: CreatePosSettingsRequest, company_id: Uuid) -> Result<PosSettings, sqlx::Error> {
        sqlx::query_as!(
            PosSettings,
            r#"
            INSERT INTO pos_settings (company_id, allow_discount_change, allow_rate_change, auto_print_receipt)
            VALUES ($1, $2, $3, $4)
            RETURNING id, company_id, allow_discount_change, allow_rate_change, auto_print_receipt, created_at
            "#,
            company_id, req.allow_discount_change, req.allow_rate_change, req.auto_print_receipt
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_pos_settings(&self, company_id: Uuid) -> Result<Vec<PosSettings>, sqlx::Error> {
        sqlx::query_as!(
            PosSettings,
            "SELECT * FROM pos_settings WHERE company_id = $1 ORDER BY created_at DESC",
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }

    // --- POS Opening Entries ---
    pub async fn create_pos_opening_entry(&self, req: CreatePosOpeningEntryRequest, company_id: Uuid) -> Result<PosOpeningEntry, sqlx::Error> {
        sqlx::query_as!(
            PosOpeningEntry,
            r#"
            INSERT INTO pos_opening_entries (company_id, pos_profile_id, user_id, opening_amount, status)
            VALUES ($1, $2, $3, $4, 'Open')
            RETURNING id, company_id, pos_profile_id, user_id, period_start_date, opening_amount, status, created_at
            "#,
            company_id, req.pos_profile_id, req.user_id, req.opening_amount
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_pos_opening_entries(&self, company_id: Uuid) -> Result<Vec<PosOpeningEntry>, sqlx::Error> {
        sqlx::query_as!(
            PosOpeningEntry,
            "SELECT * FROM pos_opening_entries WHERE company_id = $1 ORDER BY created_at DESC",
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }

    // --- POS Closing Entries ---
    pub async fn create_pos_closing_entry(&self, req: CreatePosClosingEntryRequest, company_id: Uuid) -> Result<PosClosingEntry, sqlx::Error> {
        sqlx::query_as!(
            PosClosingEntry,
            r#"
            INSERT INTO pos_closing_entries (company_id, pos_profile_id, user_id, pos_opening_entry_id, period_start_date, grand_total, net_total, total_quantity, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Submitted')
            RETURNING id, company_id, pos_profile_id, user_id, pos_opening_entry_id, period_start_date, period_end_date, grand_total, net_total, total_quantity, status, created_at
            "#,
            company_id, req.pos_profile_id, req.user_id, req.pos_opening_entry_id, req.period_start_date, req.grand_total, req.net_total, req.total_quantity
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_pos_closing_entries(&self, company_id: Uuid) -> Result<Vec<PosClosingEntry>, sqlx::Error> {
        sqlx::query_as!(
            PosClosingEntry,
            "SELECT * FROM pos_closing_entries WHERE company_id = $1 ORDER BY created_at DESC",
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }

    // --- Loyalty Programs ---
    pub async fn create_loyalty_program(&self, req: CreateLoyaltyProgramRequest, company_id: Uuid) -> Result<LoyaltyProgram, sqlx::Error> {
        sqlx::query_as!(
            LoyaltyProgram,
            r#"
            INSERT INTO loyalty_programs (company_id, program_name, auto_opt_in, from_date, to_date, conversion_factor, expiry_duration_in_days)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, company_id, program_name, auto_opt_in, from_date, to_date, conversion_factor, expiry_duration_in_days, created_at
            "#,
            company_id, req.program_name, req.auto_opt_in, req.from_date, req.to_date, req.conversion_factor, req.expiry_duration_in_days
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_loyalty_programs(&self, company_id: Uuid) -> Result<Vec<LoyaltyProgram>, sqlx::Error> {
        sqlx::query_as!(
            LoyaltyProgram,
            "SELECT * FROM loyalty_programs WHERE company_id = $1 ORDER BY created_at DESC",
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }

    // --- Loyalty Point Entries ---
    pub async fn create_loyalty_point_entry(&self, req: CreateLoyaltyPointEntryRequest, company_id: Uuid) -> Result<LoyaltyPointEntry, sqlx::Error> {
        sqlx::query_as!(
            LoyaltyPointEntry,
            r#"
            INSERT INTO loyalty_point_entries (company_id, loyalty_program_id, client_id, sales_invoice_id, loyalty_points, purchase_amount, expiry_date)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, company_id, loyalty_program_id, client_id, sales_invoice_id, loyalty_points, purchase_amount, expiry_date, posting_date, created_at
            "#,
            company_id, req.loyalty_program_id, req.client_id, req.sales_invoice_id, req.loyalty_points, req.purchase_amount, req.expiry_date
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_loyalty_point_entries(&self, company_id: Uuid) -> Result<Vec<LoyaltyPointEntry>, sqlx::Error> {
        sqlx::query_as!(
            LoyaltyPointEntry,
            "SELECT * FROM loyalty_point_entries WHERE company_id = $1 ORDER BY created_at DESC",
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }
}
