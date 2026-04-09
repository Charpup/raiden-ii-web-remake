# Arcade Baseline Matrix

This is the working baseline artifact for content authoring. It separates:
- what is already locked as an arcade target
- what still needs stage-by-stage capture before final content authoring
- what the current development slice implements

## Global Rules
| Area | Target |
|------|--------|
| Version target | Arcade `Raiden II` only |
| Release scope | 8 stages, loop support, 1P/2P local co-op, cabinet presets, hidden/checkpoint systems |
| Deployment | Static subpath web app |
| Asset policy | Replacement/remade assets only |

## Stage Matrix
| Stage | Current Dev Status | Wave Data | Checkpoints | Hidden Items | Boss Phases | Loop/Cabinet Notes |
|------|---------------------|-----------|-------------|--------------|-------------|--------------------|
| 1 | Macro golden slice implemented | Eight authored macro beats now cover opening farms, first cache, swamp pressure, crater, fairy tree, and pre-boss cache route; exact per-wave arcade scroll values still subject to capture refinement | Crater-exit checkpoint implemented and verified as the late-stage recovery checkpoint | Fairy tree hidden route, checkpoint recovery drops, and pre-boss cache reward are implemented; easy/hard cache reward split now lives in data | Death Walkers encounter now carries named phases, pattern labels, and dual walker parts; exact attack timings still subject to capture refinement | Easy/hard reward split and health tuning flow through data without code forks |
| 2 | Macro-authored route implemented | Six authored macro beats now cover suburb approach, canal gunboats, amphibious heavy-tank setpiece, base entrance, return-to-town pressure, and the hard-only late-car beat; exact arcade scroll values remain subject to capture refinement | A coarse late-route checkpoint now anchors the base-return segment; exact arcade placement still needs video capture | No dedicated hidden item route is locked yet; the hard-only late bonus car is authored as a cabinet-gated special target rather than hard-coded logic | Albatross now carries a named opening, Hornet-missile, and desperation ladder; exact attack timing still needs capture refinement | Hard-only late-car appearance and health tuning remain data-driven |
| 3 | Macro-authored route implemented | Six authored macro beats now cover the superstructure break, crusher-tank route, open-water gunboats, oil-platform crossfire, dual-platform route, and war-barge approach | A coarse war-barge checkpoint is authored for late-route recovery; exact arcade placement still needs capture refinement | Silver-crate 1UP crush route, gunboat power-up route, and right-platform Miclus route are now authored through data-driven hidden triggers | Battle Axe now carries named pop-up battery, broadside pressure, and exposed-core phases; exact timings still need capture refinement | Source-aware hidden trigger support stays generic and data-driven |
| 4 | Macro-authored route implemented | Five mainline macro beats now cover the forest advance, ring-defense circle, first platform push, third-platform kamikaze rush, and twin-tower approach; the fairy bush reveal now lives outside the ordered wave list | A coarse kamikaze-rush checkpoint is authored for late-route recovery; exact arcade placement still needs capture refinement | The fairy route is now expressed as `ring targets cleared -> non-blocking bush reveal -> fairy reward`, with an additional late tower power-up route in data | Thunder Fortress now carries named barricade, tower-battery, and core-storm phases; exact timings still need capture refinement | Optional hidden reveals no longer block Stage 4 mainline progression |
| 5 | Macro-authored route implemented | Six authored macro beats now cover the ground-base advance, rail-tank gauntlet, bomber corridor, refinery crossfire, late armor surge, and pre-boss cache stretch | A coarse refinery-exit checkpoint now anchors the late-route recovery window; exact arcade placement still needs capture refinement | A safe placeholder hidden-cache medal route is authored as a one-shot reward, while any Stage 5-exclusive hidden route remains capture backlog | Black Bird now carries a named three-form ladder covering opening, blue form, and red form; exact attack timing still needs capture refinement | No stage-specific code forks; Stage 5-exclusive hidden routes remain provisional until captured |
| 6 | Macro-authored route implemented | Six authored macro beats now cover the launch scramble, crystal corridor, asteroid ambush, defense array, red crystal escape, and reactor approach | A coarse defense-exit checkpoint now anchors the late route before the crystal-escape stretch; exact arcade placement still needs capture refinement | The red crystal 1UP route is now authored through an explicit `escape-window` state tag rather than hard-coded runtime logic | Graphite now carries named prism-opening, rotary-lattice, and core-rush phases; exact attack timing and public naming still need capture refinement | Enemy state-transition support stays generic and data-driven |
| 7 | Macro-authored route implemented | Five authored macro beats now cover the battleship deck, meteor scramble, nuclear rocket battery, artillery corridor, and launch apron | A coarse artillery-corridor checkpoint now anchors the late route; exact arcade placement still needs capture refinement | The rocket-cache fairy route is authored as an optional hidden reveal that no longer blocks boss progression and now expires once the boss starts | Huge Satellite now carries named dish-array, orbital-burst, and core-collapse phases; exact part cadence and alias naming still need capture refinement | Optional hidden reveals are locked to the data layer and remain non-blocking for the mainline |
| 8 | Final-stage route implemented | Five authored macro beats now cover the alien surface, roaming crystal chase, facility crossfire, pre-boss Miclus line, and Mother Haven approach | A coarse facility-exit checkpoint now anchors the final-stage late route; exact arcade placement still needs capture refinement | The stable pre-boss Miclus + medals line is now authored as a single multi-reward hidden trigger and expires cleanly when Mother Haven starts; the mid-stage floating-crystal 1UP remains provisional | Mother Haven now carries named shell, siege, and core phases as the authored final boss | Stage 8 now replaces the old scaffold and still advances loop index back to Stage 1 through data |

## Current Golden Slice Requirements
- One schema-backed stage definition
- At least one wave trigger and spawn set
- At least one checkpoint update and respawn path
- At least one hidden trigger and reward path
- One boss encounter with multiple phases
- Cabinet-profile tuning applied through data
- Shared simulation state that works for 1P and 2P

## Implemented Calibration Slice
- `stage-1` now proves macro-route authoring, staggered wave spawning, crater-exit checkpoint recovery, fairy checkpoint drops, cabinet-gated hidden rewards, and a dual-part Death Walkers finale.
- `stage-8` no longer exists only as a loop scaffold; it is now a macro-authored final-stage slice that also proves data-driven loop carryover after Mother Haven.
- The current calibration focus shifts from "can Stage 8 loop?" to "can full authored content stay on the same generic stage seam?"

## Capture Backlog
- Exact stage-by-stage wave ordering and scroll trigger points
- Exact checkpoint positions and respawn safety windows
- Exact hidden item placement and one-shot conditions
- Exact boss phase thresholds and attack sequencing
- Exact easy/hard cabinet deltas and loop escalation values
- Stage 5-exclusive hidden route confirmation
- Stage 6 red-crystal escape timing and boss public-name alias capture
- Stage 7 boss part cadence and add-spawn behavior
- Stage 8 floating-crystal 1UP validity and pre-boss Miclus exact trigger shape
