#!/bin/bash

# ============================================================
# Trade Journal — Start Full Stack (Prod Mode)
# ============================================================

set -e

PROJECT_DIR="$HOME/IdeaProjects/trading-journal-platform"
cd "$PROJECT_DIR"

echo "============================================="
echo "🚀 Starting Trade Journal (Prod Mode)"
echo "============================================="
echo ""

# ------------------------------------------------------------
# 1. Check Docker is running
# ------------------------------------------------------------
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker Desktop is not running."
    echo "   Opening Docker Desktop..."
    open -a Docker
    echo "   ⏳ Waiting 30 seconds for Docker to start..."
    sleep 30
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Docker still not running. Please start it manually and retry."
        exit 1
    fi
fi
echo "✅ Docker is running"

# ------------------------------------------------------------
# 2. Stop dev infrastructure if running
# ------------------------------------------------------------
if docker ps --format '{{.Names}}' | grep -q "^user-db$"; then
    # Check if it's dev (only DBs) or prod (services too)
    if ! docker ps --format '{{.Names}}' | grep -q "^user-service$"; then
        echo "🔄 Stopping dev infrastructure..."
        docker compose -f docker-compose.dev.yml down 2>/dev/null || true
    fi
fi

# ------------------------------------------------------------
# 3. Prune orphan networks (fixes "network not found" errors)
# ------------------------------------------------------------
echo "🧹 Pruning orphan networks..."
docker network prune -f > /dev/null 2>&1 || true

# ------------------------------------------------------------
# 4. Start the full stack
# ------------------------------------------------------------
echo ""
echo "🐳 Starting containers..."
docker compose -f docker-compose.prod.yml up -d

# ------------------------------------------------------------
# 5. Wait for databases to be healthy
# ------------------------------------------------------------
echo ""
echo "⏳ Waiting for databases (up to 60 seconds)..."

DB_READY=false
for i in {1..12}; do
    sleep 5
    DB_STATUS=$(docker ps --format '{{.Names}}\t{{.Status}}' | grep -E "user-db|trade-db" | grep -c "healthy" || true)
    if [ "$DB_STATUS" = "2" ]; then
        DB_READY=true
        echo ""
        echo "✅ Databases ready"
        break
    fi
    echo -n "."
done

if [ "$DB_READY" = false ]; then
    echo ""
    echo "⚠️  Databases did not become healthy in time."
fi

# ------------------------------------------------------------
# 6. Wait for API Gateway to be healthy
# ------------------------------------------------------------
echo ""
echo "⏳ Waiting for API Gateway (up to 60 seconds)..."

GATEWAY_READY=false
for i in {1..20}; do
    sleep 3
    if curl -sf http://localhost:8080/actuator/health 2>/dev/null | grep -q '"status":"UP"'; then
        GATEWAY_READY=true
        echo ""
        echo "✅ API Gateway ready"
        break
    fi
    echo -n "."
done

if [ "$GATEWAY_READY" = false ]; then
    echo ""
    echo "⚠️  API Gateway not ready — check logs: docker logs api-gateway"
fi

# ------------------------------------------------------------
# 7. Wait for frontend
# ------------------------------------------------------------
echo ""
echo "⏳ Waiting for frontend..."

FRONTEND_READY=false
for i in {1..10}; do
    sleep 2
    if curl -sf -o /dev/null http://localhost/healthz 2>/dev/null; then
        FRONTEND_READY=true
        echo ""
        echo "✅ Frontend ready"
        break
    fi
    echo -n "."
done

if [ "$FRONTEND_READY" = false ]; then
    echo ""
    echo "⚠️  Frontend not ready — check logs: docker logs frontend"
fi

# ------------------------------------------------------------
# 8. Show final status
# ------------------------------------------------------------
echo ""
echo "============================================="
echo "📊 Container Status"
echo "============================================="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# ------------------------------------------------------------
# 9. Count healthy services
# ------------------------------------------------------------
HEALTHY_COUNT=$(docker ps --format '{{.Status}}' | grep -c "healthy" || true)
TOTAL_COUNT=$(docker ps --format '{{.Names}}' | wc -l | xargs)

echo ""
echo "============================================="
if [ "$HEALTHY_COUNT" -ge 6 ] && [ "$GATEWAY_READY" = true ]; then
    echo "✅ Trade Journal is UP ($HEALTHY_COUNT/$TOTAL_COUNT healthy)"
    echo "============================================="
    echo ""
    echo "🌐 Opening http://localhost"
    echo ""
    open http://localhost
else
    echo "⚠️  Trade Journal started with warnings"
    echo "============================================="
    echo ""
    echo "Check logs:"
    echo "  docker logs user-service --tail 20"
    echo "  docker logs trade-service --tail 20"
    echo "  docker logs analytics-service --tail 20"
    echo "  docker logs api-gateway --tail 20"
fi

echo ""
echo "📋 Useful commands:"
echo "  Stop:     ./scripts/stop.sh"
echo "  Logs:     docker compose -f docker-compose.prod.yml logs -f"
echo "  Backup:   ./scripts/backup.sh"
echo ""