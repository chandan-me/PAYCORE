# ==============================================================================
# PAYCORE Frontend — Production Multi-Stage Dockerfile
# Stage 1: Build React 18 + Vite TypeScript bundle
# Stage 2: Serve via High-Performance Nginx Alpine
# ==============================================================================

# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests & install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code & configuration
COPY . .

# Compile TypeScript and build production bundle
RUN npm run build

# Production Nginx Stage
FROM nginx:alpine AS runner

# Copy built static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom Nginx configuration for Single Page App (SPA) routing
RUN echo 'server {' \
    '    listen 5173;' \
    '    server_name localhost;' \
    '    root /usr/share/nginx/html;' \
    '    index index.html;' \
    '    location / {' \
    '        try_files $uri $uri/ /index.html;' \
    '    }' \
    '    location /assets/ {' \
    '        expires 1y;' \
    '        add_header Cache-Control "public, immutable";' \
    '    }' \
    '}' > /etc/nginx/conf.d/default.conf

EXPOSE 5173

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5173/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
