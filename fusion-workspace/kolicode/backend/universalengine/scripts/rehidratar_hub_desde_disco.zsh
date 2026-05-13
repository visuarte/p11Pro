#!/usr/bin/env zsh
set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
root_dir="$(cd "$script_dir/.." && pwd)"
env_file="$root_dir/.env"

if [[ ! -f "$env_file" ]]; then
  echo "Error: no existe $env_file" >&2
  exit 1
fi

# shellcheck disable=SC1090
source "$env_file"

db_container="${DB_CONTAINER_NAME:-base-datos-vegabajaimprentaa}"
db_user="${DB_USER:-admin}"
db_name="${DB_NAME:-universal_db_vegabajaimprentaa}"
generated_host_dir="${GENERATED_HOST_DIR:-./proyectos_generados}"

if [[ "$generated_host_dir" == /* ]]; then
  projects_root="$generated_host_dir"
else
  projects_root="$root_dir/${generated_host_dir#./}"
fi

replace_mode="true"
if [[ "${1:-}" == "--append" ]]; then
  replace_mode="false"
fi

if [[ ! -d "$projects_root" ]]; then
  echo "Error: no existe la carpeta de proyectos: $projects_root" >&2
  exit 1
fi

sql_escape() {
  print -r -- "$1" | sed "s/'/''/g"
}

echo "[1/5] Validando contenedor DB..."
docker ps --format '{{.Names}}' | grep -Fx "$db_container" >/dev/null || {
  echo "Error: contenedor DB no encontrado: $db_container" >&2
  exit 1
}

if [[ "$replace_mode" == "true" ]]; then
  echo "[2/5] Limpiando tablas projects y project_files..."
  docker exec -i "$db_container" psql -U "$db_user" -d "$db_name" -v ON_ERROR_STOP=1 -c "TRUNCATE TABLE projects RESTART IDENTITY CASCADE;" >/dev/null
else
  echo "[2/5] Modo append: no se limpian tablas."
fi

echo "[3/5] Rehidratando proyectos desde $projects_root ..."
project_dirs=("$projects_root"/proyecto_*(N/))
if (( ${#project_dirs[@]} == 0 )); then
  echo "No se encontraron carpetas proyecto_* para importar."
  exit 0
fi

imported_projects=0
imported_files=0
skipped_non_utf8=0
skipped_too_large=0
MAX_INLINE_BYTES="${MAX_INLINE_BYTES:-200000}"

is_utf8_file() {
  local file_path="$1"
  python3 - <<'PY' "$file_path"
import pathlib, sys
p = pathlib.Path(sys.argv[1])
try:
    p.read_bytes().decode('utf-8')
    raise SystemExit(0)
except UnicodeDecodeError:
    raise SystemExit(1)
PY
}

for dir in "${project_dirs[@]}"; do
  project_name="$(basename "$dir")"
  esc_project_name="$(sql_escape "$project_name")"

  project_id_raw=$(docker exec -i "$db_container" psql -q -tA -U "$db_user" -d "$db_name" -v ON_ERROR_STOP=1 -c "INSERT INTO projects (nombre, estado) VALUES ('$esc_project_name', 'RECUPERADO') RETURNING id;")
  project_id="$(print -r -- "$project_id_raw" | tr -d '\r' | grep -Eo '^[0-9]+' | head -n1)"
  if [[ -z "$project_id" ]]; then
    echo "Error: no se pudo obtener el id para $project_name" >&2
    exit 1
  fi

  files=("$dir"/**/*(.N))
  for file in "${files[@]}"; do
    file_size="$(stat -f%z "$file" 2>/dev/null || echo 0)"
    if [[ "$file_size" -gt "$MAX_INLINE_BYTES" ]]; then
      skipped_too_large=$((skipped_too_large + 1))
      echo "    - Omitido (>${MAX_INLINE_BYTES} bytes): ${file#$dir/}"
      continue
    fi

    if ! is_utf8_file "$file"; then
      skipped_non_utf8=$((skipped_non_utf8 + 1))
      echo "    - Omitido (no UTF-8): ${file#$dir/}"
      continue
    fi

    relative_path="${file#$dir/}"
    file_name="$(basename "$relative_path")"
    relative_dir="$(dirname "$relative_path")"

    if [[ "$relative_dir" == "." ]]; then
      ruta="/"
    else
      ruta="/$relative_dir"
    fi

    esc_file_name="$(sql_escape "$file_name")"
    esc_ruta="$(sql_escape "$ruta")"
    content_b64="$(base64 < "$file" | tr -d '\n')"

    docker exec -i "$db_container" psql -U "$db_user" -d "$db_name" -v ON_ERROR_STOP=1 -c "INSERT INTO project_files (project_id, nombre_archivo, contenido, ruta) VALUES ($project_id, '$esc_file_name', convert_from(decode('$content_b64','base64'),'UTF8'), '$esc_ruta');" >/dev/null

    imported_files=$((imported_files + 1))
  done

  imported_projects=$((imported_projects + 1))
  echo "  - Importado $project_name (id=$project_id, archivos=${#files[@]})"
done

echo "[4/5] Resultado: proyectos=$imported_projects, archivos=$imported_files"
echo "        omitidos(no UTF-8)=$skipped_non_utf8"
echo "        omitidos(tamano)=$skipped_too_large (limite=${MAX_INLINE_BYTES})"

echo "[5/5] Validando endpoint del Hub..."
curl -s http://localhost:8081/api/v1/projects | cat

echo "\nListo. Si la UI sigue vacia, recarga duro (Cmd+Shift+R)."

