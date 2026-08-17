//! Multi-Currency Exchange Rate Service (QACC-008)
//!
//! Provides:
//! 1. Exchange rate CRUD operations
//! 2. Rate lookup with fallback logic (exact date → most recent → error)
//! 3. Currency conversion helper
//! 4. Gain/Loss calculation for realized forex differences

use chrono::NaiveDate;
use management_system_core::domain::errors::{DomainError, DomainResult};
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

/// Exchange rate record
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ExchangeRate {
    pub id: Uuid,
    pub company_id: Uuid,
    pub from_currency: String,
    pub to_currency: String,
    pub exchange_rate: Decimal,
    pub effective_date: NaiveDate,
    pub source: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub created_by: Option<Uuid>,
}

/// Request to set an exchange rate
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SetExchangeRateRequest {
    pub company_id: Uuid,
    pub from_currency: String,
    pub to_currency: String,
    pub exchange_rate: Decimal,
    pub effective_date: NaiveDate,
    pub source: Option<String>,
}

/// Currency conversion result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversionResult {
    pub from_amount: Decimal,
    pub from_currency: String,
    pub to_amount: Decimal,
    pub to_currency: String,
    pub rate_used: Decimal,
    pub rate_date: NaiveDate,
}

#[derive(Clone)]
pub struct MultiCurrencyService {
    pool: PgPool,
}

impl MultiCurrencyService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Set (upsert) an exchange rate for a specific date
    pub async fn set_rate(&self, req: &SetExchangeRateRequest) -> DomainResult<ExchangeRate> {
        if req.exchange_rate <= dec!(0) {
            return Err(DomainError::validation(
                "exchange_rate",
                "Exchange rate must be positive",
            ));
        }

        if req.from_currency == req.to_currency {
            return Err(DomainError::validation(
                "currency",
                "From and To currency must be different",
            ));
        }

        let rate: ExchangeRate = sqlx::query_as(
            r#"
            INSERT INTO exchange_rates (company_id, from_currency, to_currency, exchange_rate, effective_date, source, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (company_id, from_currency, to_currency, effective_date)
            DO UPDATE SET exchange_rate = $4, source = $6
            RETURNING *
            "#,
        )
        .bind(req.company_id)
        .bind(&req.from_currency)
        .bind(&req.to_currency)
        .bind(req.exchange_rate)
        .bind(req.effective_date)
        .bind(&req.source)
        .bind(None::<Uuid>) // created_by — will be set by caller
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::internal(e.to_string()))?;

        Ok(rate)
    }

    /// Get the effective exchange rate for a date (exact match or most recent prior)
    pub async fn get_rate(
        &self,
        company_id: Uuid,
        from_currency: &str,
        to_currency: &str,
        date: NaiveDate,
    ) -> DomainResult<ExchangeRate> {
        // If same currency, return rate of 1
        if from_currency == to_currency {
            return Ok(ExchangeRate {
                id: Uuid::nil(),
                company_id,
                from_currency: from_currency.to_string(),
                to_currency: to_currency.to_string(),
                exchange_rate: dec!(1),
                effective_date: date,
                source: Some("identity".to_string()),
                created_at: chrono::Utc::now(),
                created_by: None,
            });
        }

        // Find the most recent rate on or before the given date
        let rate: Option<ExchangeRate> = sqlx::query_as(
            r#"
            SELECT * FROM exchange_rates
            WHERE company_id = $1
                AND from_currency = $2
                AND to_currency = $3
                AND effective_date <= $4
            ORDER BY effective_date DESC
            LIMIT 1
            "#,
        )
        .bind(company_id)
        .bind(from_currency)
        .bind(to_currency)
        .bind(date)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| DomainError::internal(e.to_string()))?;

        rate.ok_or_else(|| {
            DomainError::business_rule(
                "ExchangeRateNotFound",
                &format!(
                    "No exchange rate found for {}/{} on or before {}",
                    from_currency, to_currency, date
                ),
            )
        })
    }

    /// Convert an amount from one currency to another
    pub async fn convert(
        &self,
        company_id: Uuid,
        amount: Decimal,
        from_currency: &str,
        to_currency: &str,
        date: NaiveDate,
    ) -> DomainResult<ConversionResult> {
        let rate_record = self.get_rate(company_id, from_currency, to_currency, date).await?;
        let converted = (amount * rate_record.exchange_rate).round_dp(4);

        Ok(ConversionResult {
            from_amount: amount,
            from_currency: from_currency.to_string(),
            to_amount: converted,
            to_currency: to_currency.to_string(),
            rate_used: rate_record.exchange_rate,
            rate_date: rate_record.effective_date,
        })
    }

    /// List exchange rates for a company within a date range
    pub async fn list_rates(
        &self,
        company_id: Uuid,
        from_date: Option<NaiveDate>,
        to_date: Option<NaiveDate>,
    ) -> DomainResult<Vec<ExchangeRate>> {
        let rates: Vec<ExchangeRate> = sqlx::query_as(
            r#"
            SELECT * FROM exchange_rates
            WHERE company_id = $1
                AND ($2::DATE IS NULL OR effective_date >= $2)
                AND ($3::DATE IS NULL OR effective_date <= $3)
            ORDER BY from_currency, to_currency, effective_date DESC
            "#,
        )
        .bind(company_id)
        .bind(from_date)
        .bind(to_date)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::internal(e.to_string()))?;

        Ok(rates)
    }

    /// Calculate realized foreign exchange gain/loss
    /// Compares the booking rate vs settlement rate for a specific transaction
    pub fn calculate_forex_gain_loss(
        booking_amount: Decimal,
        booking_rate: Decimal,
        settlement_rate: Decimal,
    ) -> Decimal {
        let booking_value = booking_amount * booking_rate;
        let settlement_value = booking_amount * settlement_rate;
        // Positive = gain, negative = loss
        (settlement_value - booking_value).round_dp(4)
    }
}
