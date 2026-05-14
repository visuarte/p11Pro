#!/bin/bash
# KoliCode - Docker Compose Startup Script
# Description: Start all Docker services for development

set -e  # Exit on error

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
POSTGRES_HOST="${POSTGRES_HOST:-127.0.0.1}"
POSTGRES_PORT="${POSTGRES_PORT:-5433}"
POSTGRES_DB="${POSTGRES_DB:-kolicode}"
POSTGRES_USER="${POSTGRES_USER:-kolicode}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-kolicode_dev_pass}"

echo "=========================================="
echo "🐳 Starting KoliCode Docker Services"
echo "=========================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

# Check if .env exists, if not copy from .env.example
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    echo "📝 .env file not found, creating from .env.example..."
    cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
    echo "✅ Created .env file. Please review and update if needed."
    echo ""
fi

if [ -f "$PROJECT_ROOT/.env" ]; then
    # shellcheck disable=SC1091
    source "$PROJECT_ROOT/.env"
    POSTGRES_HOST="${POSTGRES_HOST:-127.0.0.1}"
    POSTGRES_PORT="${POSTGRES_PORT:-5433}"
    POSTGRES_DB="${POSTGRES_DB:-kolicode}"
    POSTGRES_USER="${POSTGRES_USER:-kolicode}"
    POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-kolicode_dev_pass}"
fi

# Navigate to project root
cd "$PROJECT_ROOT"

# Start Docker Compose services
echo "🚀 Starting services..."
docker-compose up -d postgres redis

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Check PostgreSQL health
echo "🔍 Checking PostgreSQL..."
if docker-compose exec -T postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready"
else
    echo "⚠️  PostgreSQL is starting... (may take a few more seconds)"
fi

# Check Redis health
echo "🔍 Checking Redis..."
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is ready"
else
    echo "⚠️  Redis is starting... (may take a few more seconds)"
fi

echo ""
echo "=========================================="
echo "✅ Services Started Successfully"
echo "=========================================="
echo ""
echo "📊 Service Status:"
docker-compose ps
echo ""
echo "🔗 Connection Details:"
echo "  PostgreSQL: postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB"
echo "  Redis:      redis://localhost:6379"
echo ""
echo "💡 Useful Commands:"
echo "  View logs:        docker-compose logs -f"
echo "  Stop services:    npm run docker:down"
echo "  Restart services: npm run docker:restart"
echo ""
