#!/bin/bash
set -e

DOMAIN=${NGINX_HOST:-localhost}
CERT_PATH="/etc/letsencrypt/live/$DOMAIN"

# If no TLS certs exist yet, create self-signed for initial startup
if [ ! -f "$CERT_PATH/fullchain.pem" ]; then
    echo "=== No TLS certificates found for $DOMAIN ==="
    echo "=== Generating self-signed certificate for initial startup ==="
    
    mkdir -p "$CERT_PATH"
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$CERT_PATH/privkey.pem" \
        -out "$CERT_PATH/fullchain.pem" \
        -subj "/CN=$DOMAIN/O=ERPQu/C=ID"
    
    echo "=== Self-signed cert created. Replace with Let's Encrypt using: ==="
    echo "    certbot certonly --webroot -w /var/www/certbot -d $DOMAIN"
fi

# Start cron for cert renewal in background
echo "0 12 * * * /usr/bin/certbot renew --quiet && nginx -s reload" | crontab -
crond -b

# Execute the CMD
exec "$@"
