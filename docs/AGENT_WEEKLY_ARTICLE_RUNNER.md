# Weekly Article Agent Runner

Script: `scripts/agent_weekly_article_runner.sh`

This runner creates one new blog article in `hushline-docs`, builds the docs site, publishes the generated static output into `hushline-website/src/library`, and can hand the published article off to the `hushline-social` repo for LinkedIn publication.

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

1. Refresh the local `hushline-docs` checkout to `origin/main`.
2. Refresh the local `hushline-website` checkout to `origin/main`.
3. Preflight the social publishing environment when weekly social sharing is enabled.
4. Configure signed-commit git identity for the bot user in both repositories.
5. Select the next article topic from the catalog.
6. Ask Codex to write exactly one new blog article under `docs/blog/<date>-<slug>/index.md`.
7. Run local validation:
   - `npm install`
   - `npm run build`
8. Build a social-share archive for the article.
9. Delete the contents of `hushline-website/src/library`.
10. Copy the new contents of `docs/build/` into `hushline-website/src/library`.
11. Commit and force-push directly to the configured base branches in both repositories. No PR is created.
12. When weekly social sharing is enabled, install the rendered article archive into `hushline-social/previous-posts/<date-or-date-suffix>/` and publish it through the existing LinkedIn publisher.

The rendered article-share copy should:

- lead with an engaging question
- put `We just published an article describing...` or `showing...` on its own line
- end with `read it here: <url>` on its own line

## Output Conventions

The generated article prompt instructs Codex to:

- use the existing blog format in `docs/blog/`
- use `authors: [hushline-agent]`
- prefer `tags: [hushline]`
- include `<!-- truncate -->`
- use section headings that are specific to the article subject, not canned labels like `The Real-World Scenario` or `The Practical Takeaway`
- do not add image assets unless they are necessary
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

The default publish layout assumes sibling checkouts:

- `/path/to/hushline-docs`
- `/path/to/hushline-website`

## Required Commands

- `git`
- `codex`
- `node`
- `npm`

## Environment Variables

- `HUSHLINE_DOCS_REPO_DIR` (default the checkout containing the runner)
- `HUSHLINE_DOCS_REPO_SLUG` (default `scidsg/hushline-docs`)
- `HUSHLINE_DOCS_BASE_BRANCH` (default `main`)
- `HUSHLINE_DOCS_BOT_GIT_NAME` (default `hushline-dev`)
- `HUSHLINE_DOCS_BOT_GIT_EMAIL` (default `git-dev@scidsg.org`)
- `HUSHLINE_DOCS_BOT_GIT_GPG_FORMAT` (default `ssh`)
- `HUSHLINE_DOCS_BOT_GIT_SIGNING_KEY` (optional)
- `HUSHLINE_DOCS_BOT_GIT_DEFAULT_SSH_SIGNING_KEY_PATH` (optional)
- `HUSHLINE_DOCS_WEEKLY_TOPIC_CATALOG` (default `scripts/weekly_article_topics.json`)
- `HUSHLINE_DOCS_WEEKLY_VERBOSE_CODEX_OUTPUT` (default `0`)
- `HUSHLINE_DOCS_BUILD_DIR` (default `docs/build`)
- `HUSHLINE_WEBSITE_REPO_DIR` (default sibling checkout `../hushline-website`)
- `HUSHLINE_WEBSITE_REPO_SLUG` (default `scidsg/hushline-website`)
- `HUSHLINE_WEBSITE_BASE_BRANCH` (default `main`)
- `HUSHLINE_WEBSITE_LIBRARY_DIR` (default `src/library` inside `HUSHLINE_WEBSITE_REPO_DIR`)
- `HUSHLINE_DOCS_SITE_BASE_URL` (default `https://hushline.app/library`)
- `HUSHLINE_DOCS_WEEKLY_SOCIAL_ENABLED` (default `1`)
- `HUSHLINE_DOCS_WEEKLY_SOCIAL_PUBLISH` (default `1`)
- `HUSHLINE_SOCIAL_REPO_DIR` (default sibling checkout `../hushline-social`)
- `HUSHLINE_SOCIAL_BASE_BRANCH` (default `main`)
- `HUSHLINE_SOCIAL_ARCHIVE_ROOT` (default `previous-posts`)
- `HUSHLINE_SOCIAL_ENV_FILE` (default `HUSHLINE_SOCIAL_REPO_DIR/.env.launchd`)
- `HUSHLINE_CODEX_MODEL` (default `gpt-5.4`)
- `HUSHLINE_CODEX_REASONING_EFFORT` (default `high`)

## Notes

- This runner is intentionally lighter than the Hush Line app runners because `hushline-docs` has no Docker runtime or app test matrix to bootstrap.
- It assumes both `hushline-docs` and `hushline-website` are dedicated automation checkouts because it hard-resets both working trees to their configured base branches.
- If weekly social sharing is enabled, point `HUSHLINE_SOCIAL_REPO_DIR` at a dedicated automation checkout of `hushline-social` as well, because the runner refreshes that checkout before writing the new article-share archive and triggering LinkedIn publication.
- The publish step is destructive by design: it removes the existing contents of `src/library` only after `npm run build` succeeds, then copies the fresh build output into place.
- `--dry-run` is safe for local inspection because it only prints the selected topic JSON and exits before any git reset, signing setup, or publish work.
