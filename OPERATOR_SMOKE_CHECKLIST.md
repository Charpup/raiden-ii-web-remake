# Operator Smoke Checklist

Run this after deploying the build to `https://galatealearningfor.fun/games/raiden-ii/`.

## Entry And Asset Checks
- Open `https://galatealearningfor.fun/games/raiden-ii/`
- Confirm the page returns `200`
- Confirm there are no missing CSS/JS/image requests
- Confirm `favicon.svg` loads successfully

## Start Flow
- From title, click `Start Mission`
- Select `1P Solo Sortie`
- Select `Easy Cabinet`
- Confirm gameplay begins and the HUD is visible

## Input Checks
- 1P keyboard:
  - move: `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`
  - fire: `Z`
  - bomb: `X`
  - focus: `Right Shift`
- 2P keyboard:
  - move: `W`, `A`, `S`, `D`
  - fire: `.`
  - bomb: `,`
  - focus: `/`
- Gamepad:
  - stick axes 0/1 move the assigned player
  - button 0 fires
  - button 1 bombs
  - button 4 focuses

## Co-op Checks
- Return to title
- Start a `2P Co-op Sortie`
- Select `Hard Cabinet`
- Confirm both player HUD panels are populated
- During gameplay, confirm player 2 can rejoin from the `Rejoin 2P` action

## Flow Checks
- Trigger or force a continue state and confirm:
  - continue overlay appears
  - countdown changes
  - accepting continue returns the player to gameplay
- Trigger a session game over and confirm:
  - game-over overlay appears
  - `Back To Title` returns to title cleanly
- Complete the final-stage route or use a prepared debug/review path and confirm:
  - ending overlay appears
  - loop transition appears
  - gameplay resumes on Stage 1 of the next loop

## Stability Checks
- Leave the tab running through gameplay for 10 minutes
- Switch the tab to background and return
- Confirm:
  - no stuck input
  - no runaway simulation jump
  - no permanently stuck overlay
  - audio can still resume after returning

## HUD Checks
- Confirm stage label updates
- Confirm loop label updates after final clear
- Confirm boss meter appears during boss encounters
- Confirm player score, lives, bombs, and weapon labels update during play

## Pass Criteria
- No asset 404s
- No blank screen
- No stuck title/game-over/ending/loop overlay
- 1P and 2P both enter gameplay successfully
- Continue/game-over/ending/loop flows all behave as expected
