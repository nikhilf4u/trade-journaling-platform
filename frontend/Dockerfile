# ============================================================
# FRONTEND — Multi-stage Docker build
# Stage 1: Build React app with Node
# Stage 2: Serve with Nginx
# ============================================================

# ------------------------------------------------------------
# Stage 1: BUILDER
# ------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (for cache efficiency)
COPY package*.json ./

# Install dependencies (use ci for reproducible builds)
RUN npm ci

# Copy source code
COPY . .

# Build argument for API URL (baked into the bundle at build time)
ARG VITE_API_URL=
ENV VITE_API_URL=${VITE_API_URL}

# Build the production bundle
RUN npm run build

# ------------------------------------------------------------
# Stage 2: RUNTIME (Nginx)
# ------------------------------------------------------------
FROM nginx:1.27-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx runs as root by default; drop to nginx user
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
