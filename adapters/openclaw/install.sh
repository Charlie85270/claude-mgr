#!/usr/bin/env bash
set -euo pipefail

# factor-echelon OpenClaw bundle installer

BUNDLE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="${OPENCLAW_INSTALL_DIR:-$HOME/.openclaw/workspace/factor-echelon}"

echo "[factor-echelon] Installing to $INSTALL_DIR"

mkdir -p "$INSTALL_DIR"
cp -R "$BUNDLE_DIR/skill/"* "$INSTALL_DIR/"
cp "$BUNDLE_DIR/openclaw.json" "$INSTALL_DIR/openclaw.json"

echo "[factor-echelon] Registering mempalace MCP server"
if command -v mempalace &>/dev/null; then
  mempalace mcp register || echo "[factor-echelon]   (mempalace registration optional; skip if not installed)"
fi

echo "[factor-echelon] Install complete"
echo "[factor-echelon] Run: openclaw start --config $INSTALL_DIR/openclaw.json"
