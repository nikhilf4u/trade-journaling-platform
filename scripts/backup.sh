#!/bin/bash

# ============================================================
# Trade Journal — Backup Script
# ============================================================
# Dumps all 3 databases + uploads to ~/trade-journal-backups
# Keeps 30 days of history
# Usage: ./backup.sh
# ============================================================

set -e

PROJECT_DIR="$HOME/IdeaProjects/trading-journal-platform"
BACKUP_DIR="$HOME/trade-journal-backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
LOG_FILE="$BACKUP_DIR/backup.log"

mkdir -p "$BACKUP_DIR"

echo "=============================================" >> "$LOG_FILE"
echo "Backup started: $(date)" >> "$LOG_FILE"

# Verify containers are running
if ! docker ps --format '{{.Names}}' | grep -q "trade-db"; then
    echo "❌ ERROR: trade-db is not running. Start the stack first."
    echo "❌ ERROR: trade-db is not running. Start the stack first." >> "$LOG_FILE"
    exit 1
fi

echo "📦 Backing up user database..."
docker exec user-db pg_dump -U trader userdb | gzip > "$BACKUP_DIR/userdb_$DATE.sql.gz"
echo "✅ userdb_$DATE.sql.gz created"

echo "📦 Backing up trade database..."
docker exec trade-db pg_dump -U trader tradedb | gzip > "$BACKUP_DIR/tradedb_$DATE.sql.gz"
echo "✅ tradedb_$DATE.sql.gz created"

echo "📸 Backing up uploaded screenshots..."
docker run --rm \
  -v trading-journal-platform_uploads_data:/source:ro \
  -v "$BACKUP_DIR":/backup \
  alpine tar czf "/backup/uploads_$DATE.tar.gz" -C /source . 2>/dev/null || true
echo "✅ uploads_$DATE.tar.gz created"

# Clean up backups older than 30 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
find "$BACKUP_DIR" -name "uploads_*.tar.gz" -mtime +30 -delete

TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo ""
echo "============================================="
echo "✅ Backup complete!"
echo "============================================="
echo "📁 Location: $BACKUP_DIR"
echo "📊 Total size: $TOTAL_SIZE"
echo ""
ls -lh "$BACKUP_DIR"/*_$DATE.* 2>/dev/null

echo "Backup complete: $(date)" >> "$LOG_FILE"
echo "Total size: $TOTAL_SIZE" >> "$LOG_FILE"
