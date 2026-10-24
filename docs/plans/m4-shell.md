# Milestone 4 "Room shell and state": implementation plan (approved 2026-10-24)

## Context

Milestones 1–3 are on `main` (7475d52): tokens, guardrails, and the full component set. Milestone 4 is where the prototype starts to become the room. It adds:
- the mock meeting state every screen reads from
- a page address for each canvas artboard
- the room shell that the desktop and mobile flows (milestones 5–6) are assembled from

The live canvas is unchanged (version 1792788314-4b91).

**From `PLAN.md` › Milestone 4, the exit criteria are:**
- stories at 1, 14 and 30 participants and with long names
- no hard-coded counts
- the F1, G1–G5 and L1 routes render from the store

**Run this like milestone 3, to save credit:** I write the plan here without a separate planning agent, two Fable batches build in sequence on one branch, there's one reviewer pass, one fix round, then screenshots for you.

## Setup
- Branch `m4-shell` from `main`.
- Save this plan as `docs/plans/m4-shell.md`. Commit and push.

## Batch A: state, fixtures and routing (one Fable agent)

### Room-state store (`src/mocks/`)
- **No new state library:** a typed store using `useSyncExternalStore`, with a `useRoom(selector)` hook. A pure reducer of actions with unit tests.
- **The state covers:**
  - participants: name, role, audio (`live | speaking | muted | listening | notJoined`), camera, raised-hand time, presenter, engagement
  - chat (Everyone)
  - DMs
  - presentation: slide index and count
  - panel and scope
  - alerts
  - plugins
  - breakouts: setup, live and back phases, rooms, moves, help queue, closing countdown
- **Actions:** raise and lower hand, send message, open DM, mute, set panel and filter, move student, open and close rooms, close countdown.
  - Port the breakout logic from `docs/canvas/project/Breakout.dc.html`, but with the review fixes:
    - B1: an empty room never crashes
    - B3: the help queue comes from data
    - B4: rebalance keeps manual moves
    - B6: up to ~50 rooms
- **Fixtures** (`src/mocks/fixtures/`): 1, 4, 14 (the canvas class: Bruno, Rafaela Monaco, Cibelle Maciel, …, taken from the boards) and 30 participants, plus long names, duplicate first names and an empty chat.
- **Announcements:** state changes that must be announced (raised hands, new chat, help requests) go through `Announcer`, from one effect in the room provider, never from components.

### Routing
- **Router:** add `react-router` (current stable, pinned).
- **Routes:**
  - `/` is the index of every artboard
  - `/desktop/:artboard` and `/mobile/:artboard`, named by the file stem in `docs/artboards.md`
- **The route list is generated from `docs/artboards.md`** by a script, `scripts/artboards.ts`, which writes `src/routes/artboards.json`. `tokens:check`-style freshness checking goes into `check`. Each artboard's props (for example `panel=people&pfilter=low`) become its initial store state, and query parameters can override them.
- **The Playwright/axe spec loops over that one generated list.** Routes that aren't built yet render a clear "Not built yet (milestone N)" placeholder, so the list is complete from day one and axe still runs on every route.

### Tests and stories
- Reducer unit tests for every action, including the B1, B3, B4 and B6 cases.
- A route test that F1 and G1 load with the right initial state.

## Batch B: shell components (a second Fable agent, after A)

**`SessionHeader`, `AlertPill`, `ActionBar`, `Stage` (grid, presentation, presenter, minimized), `VideoTile`, `WebcamStrip`, `SidePanel`, `ParticipantRow` and `ParticipantList`, `ChatMessage`, `Composer` (built on `TextArea`), and `DMList`**

They compose the milestone 2–3 primitives and read the store through props or `useRoom`. Then wire the **F1, G1–G5 and L1** routes to render from the store.

**Rules and review findings to apply:**
- **People status is Option A:** fixed mic and camera columns, as in `docs/screenshots/O2StudentActions.png`.
- **X12:** tiles show speaking and muted icons.
- **X13:** row actions show on focus and on touch, not only on hover.
- **X15:** no hard-coded counts; everything is data-driven, including the minimized grid.
- **D4:** the insight pill's accessible name starts with its visible text.
- **D6:** DM names and alert pills truncate with a tooltip.
- **B9:** duplicate first names are told apart.
- **P8:** one vocabulary shared with mobile.
- **X10:** the session clock is not in a live region.
- **Stories:** every component has stories at 1, 14 and 30 participants and with long names, plus `Stage`.
- **Avatar xl (48px):** added here if the minimized grid needs it (deferred from milestone 2).

## Rules for both agents
- Follow `CLAUDE.md` exactly: Component pattern, tokens, Accessibility, Scale, Routes and state.
- Never copy raw canvas values.
- Keep the hook green.
- Commit per unit, and push.
- Use the commit footer, and keep model names out of files.
- List anything ambiguous under "Owner decisions needed".
- Don't tick the milestone 4 boxes.

## Review, fixes, sign-off
1. **One `reviewer` pass after batch B.** It also compares the F1, G1–G5 and L1 routes against the canvas source and `O2StudentActions.png`.
2. **One Fable fix round from the review list.** I verify it with checks, CI and a browser probe; there's no second review.
3. **Screenshots for you:** the F1, G1–G5 and L1 routes at 1400×900, plus the 30-participant and long-name variants.
4. **After your approval:** tick the boxes, merge into `main`, and confirm CI.

## Verification
- `npm run check`, `npm run test:e2e` (now including every route) and CI all pass.
- The F1, G1–G5 and L1 routes render from the store. Changing state (raising a hand) shows up in People and is announced.
