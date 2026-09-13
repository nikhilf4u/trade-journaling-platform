#!/bin/bash

# ============================================================
# Trade Journal — Restore Script
# ============================================================
# Auto-detects dev vs prod mode:
#   - dev  → only infrastructure in Docker (services run locally)
#   - prod → full stack in Docker
#
# Usage:
#   ./restore.sh              # restore from latest backup
#   ./restore.sh 2026-09-12_14-30-45   # specific timestamp
# ============================================================

set -e

PROJECT_DIR="$HOME/IdeaProjects/trading-journal-platform"
BACKUP_DIR="$HOME/trade-journal-backups"

cd "$PROJECT_DIR"

echo "============================================="
echo "🔄 Trade Journal Restore"
echo "============================================="
echo ""

# ------------------------------------------------------------
# 1. Detect running mode
# ------------------------------------------------------------
if docker ps --format '{{.Names}}' | grep -q "^user-service$"; then
    MODE="prod"
    COMPOSE_FILE="docker-compose.prod.yml"
    echo "🔍 Mode detected: PROD (full stack in Docker)"
elif docker ps --format '{{.Names}}' | grep -q "^user-db$"; then
    MODE="dev"
    COMPOSE_FILE="docker-compose.dev.yml"
    echo "🔍 Mode detected: DEV (only infrastructure in Docker)"
else
    echo "❌ No Trade Journal containers running."
    echo ""
    echo "Start infrastructure first:"
    echo "  DEV:  docker compose -f docker-compose.dev.yml up -d"
    echo "  PROD: docker compose -f docker-compose.prod.yml up -d"
    exit 1
fi

echo ""

# ------------------------------------------------------------
# 2. Determine backup to use
# ------------------------------------------------------------
if [ -z "$1" ]; then
    echo "📅 Finding latest backup..."
    USERDB=$(ls -t "$BACKUP_DIR"/userdb_*.sql.gz 2>/dev/null | head -1)
    TRADEDB=$(ls -t "$BACKUP_DIR"/tradedb_*.sql.gz 2>/dev/null | head -1)
    ANALYTICSDB=$(ls -t "$BACKUP_DIR"/analyticsdb_*.sql.gz 2>/dev/null | head -1)
    UPLOADS=$(ls -t "$BACKUP_DIR"/uploads_*.tar.gz 2>/dev/null | head -1)
else
    echo "📅 Using timestamp: $1"
    USERDB="$BACKUP_DIR/userdb_$1.sql.gz"
    TRADEDB="$BACKUP_DIR/tradedb_$1.sql.gz"
    ANALYTICSDB="$BACKUP_DIR/analyticsdb_$1.sql.gz"
    UPLOADS="$BACKUP_DIR/uploads_$1.tar.gz"
fi

if [ ! -f "$USERDB" ] && [ ! -f "$TRADEDB" ]; then
    echo "❌ No backup files found in $BACKUP_DIR"
    echo ""
    echo "Available backups:"
    ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "  (none)"
    exit 1
fi

echo "   User DB:      $(basename "$USERDB")"
[ -f "$TRADEDB" ] && echo "   Trade DB:     $(basename "$TRADEDB")"
[ -f "$ANALYTICSDB" ] && echo "   Analytics DB: $(basename "$ANALYTICSDB")"
[ -f "$UPLOADS" ] && echo "   Uploads:      $(basename "$UPLOADS")"
echo ""

read -p "⚠️  This will OVERWRITE current data. Continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# ------------------------------------------------------------
# 3. Verify databases are running
# ------------------------------------------------------------
if ! docker ps --format '{{.Names}}' | grep -q "user-db"; then
    echo "❌ user-db is not running. Start it first."
    exit 1
fi

# ------------------------------------------------------------
# 4. Stop application services (mode-specific)
# ------------------------------------------------------------
if [ "$MODE" = "prod" ]; then
    echo ""
    echo "⏸️  Stopping application services (prod)..."
    docker compose -f "$COMPOSE_FILE" stop user-service trade-service analytics-service api-gateway frontend 2>/dev/null || true
    sleep 5
