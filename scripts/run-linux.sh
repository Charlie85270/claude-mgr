#!/usr/bin/env bash
#
# Set up and launch Dorothy in development mode on Linux.
#
#   scripts/run-linux.sh                 Electron dev mode (default)
#   scripts/run-linux.sh --web           Browser-only mode on http://localhost:3000
#   scripts/run-linux.sh --skip-install   Skip dependency install
#   scripts/run-linux.sh --help
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

DEV_PORT=3000
REBUILD_STAMP="node_modules/.dorothy-electron-rebuild"

SKIP_INSTALL=0
WEB_MODE=0

if [ -t 1 ]; then
  C_BOLD=$'\033[1m'; C_RED=$'\033[31m'; C_YELLOW=$'\033[33m'; C_BLUE=$'\033[34m'; C_OFF=$'\033[0m'
else
  C_BOLD=''; C_RED=''; C_YELLOW=''; C_BLUE=''; C_OFF=''
fi

log()  { printf '%s\n' "${C_BLUE}==>${C_OFF} $*"; }
warn() { printf '%s\n' "${C_YELLOW}warning:${C_OFF} $*" >&2; }
err()  { printf '%s\n' "${C_RED}error:${C_OFF} $*" >&2; }
die()  { err "$@"; exit 1; }

usage() {
  cat <<'EOF'
Usage: scripts/run-linux.sh [options]

Sets up a Linux checkout of Dorothy and launches it in development mode:
checks prerequisites, installs dependencies, rebuilds the native modules
(better-sqlite3, node-pty) against the Electron ABI, then starts the app.

Options:
  --web            Run browser-only mode (next dev on http://localhost:3000).
                   Skips Electron and the native-module rebuild.
  --skip-install   Do not run "npm install" even if dependencies look stale.
  -h, --help       Show this help.

Notes:
  * The Electron rebuild is cached with a stamp file
    (node_modules/.dorothy-electron-rebuild) and only re-runs when the Electron
    version or the Node ABI changes.
  * --web leaves the native modules built for the Electron ABI. Nothing under
    src/ loads them, but a plain "node" script that does would need
    "npm rebuild better-sqlite3 node-pty" first.
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --web) WEB_MODE=1 ;;
    --skip-install) SKIP_INSTALL=1 ;;
    -h|--help) usage; exit 0 ;;
    *) err "unknown option: $1"; echo >&2; usage >&2; exit 1 ;;
  esac
  shift
done

# ---------------------------------------------------------------- prerequisites

required_node_major() {
  local version=22
  if [ -f .nvmrc ]; then
    local pinned
    pinned="$(tr -d '[:space:]v' < .nvmrc)"
    pinned="${pinned%%.*}"
    case "$pinned" in ''|*[!0-9]*) ;; *) version="$pinned" ;; esac
  fi
  printf '%s' "$version"
}

