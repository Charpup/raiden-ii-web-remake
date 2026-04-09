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
| 1 | Golden-slice target for current tranche | Provisional schema-backed slice in current tranche; exact arcade capture still to refine | Provisional single checkpoint in current tranche; exact arcade mapping pending | Provisional single hidden trigger in current tranche; exact arcade mapping pending | Provisional multi-phase boss in current tranche; exact arcade mapping pending | Must validate easy/hard tuning hooks without branching code |
| 2 | Pending authoring | TBD from arcade capture | TBD | TBD | TBD | Must remain data-driven |
| 3 | Pending authoring | TBD from arcade capture | TBD | TBD | TBD | Must remain data-driven |
| 4 | Pending authoring | TBD from arcade capture | TBD | TBD | TBD | Must remain data-driven |
| 5 | Pending authoring | TBD from arcade capture | TBD | TBD | TBD | Must remain data-driven |
| 6 | Pending authoring | TBD from arcade capture | TBD | TBD | TBD | Must remain data-driven |
| 7 | Pending authoring | TBD from arcade capture | TBD | TBD | TBD | Must remain data-driven |
| 8 | Pending authoring | TBD from arcade capture | TBD | TBD | TBD | Stage clear must feed loop rules |

## Current Golden Slice Requirements
- One schema-backed stage definition
- At least one wave trigger and spawn set
- At least one checkpoint update and respawn path
- At least one hidden trigger and reward path
- One boss encounter with multiple phases
- Cabinet-profile tuning applied through data
- Shared simulation state that works for 1P and 2P

## Capture Backlog
- Exact stage-by-stage wave ordering and scroll trigger points
- Exact checkpoint positions and respawn safety windows
- Exact hidden item placement and one-shot conditions
- Exact boss phase thresholds and attack sequencing
- Exact easy/hard cabinet deltas and loop escalation values
