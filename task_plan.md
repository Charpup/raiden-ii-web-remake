# Task Plan: Raiden II Web Arcade Remake

## Goal
Build a public, static-deployable, high-fidelity browser remake of the arcade version of Raiden II using Vite, TypeScript, PixiJS, a deterministic fixed-step simulation, and a TriadDev Extended workflow with TDD/SDD gates.

## Current Phase
Phase 6

## Phases

### Phase 1: Requirements & Discovery
- [x] Read deployment handoff and extract hosting constraints
- [x] Research arcade Raiden II gameplay scope and version boundaries
- [x] Survey reusable open-source references and license risks
- [x] Lock implementation route and stack decisions
- **Status:** complete

### Phase 2: Planning & Structure
- [x] Create TriadDev working files and orchestration handoff
- [x] Extract execution batches and dependencies
- [x] Write value-review.md for full-scope public release
- [x] Author initial SPEC.yaml for runtime foundation batch
- **Status:** complete

### Phase 3: Runtime Foundation
- [x] Initialize Vite + TypeScript + Vitest + PixiJS project scaffold
- [x] Implement fixed-step clock and simulation shell
- [x] Implement keyboard/gamepad input mapping for 1P/2P
- [x] Implement renderer sync boundary without game-rule ownership
- [x] Implement audio director timing shell
- **Status:** complete

### Phase 4: Combat Core
- [x] Implement player movement and hitbox model
- [x] Implement main weapon progression and downgrade rules
- [x] Implement sub-weapon progression and bomb system
- [x] Implement damage, respawn, invulnerability, and score rules
- [x] Verify deterministic combat tests
- **Status:** complete

### Phase 5: Stage Authoring & Content
- [x] Implement stage, wave, boss phase, checkpoint, and hidden trigger data systems
- [x] Author Stage 1-8 content baselines and loop entry
- [x] Implement cabinet presets and 2P lifecycle rules
- [x] Integrate browser runtime shell, UI flow, and placeholder replacement asset/audio manifests
- **Status:** complete

### Phase 6: Verification & Delivery
- [x] Run unit, integration, build, and performance checks
- [x] Validate static subpath deployment assumptions
- [x] Run a real-browser smoke pass against the production base path
- [x] Write host deployment and operator smoke handoff documents
- [x] Update progress and final delivery artifacts
- **Status:** complete

## Key Questions
1. How do we preserve arcade timing fidelity while staying within a pure static browser deployment?
2. Which rules must live in deterministic simulation state versus data-driven content definitions?
3. What is the minimum runtime slice that proves the architecture before the full content load lands?

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Use TriadDev Extended workflow | The project is large, multi-phase, and requires explicit spec/test gates. |
| Target arcade Raiden II only | Keeps fidelity target stable and avoids DX/console scope creep. |
| Use Vite + TypeScript + PixiJS | Matches the chosen plan and supports a static, modern browser build. |
| Greenfield the runtime core | Existing repos are too partial, old, or license-risky to be the product base. |
| Treat open-source repos as references only | Preserves control over deterministic rules and public release safety. |
| Keep combat rules pure and configurable | Supports later tuning toward arcade fidelity without coupling rules to rendering. |
| Bootstrap GitHub early and keep `main` stable | Preserves reviewable history and keeps each implementation tranche PR-ready. |
| Use Stage 1 and Stage 8 as calibration slices | Proves stage, boss, checkpoint, hidden, cabinet, co-op, and loop seams before full content entry. |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| Existing workspace is not a git repository | 1 | Initialized git, created the public GitHub repo, and switched future work to branch/PR flow. |
| Several early subagents disconnected during research | 1 | Re-ran narrower tasks with longer 3-5 minute waits and recovered usable results. |
| `npm run build` surfaced strict test typing issues | 1 | Split frame-input types and tightened null-safe combat expectations. |
| A partial patch injected staged test content into `combatCore.test.ts` | 1 | Restored the file, moved the integration suite into its own test file, and re-ran RED before implementation. |

## Notes
- Keep all arcade-specific behavior expressible through data/config where possible.
- Do not bind gameplay rules to renderer objects.
- Public release must use remade assets only.
- Stage 1-8 authored content, loop carryover, co-op lifecycle, cabinet rules, and the browser shell are complete.
- `codex/release-verification` completed the final release blockers, deployment validation, and host handoff package.
- Deployment target stays fixed at `/games/raiden-ii/` under the host's static root.
- The repository now includes project-specific deployment and smoke documents for the host agent:
  - `HOST_DEPLOYMENT_HANDOFF.md`
  - `OPERATOR_SMOKE_CHECKLIST.md`
