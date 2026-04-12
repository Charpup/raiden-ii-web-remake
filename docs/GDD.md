# Raiden II Stage 1 Playable Prototype GDD

## 1. Vision & Prototype Bar
- Build a desktop-first `1P Solo + Easy` Stage 1 vertical slice that a player can understand, survive, and clear through the Stage 1 boss.
- Treat the current Sprint 2 build as a functional baseline, not a quality-complete demo.
- Do not expand to Stage 2-8 polish until Stage 1 has a convincing boss-clear loop.

## 2. Player Experience Goals
- Within 30 seconds, the player should understand movement, firing, dodging, pickups, and the basic HUD.
- Within roughly 3 minutes, a normal easy-path player should reach the Stage 1 boss.
- A boss clear should produce an unmistakable completion moment before any next-stage or loop behavior.

## 3. Controls & Onboarding
- Primary controls are `Arrow Keys` to move, `Z` to fire, `X` to bomb, and `Right Shift` for focused movement.
- The title/select flow must show these bindings before gameplay starts.
- Gameplay should include a compact reminder or help/pause affordance so players do not have to guess how to attack.

## 4. Stage 1 Structure
- Rebuild the current short route into five readable segments: opening tutorial pressure, mid-route side pressure, recovery/cache section, pre-boss escalation, and boss intro.
- The current one-or-two-wave-to-boss pacing is too short for the target vertical slice.
- Checkpoints and recovery items should support learning without removing arcade tension.

## 5. Combat Readability
- Player bullets, enemy bullets, pickups, explosions, and hit feedback must remain visually separable under motion.
- Enemy bullets should be readable before they are lethal; early threats should teach lanes and dodge timing.
- HUD priority is score, lives, bombs, current weapon, stage progress, and boss health only when a boss is active.

## 6. Enemy & Wave Design
- Opening waves teach shooting and movement with low-density threats.
- Mid-route waves introduce side entries, ground turrets, and item carriers without overwhelming the playfield.
- Pre-boss waves should raise pressure and reward active shooting, not simply stall before the boss.
- Enemy waves must be long enough to feel like a stage route, but still compact enough for the Stage 1 vertical slice.

## 7. Boss Design
- Death Walkers must have multiple clearly different phases with deterministic but varied attack patterns.
- Patterns should include aimed fire, lateral pressure, spread variation, and short reposition windows.
- Avoid a single permanent safe spot; if a safe pocket exists, it should be temporary and pattern-dependent.
- Any apparent randomness should be seeded or deterministic so tests and replays remain reproducible.

## 8. Powerups & Recovery
- Weapon, bomb, medal, fairy, and hidden-cache rewards should appear at intentional learning/recovery points.
- The first weapon pickup should be easy to notice and collect.
- Hidden rewards should be optional bonuses, not required route progression.

## 9. Art Direction
- Sprint 2 replacement assets are acceptable as a pipeline proof, but not final quality.
- Sprint 3 should improve cohesion by normalizing sprite scale, crop, anchors, color temperature, and background tiling.
- Stage 1 should read as one coherent arcade-shooter environment rather than mixed low-resolution sources.

## 10. Audio Direction
- Stage BGM should loop cleanly without sounding like a stuck debug tone.
- Fire SFX must be audible but not fatiguing under sustained fire.
- Enemy destruction, player hit, respawn, pickup, and bomb cues should have clear priorities and avoid masking the BGM.

## 11. Difficulty & Tuning
- `1P Solo + Easy` is the tuning baseline for the playable vertical slice.
- Hard cabinet and 2P should remain regression-preserved but should not drive Sprint 3 tuning decisions.
- Boss and wave tuning should prioritize readable challenge over raw density.

## 12. Acceptance & Playtest Checklist
- Player can start from title, choose `1P Solo + Easy`, understand controls, and enter Stage 1 without confusion.
- Stage 1 lasts long enough to feel like a small mission and reaches the boss without a dead or empty stretch.
- Boss patterns can hit a player who parks in one location, while still being dodgeable through active play.
- Replacement art/audio are present, but known art-quality limitations are tracked as non-blocking unless they obscure gameplay.
- Automated checks remain green, and manual preview feedback is recorded before Sprint 3 is called complete.
