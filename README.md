# Raiden II Web Remake

A public browser remake project targeting the arcade version of **Raiden II**.

## Current Status
- Runtime foundation implemented and verified
- Combat core implemented and verified
- Next tranche: simulation/content seam, stage runner contracts, and Stage 1 golden slice

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
