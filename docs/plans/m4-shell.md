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

## Build notes (2026-10-24, batch B)

Built as planned: `SessionHeader`, `AlertPill`, `ActionBar`, `Stage`, `VideoTile`, `WebcamStrip`, `SidePanel`, `ParticipantRow`, `ParticipantList`, `ChatMessage`, `Composer` and `DMList` in `src/components/`, each with stories at 1, 14 and 30 participants and with long names plus a `Stage` story, and tests for roles, names, keyboard and aria state. Batch A's six defaults are kept. The deviations and decisions are also in `PLAN.md` › Decisions log.

- **Tokens and utilities.** `component.avatar.xl` (48px, `size-avatar-xl`) for the camera-off avatar in a grid tile; `semantic.color.slide` (neutral-0) and `on-slide` (neutral-950), the only pair used on the slide placeholder in every mode, since the slide is content, not chrome, and the stage tokens around it turn `text-muted` to neutral-400. `slide-fit` in `theme.css` fits a 16:9 box into a size container by width or height (`width: min(100%, calc(100cqh * 16 / 9))`), the canvas's fit computed in CSS instead of script. No other new color: the alert pills, badges, status columns and bubbles use the status, accent and insight families, all already checked against the stage.
- **Icons.** `person` (the webcam placeholder, no real video in the prototype), `back`, `private` (the DM lock; `lockChat` stays the moderator action, a different meaning), `question`, `help` (LifeBuoy, a room asking for help), `minimize`, `restore`.
- **Route containers** live in `src/routes/room/`: `RoomScreen` (the shell), `PeoplePanel` and `ChatPanel` (store-connected, mapping every row and chat action to a store action) and `useRoomShortcuts` (Alt + M / V / H on `event.code`, `preventDefault` on a match). `screens.ts` registers `RoomScreen` for the seven milestone 4 stems. Leave confirms in the `ConfirmDialog`, then navigates to the artboard index. `Composer` is the one store-connected component, as the plan said ("sends through the store"); everything else reads props.
- **Stage layout.** The canvas computes whether the webcam strip is beside or above the slide from the slide's fit; at 1400×900 that comes out as beside when the panel is closed and above when it is open, so `RoomScreen` passes `webcams` from `ui.panel` instead of measuring. The strip shows five tiles and "+N more" from the data; the minimized grid's column count is `ceil(sqrt(tiles × 1.6))` capped at 8 (15 tiles give the canvas's 5 columns, 31 give 8). `layout` is derived: no deck → `grid`, minimized → `minimized`, a share → `presenter`, else `presentation`. The `presenter` layout has the "What everyone sees" tabs and the screen frame; the live-share pill and Stop sharing are milestone 5.
- **Controls over the slide.** Anything drawn inside `<Surface kind="stage">` takes the stage tokens, so a white button over the white slide would come out dark. The "Minimize presentation" button therefore sits in a chrome row above the slide, always visible (X13), not over the slide on hover as the canvas draws it. Milestone 5's `PresentationControls` needs either the same placement or a surface reset for controls that float over the slide.
- **People rows (Option A).** Fixed mic and camera columns as one `role="img"` named "Muted, camera on"; speaking is the green disc plus the avatar ring; camera off is blank, as the screenshot draws it. The row actions fade with opacity (not `visibility`), so Tab reaches them and they appear on focus, and `pointer-coarse:` shows them always (X13); they also stay while the ⋯ menu is open. The ⋯ `Menu` is controlled by `ui.peopleMenu` when the room passes it (so O2's `pmenu=anton` deep-links) and keeps its own state otherwise. Remove from session confirms in a `ConfirmDialog`. The microphone switch is "Microphone (ask to unmute)" for a muted person (on → `requestUnmute`), "Microphone" for a live one (off → `mute`), and disabled before audio is joined. A cut-off name shows in a hover tooltip on a `tabIndex={-1}` span (not in the tab order; assistive technology gets the full name anyway and the ⋯ menu header repeats it).
- **Chat.** Everyone / Direct are segmented `Tabs` inside the Chat tab panel (owner decision). The thread view has the back button, the lock and "Only you and Rafaela can see this conversation. Moderators can’t read it." Unread rows in the Direct list use the sunken fill, a bolder preview and a neutral count badge ("1 unread"), not the canvas's red dot (owner decision: neutral badges). Message lists scroll to the newest message when one arrives.
- **Accessible names.** `VideoTile` is a `figure` named through `aria-labelledby` on its caption (the accessibility API in jsdom does not derive a figure's name from `figcaption`); the caption is the plate plus a hidden ", speaking, hand raised, camera on". The DM row's inline spans are joined with spaces so the name reads "Rafaela Monaco Can I share…? 9:06 1 unread".
- **TextArea** gained an `icon` prop (the lock before the text of a private composer).
- **Tests.** `App.test.tsx` now uses a milestone 5 artboard for the placeholder cases, since F1 and G1 render the room. `RoomScreen.test.tsx` covers the seven routes and the end-to-end interactions (raise hand → People and announcement, send → chat, Message privately → thread, panel toggles, the student menu, the shortcuts, Leave). `e2e/room.spec.ts` walks F1 → People → a person's menu → Escape and G2 → type and send, by keyboard only, plus the raised-hand announcement.
- **`npm run check`** takes about 19 s (was 15 s): 46 test files, 464 tests.

### Owner decisions needed (batch B)

1. **Minimize control placement.** The canvas shows "Minimize presentation" over the slide's top-right corner on hover; here it is a soft button in a row above the slide, always visible (X13) and in the stage colors. Confirm, or ask milestone 5 to draw it over the slide with a surface reset.
2. **Webcams beside or above.** The strip is beside the slide when the panel is closed and above it when the panel is open, decided from the panel state rather than the canvas's fit computation. At other viewport sizes the canvas might choose differently.
3. **Join audio.** "Join audio" sets the local person's audio to `live` (mic on). Confirm, or join muted.
4. **Alert pill actions.** "4 raised" opens People without changing the filter (as the canvas does); "Rafaela asked" opens Chat (Everyone); "3 low engagement" opens People filtered to low engagement. The help and "Breakouts ended" pills do nothing until milestone 5.
5. **Unread Direct rows.** The sunken fill, a bolder preview and a neutral "N unread" badge replace the canvas's blue tint and red dot. Confirm.
6. **Remove from session** confirms in an alert dialog ("Remove Anton Georgiev?"); the canvas removes at once. Confirm.
7. **Teacher's short name.** `selectDisplayNames` (batch A) takes the first word of "Prof. Helena Costa", so an announcement about the teacher reads "Prof. raised their hand". Tiles say "You" and the teacher raises no alert, so it only shows when the teacher raises her own hand; strip the honorific in the selector, or rename the fixture.

## Owner decisions (2026-10-24, after the build notes)

- **Join audio joins muted** (batch B item 3). `joinAudio` sets the local person's audio to `muted` from `notJoined` or `listening`; the Microphone toggle then reads unpressed and the person unmutes themselves. Alt + M before joining joins the same way.
- **The Minimize control stays in the row above the slide** (batch B item 1).
- Accepted as defaults: webcams beside or above the slide by panel state (item 2); unread Direct rows on the sunken fill with a neutral badge (item 5); Remove from session confirms (item 6); honorifics stripped from display names (item 7, fixed in the review round as S4).

## Build notes (2026-10-24, review fix round)

One reviewer pass found two blocking accessibility problems, eleven should-fix items and some nits; one agent run fixed the whole list. The commits on `m4-shell` are grouped: blocking; reducer and state; components and tv; fidelity; stories; nits; docs. `PLAN.md` › Decisions log has the summary; the notes below are what a later milestone needs to know.

- **Focus after a control unmounts (B1).** `src/routes/room/focus.ts` holds the pattern: `RoomScreen` keeps one pending `FocusRequest` in a ref behind a context (`requestFocus`, `takeFocus`), the handler that will unmount its own control writes the request before dispatching, and the component that renders the target takes it in its mount effect and focuses the element itself. No state and no setState in an effect, so the React Compiler lint stays quiet. Closing the panel needs no request: `closePanel` focuses the right toggle through `ActionBar` › `panelRefs` before the commit. Removing a person is handled inside `ParticipantList` (it knows the rows): the next row's ⋯ button, else the previous one, else the first section heading (`tabIndex={-1}`), else the list root; it works because React Aria only restores focus from a closed dialog when `document.activeElement` is `<body>`. Leave: `IndexPage` focuses its `h1` when `useNavigationType()` is not `POP`, so a direct load does not grab focus. Milestone 5's "Move to…" (B2) should reuse `ParticipantList`'s pending-focus logic and the store-diff announcement in `announcements.ts`.
- **Acting as another participant in tests.** The `RoomProvider` exposes its store as `window.bbbRoom` while mounted. `e2e/room.spec.ts` and `RoomScreen.test.tsx` dispatch `raiseHand` for Anton through it, since the teacher's own hand is no longer announced (S4) nor counted in the hands pill (nit).
- **Reducer.** `removeParticipant` (S2) drops the person's direct thread and question alerts, nulls `from` in the help queue, closes the student sheet and hands the presenter role to the teacher (you first); their public messages stay and read "Someone who left". The setup actions (`setBreakoutMode`, `setRoomCount`, `shuffleRooms`, `evenOutRooms`) return the state unchanged outside `phase === 'setup'` (S3), and `requestHelp` refuses a room index outside `0..roomCountFor()`. Message and help ids come from `chat.seq` and `breakouts.helpSeq` (fixtures start both at 0), so the same state and action always give the same id.
- **Names.** `src/mocks/names.ts` (`nameWords`, `firstName`, `firstNameWithInitial`) strips honorifics (Prof., Profa., Dr., Dra., Mr., Ms., Mrs., Sr., Sra.) and a trailing generational suffix (Jr., Sr., II–V) when another word is left. `selectDisplayNames`, `initials` and `roomStatus` use it; `roomStatus` now takes `names` (`selectDisplayNames(state)`) so two Anas read "Ana S. and Ana F. are talking" (S8). Composer and the thread note use the display name too.
- **Microphone switch (S1).** Label fixed to "Microphone", checked only while the mic is on. For a muted person "on" dispatches `requestUnmute`, and while a request is pending (the row's second line says "Asked to unmute") "on" again dispatches `cancelUnmuteRequest`; "off" mutes a live person. Before audio is joined the item is disabled and described "Audio not joined". `PeoplePanel` reads `unmuteRequested` from the store to choose the action.
- **Tooltips (S5).** `useTruncationTooltip` in `triggerRef` mode everywhere a cut-off label needs one. In ParticipantRow the `li` is the trigger (`useHover` plus focus-within through `onFocus` / `onBlur`), the name span is what is measured, and the tooltip is positioned against the name. The ⋯ menu header wraps the name (`break-words`).
- **Layout (S10).** `Surface` takes `as` and the stage column is a `main`. `ChipGroup` and `Chip` take `density="compact"` (no wrap, tighter gap and padding, labels truncate). Stage: beside the slide, `fit` is the `@container` and the strip gets `mt-21`; above it, the stage root is the `@container` and the slide uses `slide-fit-stacked` (`theme.css`), whose height subtracts the strip, the chrome row and the gaps, with a 40% floor so a very short stage overflows rather than losing the slide. Checked by screenshot at 1400×900 (F1, G1, G2, G3, 30 people minimized, long names).
- **Contrast.** `status-live-text` on `surface-sunken` is 4.34:1 in light mode (green-700 on neutral-50). It is only ever the live mic glyph in a hovered or focused People row, so the pair is declared at the icon minimum (3:1) with a note; `status-hand-text` on `surface-sunken` ("Raised · 3 min" in a hovered row) is text and passes at 4.79.
- **Stories (S11).** VideoTile has no 1 / 14 / 30 stories and ActionBar no long-name story: a single tile and a bar of icon buttons have no count or name to scale. The 0-participant WebcamStrip and Stage grid stories carry a visible caption in a decorator, because an empty `ul` does not count as rendered for the Storybook e2e readiness check.
- **`npm run check`** takes about 20 s (48 test files, 487 tests, about 10 s of Vitest); `test:e2e` runs 324 tests in about 7 minutes.

### Owner decisions needed (review fix round)

1. **`status-live-text` on `surface-sunken` at 3:1.** The pair fails the 4.5 text minimum in light mode but is only used as the mic glyph. Keep it declared as an icon pair, or darken `green-700` (which would also lift its 4.55 on `green-50`) and have every green text pass 4.5 on the sunken fill.
2. **Pending unmute request in the ⋯ menu.** The Microphone switch stays unchecked while a request is pending and shows no cue of its own (the row's second line says "Asked to unmute"); turning it on again cancels the request. Confirm, or give the menu item a description ("Asked to unmute") as well.
3. **`window.bbbRoom`.** The store is exposed on `window` for the end-to-end tests and the console. Keep it, or guard it behind a query parameter before milestone 7's deploy.
