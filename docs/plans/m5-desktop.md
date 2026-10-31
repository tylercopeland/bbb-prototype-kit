# Milestone 5 "Desktop flows": implementation plan (approved 2026-10-30)

## Context

Milestones 1–4 are on `main` (1441849). The design system, the room-state store, routing and the room shell are done. The F1, G1–G5 and L1 routes render from the store, and 26 desktop artboards are still placeholders.

Milestone 5 builds them, in the order `PLAN.md` gives: sharing and media → slides overview → poll → timer → learning analytics → breakouts 1–12.

**Exit criteria:**
- every desktop artboard has a route that reproduces it, linked from the index
- Playwright walks each flow by keyboard, and axe passes on every route
- Playwright screenshot baselines exist for every route, approved by you against the canvas

**Canvas check:** a new version, but all `project/` files have the same byte sizes as our copy; only the editor runtime changed. No sync needed.

**Your decision today:** moderators can turn off private chat. A "Private chat" switch goes in room settings. When it's off, students don't see "Message privately", teacher-to-student messages keep working, and the thread note says so.

**Lean, as before:** I write this plan myself, three Fable batches build in sequence on one branch, then one review pass, one fix round, and screenshots for your sign-off.

## Setup
- Branch `m5-desktop` from `main`.
- Save this plan as `docs/plans/m5-desktop.md`. Commit and push.

## Batch A: sharing, media, slides overview, plugins, analytics and student actions
**Routes:** M1, M2 (presenter sharing: Screen and Presentation tabs), H1, H2 (Share media picker: Slides and Screen), N1 (All slides overview), O1 (Learning Analytics entry point), O2 (student actions menu open), BO1 (Plugins → Breakout rooms).

**Components, built with their flows:**
- `MediaPicker`: types along the bottom, as in `canvas-notes.md`
- `PresentationControls`: visible on focus and on touch (X13)
- `WhiteboardToolbar`: pen, highlighter, eraser and colors; one icon per meaning (X6)
- `SlideOverview`
- `PluginsMenu`
- the live-share pill with Stop sharing

**Also:**
- **Room settings:** a "Private chat" switch (your decision), wired through the store; tests cover students with it on and off.
- **D5:** React works; Leave already confirms.
- **X1:** every picker has a visible close button.

## Batch B: poll and timer
**Routes:** PL1–PL3 (setup, live with only you seeing answers, results shown) and TM1–TM4 (ready, running, minimized, done).

**Components:**
- `PollBuilder`
- `PollResults`: not color-only, with counts and percentages as text
- `Timer`, as a card and a pill

**Rules and review fixes:**
- **D1:** floating cards never cover the slide's title area by default.
- **Timer placement by keyboard:** corner snapping with arrow keys or a "Move to corner" menu, with the new position announced.
- **Timer finishing:** announced assertively; the ticking time is **never** in a live region (X10).
- **Poll answers:** announced politely.
- **Presets** use `ChipGroup` (X8).

## Batch C: breakouts 2–12, plus visual baselines
**Routes:** BO2–BO12.

**Components:**
- the setup panel: **keep the Breakout board's own structure** (owner decision), as in `docs/screenshots/BO2SetupGroups-desk.png`
- `RoomCard`
- `RoomPreview`
- the help-queue list
- the closing countdown

**Fixes:** these use the store's existing breakout logic, so wire it rather than rewrite it.
- **B1:** an empty room never crashes.
- **B2:** "Move to…" menu, with focus and the move announced.
- **B3:** the help queue comes from data, with acknowledge and clear.
- **B4:** rebalancing keeps manual moves.
- **B5:** confirm before opening rooms; the closing countdown is clearly visible and announced.
- **B6:** up to ~50 rooms, with a condensed solo list.
- **B7:** one naming rule.
- **B8:** real inputs and wired buttons.
- **B9:** duplicate names told apart.

**Visual baselines (exit criterion 3):**
- Add `e2e/visual.spec.ts`: `toHaveScreenshot()` on every desktop route at 1400×900, with a small pixel tolerance.
- Baselines must match CI's browser, so add a manually triggered `update-snapshots` GitHub workflow that regenerates them on CI's Chromium and commits them to the branch.
- The normal CI `e2e` job compares against them. Locally, the visual spec is skipped unless baselines for this platform exist.

