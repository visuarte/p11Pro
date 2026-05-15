#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:8040}"
REQUESTS="${2:-25}"
CONCURRENCY="${3:-5}"
PAYLOAD='{"load":"true"}'

if command -v hey >/dev/null 2>&1; then
  exec hey -n "$REQUESTS" -c "$CONCURRENCY" -m POST -H "Content-Type: text/plain" -d "$PAYLOAD" "$BASE_URL/api/v1/checklist"
fi

if command -v wrk >/dev/null 2>&1; then
  TMP_SCRIPT="$(mktemp)"
  cat > "$TMP_SCRIPT" <<'EOF'
wrk.method = "POST"
wrk.body   = "{\"load\":\"true\"}"
wrk.headers["Content-Type"] = "text/plain"
EOF
  trap 'rm -f "$TMP_SCRIPT"' EXIT
  exec wrk -t"$CONCURRENCY" -c"$CONCURRENCY" -d10s -s "$TMP_SCRIPT" "$BASE_URL/api/v1/checklist"
fi

echo "[load] hey/wrk no están instalados; usando fallback con curl"
for _ in $(seq 1 "$REQUESTS"); do
  curl -fsS -X POST "$BASE_URL/api/v1/checklist" -H "Content-Type: text/plain" -d "$PAYLOAD" >/dev/null
done
echo "[load] completadas $REQUESTS inserciones seriales en checklist"
