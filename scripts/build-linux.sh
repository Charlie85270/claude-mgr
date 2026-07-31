#!/usr/bin/env bash
#
# Build Dorothy's Linux distributables with electron-builder.
#
#   scripts/build-linux.sh                  All configured targets
#   scripts/build-linux.sh AppImage deb     Only the named targets
#   scripts/build-linux.sh --dir            Unpacked build only (fast, for testing)
#   scripts/build-linux.sh --skip-mcp       Reuse already-built MCP server bundles
#   scripts/build-linux.sh --help
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

MCP_SERVERS=(mcp-orchestrator mcp-telegram mcp-kanban mcp-vault mcp-socialdata mcp-x mcp-world)

SKIP_MCP=0
DIR_ONLY=0
TARGETS=()

if [ -t 1 ]; then
  C_RED=$'\033[31m'; C_BLUE=$'\033[34m'; C_OFF=$'\033[0m'
else
  C_RED=''; C_BLUE=''; C_OFF=''
fi

log() { printf '%s\n' "${C_BLUE}==>${C_OFF} $*"; }
die() { printf '%s\n' "${C_RED}error:${C_OFF} $*" >&2; exit 1; }

usage() {
  cat <<'EOF'
Usage: scripts/build-linux.sh [options] [targets...]

Builds the Next.js static export, compiles the Electron main process, bundles the
MCP servers, and runs electron-builder for Linux.

Targets:
  Any electron-builder Linux target (AppImage, deb, rpm, tar.gz). With no target
  argument, everything listed under build.linux.target in package.json is built.

Options:
  --dir          Unpacked directory build only — no installers. Much faster.
  --skip-mcp     Do not reinstall/rebuild the MCP servers; reuse their dist/bundle.js.
  -h, --help     Show this help.

Output lands in release/.
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --dir) DIR_ONLY=1 ;;
    --skip-mcp) SKIP_MCP=1 ;;
    -h|--help) usage; exit 0 ;;
    -*) die "unknown option: $1" ;;
    *) TARGETS+=("$1") ;;
  esac
  shift
done

[ -d node_modules ] || die "node_modules/ is missing — run 'npm install' first."

# Next.js cannot statically export API routes, and src/app/icon.tsx conflicts with
# the packaged icon, so both are moved aside for the duration of the build.
restore_sources() {
  if [ -d src/app/_api_backup ]; then
    mv src/app/_api_backup src/app/api
  fi
  if [ -f src/app/_icon_backup.tsx ]; then
    mv src/app/_icon_backup.tsx src/app/icon.tsx
  fi
}

log "Preparing sources for static export..."
if [ -d src/app/api ]; then
  mv src/app/api src/app/_api_backup
fi
if [ -f src/app/icon.tsx ]; then
  mv src/app/icon.tsx src/app/_icon_backup.tsx
fi
trap restore_sources EXIT

log "Building the Next.js static export..."
ELECTRON_BUILD=1 npx next build

log "Compiling the Electron main process..."
npx tsc -p electron/tsconfig.json

if [ "$SKIP_MCP" -eq 1 ]; then
  log "Skipping MCP server bundles (--skip-mcp)."
  for server in "${MCP_SERVERS[@]}"; do
    [ -f "$server/dist/bundle.js" ] || die "$server/dist/bundle.js is missing — run without --skip-mcp."
  done
else
  for server in "${MCP_SERVERS[@]}"; do
    log "Bundling ${server}..."
    ( cd "$server" && npm install && npm run build )
  done
fi

restore_sources
trap - EXIT

log "Running electron-builder..."
if [ "$DIR_ONLY" -eq 1 ]; then
  npx electron-builder --linux --dir
elif [ ${#TARGETS[@]} -gt 0 ]; then
  npx electron-builder --linux "${TARGETS[@]}"
else
  npx electron-builder --linux
fi

log "Done. Artifacts in release/:"
shopt -s nullglob
for artifact in release/*.AppImage release/*.deb release/*.rpm release/*.tar.gz; do
  printf '  %s  %s\n' "$(du -h "$artifact" | cut -f1)" "$artifact"
done
shopt -u nullglob
