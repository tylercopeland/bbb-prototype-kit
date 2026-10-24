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

## Build notes (2026-10-24, batch A)

Built as planned. The deviations, each the smallest fix that keeps the intent, are also in `PLAN.md` › Decisions log.

- **Store files:** `src/mocks/types.ts`, `reducer.ts`, `store.ts`, `context.ts` (`useRoom`, `useRoomDispatch`, `useRoomStore`), `RoomProvider.tsx`, `announcements.ts`, `selectors.ts`, `breakouts.ts`, `time.ts`, `fixtures/`. The hooks and `announcementsFor` sit in their own files so `RoomProvider.tsx` exports only the component (fast refresh lint).
- **State shape:** `session` (title, recording, startedAt), `clock.now`, `participants[]` (id, name, role teacher | student, isSelf, audio live | speaking | muted | listening | notJoined, camera, handRaisedAt, isPresenter, isModerator, hasWhiteboard, chatLocked, unmuteRequested, engagement), `chat` (everyone[], direct[] threads keyed by the other person, each message with `read`), `presentation` (decks, deckIndex, slideIndex, minimized, overviewOpen, share none | screen | deck, screenKind, screenShared, tool), `poll`, `timer`, `plugins` (featured, more, open), `alerts` (stored question alerts; hands and insight pills are derived), `breakouts` (phase, mode, roomCount, assignment, durationMin, extraMin, options, seed, assignments, moves, moving, openedAt, peek, view, closingEndsAt, onStage, helpQueue, activity, work, listening), `ui` (layout, panel, scope, dm, peopleFilter, peopleMenu, mediaOpen, mediaType, analyticsTipShown, breakoutsOpen, orientation, sheet, sheetStudent, annotating, reacting).
- **Clock:** milliseconds since midnight on a room clock (`timeOfDay(9, 6, 6)`), so "9:02" and "29:36" format the same in every time zone and nothing reads `Date.now()`. `tick` also ends the closing countdown, the auto return and the class timer.
- **Unread and alerts:** a message carries `read`; opening the chat panel on Everyone, or a direct thread, marks what is visible read (`readVisibleChat`), so the Chat badge, the "Rafaela asked" pill and the Direct list's highlight all come from the same flag.
- **Breakouts:** `assignments` is the stored automatic assignment and `moves` the pins (B4). `shuffleRooms` bumps `seed` and rebuilds `assignments` with the canvas's seeded shuffle; `evenOutRooms` rebuilds it with `balancedAround` (unmoved students fill the emptiest rooms around the pins); `setRoomCount` rebuilds it and drops only the moves into rooms that no longer exist. The canvas's live room statuses ("Ana and Bruno are talking", "Quiet for 4 min") are `activity` rows keyed by room index and a help request is a `helpQueue` row (B3); the artboard mapping adds the canvas's one request (room 2, or room 3 in solo mode, a minute ago).
- **Routes:** `react-router` 8.5.0 with `createBrowserRouter`; `Root` bridges React Aria's `RouterProvider` so `Link`s navigate client-side, and mounts the one `Announcer`. The index and placeholder pages use a small `RouteLink` on React Aria's `Link` (in `src/routes`, not a design-system component). `ArtboardPage` keys the `RoomProvider` by route and query, so moving between artboards remounts a fresh store.
- **Props mapping:** `applyProps` dispatches store actions for each prop; three canvas timings are set directly because no action expresses them (rooms opened 1:18 ago, help asked 1 min ago, the running timer at 3:42 of 5:00). `panel=hub` (command layout) maps to no panel. `presctl` is accepted and ignored (hover-only controls show on focus and touch anyway, X13).
- **e2e:** `e2e/routes.spec.ts` scans `/`, the not-found page and every route at its artboard size; the smoke spec moved to `/tokens`.

### Owner decisions needed (batch A)

1. **Solo room naming (B7).** Rooms are "Room N" in every mode and phase; a solo room shows its student's name as a second line (`Room.subtitle`). The canvas names live solo cards by the student. Confirm "Room N · Ana Souza", or make the student's name the title in solo mode everywhere (setup and live).
2. **Room count and manual moves (B4).** Lowering the room count drops only the moves into rooms that no longer exist; every other move stays. The alternative is to confirm with undo, as the finding allows.
3. **Rebalance semantics (B4).** "Even out" keeps pinned students where they are and spreads the unmoved ones around them, so a room can stay larger if the pins make it so; "Shuffle evenly" reshuffles the unmoved students only. Confirm, or make Shuffle a full reset behind a confirmation.
4. **Help requests in the artboards (B3).** The canvas hard-codes "Room 2 asked for help"; the route mapping creates one real request (room 2 in groups, room 3 in solo mode, asked a minute ago) so BO5–BO8 show it. Confirm the solo room.
5. **Query parameters.** `?people=`, `?chat=empty` and `?clock=live` are reserved query keys next to the artboard props; confirm the names before batch B's stories reuse them.
6. **Chat unread rule.** Opening the chat panel on Everyone marks public messages read; opening a thread marks it read; nothing else does. The canvas's "2 unread" badge is Rafaela's public question plus her DM.
