#!/bin/bash
# install-local.sh - Install Servo.app to /Applications
# Run with: ./install-local.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_PATH="$SCRIPT_DIR/build/Servo.app"
INSTALL_PATH="/Applications/Servo.app"

echo "🚀 Installing Servo.app..."

# Check if app exists
if [ ! -d "$APP_PATH" ]; then
    echo "❌ Servo.app not found at $APP_PATH"
    echo "   Run 'pnpm build:sea && pnpm build:app' first"
    exit 1
fi

# Remove old installation if exists
if [ -d "$INSTALL_PATH" ]; then
    echo "🗑️  Removing old installation..."
    rm -rf "$INSTALL_PATH"
fi

# Copy new app
echo "📋 Copying to /Applications..."
cp -r "$APP_PATH" "$INSTALL_PATH"

# Verify installation
if [ -d "$INSTALL_PATH" ]; then
    echo "✅ Installed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Grant permissions in System Settings > Privacy & Security:"
    echo "      - Accessibility"
    echo "      - Screen Recording"
    echo "      - Automation (for System Events)"
    echo ""
    echo "   2. Reconnect MCP in Claude Code:"
    echo "      /mcp"
    echo ""
    echo "   3. Test with:"
    echo '      "take a screenshot"'
else
    echo "❌ Installation failed"
    exit 1
fi
