//! JWT Utilities (Short-lived Access Token & Configurable Expiry)

use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use uuid::Uuid;

/// JWT Claims
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: Uuid, // user id
    pub email: String,
    pub role: String,
    pub exp: i64, // expiration time
    pub iat: i64, // issued at
}

#[derive(Debug, Clone)]
pub struct JwtConfig {
    pub secret: String,
    pub expiry_hours: i64,
    pub access_expiry_minutes: i64,
    pub refresh_expiry_days: i64,
}

impl JwtConfig {
    pub fn new(secret: String, expiry_hours: i64) -> Self {
        Self {
            secret,
            expiry_hours,
            access_expiry_minutes: 15, // Default short-lived access token: 15 minutes (Fase 22)
            refresh_expiry_days: 7,   // Default rotating refresh token: 7 days
        }
    }

    pub fn from_env() -> Self {
        let access_mins = std::env::var("JWT_ACCESS_EXPIRY_MINUTES")
            .ok()
            .and_then(|s| s.parse().ok())
            .unwrap_or(15);

        let refresh_days = std::env::var("JWT_REFRESH_EXPIRY_DAYS")
            .ok()
            .and_then(|s| s.parse().ok())
            .unwrap_or(7);

        let expiry_hours = std::env::var("JWT_EXPIRY_HOURS")
            .unwrap_or_else(|_| "24".to_string())
            .parse()
            .unwrap_or(24);

        Self {
            secret: std::env::var("JWT_SECRET")
                .ok()
                .filter(|s| !s.trim().is_empty())
                .expect("FATAL SECURITY ERROR: JWT_SECRET environment variable is required"),
            expiry_hours,
            access_expiry_minutes: access_mins,
            refresh_expiry_days: refresh_days,
        }
    }
}

/// Create JWT token
pub fn create_token<T: Serialize>(claims: &T, config: &JwtConfig) -> Result<String, String> {
    encode(
        &Header::default(),
        claims,
        &EncodingKey::from_secret(config.secret.as_bytes()),
    )
    .map_err(|e| e.to_string())
}

/// Decode JWT token
pub fn decode_token<T: DeserializeOwned>(token: &str, config: &JwtConfig) -> Result<T, String> {
    let token_data = decode::<T>(
        token,
        &DecodingKey::from_secret(config.secret.as_bytes()),
        &Validation::default(),
    )
    .map_err(|e| e.to_string())?;

    Ok(token_data.claims)
}

/// Validate token and extract claims
pub fn validate_token<T: DeserializeOwned>(token: &str, config: &JwtConfig) -> Option<T> {
    decode_token(token, config).ok()
}
