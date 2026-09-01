FROM nginx:1.27-alpine

# Install certbot for automated TLS certificate renewal
RUN apk add --no-cache certbot certbot-nginx bash curl openssl

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY hermes.conf /etc/nginx/conf.d/hermes.conf
COPY llm.conf /etc/nginx/conf.d/llm.conf

# Create directories for certbot
RUN mkdir -p /var/www/certbot /etc/letsencrypt

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

EXPOSE 80 443

# Use custom entrypoint for cert initialization
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
