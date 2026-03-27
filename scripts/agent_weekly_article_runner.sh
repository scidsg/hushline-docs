#!/usr/bin/env bash
set -euo pipefail

prepare_runner_exec_snapshot() {
  local runner_script_path="${1:-${BASH_SOURCE[0]}}"
  local runner_argv0="${2:-$0}"
  local original_script_dir original_script_path snapshot_file

  if [[ "${HUSHLINE_DOCS_WEEKLY_RUNNER_SNAPSHOT_ACTIVE:-0}" == "1" ]]; then
    return 1
  fi

  if [[ "$runner_script_path" != "$runner_argv0" ]]; then
    return 1
  fi

  original_script_dir="$(CDPATH= cd -- "$(dirname -- "$runner_script_path")" && pwd)"
  original_script_path="$original_script_dir/$(basename -- "$runner_script_path")"
  snapshot_file="$(mktemp "${TMPDIR:-/tmp}/agent_weekly_article_runner.XXXXXX.sh")"
  cp "$original_script_path" "$snapshot_file"
  chmod 700 "$snapshot_file"
  printf '%s\t%s\n' "$original_script_dir" "$snapshot_file"
}

if SNAPSHOT_METADATA="$(prepare_runner_exec_snapshot "${BASH_SOURCE[0]}" "$0")"; then
  IFS=$'\t' read -r HUSHLINE_DOCS_WEEKLY_RUNNER_ORIGINAL_SCRIPT_DIR HUSHLINE_DOCS_WEEKLY_RUNNER_SNAPSHOT_PATH <<< "$SNAPSHOT_METADATA"
  export HUSHLINE_DOCS_WEEKLY_RUNNER_SNAPSHOT_ACTIVE=1
  export HUSHLINE_DOCS_WEEKLY_RUNNER_ORIGINAL_SCRIPT_DIR
  export HUSHLINE_DOCS_WEEKLY_RUNNER_SNAPSHOT_PATH
  exec bash "$HUSHLINE_DOCS_WEEKLY_RUNNER_SNAPSHOT_PATH" "$@"
fi

FORCE_TOPIC_ID=""
FORCE_DATE="$(date +%Y-%m-%d)"
DRY_RUN=0

SCRIPT_DIR="${HUSHLINE_DOCS_WEEKLY_RUNNER_ORIGINAL_SCRIPT_DIR:-$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)}"
DEFAULT_REPO_DIR="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"
DEFAULT_REPO_PARENT_DIR="$(CDPATH= cd -- "$DEFAULT_REPO_DIR/.." && pwd)"

REPO_DIR="${HUSHLINE_DOCS_REPO_DIR:-$DEFAULT_REPO_DIR}"
REPO_SLUG="${HUSHLINE_DOCS_REPO_SLUG:-scidsg/hushline-docs}"
BASE_BRANCH="${HUSHLINE_DOCS_BASE_BRANCH:-main}"
BOT_GIT_NAME="${HUSHLINE_DOCS_BOT_GIT_NAME:-hushline-dev}"
BOT_GIT_EMAIL="${HUSHLINE_DOCS_BOT_GIT_EMAIL:-git-dev@scidsg.org}"
BOT_GIT_GPG_FORMAT="${HUSHLINE_DOCS_BOT_GIT_GPG_FORMAT:-ssh}"
BOT_GIT_SIGNING_KEY="${HUSHLINE_DOCS_BOT_GIT_SIGNING_KEY:-}"
DEFAULT_BOT_GIT_SSH_SIGNING_KEY_PATH="${HUSHLINE_DOCS_BOT_GIT_DEFAULT_SSH_SIGNING_KEY_PATH:-}"
TOPIC_CATALOG="${HUSHLINE_DOCS_WEEKLY_TOPIC_CATALOG:-$SCRIPT_DIR/weekly_article_topics.json}"
CODEX_MODEL="${HUSHLINE_CODEX_MODEL:-gpt-5.4}"
CODEX_REASONING_EFFORT="${HUSHLINE_CODEX_REASONING_EFFORT:-high}"
VERBOSE_CODEX_OUTPUT="${HUSHLINE_DOCS_WEEKLY_VERBOSE_CODEX_OUTPUT:-0}"
WEBSITE_REPO_DIR="${HUSHLINE_WEBSITE_REPO_DIR:-$DEFAULT_REPO_PARENT_DIR/hushline-website}"
WEBSITE_REPO_SLUG="${HUSHLINE_WEBSITE_REPO_SLUG:-scidsg/hushline-website}"
WEBSITE_BASE_BRANCH="${HUSHLINE_WEBSITE_BASE_BRANCH:-main}"
WEBSITE_LIBRARY_DIR="${HUSHLINE_WEBSITE_LIBRARY_DIR:-$WEBSITE_REPO_DIR/src/library}"
DOCS_BUILD_DIR="${HUSHLINE_DOCS_BUILD_DIR:-$REPO_DIR/docs/build}"
ALLOW_FUTURE_PUBLICATION_DATE="${HUSHLINE_DOCS_ALLOW_FUTURE_PUBLICATION_DATE:-0}"

