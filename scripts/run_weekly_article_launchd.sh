#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"
DEFAULT_WEBSITE_REPO_DIR="$REPO_DIR/../hushline-website"
LOCK_DIR="$REPO_DIR/.tmp/weekly-article.lock"
ENV_FILE="${HUSHLINE_DOCS_ENV_FILE:-$REPO_DIR/.env.launchd}"

export HOME="${HOME:-/Users/scidsg}"
export PATH="${HUSHLINE_DOCS_LAUNCHD_PATH:-/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin}"
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex-hushline-agent-002}"
export GH_CONFIG_DIR="${GH_CONFIG_DIR:-$HOME/.config/gh}"
export NPM_CONFIG_CACHE="${NPM_CONFIG_CACHE:-$HOME/.npm}"
export XDG_CACHE_HOME="${XDG_CACHE_HOME:-$HOME/.cache}"
export XDG_CONFIG_HOME="${XDG_CONFIG_HOME:-$HOME/.config}"
export HUSHLINE_DOCS_REPO_DIR="${HUSHLINE_DOCS_REPO_DIR:-$REPO_DIR}"
export HUSHLINE_WEBSITE_REPO_DIR="${HUSHLINE_WEBSITE_REPO_DIR:-$DEFAULT_WEBSITE_REPO_DIR}"
export HUSHLINE_DOCS_BUILD_DIR="${HUSHLINE_DOCS_BUILD_DIR:-$HUSHLINE_DOCS_REPO_DIR/docs/build}"
export HUSHLINE_WEBSITE_LIBRARY_DIR="${HUSHLINE_WEBSITE_LIBRARY_DIR:-$HUSHLINE_WEBSITE_REPO_DIR/src/library}"
export HUSHLINE_DOCS_REQUIRED_CHECKOUT_BRANCH="${HUSHLINE_DOCS_REQUIRED_CHECKOUT_BRANCH:-main}"
DEFAULT_SOCIAL_REPO_DIR="$REPO_DIR/../hushline-social"

if [[ -z "${SSH_AUTH_SOCK:-}" ]]; then
  SSH_AUTH_SOCK="$(launchctl getenv SSH_AUTH_SOCK 2>/dev/null || true)"
  if [[ -n "$SSH_AUTH_SOCK" ]]; then
    export SSH_AUTH_SOCK
  fi
fi

cleanup() {
  rmdir "$LOCK_DIR" >/dev/null 2>&1 || true
}

runner_status() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S %Z')" "$*"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf 'Missing required command: %s\n' "$1" >&2
    exit 1
  fi
}

mkdir -p "$REPO_DIR/.tmp" "$REPO_DIR/logs"

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  printf 'Weekly docs article runner is already running. Exiting.\n' >&2
  exit 0
fi
trap cleanup EXIT

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

export HUSHLINE_SOCIAL_REPO_DIR="${HUSHLINE_SOCIAL_REPO_DIR:-$DEFAULT_SOCIAL_REPO_DIR}"
export HUSHLINE_SOCIAL_ENV_FILE="${HUSHLINE_SOCIAL_ENV_FILE:-$HUSHLINE_SOCIAL_REPO_DIR/.env.launchd}"

require_cmd bash
require_cmd codex
require_cmd git
require_cmd node
require_cmd npm

runner_status "Starting weekly docs article launchd wrapper."
runner_status "Using docs repo: $HUSHLINE_DOCS_REPO_DIR"
runner_status "Using website repo: $HUSHLINE_WEBSITE_REPO_DIR"
runner_status "Using social repo: $HUSHLINE_SOCIAL_REPO_DIR"
if [[ -n "${SSH_AUTH_SOCK:-}" ]]; then
  runner_status "Using SSH_AUTH_SOCK: $SSH_AUTH_SOCK"
else
  runner_status "SSH_AUTH_SOCK is not set."
fi

cd "$HUSHLINE_DOCS_REPO_DIR"
current_branch="$(git branch --show-current 2>/dev/null || true)"
if [[ -n "$HUSHLINE_DOCS_REQUIRED_CHECKOUT_BRANCH" && "$current_branch" != "$HUSHLINE_DOCS_REQUIRED_CHECKOUT_BRANCH" ]]; then
  printf 'Blocked: weekly article launchd wrapper must run from checkout branch %s, found %s. Set HUSHLINE_DOCS_REQUIRED_CHECKOUT_BRANCH to override intentionally.\n' \
    "$HUSHLINE_DOCS_REQUIRED_CHECKOUT_BRANCH" \
    "${current_branch:-<detached>}" >&2
  exit 1
fi
./scripts/agent_weekly_article_runner.sh "$@"
