#!/bin/bash
# Script to audit the proyectos_generados directory and populate the kolicode.projects table with classified status.

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

# Function to get display name from README.md
get_display_name_from_readme() {
    local project_dir="$1"
    local default_name="$2"
    if [[ -f "$project_dir/README.md" ]]; then
        # Extract first heading from README as display name
        local heading
        heading=$(grep -m 1 '^# ' "$project_dir/README.md" | sed 's/^# //' || echo "$default_name")
        echo "$heading"
    else
        echo "$default_name"
    fi
}

# Main processing
echo "Auditing $BASE_PATH for project directories..."

# Count for reporting
total=0
processed=0

# We'll process three categories: active (root), archived (_archive), candidato (_candidates)
declare -A status_map
status_map[""]="active"
status_map["_archive"]="archived"
status_map["_candidates"]="candidato"

for status_dir in "" "_archive" "_candidates"; do
    status_dir_path="$BASE_PATH/$status_dir"
    # Skip if the directory doesn't exist
    if [[ ! -d "$status_dir_path" ]]; then
        continue
    fi

    # Determine the status for this category
    local current_status="${status_map[$status_dir]}"

    # Iterate over project directories in this category
    for project_dir in "$status_dir_path"/*; do
        if [[ -d "$project_dir" ]]; then
            project_name=$(basename "$project_dir")
            
            # Skip hidden directories and special system directories (like those starting with __ or _)
            if [[ "$project_name" == _* ]] || [[ "$project_name" == .* ]]; then
                echo "Skipping special directory: $project_name"
                continue
            fi
            
            ((total++))
            
            # Get display name from README or use directory name
            display_name=$(get_display_name_from_readme "$project_dir" "$project_name")
            
            # Engine config: for now, we'll leave it NULL (can be enhanced later)
            engine_config=NULL
            
            # Upsert the project
            echo "Processing: $project_name ($display_name) -> $current_status"
            upsert_project "$project_name" "$display_name" "$project_dir" "$current_status" "$engine_config"
            ((processed++))
        fi
    done
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