# --- Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build production assets
COPY . .
ENV VITE_API_URL=/api
ENV VITE_WS_URL=/ws
RUN npm run build

# --- Runtime Stage ---
FROM nginx:alpine

# Copy compiled SPA dist files to nginx html root
COPY --from=builder /app/dist /usr/share/nginx/html

# SPA Routing Config (All requests fallback to index.html for React Router, assets return 404)
RUN echo 'server { \
    listen 80; \
    location /assets/ { \
        root /usr/share/nginx/html; \
        try_files $uri =404; \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
        add_header Cache-Control "no-cache, no-store, must-revalidate"; \
        add_header Pragma "no-cache"; \
        add_header Expires "0"; \
    } \
}' > /etc/nginx/conf.d/default.conf


EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
