#!/usr/bin/env zsh
set -euo pipefail

# Genera reportes diario/semanal con fecha/semana pre-rellenada.
# Uso:
#   scripts/generar_reporte.zsh daily
#   scripts/generar_reporte.zsh weekly --week 2026-W15
#   scripts/generar_reporte.zsh both --date 2026-04-10 --responsable "Equipo QA"

script_dir="$(cd "$(dirname "$0")" && pwd)"
root_dir="$(cd "$script_dir/.." && pwd)"

mode="${1:-both}"
shift || true

date_value="$(date +%F)"
week_value="$(python3 - <<'PY'
from datetime import date
iso = date.today().isocalendar()
print(f"{iso.year}-W{iso.week:02d}")
PY
)"
responsable="${USER:-operador}"

while (( $# > 0 )); do
  case "$1" in
    --date)
      date_value="$2"; shift 2 ;;
    --week)
      week_value="$2"; shift 2 ;;
    --responsable)
      responsable="$2"; shift 2 ;;
    *)
      echo "Argumento no soportado: $1" >&2
      exit 1 ;;
  esac
done

out_dir="$root_dir/docs/reportes_generados"
mkdir -p "$out_dir"

generate_daily() {
  local template="$root_dir/docs/reportediario.md"
  local output="$out_dir/reportediario-${date_value}.md"
  python3 - <<'PY' "$template" "$output" "$date_value" "$responsable"
import pathlib, re, sys

template_path = pathlib.Path(sys.argv[1])
output_path = pathlib.Path(sys.argv[2])
date_value = sys.argv[3]
responsable = sys.argv[4]

if template_path.exists():
    content = template_path.read_text(encoding='utf-8')
else:
    content = "# Reporte Diario\n\n"

content = re.sub(r"- Fecha: `[^`]*`", f"- Fecha: `{date_value}`", content)
content = re.sub(r"- Responsable: `[^`]*`", f"- Responsable: `{responsable}`", content)

meta = f"\n\n---\n\nGenerado automaticamente el {date_value}.\n"
output_path.write_text(content + meta, encoding='utf-8')
print(output_path)
PY
}

generate_weekly() {
  local template="$root_dir/docs/reportesemanal.md"
  local output="$out_dir/reportesemanal-${week_value}.md"
  python3 - <<'PY' "$template" "$output" "$week_value" "$responsable"
import pathlib, re, sys

template_path = pathlib.Path(sys.argv[1])
output_path = pathlib.Path(sys.argv[2])
week_value = sys.argv[3]
responsable = sys.argv[4]

if template_path.exists():
    content = template_path.read_text(encoding='utf-8')
else:
    content = "# Reporte Semanal\n\n"

content = re.sub(r"- Semana: `[^`]*`", f"- Semana: `{week_value}`", content)
content = re.sub(r"- Responsable: `[^`]*`", f"- Responsable: `{responsable}`", content)

meta = f"\n\n---\n\nGenerado automaticamente para la semana {week_value}.\n"
output_path.write_text(content + meta, encoding='utf-8')
print(output_path)
PY
}

case "${mode:l}" in
  daily|diario)
    generated="$(generate_daily)"
    echo "Reporte diario generado: $generated"
    ;;
  weekly|semanal)
    generated="$(generate_weekly)"
    echo "Reporte semanal generado: $generated"
    ;;
  both|ambos)
    daily_file="$(generate_daily)"
    weekly_file="$(generate_weekly)"
    echo "Reporte diario generado: $daily_file"
    echo "Reporte semanal generado: $weekly_file"
    ;;
  *)
    echo "Modo no soportado: $mode (usa daily|weekly|both)" >&2
    exit 1
    ;;
esac

