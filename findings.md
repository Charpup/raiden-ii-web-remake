# Findings & Decisions

> Historical note: the opening public-release framing below belongs to the earlier remake roadmap. The active project direction is now a **private, desktop-first Stage 1 playable prototype**. Keep the research, but do not treat the old hosting/release assumptions as the current milestone target.

## Active Direction
- Build one convincing `1P Solo + Easy` Stage 1 boss-clear vertical slice before expanding scope again.
- Use a private Stage 1 asset pack first so the prototype gains real visual/audio life.
- Keep deterministic simulation ownership intact while presentation, shell, and encounter readability improve around it.

## Requirements
- Recreate the arcade version of Raiden II as a browser game for public website hosting.
- Publish as a static subpath application under the existing site constraints from the handoff doc.
- Preserve the arcade scope: 8 stages, loop behavior, local 1P/2P, weapon and sub-weapon systems, bombs, hidden items, checkpoint respawn, and easy/hard cabinet variants.
- Use a TriadDev Extended workflow with explicit spec and TDD evidence.
- Use remade art/audio assets rather than original game assets for public release safety.

## Research Findings
- The hosting target is best served by a static subpath deployment with hash-based assets and rollback-friendly output.
- Arcade Raiden II is not a small demo-sized game; the core experience includes around 8 stages, repeated loops, multiple weapon routes, bombs, hidden items, checkpoint respawns, and 1P/2P differences.
- High-fidelity recreation depends more on deterministic timing, hitbox rules, wave cadence, and boss phases than on any particular rendering library.
- No publicly obvious web project appears safe and complete enough to serve as a direct Raiden II production base.
- `ThunderAttack` is a useful web homage reference but too small to act as the final architecture.
- `stg-game-engine` offers useful ideas for stage scripting, but its license boundary is mixed and the project is too old to inherit wholesale.
- `bullethell` is a cleaner MIT reference for browser STG basics but leans toward bullet-hell patterns rather than Raiden II structure.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Use a fixed-step simulation at 60 Hz | Needed for deterministic gameplay, replayable logic, and faithful arcade feel. |
| Keep simulation, render, audio, and content-data separate | Prevents the renderer from owning gameplay state and keeps tests headless. |
| Use Vitest for TDD in TypeScript | Works naturally with Vite and the chosen stack. |
| Use data-driven stage and rules definitions | Avoids hard-coded stage logic and keeps cabinet/loop variants configurable. |
| Default long waits for key subagents | The workspace showed instability with 30-second waits; 3-5 minutes is safer. |
| Use pure combat systems with configurable rules | Lets arcade tuning evolve without coupling rules to renderer or stage code. |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| Initial subagent research runs disconnected before completion | Retried with narrower prompts and longer wait windows; then closed completed agents promptly. |
| No existing codebase or git metadata in the workspace | Treat the repo as fully greenfield and build all structure from scratch. |
| Strict TypeScript build surfaced test-only type gaps | Fixed by distinguishing captured inputs from simulation inputs and using null-safe expectations. |

## Resources
- Handoff: `D:\CodexWorkspace\web_mini-game\galatealearningfor.fun-game-handoff-2026-04-09.md`
- Shmups Wiki: https://shmups.wiki/library/Raiden_II
- GameFAQs FAQ: https://gamefaqs.gamespot.com/arcade/564388-raiden-ii/faqs/274
- SHMUPS! review: https://www.shmups.com/reviews/raiden2pc/index.html
- ThunderAttack: https://github.com/crescent3983/ThunderAttack
- stg-game-engine: https://github.com/christopheroussy/stg-game-engine
- bullethell: https://github.com/selenebun/bullethell

## Visual/Browser Findings
- The hosting handoff strongly favors a self-contained static build under a subpath and explicitly warns against high-frequency polling or heavy runtime overhead.
- The arcade experience depends on consistent scroll pacing, weapon cadence, hidden trigger timing, and boss pressure rather than modern bullet density.
- The safest public-release interpretation is "mechanics-faithful remake with original replacement assets."
- The runtime foundation batch now passes deterministic timing, input mapping, renderer isolation, audio sync, coverage, and build checks.
- The combat core batch now passes movement, weapon progression, bomb, damage/respawn, scoring, coverage, and build checks.
