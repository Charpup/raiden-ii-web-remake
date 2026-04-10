# Raiden II Private Prototype

This repo is no longer tracked as a public-release-ready remake. It has been reset onto a **private playable prototype** track focused on a **desktop-first Stage 1 vertical slice** for *Raiden II*.

## Current Direction
- Build a browser prototype that feels alive enough to actually play
- Prioritize desktop viewport fit, readable HUD, real render assets, and non-placeholder audio behavior
- Keep deterministic simulation ownership intact while upgrading the presentation layer around it
- Treat any future original/extracted asset pack as a **private local override**, not a committed repository asset set

## What Exists Now
- Deterministic simulation, authored stage data, co-op/cabinet/session flow, and browser shell wiring
- A tracked fallback prototype asset pack in `public/assets/`
- Viewport-fit logic for a fixed desktop gameplay shell
- Stage 1 movement + player projectile pass sufficient to make the slice start feeling interactive
- Private override asset/audio path conventions under `public/private-prototype/` for local-only experimentation

## What This Is Not
- Not a public-release-ready remake
- Not a final-art or final-audio build
- Not a legally cleared distribution package for original Raiden II assets

## Prototype Priorities
1. Make Stage 1 readable and playable on desktop without page scrolling
2. Replace dead placeholder blocks with real sprite/background rendering
3. Replace the old oscillator drone with a real cue-to-playback pipeline
4. Keep the asset abstraction flexible enough to later swap between private extracted assets and original replacement art

## Active Roadmap
The current roadmap is organized as four high-level sprints:

1. `combat-readability`
   Bring the opening 30-60 seconds of Stage 1 to a readable and survivable standard.
2. `private-asset-pack`
   Switch the Stage 1 core experience from fallback-first visuals/audio to a private prototype asset pack.
3. `boss-clear-slice`
   Complete the `1P Solo + Easy` Stage 1 flow from title to boss clear.
4. `prototype-hardening`
   Add browser-level acceptance coverage, desktop-fit validation, and demo-grade stability.

The current milestone is **not** “finish the remake.” It is **one convincing Stage 1 boss-clear prototype**.

## Useful Commands
```bash
npm install
npm run test:run
npm run coverage
npm run build
npm run preview -- --host 127.0.0.1 --port 4175
```

Local preview path:

```text
http://127.0.0.1:4175/games/raiden-ii/
```

## Working Files
- `task_plan.md`
- `findings.md`
- `progress.md`
- `SPEC.yaml`
- `triadev-handoff.json`
- `arcade-baseline-matrix.md`

## Historical Notes
The older public-release and host-deployment documents are still in the repo as historical output from the previous roadmap, but they are **superseded** by the private prototype reset until the project is intentionally reopened for a public-safe release track.
