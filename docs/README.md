# Hush Line Docs Site

This site is built with [Docusaurus](https://docusaurus.io/) and lives in this `docs/` directory.

## Prerequisites

- Node.js `>=18`
- npm

## Install

Run from the `docs/` directory:

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

- The site base URL is `/library/`, so use `/library/` in local URLs.
- If port `3000` is in use, keep using `3001` (or another free port).

## Production Build + Local Serve

Use this when you want to verify the exact generated output:

```bash
npm run build
npm run serve -- --host 127.0.0.1 --port 3001
```

Open:

- `http://127.0.0.1:3001/library/`

## Common Troubleshooting

- `npm run start` fails at repo root: run commands from `docs/`, not the repository root.
- `Something is already running on port 3000`: use `--port 3001` or stop the process on `3000`.
- New blog image/content not showing: rebuild with `npm run build`, then run `npm run serve`, and hard refresh your browser.