check_prerequisites() {
  local node_major want_major
  local -a problems=() apt_packages=()

  want_major="$(required_node_major)"

  if command -v node >/dev/null 2>&1; then
    node_major="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
    if [ "$node_major" -lt "$want_major" ]; then
      problems+=("Node.js $(node -v) is too old — Dorothy needs Node >= ${want_major} (see .nvmrc).")
    fi
  else
    problems+=("Node.js is not installed — Dorothy needs Node >= ${want_major} (see .nvmrc).")
  fi

  if ! command -v npm >/dev/null 2>&1; then
    problems+=("npm is not installed (it ships with Node.js).")
  fi

  # better-sqlite3 and node-pty have no prebuilt binaries for the Electron ABI, so
  # node-gyp compiles them from source. That only happens when this run may install
  # dependencies or rebuild them — "--web --skip-install" compiles nothing.
  if [ "$SKIP_INSTALL" -eq 0 ] || [ "$WEB_MODE" -eq 0 ]; then
    if ! command -v python3 >/dev/null 2>&1; then
      problems+=("python3 is not installed — node-gyp needs it to build better-sqlite3 and node-pty.")
      apt_packages+=("python3")
    fi

    local -a missing_toolchain=()
    command -v make >/dev/null 2>&1 || missing_toolchain+=("make")
    command -v g++ >/dev/null 2>&1 || missing_toolchain+=("g++")
    if [ ${#missing_toolchain[@]} -gt 0 ]; then
      problems+=("No C++ toolchain (missing: ${missing_toolchain[*]}) — better-sqlite3 and node-pty compile from source.")
      apt_packages+=("build-essential")
    fi
  fi

  if [ ${#problems[@]} -eq 0 ]; then
    return 0
  fi

  err "missing prerequisites:"
  local problem
  for problem in "${problems[@]}"; do
    printf '  - %s\n' "$problem" >&2
  done
  printf '\n' >&2
  if [ ${#apt_packages[@]} -gt 0 ]; then
    printf '%s\n' "  On Debian/Ubuntu: ${C_BOLD}sudo apt install -y ${apt_packages[*]}${C_OFF}" >&2
  fi
  if ! command -v node >/dev/null 2>&1 || [ "${node_major:-0}" -lt "$want_major" ]; then
    printf '%s\n' "  Node ${want_major} is not in the Ubuntu/Debian archives — install it with nvm:" >&2
    printf '%s\n' "    ${C_BOLD}curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash && nvm install ${want_major}${C_OFF}" >&2
    printf '%s\n' "  or from NodeSource: ${C_BOLD}https://github.com/nodesource/distributions${C_OFF}" >&2
  fi
  exit 1
}

# next dev silently falls back to another port when 3000 is taken, and then
# "wait-on http://localhost:3000" in electron:dev waits forever.
check_port_free() {
  local busy=0
  if command -v ss >/dev/null 2>&1; then
    # Piping into "grep -q" makes grep exit on the first hit, which kills awk
    # with SIGPIPE (141); under "set -o pipefail" that becomes the pipeline's
    # status and a busy port gets reported as free. Capture first, then match
    # without a pipe. (ss | awk is safe — awk consumes all of its input.)
    local listening
    listening=$(ss -ltnH 2>/dev/null | awk '{print $4}' || true)
    if grep -qE "[:.]${DEV_PORT}$" <<<"$listening"; then
      busy=1
    fi
  elif command -v lsof >/dev/null 2>&1; then
    if lsof -iTCP:"${DEV_PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
      busy=1
    fi
  else
    return 0
  fi

  if [ "$busy" -eq 1 ]; then
    err "port ${DEV_PORT} is already in use."
    printf '%s\n' "  Dorothy's dev server must own port ${DEV_PORT}: next dev would fall back to another" >&2
    printf '%s\n' "  port and the app would never connect. Stop the other server, e.g.:" >&2
    printf '%s\n' "    ${C_BOLD}fuser -k ${DEV_PORT}/tcp${C_OFF}" >&2
    exit 1
  fi
}

# ------------------------------------------------------------------- install

dependencies_stale() {
  if [ ! -d node_modules ]; then
    return 0
  fi
  if [ ! -f node_modules/.package-lock.json ]; then
    return 0
  fi
  if [ package-lock.json -nt node_modules/.package-lock.json ] || [ package.json -nt node_modules/.package-lock.json ]; then
    return 0
  fi
  return 1
}

install_dependencies() {
  if [ "$SKIP_INSTALL" -eq 1 ]; then
    if [ ! -d node_modules ]; then
      die "--skip-install was passed but node_modules/ does not exist. Run without --skip-install first."
    fi
    log "Skipping dependency install (--skip-install)."
    return 0
  fi

  if dependencies_stale; then
    log "Installing dependencies (npm install) — this takes a few minutes on a fresh checkout..."
    npm install
    # An install can restore the Node-ABI build of a native module, so the
    # cached Electron rebuild can no longer be trusted.
    rm -f "$REBUILD_STAMP"
  else
    log "Dependencies are up to date."
  fi
}

# ------------------------------------------------------- native module rebuild

rebuild_native_modules() {
  local electron_version node_abi want current

  if [ ! -d node_modules/electron ]; then
    die "node_modules/electron is missing — run without --skip-install so dependencies get installed."
  fi

  electron_version="$(node -p "require('electron/package.json').version")"
  node_abi="$(node -p 'process.versions.modules')"
  want="electron=${electron_version} node-abi=${node_abi}"

  current=""
  if [ -f "$REBUILD_STAMP" ]; then
    current="$(cat "$REBUILD_STAMP")"
  fi

  if [ "$current" = "$want" ]; then
    log "Native modules already built for Electron ${electron_version} (stamp: ${REBUILD_STAMP})."
    return 0
  fi

  log "Rebuilding better-sqlite3 and node-pty for Electron ${electron_version} — this is slow, but it is cached..."
  npx @electron/rebuild --force --only better-sqlite3,node-pty
  printf '%s\n' "$want" > "$REBUILD_STAMP"
}

# ------------------------------------------------------------ electron sandbox

read_userns_restriction() {
  local value="" sysctl_bin
  for sysctl_bin in sysctl /usr/sbin/sysctl /sbin/sysctl; do
    if command -v "$sysctl_bin" >/dev/null 2>&1; then
      value="$("$sysctl_bin" -n kernel.apparmor_restrict_unprivileged_userns 2>/dev/null || true)"
      break
    fi
  done
  if [ -z "$value" ] && [ -r /proc/sys/kernel/apparmor_restrict_unprivileged_userns ]; then
    value="$(cat /proc/sys/kernel/apparmor_restrict_unprivileged_userns 2>/dev/null || true)"
  fi
  printf '%s' "${value:-0}"
}

configure_electron_sandbox() {
  if [ "$(read_userns_restriction)" != "1" ]; then
    return 0
  fi
  export ELECTRON_DISABLE_SANDBOX=1
  log "kernel.apparmor_restrict_unprivileged_userns=1, so exported ELECTRON_DISABLE_SANDBOX=1: this kernel (Ubuntu 24.04+) blocks unprivileged user namespaces and Electron's sandbox would fail to start without it."
}

# ------------------------------------------------------------------- launching

CHILD_PID=""
CLEANED_UP=0

cleanup() {
  if [ "$CLEANED_UP" -eq 1 ]; then
    return 0
  fi
  CLEANED_UP=1
  trap - INT TERM EXIT

  if [ -n "$CHILD_PID" ] && kill -0 "$CHILD_PID" 2>/dev/null; then
    log "Shutting down dev processes..."
    kill -TERM -"$CHILD_PID" 2>/dev/null || kill -TERM "$CHILD_PID" 2>/dev/null || true
    local waited=0
    while [ "$waited" -lt 50 ] && kill -0 "$CHILD_PID" 2>/dev/null; do
      sleep 0.1
      waited=$((waited + 1))
    done
    kill -KILL -"$CHILD_PID" 2>/dev/null || true
  fi
}

launch() {
  local -a command

  # Installing and rebuilding can take minutes, so re-check as close to the spawn
  # as possible: something else may have taken the port in the meantime.
  check_port_free

  if [ "$WEB_MODE" -eq 1 ]; then
    command=(npm run dev)
    log "Starting browser-only mode — open http://localhost:${DEV_PORT} (Ctrl-C to stop)."
  else
    command=(npm run electron:dev)
    log "Starting Electron dev mode — the window opens once http://localhost:${DEV_PORT} is up (Ctrl-C to stop)."
  fi

  # Job control puts the child in its own process group so that Ctrl-C tears
  # down every next/electron process instead of orphaning them.
  set -m
  "${command[@]}" < /dev/null &
  CHILD_PID=$!
  set +m

  trap cleanup INT TERM EXIT

  local status=0
  wait "$CHILD_PID" || status=$?
  cleanup

  # 130/143 mean the user stopped it with Ctrl-C, which is a normal exit.
  if [ "$status" -eq 130 ] || [ "$status" -eq 143 ]; then
    status=0
  fi
  return "$status"
}

# ----------------------------------------------------------------------- main

log "Dorothy dev launcher (${REPO_ROOT})"
check_prerequisites
check_port_free
install_dependencies
if [ "$WEB_MODE" -eq 0 ]; then
  rebuild_native_modules
  configure_electron_sandbox
fi
launch
