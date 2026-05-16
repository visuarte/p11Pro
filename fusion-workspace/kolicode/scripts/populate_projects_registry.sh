#!/bin/bash
# Script to populate the kolicode.projects table with initial data from proyectos_generados
# This script scans the proyectos_generados directory and inserts each project as an active entry.

set -euo pipefail

# Configuration
BASE_PATH="/Volumes/PROYECTOSAP/p11pro/fusion-workspace/kolicode/backend/universalengine/proyectos_generados"
SCHEMA="kolicode"
TABLE="projects"

# Default database connection (can be overridden by DATABASE_URL env var)
if [[ -z "${DATABASE_URL:-}" ]]; then
    DATABASE_URL="host=localhost port=5432 dbname=kolicode user=kolicode password=kolicode"
fi

# Function to escape single quotes for SQL
escape_sql() {
    echo "$1" | sed "s/'/''/g"
}

# Function to insert or update a project
upsert_project() {
    local internal_alias="$1"
    local display_name="$2"
    local absolute_path="$3"
    local status="$4"
    local engine_config="$5"  # JSONB or NULL

    # Escape values for SQL
    local escaped_alias=$(escape_sql "$internal_alias")
    local escaped_display=$(escape_sql "$display_name")
    local escaped_path=$(escape_sql "$absolute_path")
    local escaped_status=$(escape_sql "$status")
    local escaped_config="${engine_config:-NULL}"

    # If engine_config is not NULL, we need to quote it as a string for JSONB
    if [[ "$engine_config" != "NULL" ]]; then
        escaped_config="'$engine_config'"
    fi

    # Construct SQL
    local sql="
        INSERT INTO $SCHEMA.$TABLE (internal_alias, display_name, absolute_path, status, engine_config)
        VALUES ('$escaped_alias', '$escaped_display', '$escaped_path', '$escaped_status', $escaped_config)
        ON CONFLICT (internal_alias) DO UPDATE
        SET display_name = EXCLUDED.display_name,
            absolute_path = EXCLUDED.absolute_path,
            status = EXCLUDED.status,
            engine_config = EXCLUDED.engine_config,
            updated_at = NOW();
    "

    # Execute via psql
    PGPASSWORD=$(echo "$DATABASE_URL" | sed -n 's/.*password=\([^ ]*\).*/\1/p') \
    PGUSER=$(echo "$DATABASE_URL" | sed -n 's/.*user=\([^ ]*\).*/\1/p') \
    PGHOST=$(echo "$DATABASE_URL" | sed -n 's/.*host=\([^ ]*\).*/\1/p') \
    PGPORT=$(echo "$DATABASE_URL" | sed -n 's/.*port=\([^ ]*\).*/\1/p') \
    PGDATABASE=$(echo "$DATABASE_URL" | sed -n 's/.*dbname=\([^ ]*\).*/\1/p') \
    psql -v ON_ERROR_STOP=1 --no-psqlrc -qt -c "$sql"
}

# Main processing
echo "Scanning $BASE_PATH for project directories..."

# Count for reporting
total=0
processed=0

# Iterate over directories in BASE_PATH
for dir in "$BASE_PATH"/*; do
    if [[ -d "$dir" ]]; then
        dir_name=$(basename "$dir")
        
        # Skip special directories
        if [[ "$dir_name" == _* ]]; then
            echo "Skipping special directory: $dir_name"
            continue
        fi
        
        ((total++))
        
        # Determine status: active for top-level projects
        status="active"
        
        # Try to get a better display name from README or project config
        display_name="$dir_name"  # Default
        if [[ -f "$dir/README.md" ]]; then
            # Extract first heading from README as display name
            read -r display_name < <(grep -m 1 '^# ' "$dir/README.md" | sed 's/^# //' || echo "$dir_name")
        fi
        
        # Engine config: for now, we'll leave it NULL (can be enhanced later)
        engine_config=NULL
        
        # Upsert the project
        echo "Processing: $dir_name ($display_name) -> $status"
        upsert_project "$dir_name" "$display_name" "$dir" "$status" "$engine_config"
        ((processed++))
    fi
done

echo "Completed. Processed $processed/$total projects."

# Verification step
echo "Verifying inserted records:"
PGPASSWORD=$(echo "$DATABASE_URL" | sed -n 's/.*password=\([^ ]*\).*/\1/p') \
PGUSER=$(echo "$DATABASE_URL" | sed -n 's/.*user=\([^ ]*\).*/\1/p') \
PGHOST=$(echo "$DATABASE_URL" | sed -n 's/.*host=\([^ ]*\).*/\1/p') \
PGPORT=$(echo "$DATABASE_URL" | sed -n 's/.*port=\([^ ]*\).*/\1/p') \
PGDATABASE=$(echo "$DATABASE_URL" | sed -n 's/.*dbname=\([^ ]*\).*/\1/p') \
psql -v ON_ERROR_STOP=1 --no-psqlrc -qt -c "SELECT internal_alias, display_name, status FROM $SCHEMA.$TABLE ORDER BY internal_alias;"