PROMPT_FILE=""
CODEX_OUTPUT_FILE=""
CODEX_TRANSCRIPT_FILE=""
SELECTION_FILE=""

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --topic)
        FORCE_TOPIC_ID="${2:-}"
        [[ -n "$FORCE_TOPIC_ID" ]] || { echo "Missing value for --topic" >&2; exit 1; }
        shift 2
        ;;
      --date)
        FORCE_DATE="${2:-}"
        [[ -n "$FORCE_DATE" ]] || { echo "Missing value for --date" >&2; exit 1; }
        shift 2
        ;;
      --dry-run)
        DRY_RUN=1
        shift
        ;;
      *)
        echo "Unknown argument: $1" >&2
        exit 1
        ;;
    esac
  done
}

runner_status() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S %Z')" "$*"
}

assert_publication_date_is_allowed() {
  local today_local=""

  today_local="$(date +%Y-%m-%d)"
  if [[ "$FORCE_DATE" > "$today_local" && "$ALLOW_FUTURE_PUBLICATION_DATE" != "1" ]]; then
    printf '%s\n' "Blocked: publication date $FORCE_DATE is in the future relative to local server date $today_local. Override with HUSHLINE_DOCS_ALLOW_FUTURE_PUBLICATION_DATE=1 only when intentionally pre-publishing." >&2
    return 1
  fi
}

cleanup() {
  rm -f "${PROMPT_FILE:-}" "${CODEX_OUTPUT_FILE:-}" "${CODEX_TRANSCRIPT_FILE:-}" "${SELECTION_FILE:-}"
  rm -f "${HUSHLINE_DOCS_WEEKLY_RUNNER_SNAPSHOT_PATH:-}"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

signing_key_looks_like_public_key_literal() {
  local signing_key="$1"
  [[ "$signing_key" == ssh-*' '* ]]
}

resolve_bot_git_signing_key() {
  local configured_signing_key=""
  local configured_gpg_format=""

  if [[ "$BOT_GIT_GPG_FORMAT" != "ssh" ]]; then
    printf '%s\n' "$BOT_GIT_SIGNING_KEY"
    return 0
  fi

  if [[ -n "$BOT_GIT_SIGNING_KEY" ]]; then
    printf '%s\n' "$BOT_GIT_SIGNING_KEY"
    return 0
  fi

  configured_signing_key="$(git config --get user.signingkey 2>/dev/null || true)"
  configured_gpg_format="$(git config --get gpg.format 2>/dev/null || true)"
  if [[ -n "$configured_signing_key" ]]; then
    if [[ "$configured_gpg_format" == "ssh" ]] \
      || signing_key_looks_like_public_key_literal "$configured_signing_key" \
      || [[ "$configured_signing_key" == *.pub ]]; then
      printf '%s\n' "$configured_signing_key"
      return 0
    fi
  fi

  if [[ -n "$DEFAULT_BOT_GIT_SSH_SIGNING_KEY_PATH" && -f "$DEFAULT_BOT_GIT_SSH_SIGNING_KEY_PATH" ]]; then
    printf '%s\n' "$DEFAULT_BOT_GIT_SSH_SIGNING_KEY_PATH"
    return 0
  fi

  return 1
}

assert_ssh_signing_ready() {
  local signing_key="$1"
  local private_key_hint=""
  local smoke_dir=""
  local smoke_output=""

  if [[ -z "$signing_key" ]]; then
    printf '%s\n' "Blocked: SSH signing key is not configured." >&2
    return 1
  fi

  if ! signing_key_looks_like_public_key_literal "$signing_key" && [[ ! -f "$signing_key" ]]; then
    printf '%s\n' "Blocked: SSH signing key file not found: $signing_key" >&2
    return 1
  fi

  if [[ "$signing_key" == *.pub ]]; then
    private_key_hint="${signing_key%.pub}"
  fi

  smoke_dir="$(mktemp -d)"
  set +e
  smoke_output="$(
    cd "$smoke_dir" &&
      git init -q &&
      git config user.name "$BOT_GIT_NAME" &&
      git config user.email "$BOT_GIT_EMAIL" &&
      git config commit.gpgsign true &&
      git config gpg.format ssh &&
      git config user.signingkey "$signing_key" &&
      git commit --allow-empty -m "runner signing preflight" 2>&1
  )"
  local smoke_rc=$?
  set -e
  rm -rf "$smoke_dir"

  if (( smoke_rc == 0 )); then
    return 0
  fi

  if printf '%s\n' "$smoke_output" | grep -Eqi '(incorrect passphrase supplied to decrypt private key|enter passphrase for)'; then
    if [[ -n "$private_key_hint" ]]; then
      printf '%s\n' "Blocked: SSH signing key is present but unavailable to Git. Load the matching private key into ssh-agent first, for example: ssh-add $private_key_hint" >&2
    else
      printf '%s\n' "Blocked: SSH signing key is present but unavailable to Git. Load the matching private key into ssh-agent first." >&2
    fi
    return 1
  fi

  printf '%s\n' "Blocked: SSH signing preflight failed for $signing_key" >&2
  printf '%s\n' "$smoke_output" >&2
  return 1
}

