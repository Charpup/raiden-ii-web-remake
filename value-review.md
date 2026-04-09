# value-review.md

## 1) Decision Summary
- **Proposal:** Build and publicly deploy a mechanics-faithful arcade Raiden II browser remake with remade assets, using a static frontend stack and TriadDev Extended delivery.
- **Date:** 2026-04-09
- **Owner:** Codex
- **Verdict:** `GO`
- **Total Score (0-30):** 22
- **Confidence:** `Medium`

## 2) Problem Framing
### 2.1 One-line Decision Object
- **Problem / User / Outcome / Time Horizon:** There is no current public game experience on the target site; arcade-shooter players and site visitors need a polished, memorable browser game, and shipping a faithful Raiden II remake should create that outcome over the next implementation cycle.

### 2.2 Baseline and Opportunity Cost
- **Current baseline:** The workspace is empty aside from deployment handoff material; there is no game, no runtime, and no reusable product-grade codebase.
- **Opportunity cost of doing this now:** Time spent here is not spent on a smaller demo, a simpler casual game, or a less fidelity-sensitive project that could launch faster.

### 2.3 Constraints
- **Team/Capacity:** Single active implementation agent in a greenfield repository, with selective subagent support for research and review.
- **Technical constraints:** Static subpath deployment, browser performance budget, no backend dependency, deterministic gameplay needs, remade assets only.
- **Budget/compliance/deadline constraints:** Public release must avoid original copyrighted game assets; the project scope is large and must be tightly structured to remain viable.

## 3) First-Principles Check
### 3.1 Claim Classification
| Claim | Type (`Fact` / `Inference` / `Assumption`) | Evidence / Note |
|---|---|---|
| The hosting target supports a static browser game well | `Fact` | Handoff explicitly recommends static subpath deployment. |
| A faithful Raiden II remake needs deterministic timing and data-driven content | `Inference` | Supported by gameplay research and genre-specific engineering constraints. |
| Full-scope first release can be achieved incrementally with TriadDev gates | `Assumption` | Plausible, but depends on disciplined scope execution. |
| Remade assets are sufficient for public release safety | `Inference` | Strongly safer than using original assets, though visual similarity still needs care. |

### 3.2 Fundamental Questions
1. **Real problem vs proxy problem:** The real goal is to ship a distinctive, replayable public web game, not to merely prove that PixiJS or Vite can run a shooter.
2. **If we do nothing for 30/60/90 days:** The site continues without this game; no direct user harm occurs, but the opportunity to create a flagship interactive experience is lost.
3. **Simplest 80% value intervention:** A smaller single-player homage could deliver some value faster, but it would fail the requested full-fidelity remit.
4. **True required dependencies vs habitual dependencies:** Static hosting, deterministic simulation, tests, and replacement assets are required; a backend, live ops, and network multiplayer are not.
5. **Fast falsification metric:** If the runtime foundation cannot prove deterministic stepping, renderer decoupling, and input/audio sync under tests, the full remake path is not yet credible.

### 3.3 First-Principles Critique Layer
1. **Root value** (strip all assumptions — what remains?): A polished public browser game that feels like a classic arcade shooter and showcases the site.
2. **True beneficiary** (user / system / vanity metric?): Primary beneficiaries are end users and site visitors; secondarily the site brand benefits.
3. **Cost of inaction** (worst outcome in 90 days?): No flagship game launches; value is delayed rather than catastrophically lost.
4. **80% shortcut** (simpler intervention exists?): Yes, but it does not satisfy the explicit full-scope requirement, so it is a fallback rather than the chosen path.
5. **Key uncertainty** (what could invalidate this decision?): The content and asset workload may outpace the initial runtime delivery speed.

*Note any unclear answers here — each will cap the corresponding score dimension at 3/5.*

## 4) Value Scoring Rubric
| Criterion | Score (0-5) | Evidence | Notes |
|---|---:|---|---|
| User Impact | 4 | A polished browser Raiden-like game is a clear, visible user-facing outcome. | Strong if fidelity lands. |
| Strategic Fit | 5 | Directly aligns with the handoff's subpath static-game deployment model. | |
| Urgency | 2 | Delay is acceptable; this is valuable but not crisis-driven. | |
| Evidence Strength | 3 | Hosting and genre evidence are good, but full-scope delivery remains partially assumed. | Medium confidence. |
| Effort Efficiency | 3 | High effort, but justified by flagship impact if executed well. | Complexity is substantial. |
| Risk Controllability | 5 | Risks are manageable with TriadDev batching, TDD gates, data-driven rules, and replacement assets. | |
| **Total** | **22/30** |  |  |

*Scores capped at 3/5 are marked "First-principles unclear".*

## 5) Risk and Anti-Patterns
### 5.1 Top Risks and Mitigations
| Risk | Severity (L/M/H) | Mitigation | Residual Risk |
|---|---|---|---|
| Runtime fidelity slips because rules leak into rendering code | H | Enforce simulation/render boundary in SPEC and tests first | M |
| Content workload for 8 stages and bosses overwhelms implementation pace | H | Build data tooling and stage schema before authoring all content | M |
| Public-release asset similarity creates legal exposure | H | Use wholly remade assets and exclude original ROM/ported assets | M |
| 2P and cabinet variants create branching complexity | M | Encode variants as data profiles, not separate code paths | L |

### 5.2 Anti-Patterns Check
- [ ] Solution-first bias
- [ ] Metric theater
- [ ] Roadmap cargo-cult
- [x] Unpriced complexity
- [ ] Single-stakeholder capture
- [ ] Evidence laundering

If 2+ checked and unresolved, default to `REVISE` or `NO-GO`.

## 6) Go/No-Go Rationale
### 6.1 Top 3 Reasons for Verdict
1. The hosting environment and requested delivery model align cleanly with a static browser architecture.
2. The project has a clear user-visible payoff and a precise fidelity target.
3. The major risks are known and can be controlled through staged TriadDev + TDD/SDD execution.

### 6.2 Preconditions to Change Verdict
- **What must become true to upgrade/downgrade decision:** If runtime foundation tests fail to demonstrate deterministic timing and clean subsystem boundaries, the decision should downgrade to `REVISE` before deep content production continues.

## 7) Next Action (48h)
- **Immediate action:** Create the runtime foundation SPEC, write RED tests for Batch A, and implement the minimum runtime shell to satisfy them.
- **Owner:** Codex
- **Expected measurable signal:** Deterministic simulation, input mapping, renderer sync, and audio sync tests all pass in a fresh Vite/TypeScript project.
- **Re-evaluation date:** 2026-04-11

## 8) Hand-off
- If `GO`: Define scope boundaries, success metrics, and risk controls for TDD/SDD hand-off.
- Scope boundaries: arcade Raiden II only, static browser app only, no backend, no online multiplayer, remade assets only.
- Success metrics: tests green for each batch, stable 60fps desktop play, subpath-safe build output, deterministic runtime state transitions.
- Risk controls: fixed-step simulation, data-driven content, renderer isolation, long-running subagent windows, and strict spec-first development.
