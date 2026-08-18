use chrono::{DateTime, Utc};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;

use crate::infrastructure::cache::CacheOperations;

pub const MAX_FAILED_ATTEMPTS: u32 = 5;
pub const LOCKOUT_DURATION_SECS: i64 = 15 * 60; // 15 minutes lockout

#[derive(Debug, Clone)]
pub struct FailedAttemptRecord {
    pub count: u32,
    pub last_failed_at: DateTime<Utc>,
    pub locked_until: Option<DateTime<Utc>>,
}

/// Distributed & Thread-safe Login Lockout & Brute-Force Tracker (QSEC-009 / Fase 22)
#[derive(Clone)]
pub struct LoginLockoutTracker {
    cache: Option<Arc<dyn CacheOperations>>,
    records: Arc<Mutex<HashMap<String, FailedAttemptRecord>>>,
}

impl Default for LoginLockoutTracker {
    fn default() -> Self {
        Self::new()
    }
}

impl LoginLockoutTracker {
    pub fn new() -> Self {
        Self {
            cache: None,
            records: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn with_cache(cache: Arc<dyn CacheOperations>) -> Self {
        Self {
            cache: Some(cache),
            records: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Check if target email/key is currently locked out
    pub async fn check_lockout(&self, key: &str) -> Result<(), String> {
        let key_lower = key.trim().to_lowercase();
        if let Some(ref cache) = self.cache {
            let lock_key = format!("login:lockout:{}", key_lower);
            if let Ok(true) = cache.exists(&lock_key).await {
                return Err(
                    "Account is temporarily locked due to repeated failed login attempts. Try again in 15 minutes."
                        .to_string(),
                );
            }
        }

        let mut records = self.records.lock().await;

        if let Some(rec) = records.get_mut(&key_lower) {
            if let Some(until) = rec.locked_until {
                if Utc::now() < until {
                    let secs_left = (until - Utc::now()).num_seconds();
                    return Err(format!(
                        "Account is temporarily locked due to repeated failed login attempts. Try again in {} seconds.",
                        secs_left
                    ));
                } else {
                    // Lockout expired, reset record
                    rec.locked_until = None;
                    rec.count = 0;
                }
            }
        }
        Ok(())
    }

    /// Record a failed login attempt for an email/key across Redis cluster
    pub async fn record_failed_attempt(&self, key: &str) -> (u32, bool) {
        let key_lower = key.trim().to_lowercase();
        let mut count = 0;
        let mut is_locked = false;

        if let Some(ref cache) = self.cache {
            let failed_key = format!("login:failed:{}", key_lower);
            if let Ok(c) = cache.incr(&failed_key, std::time::Duration::from_secs(900)).await {
                count = c as u32;
                if count >= MAX_FAILED_ATTEMPTS {
                    let lock_key = format!("login:lockout:{}", key_lower);
                    let _ = cache
                        .set_raw(
                            &lock_key,
                            "1",
                            Some(std::time::Duration::from_secs(LOCKOUT_DURATION_SECS as u64)),
                        )
                        .await;
                    is_locked = true;
                }
            }
        }

        let mut records = self.records.lock().await;
        let entry = records
            .entry(key_lower.clone())
            .or_insert_with(|| FailedAttemptRecord {
                count: 0,
                last_failed_at: Utc::now(),
                locked_until: None,
            });

        entry.count += 1;
        entry.last_failed_at = Utc::now();

        if entry.count >= MAX_FAILED_ATTEMPTS {
            entry.locked_until =
                Some(Utc::now() + chrono::Duration::seconds(LOCKOUT_DURATION_SECS));
            tracing::warn!(
                "SECURITY AUDIT BRUTE-FORCE LOCKOUT: Key '{}' locked out for 15 minutes after {} failed attempts",
                key_lower,
                entry.count
            );
            is_locked = true;
        }

        if count == 0 {
            count = entry.count;
        }

        (count, is_locked)
    }

    /// Record successful login (resets counter for key across Redis & memory)
    pub async fn record_success(&self, key: &str) {
        let key_lower = key.trim().to_lowercase();
        if let Some(ref cache) = self.cache {
            let _ = cache.delete(&format!("login:failed:{}", key_lower)).await;
            let _ = cache.delete(&format!("login:lockout:{}", key_lower)).await;
        }
        let mut records = self.records.lock().await;
        records.remove(&key_lower);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_login_lockout_after_max_failed_attempts() {
        let tracker = LoginLockoutTracker::new();
        let email = "user@example.com";

        // Initial check should pass
        assert!(tracker.check_lockout(email).await.is_ok());

        // Perform 4 failed attempts
        for _ in 0..4 {
            let (_, is_locked) = tracker.record_failed_attempt(email).await;
            assert!(!is_locked);
            assert!(tracker.check_lockout(email).await.is_ok());
        }

        // 5th failed attempt triggers lockout
        let (count, is_locked) = tracker.record_failed_attempt(email).await;
        assert_eq!(count, 5);
        assert!(is_locked);

        // Subsequent check fails with lockout message
        let lockout_err = tracker.check_lockout(email).await;
        assert!(lockout_err.is_err());
        assert!(lockout_err.unwrap_err().contains("temporarily locked"));
    }

    #[tokio::test]
    async fn test_successful_login_resets_failed_counter() {
        let tracker = LoginLockoutTracker::new();
        let email = "admin@example.com";

        // 3 failed attempts
        for _ in 0..3 {
            tracker.record_failed_attempt(email).await;
        }

        // Successful login resets counter
        tracker.record_success(email).await;

        // 3 more failed attempts should not trigger lockout because counter was reset
        for _ in 0..3 {
            let (_, is_locked) = tracker.record_failed_attempt(email).await;
            assert!(!is_locked);
        }

        assert!(tracker.check_lockout(email).await.is_ok());
    }
}
