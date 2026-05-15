#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
REPORT_DIR="$ROOT/build/reports/dependency-audit"
mkdir -p "$REPORT_DIR"

find "$ROOT" -name '._*' -delete

echo "[audit] Root: $ROOT"

pushd "$ROOT/frontend" >/dev/null
echo "[audit] Running npm audit..."
npm audit --json > "$REPORT_DIR/frontend-npm-audit.json" || true
popd >/dev/null

pushd "$ROOT/backend" >/dev/null
echo "[audit] Running Gradle dependencyReport..."
chmod +x ./gradlew
./gradlew --no-daemon dependencyReport > "$REPORT_DIR/backend-dependency-report.txt"
popd >/dev/null

echo "[audit] Reports written to $REPORT_DIR"
