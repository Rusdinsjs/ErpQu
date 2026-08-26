-- Migration: Webhook Subscription & Delivery System (QAPI-003)

-- ═══════════════════════════════════════════════════
-- 1. WEBHOOK SUBSCRIPTIONS
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS webhook_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,   -- e.g. "asset.created", "*" for all
    target_url TEXT NOT NULL,
    secret TEXT,                         -- HMAC-SHA256 signing secret
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    CONSTRAINT uq_webhook_subscription UNIQUE (company_id, event_type, target_url)
);

CREATE INDEX IF NOT EXISTS idx_webhook_subs_company_event
    ON webhook_subscriptions(company_id, event_type, is_active);

-- ═══════════════════════════════════════════════════
-- 2. WEBHOOK DELIVERY LOG
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS webhook_delivery_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, delivered, failed, retrying
    http_status INT,
    response_body TEXT,
    attempt_count INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    next_retry_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_delivery_pending
    ON webhook_delivery_log(status, next_retry_at)
    WHERE status IN ('pending', 'retrying');

CREATE INDEX IF NOT EXISTS idx_webhook_delivery_sub
    ON webhook_delivery_log(subscription_id, created_at DESC);

COMMENT ON TABLE webhook_subscriptions IS 'QAPI-003: Outbound webhook subscriptions per company per event type';
COMMENT ON TABLE webhook_delivery_log IS 'QAPI-003: Webhook delivery attempts with retry tracking';