else
    echo ""
    echo "⏸️  DEV mode — you must stop local services manually:"
    echo "   Press Ctrl+C in each of the 5 service terminals."
    echo ""
    read -p "   Press ENTER when all local services are stopped... " -r
    sleep 2
fi

# ------------------------------------------------------------
# 5. Restore user database
# ------------------------------------------------------------
if [ -f "$USERDB" ]; then
    echo "📦 Restoring user database..."
    docker exec user-db psql -U trader -d userdb -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO trader;" > /dev/null
    gunzip -c "$USERDB" | docker exec -i user-db psql -U trader userdb > /dev/null 2>&1
    echo "   ✅ User database restored"
fi

# ------------------------------------------------------------
# 6. Restore trade database
# ------------------------------------------------------------
if [ -f "$TRADEDB" ]; then
    echo "📦 Restoring trade database..."
    docker exec trade-db psql -U trader -d tradedb -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO trader;" > /dev/null
    gunzip -c "$TRADEDB" | docker exec -i trade-db psql -U trader tradedb > /dev/null 2>&1
    echo "   ✅ Trade database restored"
fi

# ------------------------------------------------------------
# 7. Restore analytics database (if it exists)
# ------------------------------------------------------------
if [ -f "$ANALYTICSDB" ]; then
    if docker ps --format '{{.Names}}' | grep -q "analytics-db"; then
        echo "📦 Restoring analytics database..."
        docker exec analytics-db psql -U trader -d analyticsdb -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO trader;" > /dev/null
        gunzip -c "$ANALYTICSDB" | docker exec -i analytics-db psql -U trader analyticsdb > /dev/null 2>&1
        echo "   ✅ Analytics database restored"
    else
        echo "⏭️  Skipping analytics-db (not running)"
    fi
fi

# ------------------------------------------------------------
# 8. Restore uploaded screenshots
# ------------------------------------------------------------
if [ -f "$UPLOADS" ]; then
    echo "📸 Restoring screenshots..."
    docker run --rm \
      -v trading-journal-platform_uploads_data:/target \
      -v "$BACKUP_DIR":/backup \
      alpine sh -c "rm -rf /target/* && tar xzf /backup/$(basename "$UPLOADS") -C /target" 2>/dev/null || true
    echo "   ✅ Screenshots restored"
fi

# ------------------------------------------------------------
# 9. Restart application services (mode-specific)
# ------------------------------------------------------------
if [ "$MODE" = "prod" ]; then
    echo ""
    echo "▶️  Restarting services (prod)..."
    docker compose -f "$COMPOSE_FILE" up -d
    echo "   ⏳ Waiting for services (60 seconds)..."
    sleep 60
else
    echo ""
    echo "▶️  DEV mode — restart local services manually:"
    echo "   Terminal 1: ./scripts/dev.sh user"
    echo "   Terminal 2: ./scripts/dev.sh trade"
    echo "   Terminal 3: ./scripts/dev.sh analytics"
    echo "   Terminal 4: ./scripts/dev.sh gateway"
    echo "   Terminal 5: ./scripts/dev.sh frontend"
    echo ""
    echo "   ⏳ Waiting 10 seconds for infrastructure to be ready..."
    sleep 10
fi

# ------------------------------------------------------------
# 10. Verify restore
# ------------------------------------------------------------
echo ""
echo "============================================="
echo "✅ Restore Complete"
echo "============================================="
echo ""

USER_COUNT=$(docker exec user-db psql -U trader -d userdb -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs)
TRADE_COUNT=$(docker exec trade-db psql -U trader -d tradedb -t -c "SELECT COUNT(*) FROM trades;" 2>/dev/null | xargs)
SCREENSHOT_COUNT=$(docker exec trade-db psql -U trader -d tradedb -t -c "SELECT COUNT(*) FROM trade_screenshots;" 2>/dev/null | xargs)

echo "📊 Restored data:"
echo "   Users:       ${USER_COUNT:-0}"
echo "   Trades:      ${TRADE_COUNT:-0}"
echo "   Screenshots: ${SCREENSHOT_COUNT:-0}"
echo ""

if [ "$MODE" = "prod" ]; then
    echo "🌐 Open http://localhost to verify"
else
    echo "🌐 Start the local services, then open http://localhost:5173"
fi
echo ""