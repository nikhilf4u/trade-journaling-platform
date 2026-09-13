#!/bin/bash

echo "🧹 Cleaning Docker resources..."

# Stop all project containers
cd ~/IdeaProjects/trading-journal-platform
docker compose -f docker-compose.dev.yml down 2>/dev/null || true
docker compose -f docker-compose.prod.yml down 2>/dev/null || true

# Remove broken networks
docker network prune -f

# Optional: remove dangling images
docker image prune -f

echo ""
echo "✅ Cleanup complete"
echo ""
echo "Now restart with:"
echo "  Dev:  docker compose -f docker-compose.dev.yml up -d"
echo "  Prod: docker compose -f docker-compose.prod.yml up -d"