## Rules for every batch
- Follow `CLAUDE.md` exactly.
- Every flow gets a keyboard-only Playwright walk.
- Every route passes axe at its artboard size.
- Never copy raw canvas values.
- Keep the hook green.
- Commit per unit, push, use the commit footer, and keep model names out of files.
- List anything ambiguous under "Owner decisions needed".
- Don't tick the milestone 5 boxes.

## Review, fixes, sign-off
1. **One `reviewer` pass after batch C.** It covers fidelity against `Focus.dc.html` and `Breakout.dc.html` and the review findings, plus the keyboard flows.
2. **One Fable fix round.** I verify it with checks, CI and browser probes.
3. **Baselines:** trigger `update-snapshots`, then send you the baseline images for the 33 desktop routes to approve against the canvas.
4. **After your approval:** tick the boxes, merge into `main`, and confirm CI.

## Verification
- `npm run check`, `npm run test:e2e` and CI all pass.
- Every desktop artboard renders from the store, not a placeholder.
- Each flow is walked by keyboard in Playwright.
- Baselines are committed and compared in CI.

## Build notes (2026-10-30, batch A)

Built as planned. The deviations are also in `PLAN.md` › Decisions log.

- **Routes:** M1, M2, H1, H2, N1, O1, O2 and BO1 render `RoomScreen` (`src/routes/screens.ts` › `MILESTONE_5A`); the artboard props already mapped to store actions, so `initialState.ts` did not change. BO1 → Breakout rooms shows a stand-in surface ("Breakout rooms · Not built yet (milestone 5, batch C)" with Back to the room) until batch C replaces it.
- **Components:** `MediaPicker` (six types as stacked icon tabs along the bottom, real tab panels: Slides with Add slides and your decks as a radio group, Screen, Video, Audio, URL, More), `PresentationControls` (the Slides group with `SlideOverview` and the pager, plus `WhiteboardToolbar`; hidden until the slide is hovered or holds focus, always shown on touch, X13; the All slides dialog keeps them visible), `WhiteboardToolbar` (two radio groups: six tools, six inks), `SlideOverview` (a popover dialog of thumbnail buttons, the current one `aria-current`), `PluginsMenu` (featured cards with their state line, the "More plugins" rows), `ReactionTray` (D5), `RoomSettings` (the Private chat switch), `SharePill` (the live note with Stop sharing). `Tabs` gained a `stacked` variant with an icon, `IconButton` `tooltipDefaultOpen` and `tooltipHint`, `Tooltip` a `hint`, `Popover` a standalone mode (`triggerRef`, `id`, `restoreFocusTo`) and `FocusFallback`, `Menu` `restoreFocusTo` and first-item focus when open on load, `VideoTile` / `WebcamStrip` / `Stage` reactions, `Stage` `controls` and `sharePill` slots, `ActionBar` the picker slots (`pluginsPicker`, `mediaPicker`, `settings`), `mediaOpen`, `onPluginsOpenChange`, `onMediaOpenChange`, `onReaction`, `analyticsTipOpen` and `panelRefs.media`, `ParticipantRow` / `ParticipantList` `canMessage`.
- **Store:** `session.privateChat` + `setPrivateChat` + `canMessagePrivately` + `selectCanMessage`; `reactions` + `sendReaction` + `selectReactions` + `REACTION_LIFETIME` (`src/mocks/reactions.ts` holds the six kinds with their emoji and labels); `presentation.color` + `setInkColor`; `selectDeck`; `addDeck`. `removeParticipant` drops the person's reactions. Announcements: "Anton reacted: Clap" (polite), never your own.
- **Icons (X6):** `highlighter`, `mediaSlides`, `mediaVideo`, `mediaAudio`, `mediaUrl`, `screenEntire`, `screenWindow`, `screenTab`, `upload`, `check`, `whiteboard`, `previousSlide`, `nextSlide`, `qaBoard`, `quiz`, `wordCloud`, `randomPicker`; the Pen tool is `annotate` and the More type is `more`.
- **e2e:** `e2e/sharing.spec.ts`: Share media → switch type with the arrow keys → Escape; H2 → a screen kind → the tabs and the pill → Stop sharing; F1 → All slides → pick → focus returns; N1 → Escape → All slides takes focus; Plugins → Breakout rooms → Back to the room; BO1 → Close; O2 → toggle Whiteboard access → Escape returns to ⋯; React → Clap → the store; Room settings → Private chat off → the thread note. Every flow ends with a focus check.
- **Timings:** `npm run check` takes about 17 s (vitest 9–13 s of it); `npm run test:e2e` about 8 minutes (365 Playwright tests).
- **Known flake, not from this batch:** `Components/Toast › Open` in stage mode occasionally fails axe's color contrast with a blended color (`#437bd7`) while the toast's `animate-overlay-in` runs; it passes on rerun. Waiting for `animationend` in `storyReady` would fix it.

