use chrono::{DateTime, Utc};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

use crate::infrastructure::cache::CacheOperations;

/// Distributed & Thread-safe session tracker for JTI revocation & role security invalidations (QSEC-008 / Fase 22)
#[derive(Clone)]
pub struct SessionTracker {
    cache: Option<Arc<dyn CacheOperations>>,
    /// In-memory fallback / local cache: Maps revoked JTI string -> revocation expiration time
    revoked_jtis: Arc<RwLock<HashMap<String, DateTime<Utc>>>>,
    /// In-memory fallback: Maps user_id -> timestamp when user sessions were invalidated
    user_invalidations: Arc<RwLock<HashMap<Uuid, i64>>>,
}

impl Default for SessionTracker {
    fn default() -> Self {
        Self::new()
    }
}

impl SessionTracker {
    pub fn new() -> Self {
        Self {
            cache: None,
            revoked_jtis: Arc::new(RwLock::new(HashMap::new())),
            user_invalidations: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub fn with_cache(cache: Arc<dyn CacheOperations>) -> Self {
        Self {
            cache: Some(cache),
            revoked_jtis: Arc::new(RwLock::new(HashMap::new())),
            user_invalidations: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Revoke a specific token JTI (e.g. on logout or explicit revocation) across Redis cluster
    pub async fn revoke_jti(&self, jti: String, expires_at: DateTime<Utc>) {
        if let Some(ref cache) = self.cache {
            let ttl_secs = (expires_at - Utc::now()).num_seconds().max(1) as u64;
            let key = format!("session:revoked:{}", jti);
            let _ = cache
                .set_raw(&key, "1", Some(std::time::Duration::from_secs(ttl_secs)))
                .await;
        }
        let mut map = self.revoked_jtis.write().await;
        map.insert(jti, expires_at);
    }

    /// Check if a JTI is revoked in Redis or local memory
    pub async fn is_jti_revoked(&self, jti: &str) -> bool {
        if let Some(ref cache) = self.cache {
            let key = format!("session:revoked:{}", jti);
            if let Ok(exists) = cache.exists(&key).await {
                if exists {
                    return true;
                }
            }
        }
        let map = self.revoked_jtis.read().await;
        if let Some(exp) = map.get(jti) {
            if *exp > Utc::now() {
                return true;
            }
        }
        false
    }

    /// Invalidate all active tokens for a specific user issued BEFORE this moment
    /// (called on role assignment, role removal, password change, or security mutation)
    pub async fn invalidate_user_sessions(&self, user_id: Uuid) {
        let now_epoch = Utc::now().timestamp();
        if let Some(ref cache) = self.cache {
            let key = format!("user:invalidated_before:{}", user_id);
            // 30 days TTL in Redis
            let _ = cache
                .set_raw(
                    &key,
                    &now_epoch.to_string(),
                    Some(std::time::Duration::from_secs(86400 * 30)),
                )
                .await;
        }
        let mut map = self.user_invalidations.write().await;
        map.insert(user_id, now_epoch);
        tracing::info!(
            "Invalidated active sessions for user {} issued before {}",
            user_id,
            now_epoch
        );
    }

    /// Check if token issued at timestamp (`iat`) for `user_id` was invalidated by security mutation
    pub async fn is_user_token_invalidated(&self, user_id: Uuid, iat: i64) -> bool {
        if let Some(ref cache) = self.cache {
            let key = format!("user:invalidated_before:{}", user_id);
            if let Ok(Some(val)) = cache.get_raw(&key).await {
                if let Ok(invalidated_before) = val.parse::<i64>() {
                    if iat <= invalidated_before {
                        return true;
                    }
                }
            }
        }
        let map = self.user_invalidations.read().await;
        if let Some(&invalidated_before) = map.get(&user_id) {
            if iat <= invalidated_before {
                return true;
            }
        }
        false
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_jti_revocation() {
        let tracker = SessionTracker::new();
        let jti = "test-jti-123".to_string();

        assert!(!tracker.is_jti_revoked(&jti).await);

        tracker
            .revoke_jti(jti.clone(), Utc::now() + chrono::Duration::hours(1))
            .await;

        assert!(tracker.is_jti_revoked(&jti).await);
    }

    #[tokio::test]
    async fn test_user_session_invalidation_after_role_change() {
        let tracker = SessionTracker::new();
        let user_id = Uuid::new_v4();
        let old_iat = Utc::now().timestamp() - 100;

        // Active token issued before role change should be valid initially
        assert!(!tracker.is_user_token_invalidated(user_id, old_iat).await);

        // Role is revoked/mutated -> invalidate active sessions
        tracker.invalidate_user_sessions(user_id).await;

        // Old token issued before role change is now rejected
        assert!(tracker.is_user_token_invalidated(user_id, old_iat).await);

        // Newly issued token (iat in future relative to invalidation) remains valid
        let new_iat = Utc::now().timestamp() + 10;
        assert!(!tracker.is_user_token_invalidated(user_id, new_iat).await);
    }
}
