# Weekly Article Agent Runner

Script: `scripts/agent_weekly_article_runner.sh`

This runner creates one new blog article proposal in `hushline-docs` at a time. It is designed to be scheduled weekly on a server, similar to the local runners used in the main Hush Line repository.

## Goal

Write one new article per week that:

- focuses on real Hush Line features and documented product behavior
- maps those features to real-world scenarios for core Hush Line users
- keeps topic selection varied over time instead of repeating the same angle every week

## How Topic Selection Works

The runner uses [`scripts/weekly_article_topics.json`](../scripts/weekly_article_topics.json) as a topic catalog.

Each topic includes:

- a stable topic id
- a core user group
- a feature focus
- a concrete scenario
- supporting docs to read before drafting

The selector script [`scripts/select_weekly_article_topic.mjs`](../scripts/select_weekly_article_topic.mjs):

- scans existing blog posts for `agent_topic_id` frontmatter
- prefers topics that have never been used
- otherwise falls back to the least recently used topic
- can be forced to a specific topic with `--topic <id>`

## Execution Flow

1. Refresh the local checkout to `origin/main`.
2. Exit early if any open human-authored PR exists.
3. Exit early if any open bot-authored PR already exists.
4. Configure signed-commit git identity for the bot user.
5. Select the next article topic from the catalog.
6. Create or reset the weekly work branch.
7. Ask Codex to write exactly one new blog article under `docs/blog/<date>-<slug>/index.md`.
8. Run local validation:
   - `npm install`
   - `npm run build`
9. Commit, push, and open or update a PR.

## Output Conventions

The generated article prompt instructs Codex to:

- use the existing blog format in `docs/blog/`
- use `authors: [gsorrentino]`
- prefer `tags: [hushline]`
- include `<!-- truncate -->`
- include these custom frontmatter fields for future rotation:
  - `agent_topic_id`
  - `agent_feature_key`
  - `agent_core_user_key`

## Manual Usage

Run from the repository root:

```bash
./scripts/agent_weekly_article_runner.sh
```

Dry-run the topic selector without editing anything:

```bash
./scripts/agent_weekly_article_runner.sh --dry-run
```

Force a specific topic:

```bash
./scripts/agent_weekly_article_runner.sh --topic journalists-verified-directory
```

Force a specific publication date:

```bash
./scripts/agent_weekly_article_runner.sh --date 2026-04-06
```

## Suggested Server Schedule

Example cron entry for a Monday morning run:

```cron
0 14 * * 1 cd /path/to/hushline-docs && ./scripts/agent_weekly_article_runner.sh
```

Adjust the time and checkout path to match the server environment.

## Required Commands

- `git`
- `gh`
- `codex`
- `node`
- `npm`

## Environment Variables

- `HUSHLINE_DOCS_REPO_DIR` (default the checkout containing the runner)
- `HUSHLINE_DOCS_REPO_SLUG` (default `scidsg/hushline-docs`)
- `HUSHLINE_DOCS_BASE_BRANCH` (default `main`)
- `HUSHLINE_DOCS_BOT_LOGIN` (default `hushline-dev`)
- `HUSHLINE_DOCS_BOT_GIT_NAME` (default bot login)
- `HUSHLINE_DOCS_BOT_GIT_EMAIL` (default `git-dev@scidsg.org`)
- `HUSHLINE_DOCS_BOT_GIT_GPG_FORMAT` (default `ssh`)
- `HUSHLINE_DOCS_BOT_GIT_SIGNING_KEY` (optional)
- `HUSHLINE_DOCS_BOT_GIT_DEFAULT_SSH_SIGNING_KEY_PATH` (optional)
- `HUSHLINE_DOCS_WEEKLY_BRANCH_PREFIX` (default `codex/weekly-article-`)
- `HUSHLINE_DOCS_WEEKLY_TOPIC_CATALOG` (default `scripts/weekly_article_topics.json`)
- `HUSHLINE_DOCS_WEEKLY_VERBOSE_CODEX_OUTPUT` (default `0`)
- `HUSHLINE_CODEX_MODEL` (default `gpt-5.4`)
- `HUSHLINE_CODEX_REASONING_EFFORT` (default `high`)

## Notes

- This runner is intentionally lighter than the Hush Line app runners because `hushline-docs` has no Docker runtime or app test matrix to bootstrap.
- It assumes the docs repo is run from a dedicated automation checkout because it hard-resets the working tree to `origin/main`.
- `--dry-run` is safe for local inspection because it only prints the selected topic JSON and exits before any git reset, PR check, or signing setup.
