#!/bin/bash
# KoliCode - Docker Compose Shutdown Script
# Description: Stop all Docker services

set -e  # Exit on error

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=========================================="
echo "🛑 Stopping KoliCode Docker Services"
echo "=========================================="
echo ""

# Navigate to project root
cd "$PROJECT_ROOT"

# Stop Docker Compose services
echo "🔄 Stopping services..."
docker-compose down

echo ""
echo "=========================================="
echo "✅ Services Stopped Successfully"
echo "=========================================="
echo ""
echo "💡 Data is preserved in Docker volumes"
echo "   To remove volumes: docker-compose down -v"
echo ""

