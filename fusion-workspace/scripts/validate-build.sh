#!/bin/bash
set -e

PLATFORM=${1:-"all"}

echo "🚀 KoliCode Build Validation Script"
echo "Platform: $PLATFORM"
echo ""

# Step 1: Clean
echo "🧹 Cleaning previous builds..."
rm -rf node_modules dist out build
rm -f package-lock.json

# Step 2: Install
echo "📦 Installing dependencies..."
npm install

# Step 3: Validate lockfile
echo "🔍 Validating lockfile..."
npm ci

# Step 4: Run tests (si existen)
if grep -q '"test":' package.json; then
  echo "🧪 Running tests..."
  npm test
fi

# Step 5: Build
case $PLATFORM in
  mac|macos)
    echo "🍎 Building for macOS..."
    npm run build:mac
    ls -lh dist/*.dmg
    ;;
  win|windows)
    echo "🪟 Building for Windows..."
    npm run build:win
    ls -lh dist/*.exe
    ;;
  linux)
    echo "🐧 Building for Linux..."
    npm run build:linux
    ls -lh dist/*.deb dist/*.AppImage
    ;;
  all)
    echo "🌍 Building for all platforms..."
    npm run build:mac
    npm run build:win
    npm run build:linux
    ls -lh dist/
    ;;
  *)
    echo "❌ Unknown platform: $PLATFORM"
    exit 1
    ;;
esac

# Step 6: Validate sizes
echo "📊 Validating build sizes..."
for file in dist/*; do
  SIZE=$(ls -lh "$file" | awk '{print $5}')
  echo "  $file: $SIZE"
done

echo ""
echo "✅ Build validation complete!"

