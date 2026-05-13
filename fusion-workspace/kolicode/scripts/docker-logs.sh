#!/bin/bash
# KoliCode - Docker Logs Script
# Description: View logs from Docker services

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "=========================================="
echo "📋 KoliCode Docker Logs"
echo "=========================================="
echo ""
echo "Press Ctrl+C to exit"
echo ""

# Follow logs from all services
docker-compose logs -f --tail=100

