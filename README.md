# Raiden II Web Remake

A public browser remake project targeting the arcade version of **Raiden II**.

## Current Status
- Runtime, combat, authored Stage 1-8 content, loop carryover, co-op lifecycle, cabinet rules, browser shell, and final release verification are complete
- The project is ready for static host deployment at `/games/raiden-ii/`
- Deployment target is a static subpath release at `/games/raiden-ii/`

## Stack
- Vite
- TypeScript
- PixiJS
- Vitest

## Workflow
- `main` stays stable and review-gated
- Feature work lands on `codex/*` branches
- Every tranche should open a PR and go ready for review only after:
  - `npm run test:run`
  - `npm run build`

## Public Release Constraint
This repository must contain **replacement/remade assets only**.

See [PUBLIC_ASSET_POLICY.md](./PUBLIC_ASSET_POLICY.md).

## Repository
- GitHub: [Charpup/raiden-ii-web-remake](https://github.com/Charpup/raiden-ii-web-remake)

## Useful Commands
```bash
npm install
npm run test:run
npm run coverage
npm run build
```

## Deployment
- Host deployment handoff: [HOST_DEPLOYMENT_HANDOFF.md](./HOST_DEPLOYMENT_HANDOFF.md)
- Operator smoke checklist: [OPERATOR_SMOKE_CHECKLIST.md](./OPERATOR_SMOKE_CHECKLIST.md)

## Project Planning Artifacts
- [task_plan.md](./task_plan.md)
- [findings.md](./findings.md)
- [progress.md](./progress.md)
- [SPEC.yaml](./SPEC.yaml)
- [triadev-handoff.json](./triadev-handoff.json)
- [arcade-baseline-matrix.md](./arcade-baseline-matrix.md)
