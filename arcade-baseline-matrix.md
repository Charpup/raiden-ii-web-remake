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
| 4 | Macro-authored route implemented | Six authored macro beats now cover the forest advance, ring-defense circle, revealed fairy bush, first platform push, third-platform kamikaze rush, and twin-tower approach | A coarse kamikaze-rush checkpoint is authored for late-route recovery; exact arcade placement still needs capture refinement | The fairy route is now expressed as `ring targets cleared -> bush reveal -> fairy reward`, with an additional late tower power-up route in data | Thunder Fortress now carries named barricade, tower-battery, and core-storm phases; exact timings still need capture refinement | Chained wave-trigger authoring stays generic and data-driven |
| 5 | Pending authoring | TBD from arcade capture | TBD | TBD | TBD | Must remain data-driven |
| 6 | Pending authoring | TBD from arcade capture | TBD | TBD | TBD | Must remain data-driven |
| 7 | Pending authoring | TBD from arcade capture | TBD | TBD | TBD | Must remain data-driven |
| 8 | Loop-validation slice implemented | One provisional wave implemented for loop testing; full arcade capture pending | TBD | TBD | One provisional boss implemented for loop testing | Stage clear already advances loop index through data |

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
- `stage-8` currently proves loop-advance behavior after a final-stage boss clear.
- `stage-8` remains a calibration scaffold for loop validation, while `stage-1` is the first macro-authored content slice.

## Capture Backlog
- Exact stage-by-stage wave ordering and scroll trigger points
- Exact checkpoint positions and respawn safety windows
- Exact hidden item placement and one-shot conditions
- Exact boss phase thresholds and attack sequencing
- Exact easy/hard cabinet deltas and loop escalation values
