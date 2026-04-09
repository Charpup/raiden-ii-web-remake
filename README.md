# Raiden II Web Remake

A public browser remake project targeting the arcade version of **Raiden II**.

## Current Status
- Runtime foundation implemented and verified
- Combat core implemented and verified
- Simulation/content seam and stage runner contracts implemented and verified
- Next tranche: expand the Stage 1 golden slice, author the remaining stage content, and finish 2P/cabinet/loop delivery details

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

## Project Planning Artifacts
- [task_plan.md](./task_plan.md)
- [findings.md](./findings.md)
- [progress.md](./progress.md)
- [SPEC.yaml](./SPEC.yaml)
- [triadev-handoff.json](./triadev-handoff.json)
- [arcade-baseline-matrix.md](./arcade-baseline-matrix.md)
