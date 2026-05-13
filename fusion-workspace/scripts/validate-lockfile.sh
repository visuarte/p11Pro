#!/bin/bash
set -e

echo "🔍 Validating lockfile integrity..."

# Backup lockfile
cp package-lock.json package-lock.json.backup

# Regenerate from package.json
rm package-lock.json
npm install --package-lock-only

# Compare
if diff package-lock.json package-lock.json.backup > /dev/null; then
  echo "✅ Lockfile is consistent"
  rm package-lock.json.backup
  exit 0
else
  echo "❌ Lockfile is out of sync with package.json"
  echo "Run: npm install"
  mv package-lock.json.backup package-lock.json
  exit 1
fi

