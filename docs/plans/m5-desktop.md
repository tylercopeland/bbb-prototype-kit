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
