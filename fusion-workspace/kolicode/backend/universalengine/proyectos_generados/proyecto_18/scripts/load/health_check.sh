#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:8040}"
REQUESTS="${2:-50}"
CONCURRENCY="${3:-10}"

if command -v hey >/dev/null 2>&1; then
  exec hey -n "$REQUESTS" -c "$CONCURRENCY" "$BASE_URL/health"
fi

if command -v wrk >/dev/null 2>&1; then
  exec wrk -t"$CONCURRENCY" -c"$CONCURRENCY" -d10s "$BASE_URL/health"
fi

echo "[load] hey/wrk no están instalados; usando fallback con curl"
for _ in $(seq 1 "$REQUESTS"); do
  curl -fsS "$BASE_URL/health" >/dev/null
done
echo "[load] completadas $REQUESTS requests seriales a $BASE_URL/health"