configure_bot_git_identity() {
  local resolved_signing_key=""
  git config user.name "$BOT_GIT_NAME"
  git config user.email "$BOT_GIT_EMAIL"
  git config commit.gpgsign true
  if [[ -n "$BOT_GIT_GPG_FORMAT" ]]; then
    git config gpg.format "$BOT_GIT_GPG_FORMAT"
  fi
  if resolved_signing_key="$(resolve_bot_git_signing_key)"; then
    git config user.signingkey "$resolved_signing_key"
  elif [[ "$BOT_GIT_GPG_FORMAT" == "ssh" ]]; then
    printf '%s\n' "Blocked: SSH commit signing is enabled, but no signing key is configured." >&2
    return 1
  elif [[ -n "$BOT_GIT_SIGNING_KEY" ]]; then
    git config user.signingkey "$BOT_GIT_SIGNING_KEY"
  fi

  if [[ "$BOT_GIT_GPG_FORMAT" == "ssh" ]]; then
    assert_ssh_signing_ready "$resolved_signing_key"
  fi
}

assert_git_repo_dir() {
  local repo_dir="$1"
  if ! git -C "$repo_dir" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    printf '%s\n' "Blocked: git repository not found: $repo_dir" >&2
    return 1
  fi
}

assert_directory_exists() {
  local dir_path="$1"
  if [[ ! -d "$dir_path" ]]; then
    printf '%s\n' "Blocked: directory not found: $dir_path" >&2
    return 1
  fi
}