### Owner decisions needed (batch A)

1. **Live-share pill placement.** It sits in the chrome row next to the share tabs (never over the presentation controls); the canvas draws it over the bottom of the stage. Confirm, or move it over the stage for M1 only (when the screen is on stage there are no controls to collide with).
2. **Dark controls on the white slide.** The presentation controls and the whiteboard toolbar inside the stage surface are dark cards (the milestone 4 rule for controls inside the stage), where the canvas draws white cards. A white variant needs panel tokens inside the stage, which the token modes do not express today.
3. **Media types along the bottom.** Kept as the plan says; D3's "tabs above content" is met in the DOM and the focus order (list first), not visually. Confirm, or move the tabs to the top.
4. **The whiteboard inks.** Six inks on existing tokens (Black, Blue, Red, Green, Amber, Purple), no Undo. Confirm the set, or name the colours the whiteboard should have (new tokens with contrast pairs).
5. **What the picker's other types do.** Video, Audio, URL and Blank whiteboard close the picker with a toast ("… isn't part of this prototype yet"); Add slides / Upload a file add a deck named after the chosen file. Confirm, or give them states.
6. **The reaction's visibility to its sender.** A reaction shows on the sender's tile for 8 s; with the class fixture the teacher's tile is not among the five the strip shows. Confirm, or always show your own tile in the strip, or show your reaction on the React button.
7. **Private chat copy.** The thread note while it is off: "Private chat is off for students. Only you and Ana can see this conversation, and Ana can reply here." The switch description: "Students can message each other privately. Off, only moderators can start a private conversation, and students can still reply."
8. **Learning Analytics.** The button shows a toast ("The Learning Analytics Dashboard isn't part of this prototype yet"); the tooltip reads "Learning Analytics Dashboard · Opens in a new tab ↗". Confirm, or open a placeholder page in a new tab.
9. **Toggle semantics for the pickers.** Plugins and Share media keep `aria-pressed` (the canvas and the M2 pattern) and add `aria-expanded` / `aria-haspopup="dialog"`. Confirm the double state, or drop `aria-pressed` on these two.

## Build notes (2026-10-31, batch B)

Built as planned. The deviations are also in `PLAN.md` › Decisions log.

