# hushline-docs

Standalone repository for the Hush Line documentation site.

This repo contains the source for the public docs and blog published at:

- `https://hushline.app/library/`

The actual Docusaurus app lives inside the [`docs/`](./docs) directory, so most development commands run from there rather than from the repo root.

## What Lives Here

| Path | Purpose |
| --- | --- |
| [`docs/docs/`](./docs/docs) | Documentation content shown in the Library sidebar |
| [`docs/blog/`](./docs/blog) | Blog posts, cover images, and author/tag metadata |
| [`docs/src/`](./docs/src) | Docusaurus homepage React code and custom site components |
| [`docs/static/`](./docs/static) | Static assets copied through to the built site |
| [`docs/docusaurus.config.js`](./docs/docusaurus.config.js) | Site config, navbar/footer, base URL, metadata |
| [`docs/sidebars.js`](./docs/sidebars.js) | Docs sidebar configuration |
| [`docs/package.json`](./docs/package.json) | Node scripts and Docusaurus dependency versions |
| [`docs/README.md`](./docs/README.md) | Local development details for the Docusaurus app |
| [`scripts/`](./scripts) | Repo automation helpers, including the weekly article agent |
| [`AGENTS.md`](./AGENTS.md) | Agent-facing repo map, workflow rules, and do-not-touch guidance |

## Mental Model

This repo is not the Hush Line application itself. It is the documentation website for that application.

That means:

- content changes usually happen in Markdown under `docs/docs/` or `docs/blog/`
- homepage/layout/theme changes usually happen under `docs/src/`, `docs/src/css/`, or `docs/docusaurus.config.js`
- the site is served under the `/library/` base path, not `/`
- local development commands should be run from `docs/`

## Local Development

From the `docs/` directory:

```bash
npm install
npm run start -- --host 127.0.0.1 --port 3001
```

Then open:

- `http://127.0.0.1:3001/library/`

To verify a production-style build:

```bash
npm run build
npm run serve -- --host 127.0.0.1 --port 3001
```

## Editing Guidance

- For doc content changes, start in `docs/docs/`.
- For blog work, start in `docs/blog/`.
- For homepage or presentation work, start in `docs/src/` and `docs/src/css/`.
- For navigation, links, metadata, or base path changes, inspect `docs/docusaurus.config.js` and `docs/sidebars.js`.

## Automation

- Weekly article runner: [`docs/AGENT_WEEKLY_ARTICLE_RUNNER.md`](./docs/AGENT_WEEKLY_ARTICLE_RUNNER.md)
- Topic catalog: [`scripts/weekly_article_topics.json`](./scripts/weekly_article_topics.json)

## Generated and Local-Only Paths

This repo may contain large local artifact directories during active work. Treat these as generated unless the task explicitly targets them:

- `docs/build/`
- `docs/.docusaurus/`
- `docs/node_modules/`
- `docs/static/img/screenshots/`

There may also be in-progress local doc edits in the worktree. Check `git status` before making changes and do not overwrite unrelated work.
