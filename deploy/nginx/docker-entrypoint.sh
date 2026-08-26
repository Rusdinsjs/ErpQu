#!/bin/bash
set -e

export NGINX_HOST=${NGINX_HOST:-app.sjsgroup.online}
CERT_PATH="/etc/letsencrypt/live/$NGINX_HOST"

# Substitute $NGINX_HOST in Nginx config
if [ -f /etc/nginx/conf.d/default.conf ]; then
    envsubst '${NGINX_HOST}' < /etc/nginx/conf.d/default.conf > /tmp/nginx.conf.tmp
    mv /tmp/nginx.conf.tmp /etc/nginx/conf.d/default.conf
fi

# If no TLS certs exist yet, create self-signed for initial startup
if [ ! -f "$CERT_PATH/fullchain.pem" ]; then
    echo "=== No TLS certificates found for $NGINX_HOST ==="
    echo "=== Generating self-signed certificate for initial startup ==="
    
    mkdir -p "$CERT_PATH"
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$CERT_PATH/privkey.pem" \
        -out "$CERT_PATH/fullchain.pem" \
        -subj "/CN=$NGINX_HOST/O=ERPQu/C=ID"
    
    echo "=== Self-signed cert created for $NGINX_HOST ==="
fi

# Start cron for cert renewal in background
echo "0 12 * * * /usr/bin/certbot renew --quiet && nginx -s reload" | crontab -
crond -b 2>/dev/null || true

# Execute the CMD
exec "$@"