- **Routes:** PL1, PL2, PL3, TM1, TM2, TM3 and TM4 render `RoomScreen` (`src/routes/screens.ts` › `MILESTONE_5B`). The artboard props already mapped to store actions, so `initialState.ts` did not change.
- **Components:** `PollBuilder` (the question as a `TextField`, the four answer types as a `ChipGroup` radio group (X8), one named field per multiple-choice answer with a "Remove answer A" button, "Add an answer", a "More options" disclosure with three `Switch` rows, and the "Ask the class" footer with its fine print; disabled until there is a question and every answer has text), `PollResults` (a `panel` variant with the status box, the counts and the shares, and a `stage` variant with the Poll kicker, the count, "shown to everyone" and Hide; the bars are SVG rectangles sized by share, the top answer is bold and "most chosen" for assistive technology, and who sees the results is said in words), `Timer` (the card: a group named "Timer" with Move to corner, Minimize and Remove, the ring with the time and a status word, the quick times as a compact `ChipGroup`, Reset, Start / Pause / Restart and +1 min; and the pill: one button, "Expand timer, 3:42 left"). `PollPanel` (`src/routes/room/`) wires the builder and the results with the footer actions (Show results to everyone / Hide results from everyone, End poll, New poll, Close).
- **D1 (floating cards):** `Stage` gains an overlay layer (`overlays`, four corner slots over the slide's fit box, or over the whole stage in the grid layouts; `pointer-events-none` so the slide's hover controls still work). The top right is the reserved corner: the poll results always sit there and the timer defaults there; the slide's deck name and title keep clear of it (`pr-96`, room for the panel-width poll card and its inset). Alert pills live in the session header and the webcam strip is outside the slide column, so neither overlaps a card. "Move to corner" is a `Menu` of the four corners as `menuitemradio` rows (with a check on the current one; `menuCheckStyles`); the store keeps `timer.corner`, and the move is announced politely ("Timer moved to bottom left"). Drag is not built.
- **Store:** `poll.type`, `liveResults`, `multipleAnswers`; `setPollQuestion`, `setPollType`, `setPollOption`, `addPollOption`, `removePollOption`, `setPollSetting` (only while in setup; `startPoll` needs `canStartPoll`); `timer.corner` + `setTimerCorner`; `src/mocks/poll.ts` (the presets, 2–5 answers, `pollResults`) and `src/mocks/timer.ts` (the quick times, the warn and urgent thresholds, the corner labels); `selectPollResults`, `selectCanStartPoll`. Announcements: a poll answer arriving is polite, as the running count ("Poll: 7 of 13 answered"; answers are anonymous); the timer finishing stays assertive; nothing for a tick, start, pause or the time itself (X10).
- **Tokens:** one new font size, `2xl` = 40px / 48px, for the timer's digits (the canvas draws 40–46px); `tokens-check` accepts 40 as a display size. No new colors.
- **Icons:** `start`, `pause`, `reset`, `moveToCorner`, `delete`.
- **Focus (WCAG 2.4.3):** Ask the class → "Show results to everyone"; New poll → the question; Hide on the stage card → "Show results to everyone" (or Plugins when the panel is closed); Close → Plugins; Minimize → the pill; the pill → Minimize; Remove timer → Plugins; a move to another corner remounts the card in its new slot, so `RoomScreen` refocuses the new Move to corner button through `moveButtonRef`.
- **Reduced motion:** the ring's `transition-all` and the last-ten-seconds `animate-pulse` follow the global reduced-motion rule, and the pulse also sets `motion-reduce:animate-none`.
- **e2e:** `e2e/poll-timer.spec.ts`: Plugins → Poll → edit the question, the type (arrow keys), remove and add an answer, a switch → Ask the class → an answer arrives (`bbbRoom`) and is announced → Show results → End poll → Close returns focus to Plugins; PL3 → Hide on the stage card lands on the show button; Plugins → Timer → 3 min (arrow key) → Start → Pause → Move to corner → Minimize → restore lands on Minimize; TM2 → the clock reaching zero announces assertively → Remove hands focus to Plugins.
- **Timings:** `npm run check` takes about 15–17 s.

### Owner decisions needed (batch B)

1. **The timer does not tick on its own.** The room clock moves only with `?clock=live` (the milestone 4 rule: a route renders the same at any wall-clock time, and batch C's screenshot baselines depend on it), so Start on TM1 changes the state and the status word but the digits stay until the clock ticks. Confirm, or let the timer run the live clock while it is running.
2. **Dark cards on the stage.** The timer card and the poll results card take the stage tokens (dark cards over the white slide), as the batch A controls do; the canvas draws white cards. Same question as batch A, decision 2.
3. **The reserved corner.** Both cards default to the top right of the slide and the slide's title block keeps clear of it; with a poll shown and a timer in the same corner the timer stacks under the results. Confirm, or give the timer another default corner.
4. **Poll results card width.** The stage card is the panel width (360px) instead of the canvas's 520px, so it fits the reserved corner; it shows shares only, as the canvas does.
5. **Who sees the results.** The copy: "Answers are anonymous. Only you see the results until you show them." / "… Results are shown to everyone on the stage." and, with names visible, "You can see who answered what." The stage card says "9 of 13 answered · shown to everyone".
6. **Poll answers announcement.** Each answer is announced politely as the running count ("Poll: 7 of 13 answered"), never the answer itself, because answers are anonymous by default. Confirm, or announce only every few answers for a large class.
7. **The "Students see results as they come in" and "Allow more than one answer" switches** are stored but have no effect in the prototype (there is no student view yet). Confirm, or drop them from the builder.
8. **Done ring.** At time's up the ring is empty with a green border and "Time's up!", as the canvas draws it; a full green ring would read as done more strongly.
