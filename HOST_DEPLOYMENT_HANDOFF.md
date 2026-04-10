# Raiden II Web Remake Host Deployment Handoff

This document is the project-specific deployment handoff for publishing the game to `galatealearningfor.fun`.

## Build Inputs
- Workspace: `D:\CodexWorkspace\web_mini-game`
- App base path: `/games/raiden-ii/`
- Build command:
  - `npm ci`
  - `npm run test:run`
  - `npm run coverage`
  - `npm run build`
- Build output: `dist/`

## Publish Target
- Production host root: `/var/www/galatealearningfor.fun`
- Recommended live path: `/var/www/galatealearningfor.fun/games/raiden-ii`
- Recommended release root: `/var/www/galatealearningfor.fun/releases/raiden-ii/<timestamp>`

## Recommended Publish Flow
1. Build locally or on the deployment host with the commands above.
2. Copy the contents of `dist/` into a new timestamped release directory.
3. Promote the release by pointing `/var/www/galatealearningfor.fun/games/raiden-ii` at that release directory.
4. Verify `https://galatealearningfor.fun/games/raiden-ii/` returns `200`.
5. Run the post-deploy checks in [OPERATOR_SMOKE_CHECKLIST.md](./OPERATOR_SMOKE_CHECKLIST.md).

## Fallback Publish Flow
If the host agent cannot use symlink promotion, copy the contents of `dist/` directly into:
- `/var/www/galatealearningfor.fun/games/raiden-ii/`

Keep a full copy of the previous deployable directory so rollback remains one copy/swap operation.

## Rollback
Recommended rollback:
1. Re-point `/var/www/galatealearningfor.fun/games/raiden-ii` to the previous known-good release directory.
2. Re-open `https://galatealearningfor.fun/games/raiden-ii/`.
3. Re-run the smoke checklist.

Fallback rollback:
1. Restore the previous saved directory contents into `/var/www/galatealearningfor.fun/games/raiden-ii/`.
2. Re-run the smoke checklist.

## Files Expected In The Live Build
- `index.html`
- hashed JS/CSS assets under `assets/`
- `favicon.svg`

All game asset urls must resolve under `/games/raiden-ii/`.

## No-Backend Assumption
- This build is static-only.
- Do not provision a game backend or websocket proxy for this release.
- Do not modify the root shell or existing `/clawlibrary/` or `/learning-graph/` routes.

## Compliance Constraints
- Deploy replacement/remade assets only.
- Do not upload original arcade, ROM-derived, or soundtrack-rip assets.
- Do not place secrets, tokens, or host-only credentials into the public build.

## Post-Deploy Success Criteria
- `/games/raiden-ii/` returns `200`
- all referenced static assets return `200`
- title -> mode select -> cabinet select -> gameplay works
- continue, game-over, ending, and loop transition are reachable
- no blank screen, no stuck overlay, no asset 404s
