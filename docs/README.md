# Hush Line Docs Site

This directory contains the Docusaurus app for the public Hush Line Library site.

Published URL:

- `https://hushline.app/library/`

The repository root contains high-level repo guidance in [`../README.md`](../README.md) and [`../AGENTS.md`](../AGENTS.md). This file is the practical guide for running and editing the Docusaurus site itself.

## Directory Map

| Path | Purpose |
| --- | --- |
| `docs/` | Markdown docs content rendered in the Library |
| `blog/` | Blog posts and related media |
| `src/pages/` | Homepage and standalone pages |
| `src/components/` | Reusable React components |
| `src/css/` | Site-wide custom CSS |
| `static/` | Static files copied directly into the built site |
| `docusaurus.config.js` | Site config, metadata, navbar, footer, base URL |
| `sidebars.js` | Sidebar generation/configuration |
| `package.json` | Local scripts and dependency versions |

## Prerequisites

- Node.js `>=18`
- npm

## Install

Run from this `docs/` directory:

```bash
npm install
```

## Local Development (Hot Reload)

```bash
npm run start -- --host 127.0.0.1 --port 3001
```

Open:

- `http://127.0.0.1:3001/library/`

Notes:

- The site base URL is `/library/`, so local URLs must include `/library/`.
- Commands should be run from `docs/`, not the repository root.
- If port `3000` is in use, keep using `3001` or another free port.

## Production Build + Local Serve

Use this when you want to verify the exact generated output:

```bash
npm run build
npm run serve -- --host 127.0.0.1 --port 3001
```

Open:

- `http://127.0.0.1:3001/library/`

## What to Edit for Common Tasks

| Task | Start here |
| --- | --- |
| Update docs content | matching file under `docs/` |
| Add or update a blog post | matching file under `blog/` |
| Change homepage content | `src/pages/index.js` |
| Change homepage feature blocks | `src/components/HomepageFeatures/` |
| Change site-wide styles | `src/css/custom.css` |
| Change navbar/footer/metadata | `docusaurus.config.js` |
| Change docs sidebar behavior | `sidebars.js` |

## Generated and Local-Only Directories

These paths are usually generated locally and should not be treated as hand-edited source unless the task explicitly targets them:

- `.docusaurus/`
- `build/`
- `node_modules/`
- `static/img/screenshots/`

## Common Troubleshooting

- `npm run start` fails at repo root: run commands from `docs/`, not the repository root.
- `Something is already running on port 3000`: use `--port 3001` or stop the process on `3000`.
- New blog image/content not showing: rebuild with `npm run build`, then run `npm run serve`, and hard refresh your browser.
- Broken links after changing filenames or slugs: review `docusaurus.config.js`, sidebar structure, and internal Markdown links.
