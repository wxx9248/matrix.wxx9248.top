# matrix.wxx9248.top

The landing page of wxx9248's Matrix homeserver.

## Requirements

- Node.js — the version in `devEngines` in [`package.json`](package.json)
- pnpm — the version in `packageManager` in [`package.json`](package.json)

## Commands

| Command         | What it does                                                             |
| --------------- | ------------------------------------------------------------------------ |
| `pnpm install`  | Install dependencies                                                     |
| `pnpm dev`      | Start the dev server                                                     |
| `pnpm build`    | Lint, type check and build to `dist/`. Fails if any step fails           |
| `pnpm preview`  | Serve `dist/` as Cloudflare will (`wrangler dev`)                        |
| `pnpm test`     | Unit tests and the route check (Vitest), then browser tests (Playwright) |
| `pnpm lint:fix` | Fix what ESLint can fix                                                  |
| `pnpm format`   | Format everything with Prettier                                          |