assert_publish_target_is_safe() {
  local repo_dir="$1"
  local target_dir="$2"

  case "$target_dir" in
    "$repo_dir"/*)
      ;;
    *)
      printf '%s\n' "Blocked: publish target must live inside $repo_dir: $target_dir" >&2
      return 1
      ;;
  esac

  if [[ "$target_dir" == "$repo_dir" ]]; then
    printf '%s\n' "Blocked: refusing to delete repository root: $target_dir" >&2
    return 1
  fi
}

refresh_repo_checkout() {
  local repo_dir="$1"
  local base_branch="$2"
  local repo_slug="$3"

  runner_status "Refreshing checkout for $repo_slug."
  git -C "$repo_dir" fetch origin
  git -C "$repo_dir" checkout "$base_branch"
  git -C "$repo_dir" reset --hard "origin/$base_branch"
  git -C "$repo_dir" clean -fd
}

repo_has_changes() {
  local repo_dir="$1"
  [[ -n "$(git -C "$repo_dir" status --short)" ]]
}

force_push_repo_branch() {
  local repo_dir="$1"
  local repo_slug="$2"
  local branch="$3"

  runner_status "Force-pushing $repo_slug to origin/$branch."
  git -C "$repo_dir" push --force-with-lease origin "$branch"
}

sync_build_to_website() {
  local build_dir="$1"
  local target_dir="$2"

  assert_directory_exists "$build_dir"
  assert_publish_target_is_safe "$WEBSITE_REPO_DIR" "$target_dir"

  mkdir -p "$target_dir"

  runner_status "Replacing $WEBSITE_REPO_SLUG:$target_dir with the latest docs build."
  find "$target_dir" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
  cp -a "$build_dir"/. "$target_dir"/
}

json_field() {
  local json_file="$1"
  local field_path="$2"
  node -e '
    const fs = require("fs");
    const data = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const pathParts = process.argv[2].split(".");
    let current = data;
    for (const part of pathParts) {
      current = current?.[part];
    }
    if (Array.isArray(current)) {
      console.log(current.join(", "));
    } else if (current === undefined || current === null) {
      console.log("");
    } else {
      console.log(String(current));
    }
  ' "$json_file" "$field_path"
}

existing_blog_title_paths() {
  local normalized_title="$1"

  node - "$REPO_DIR/docs/blog" "$normalized_title" <<'EOF'
    const fs = require("fs");
    const path = require("path");

    const blogRoot = process.argv[2];
    const expected = process.argv[3].trim().toLowerCase();

    function walk(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
          continue;
        }
        if (entry.name !== "index.md") {
          continue;
        }
        const content = fs.readFileSync(fullPath, "utf8");
        const match = content.match(/^title:\s*(.+)$/m);
        if (!match) {
          continue;
        }
        const title = match[1].trim().replace(/^['"]|['"]$/g, "").toLowerCase();
        if (title === expected) {
          console.log(path.relative(process.cwd(), fullPath));
        }
      }
    }

    walk(blogRoot);
EOF
}

assert_blog_title_is_unique() {
  local title="$1"
  local article_path="$2"
  local collisions=""

  collisions="$(existing_blog_title_paths "$title" | grep -vxF "$article_path" || true)"
  if [[ -n "$collisions" ]]; then
    printf '%s\n' "Blocked: blog title already exists elsewhere: $title" >&2
    printf '%s\n' "$collisions" >&2
    return 1
  fi
}

select_topic() {
  local cmd=(
    node "$SCRIPT_DIR/select_weekly_article_topic.mjs"
    --repo-root "$REPO_DIR"
    --catalog "$TOPIC_CATALOG"
    --date "$FORCE_DATE"
  )

  if [[ -n "$FORCE_TOPIC_ID" ]]; then
    cmd+=(--topic "$FORCE_TOPIC_ID")
  fi

  "${cmd[@]}"
}

build_prompt() {
  local article_path="$1"
  local article_slug="$2"
  local topic_id="$3"
  local title_seed="$4"
  local core_user_label="$5"
  local scenario="$6"
  local feature_focus="$7"
  local prompt_angle="$8"
  local supporting_docs="$9"
  local feature_key="${10}"
  local core_user_key="${11}"

  {
    cat <<EOF2
You are writing one new Hush Line blog article in $REPO_SLUG.

Follow AGENTS.md exactly.

Create exactly one new article at:
$article_path

Article requirements:
1) Write a new markdown blog post focused on Hush Line features and how they apply to a real-world scenario for this core user: $core_user_label
2) Topic id: $topic_id
3) Suggested title seed: $title_seed
4) Real-world scenario: $scenario
5) Feature focus: $feature_focus
6) Angle: $prompt_angle
7) Use the existing docs and blog content in this repo as the product source of truth. Do not invent unsupported product behavior.
8) Start by reading these supporting docs before writing: $supporting_docs
9) Keep scope narrow: create the article and update any directly needed metadata only.
10) Use the existing blog conventions in this repo. Prefer authors [gsorrentino] and tags [hushline] unless a small metadata adjustment is clearly needed.
11) Include a <!-- truncate --> marker after the opening section.
12) Do not add image assets unless they are necessary. A strong text-only article is acceptable.
13) Include these custom frontmatter fields so future weekly runs can rotate topics:
    - agent_topic_id: $topic_id
    - agent_feature_key: $feature_key
    - agent_core_user_key: $core_user_key
14) Use this slug in frontmatter: $article_slug
15) Keep the article practical and specific. The reader should understand how Hush Line helps this user in a real operational context.
16) Do not include meta commentary about following instructions in your final summary.
EOF2
  } > "$PROMPT_FILE"
}

run_codex_from_prompt() {
  local rc=0
  : > "$CODEX_OUTPUT_FILE"
  : > "$CODEX_TRANSCRIPT_FILE"

  runner_status "Codex execution started."
  set +e
  codex exec \
    --model "$CODEX_MODEL" \
    -c "model_reasoning_effort=\"$CODEX_REASONING_EFFORT\"" \
    --full-auto \
    --sandbox workspace-write \
    -C "$REPO_DIR" \
    -o "$CODEX_OUTPUT_FILE" \
    - < "$PROMPT_FILE" 2>&1 | {
      if [[ "$VERBOSE_CODEX_OUTPUT" == "1" ]]; then
        tee "$CODEX_TRANSCRIPT_FILE"
      else
        cat > "$CODEX_TRANSCRIPT_FILE"
      fi
    }
  rc=${PIPESTATUS[0]}
  set -e

  if (( rc != 0 )); then
    runner_status "Codex execution failed (exit $rc)."
    return "$rc"
  fi

  runner_status "Codex execution completed."
  if [[ -s "$CODEX_OUTPUT_FILE" ]]; then
    sed -n '1,80p' "$CODEX_OUTPUT_FILE"
  fi
}

validate_article() {
  runner_status "Installing docs dependencies."
  (cd "$REPO_DIR/docs" && npm install)
  runner_status "Building docs site."
  (cd "$REPO_DIR/docs" && npm run build)
}

build_pr_title() {
  local title_seed="$1"
  printf 'Add weekly article: %s\n' "$title_seed"
}

build_publish_commit_title() {
  local title_seed="$1"
  printf 'Publish library build for weekly article: %s\n' "$title_seed"
}

main() {
  parse_args "$@"
  trap cleanup EXIT

  SELECTION_FILE="$(mktemp)"

  require_cmd node
  assert_publication_date_is_allowed

  cd "$REPO_DIR"

  if (( DRY_RUN == 1 )); then
    select_topic > "$SELECTION_FILE"
    cat "$SELECTION_FILE"
    return 0
  fi

  PROMPT_FILE="$(mktemp)"
  CODEX_OUTPUT_FILE="$(mktemp)"
  CODEX_TRANSCRIPT_FILE="$(mktemp)"

  require_cmd git
  require_cmd codex
  require_cmd npm

  assert_git_repo_dir "$REPO_DIR"
  assert_git_repo_dir "$WEBSITE_REPO_DIR"

  refresh_repo_checkout "$REPO_DIR" "$BASE_BRANCH" "$REPO_SLUG"
  refresh_repo_checkout "$WEBSITE_REPO_DIR" "$WEBSITE_BASE_BRANCH" "$WEBSITE_REPO_SLUG"

  (cd "$REPO_DIR" && configure_bot_git_identity)
  (cd "$WEBSITE_REPO_DIR" && configure_bot_git_identity)

  select_topic > "$SELECTION_FILE"

  local topic_id=""
  local title_seed=""
  local core_user_label=""
  local scenario=""
  local feature_focus=""
  local prompt_angle=""
  local supporting_docs=""
  local article_path=""
  local article_slug=""
  local feature_key=""
  local core_user_key=""

  topic_id="$(json_field "$SELECTION_FILE" "topic.id")"
  title_seed="$(json_field "$SELECTION_FILE" "topic.title_seed")"
  core_user_label="$(json_field "$SELECTION_FILE" "topic.core_user_label")"
  scenario="$(json_field "$SELECTION_FILE" "topic.scenario")"
  feature_focus="$(json_field "$SELECTION_FILE" "topic.feature_focus")"
  prompt_angle="$(json_field "$SELECTION_FILE" "topic.prompt_angle")"
  supporting_docs="$(json_field "$SELECTION_FILE" "topic.supporting_docs")"
  article_path="$(json_field "$SELECTION_FILE" "articleRelativePath")"
  article_slug="$(json_field "$SELECTION_FILE" "articleSlug")"
  feature_key="$(json_field "$SELECTION_FILE" "topic.feature_key")"
  core_user_key="$(json_field "$SELECTION_FILE" "topic.core_user_key")"

  runner_status "Selected weekly article topic: $topic_id"
  runner_status "Planned article path: $article_path"
  assert_blog_title_is_unique "$title_seed" "$article_path"

  build_prompt \
    "$article_path" \
    "$article_slug" \
    "$topic_id" \
    "$title_seed" \
    "$core_user_label" \
    "$scenario" \
    "$feature_focus" \
    "$prompt_angle" \
    "$supporting_docs" \
    "$feature_key" \
    "$core_user_key"

  run_codex_from_prompt

  if [[ -z "$(git status --short)" ]]; then
    runner_status "Skipped: Codex produced no repository changes."
    return 0
  fi

  validate_article

  sync_build_to_website "$DOCS_BUILD_DIR" "$WEBSITE_LIBRARY_DIR"

  git -C "$REPO_DIR" add -A
  git -C "$REPO_DIR" commit -m "$(build_pr_title "$title_seed")"
  force_push_repo_branch "$REPO_DIR" "$REPO_SLUG" "$BASE_BRANCH"

  if ! repo_has_changes "$WEBSITE_REPO_DIR"; then
    runner_status "Skipped website publish: syncing the build produced no changes in $WEBSITE_LIBRARY_DIR."
    return 0
  fi

  git -C "$WEBSITE_REPO_DIR" add -A
  git -C "$WEBSITE_REPO_DIR" commit -m "$(build_publish_commit_title "$title_seed")"
  force_push_repo_branch "$WEBSITE_REPO_DIR" "$WEBSITE_REPO_SLUG" "$WEBSITE_BASE_BRANCH"
}

main "$@"
