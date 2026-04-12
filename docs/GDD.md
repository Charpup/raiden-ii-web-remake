# Raiden II Stage 1 Playable Prototype GDD

## 1. Vision & Prototype Bar
- Build a desktop-first `1P Solo + Easy` Stage 1 vertical slice that a player can start, understand, survive, and clear through the Stage 1 boss.
- Treat the Sprint 2 replacement-asset build as a functional baseline, not a quality-complete demo.
- Sprint 3 succeeds only when Stage 1 feels like a small playable arcade mission rather than a systems test.
- Do not expand to Stage 2-8 polish, public-release packaging, or 2P showcase tuning until this boss-clear loop is convincing.

## 2. Player Experience Goals
- Within 30 seconds, the player understands movement, firing, dodging, pickups, and the core HUD without reading external notes.
- Within roughly 2-3 minutes on easy, a normal active player reaches the Stage 1 boss.
- The route should alternate threat and recovery so the player has reasons to shoot, move, collect, and reset position.
- Boss clear must produce an unmistakable completion moment before any next-stage, loop, or replay behavior.

## 3. Controls & Onboarding
- Primary 1P controls are `Arrow Keys` to move, `Z` to fire, `X` to bomb, and `Right Shift` for focused movement.
- Title/select screens must show the controls before mission start; gameplay HUD must keep a compact reminder visible or accessible.
- The first 10-15 seconds should teach shooting through low-threat targets that visibly react to sustained `Z` fire.
- The first bomb prompt should be informational only; do not require bomb use to survive Sprint 3 easy-path acceptance.
- 2P controls remain regression-supported but are not the Sprint 3 onboarding focus.

## 4. Stage 1 Structure
- Rebuild Stage 1 into five readable route segments: opening tutorial pressure, mid-route side pressure, recovery/cache, pre-boss escalation, and boss intro.
- Opening tutorial pressure teaches shooting and lateral movement with low-density scouts and slow enemy fire.
- Mid-route side pressure introduces side entries, ground/turret threats, and lane discipline without flooding the playfield.
- Recovery/cache gives a clear weapon or score reward, a checkpoint-safe breath, and one optional hidden route.
- Pre-boss escalation raises enemy density and bullet pressure for a short burst before the boss warning.
- Boss intro clears the route, signals the encounter, and gives the player a stable moment to read the Death Walkers.

## 5. Combat Readability
- Player bullets, enemy bullets, pickups, hit flashes, explosions, and boss parts must remain visually separable under motion.
- Enemy bullets should be readable before they are lethal; early patterns teach lanes and dodge timing before boss patterns test them.
- Player hit feedback should briefly show what happened before continue/respawn flow takes over.
- Pickup presentation should favor visibility and persistence over arcade-perfect subtlety during this prototype phase.
- HUD priority is score, lives, bombs, current weapon, stage/loop, and boss health only while a boss is active.

## 6. Enemy & Wave Design
- Opening waves use scouts and simple ground targets to make `Z` fire immediately useful.
- Mid-route waves add side-entry warplanes and turrets to push the player out of a single vertical lane.
- Item carriers should reward active shooting and should appear before pressure spikes, not after the player is already overwhelmed.
- Pre-boss waves should create a short escalation, then stop cleanly so the boss intro does not feel like an accidental spawn.
- Wave timing should be authored data first; avoid hardcoding `stage-1` special cases in simulation logic.

## 7. Boss Design
- Death Walkers must have multiple readable phases with deterministic but varied attack patterns.
- Required pattern ingredients are aimed fire, lateral pressure, spread variation, and short reposition or recovery windows.
- The current permanent safe spot is not acceptable for Sprint 3; parking in one location must eventually be challenged.
- Any apparent randomness must use seeded or deterministic variation so tests, replay, and debugging remain reproducible.
- The boss should be dodgeable through active movement on easy, not through memorizing a single pixel-safe location.

## 8. Powerups & Recovery
- Weapon, bomb, medal, fairy, and hidden-cache rewards should appear at intentional teaching or recovery points.
- The first weapon pickup should be easy to notice and collect during normal play.
- Hidden rewards remain optional bonuses; they must not gate main route progression or boss entry.
- Checkpoint placement should restart the player near a readable segment boundary, not inside a staggered wave trap.
- Easy-path recovery should preserve tension while avoiding a death spiral after one mistake.

## 9. Art Direction
- Sprint 2 replacement assets are accepted as a pipeline proof but not as final visual quality.
- Sprint 3 should improve cohesion through normalized sprite scale, crop, anchor, color temperature, bullet contrast, and background tiling.
- Stage 1 should read as one coherent arcade-shooter environment rather than mixed low-resolution source scraps.
- Art-cohesion work should prefer adapter/catalog tuning and small derived replacements over a broad asset hunt.
- Do not block Sprint 3 on final art polish unless an asset directly obscures gameplay readability.

## 10. Audio Direction
- Stage BGM should loop cleanly and sit below repeated fire SFX without sounding like a stuck debug tone.
- Sustained player fire must be audible but not fatiguing; enemy destruction and pickup cues should cut through briefly.
- Player hit, respawn, bomb, and boss phase cues should have higher priority than routine enemy fire.
- Sprint 3 may adjust volume, cue gating, and event-edge playback, but it should not turn into a full sound redesign.

## 11. Difficulty & Tuning
- `1P Solo + Easy` is the tuning baseline for Sprint 3.
- The active-pilot opening survival contract remains a regression, but Sprint 3 adds human-play boss-clear quality as the bar.
- Hard cabinet and 2P must stay functional at smoke/regression level, but they do not drive encounter tuning.
- Difficulty should come from readable pressure, positional decisions, and boss pattern variation rather than raw bullet density.

## 12. Sprint 3 Implementation Plan
- `controls-onboarding-pass`: add title/select/gameplay control education for movement, fire, bomb, and focus.
- `art-cohesion-pass`: normalize replacement sprite scale, anchors, bullet contrast, pickup visibility, and background stitching.
- `stage1-route-expansion-pass`: expand Stage 1 into the five route segments and target a 2-3 minute easy-path boss arrival.
- `boss-pattern-pass`: replace the current predictable boss cadence with deterministic aimed and lateral pattern variation.
- `boss-clear-flow-pass`: make boss intro, phase transitions, boss defeat, and Stage 1 clear feedback feel intentional.
- `sprint3-browser-acceptance`: add preview/manual evidence for `title -> 1P Easy -> Stage 1 boss clear`.

## 13. Acceptance & Playtest Checklist
- Player can start from title, choose `1P Solo + Easy`, understand controls, and enter Stage 1 without confusion.
- Stage 1 lasts long enough to feel like a compact mission and reaches boss without dead air or accidental early boss entry.
- Boss patterns challenge a parked player while remaining dodgeable through active movement.
- Checkpoint, hidden route, pickup, boss phase, and clear flow are understandable in browser preview.
- Automated checks stay green: `npm run test:run`, coverage >= 80%, `npm run build`, and `npm run validate:replacement-assets`.
- Sprint 3 is not complete until manual preview feedback is recorded with blockers separated from non-blocking polish issues.
