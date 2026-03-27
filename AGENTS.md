# AGENTS.md

This file provides operating guidance for coding agents working in the `hushline-docs` repository.

## Scope

- Applies to the entire repository unless a deeper `AGENTS.md` exists in a subdirectory.

## What This Repo Is

- This is the standalone repository for the Hush Line documentation website.
- It is not the main Hush Line application repo.
- The published site lives at `https://hushline.app/library/`.
- The Docusaurus project itself lives under the [`docs/`](./docs) directory.

## Primary Goal

- Make the docs site clearer, more accurate, and easier to maintain without breaking the published docs experience.

## Start Here

If you are new to this repo, read in this order:

1. [`README.md`](./README.md)
2. [`docs/README.md`](./docs/README.md)
3. [`docs/docusaurus.config.js`](./docs/docusaurus.config.js)
4. [`docs/sidebars.js`](./docs/sidebars.js)
5. `/Users/scidsg/hushline/AGENTS.md`

## Cross-Repo Grounding

- Before writing or revising product-facing docs or blog content, read `/Users/scidsg/hushline/AGENTS.md`.
- Treat the main app repo `AGENTS.md` as the source for core users, supported flows, product priorities, and safety/privacy framing.
- Use it to avoid inventing unsupported workflows, user roles, or product behavior in docs articles or social copy.
- If docs content appears to conflict with `/Users/scidsg/hushline/AGENTS.md`, stop and verify the product behavior in the main app repo before publishing new claims.

## Repository Map

| Path | Purpose |
| --- | --- |
| `docs/docs/` | Documentation content pages |
| `docs/blog/` | Blog posts, media, authors, tags |
| `docs/src/pages/` | Homepage and standalone pages |
| `docs/src/components/` | Reusable React components for the site |
| `docs/src/css/` | Custom site CSS |
| `docs/static/` | Static assets copied through at build time |
| `docs/docusaurus.config.js` | Global site config, navbar/footer, base URL, metadata |
| `docs/sidebars.js` | Docs sidebar generation/configuration |
| `docs/package.json` | Local scripts and dependency versions |
| `scripts/` | Repo automation helpers and topic-selection logic |

## Local Commands

Run these from `docs/`, not from the repo root:

- install deps: `npm install`
- dev server: `npm run start -- --host 127.0.0.1 --port 3001`
- production build: `npm run build`
- serve built output: `npm run serve -- --host 127.0.0.1 --port 3001`

Local site URL:

- `http://127.0.0.1:3001/library/`

The `/library/` path matters because the site base URL is configured to `/library/`.

## Editing Rules

- Keep changes focused on the requested docs/site task.
- Do not rewrite large sections of doc content unless the task asks for it.
- Preserve existing frontmatter, slugs, and category structure unless a routing/navigation change is explicitly needed.
- Prefer updating content in place over moving files.
- Be careful with absolute URLs, internal links, and image paths because the site is served under `/library/`.
- For screenshot usage in docs and blog posts, prefer one desktop image and one mobile image when both views add value.
- Do not use full-page screenshots in docs or blog posts.
- Do not use scrolled screenshots unless the feature being documented is completely below the fold in every non-scrolled view you have available.

## Generated and Local Artifact Paths

Treat these as generated or local-only unless the task specifically targets them:

- `docs/build/`
- `docs/.docusaurus/`
- `docs/node_modules/`
- `docs/static/img/screenshots/`

This repo may also contain unrelated in-progress local changes to doc pages or screenshots. Always check `git status` first and do not revert or overwrite user work.

## Common Task Entry Points

| Task | Start here |
| --- | --- |
| Update documentation copy | matching file under `docs/docs/` |
| Update a blog post | matching file under `docs/blog/` |
| Change homepage content/layout | `docs/src/pages/index.js` and `docs/src/components/` |
| Change site-wide styling | `docs/src/css/custom.css` and component CSS modules |
| Change navbar/footer/metadata | `docs/docusaurus.config.js` |
| Change sidebar behavior | `docs/sidebars.js` |
| Debug local startup | `docs/README.md`, `docs/package.json` |
| Weekly article automation | `docs/AGENT_WEEKLY_ARTICLE_RUNNER.md`, `scripts/agent_weekly_article_runner.sh`, `scripts/weekly_article_topics.json` |

## Validation

For meaningful site changes, prefer this validation sequence from `docs/`:

1. `npm run build`
2. `npm run serve -- --host 127.0.0.1 --port 3001`

If the task is content-only and you do not build locally, say so explicitly.

## Relationship to the Main App Repo

- Main application repo: `scidsg/hushline`
- This repo documents that product, but it does not contain the Flask app, backend routes, or application tests.
- If a task requires changing actual product behavior, it belongs in the main app repo, not here.
