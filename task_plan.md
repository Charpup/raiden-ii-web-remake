# Task Plan: Raiden II Stage 1 Playable Prototype Program

## Goal
Turn the current rules/runtime foundation into a **desktop-first, privately playable Stage 1 vertical slice** that a player can start, understand, play, and clear to the Stage 1 boss ending.

## North Star
- Ship a **1P Solo + Easy** browser prototype that feels alive, readable, and intentionally arcade-like.
- Use a **repo-tracked Stage 1 replacement asset set first** so the prototype stops reading like fallback blocks plus synthetic placeholder audio.
- Expand scope only after one convincing Stage 1 boss-clear loop exists.

## Current Baseline
- Deterministic simulation, authored stage data, and browser shell already exist.
- Stage 1 now has movement, player shots, enemy motion, enemy fire, damage, continue flow, texture-backed presentation, and cue-driven audio plumbing.
- The repo is **not** being treated as public-release-ready; prior deployment/release artifacts are historical only.

## Program Structure

### Sprint 0: Baseline Already Built
- [x] Reframe the project from public-release completion to a private prototype track.
- [x] Establish a fixed desktop gameplay shell and structured asset manifest.
- [x] Bring Stage 1 from dead placeholder blocks to a minimally alive runtime loop.
- **Status:** complete

### Sprint 1: Stage 1 Combat Readability
- [x] Make the opening 30-60 seconds readable and survivable instead of merely dangerous.
- [x] Tune spawn safety, early-wave pacing, enemy fire cadence, and contact pressure.
- [x] Strengthen hit feedback, explosion readability, pickup visibility, and basic camera/presentation clarity.
- [x] Add one browser-level acceptance path for `title -> 1P easy -> live Stage 1 gameplay` without dead shell behavior.
- **Exit bar:** a human can enter Stage 1 and survive the opening without the slice feeling broken or unfair.
- **Status:** complete

### Sprint 2: Replacement Asset Integration
- [x] Make the Stage 1 core bundle replacement-first instead of fallback-first.
- [x] Wire repo-tracked replacement assets for player, common enemies, bullets, pickups, explosions, background, boss, BGM, and essential SFX.
- [x] Add fail-fast validation so missing mandatory replacement assets surface explicit errors.
- [x] Keep the abstraction boundary intact so a future public-safe asset swap remains possible.
- **Exit bar:** the slice no longer reads as placeholder blocks plus synthetic drone audio.
- **Status:** complete
- **Acceptance note:** accepted as `pass with non-blocking quality issues`: art precision remains low, control onboarding is missing, the Stage 1 route is too short, and the current boss pattern has a safe spot.

### Sprint 3: Stage 1 Boss-Clear Vertical Slice
- [ ] Complete the full `1P Solo + Easy` Stage 1 flow from title to boss clear.
- [ ] Tighten checkpoint, hidden route, boss entrance, boss phase readability, and clear flow.
- [ ] Make the HUD and overlays support the mission coherently during real play instead of only in tests.
- [ ] Validate a believable start-to-boss-clear browser playthrough.
- **Exit bar:** Stage 1 can be played start-to-boss-clear in browser preview as a convincing prototype.
- **Status:** pending

### Sprint 4: Prototype Demo Hardening
- [ ] Add browser acceptance coverage for the real Stage 1 vertical slice.
- [ ] Verify `1920x1080` and `1366x768` desktop shells remain above the fold with no page scroll.
- [ ] Run internal playtest loops and tighten the shell against dead states, stuck overlays, and presentation regressions.
- [ ] Keep 2P and hard cabinet alive at regression level without letting them expand milestone scope.
- **Exit bar:** the team can hand the build to an internal tester and expect a usable Stage 1 demo, not a broken tech shell.
- **Status:** pending

## Immediate Next Steps
1. Open the Sprint 2 PR from `codex/replacement-asset-pack` with the manual acceptance note and automated gate results.
2. Review and refine `docs/GDD.md` before implementation work resumes.
3. Use the GDD to split Sprint 3 into `controls-onboarding-pass`, `stage1-route-expansion-pass`, `boss-pattern-pass`, and `art-cohesion-pass`.
4. Start Sprint 3 implementation only after the GDD direction is locked.

## Scope Rules
| Scope | Decision |
|-------|----------|
| Primary milestone path | `1P Solo + Easy` |
| Platform priority | Desktop browser first |
| Asset strategy | Repo-tracked Stage 1 replacement assets first |
| In scope now | Stage 1 from title to boss clear |
| Secondary compatibility scope | 2P and hard cabinet remain regression-preserved |
| Out of scope now | Full campaign polish, public-safe packaging, host deployment readiness |

## Risks To Track
1. Replacement-asset integration may become the real bottleneck if the manifest stays fallback-first too long or the committed Stage 1 art/audio set drifts out of sync with the manifest.
2. Current replacement assets prove the pipeline but still need an art-cohesion pass before the slice feels polished.
3. The current Stage 1 opening is now signed off in preview, but later Stage 1 beats still need browser-level validation before boss-clear claims are credible.
4. Browser smoke is now a first-class acceptance signal and must keep pace with the deterministic suite as Sprint 3 widens the slice.

## Decisions Locked
| Decision | Rationale |
|----------|-----------|
| Stage 1 boss clear before anything larger | A believable vertical slice is more valuable than a broad but dead remake shell. |
| Replacement asset pack first | The prototype must look and sound alive before more system scope is added. |
| Simulation remains authoritative | Product quality should rise by improving presentation and tuning, not by moving rules into the renderer or browser shell. |
