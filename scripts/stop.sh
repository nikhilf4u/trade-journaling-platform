#!/bin/bash

PROJECT_DIR="$HOME/IdeaProjects/trading-journal-platform"
cd "$PROJECT_DIR"

echo "============================================="
echo "🛑 Stopping Trade Journal"
echo "============================================="
echo ""

docker compose -f docker-compose.prod.yml down

echo ""
echo "✅ Stopped. Data is preserved in Docker volumes."
echo ""
echo "To start again: ./scripts/start.sh"
echo ""