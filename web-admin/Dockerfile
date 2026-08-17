# --- Build Stage ---
FROM node:20-alpine as builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
ENV VITE_API_URL=/api
ENV VITE_WS_URL=/ws
RUN npm run build

# --- Runtime Stage ---
FROM nginx:alpine

# Copy build files to nginx static directory
COPY --from=builder /app/dist /usr/share/nginx/html

# SPA Routing Config (All requests fallback to index.html for React Router)
RUN echo 'server { \
    listen 80; \
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
