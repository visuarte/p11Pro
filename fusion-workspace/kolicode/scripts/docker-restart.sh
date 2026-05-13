#!/bin/bash
# KoliCode - Docker Compose Restart Script
# Description: Restart all Docker services

set -e  # Exit on error

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "=========================================="
echo "🔄 Restarting KoliCode Docker Services"
echo "=========================================="
echo ""

# Stop services
bash "$SCRIPT_DIR/docker-down.sh"

echo ""
echo "⏳ Waiting 2 seconds..."
sleep 2
echo ""

# Start services
bash "$SCRIPT_DIR/docker-up.sh"

