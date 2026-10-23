# BigBlueButton 4.0 room: prototype plan

## Goal

A live, shareable prototype of the BigBlueButton 4.0 room, built on an accessible design system. It covers the **Prototype – Desktop** and **Prototype – Mobile** flows from the canvas, scales from a 1:1 call to a classroom with breakouts, and meets WCAG 2.1 AA.

This is a standalone prototype. It does not need to fit into the bbb-html5 client yet.

## Definition of done

- [ ] Every artboard in `docs/artboards.md` has a matching route or Storybook story, set to the same state.
- [ ] axe reports zero violations on every route and story.
- [ ] Every flow can be completed with the keyboard alone (Playwright tests prove it).
- [ ] No hard-coded colors, sizes or radii outside the tokens (lint enforces it).
- [ ] Deployed to a shareable link with a short readme for reviewers.

## How each milestone runs

1. Start the session in plan mode: "Read PLAN.md and CLAUDE.md. We're on milestone N. Plan it."
2. Review the plan, adjust it, then let Claude build.
3. Run the `reviewer` agent on what was built. Fix what it finds.
4. Compare against the screenshots in `docs/screenshots/` yourself.
5. Commit, tick the boxes below, and add anything learned to `CLAUDE.md`.

---

## Milestone 1 · Foundations

Build: Vite + React + TypeScript, Tailwind v4 with `docs/theme.css`, React Aria Components, tailwind-variants, Storybook with the a11y addon, Vitest, Playwright with @axe-core/playwright, ESLint, Prettier.

Also:
- Move `docs/tokens.json` to `src/tokens/` and generate the theme from it with Style Dictionary, so `tokens.json` is the only place a value is edited.
- Add the token gaps the review found (see `docs/review-findings.md`, "Token gaps"): purple insight family, status tints, selected-on-dark, room palette, a 9th and 10th avatar color, 10px radius. Run a contrast check on every new pair.
- Lint rule that rejects Tailwind arbitrary values (`bg-[#…]`, `p-[13px]`) and raw hex in TSX.
- npm scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`, `storybook`, and `check` (lint + typecheck + unit tests).

Exit:
- [ ] `npm run check` passes; Storybook runs with the a11y panel.
- [ ] A story that uses `bg-[#ff0000]` fails lint.
- [ ] Light, dark and `data-surface="stage"` themes switch in Storybook.

## Milestone 2 · Reference primitives (you review closely)

Build: `Button`, `IconButton` (with tooltip and shortcut hint), `ToggleButton` (mic and camera pattern), `Avatar` (initials, status badge, speaking ring).

These set the pattern every later component copies, so review them line by line.

Exit:
- [ ] Each has stories for every variant, size and state, plus a keyboard test.
- [ ] You approve the API and look.
- [ ] The file pattern and any new rules are written into `CLAUDE.md` under "Component pattern".

## Milestone 3 · Primitive set

Build: `Tooltip`, `Popover`, `Dialog`, `Sheet` (mobile bottom sheet and landscape side sheet), `Menu` (with switch items), `Tabs` (with panels), `ChipGroup` (single-select, radio semantics), `ToggleGroup`, `Stepper`, `TextField`, `TextArea` (composer), `Switch`, `Badge`, `Toast` plus an `Announcer` for live-region messages.

These don't depend on each other, so they can be built in parallel with the `component-builder` agent, one per git worktree, then merged.

Exit:
- [ ] Every component has stories, a keyboard test and zero axe violations.
- [ ] Dialog, Popover and Sheet trap focus, close on Escape and return focus to the trigger.

## Milestone 4 · Meeting components

Build: `ActionBar`, `SessionHeader`, `AlertPill`, `VideoTile`, `WebcamStrip`, `Stage` (grid, presentation, presenter, minimized), `PresentationControls`, `WhiteboardToolbar`, `SlideOverview`, `SidePanel`, `ParticipantRow` and `ParticipantList`, `ChatMessage`, `Composer`, `DMList`, `PollBuilder`, `PollResults`, `Timer` (card and pill), `PluginsMenu`, `MediaPicker`, `RoomCard`, `RoomPreview`.

Use realistic mock data (`src/mocks/`): 1, 4, 14 and 30 participants, long names, empty chat.

Before starting, decide which people-status option (A, B or C on the canvas) to build. Note it here: **Chosen option: ___**

Exit:
- [ ] Each component has stories at 1, 14 and 30 participants and with long names.
- [ ] No hard-coded counts.

## Milestone 5 · Desktop flows

Build the routes for `docs/artboards.md` › Prototype – Desktop, in this order: room and action bar → People and chat (including DMs) → sharing and media → slides overview → poll → timer → learning analytics → breakouts 1–12.

A shared mock "room state" store drives every route, so state carries across a flow (raise a hand, see it in People).

Fix the review issues as you go: empty-room crash, data-driven help queue, "Move to…" menu for students, confirm before opening rooms, keyboard way to place the timer.

Exit:
- [ ] Each desktop artboard has a route that reproduces it, linked from an index page.
- [ ] Playwright walks each flow by keyboard.
- [ ] You've compared every route against its screenshot.

## Milestone 6 · Mobile flows

Build the 14 phone artboards using the same components.

Changes from the canvas, agreed in the review: slide above the webcams in portrait, pager below the slide in landscape, `env(safe-area-inset-*)` instead of fixed insets, 44px minimum touch targets, a visible close button on every sheet.

Exit:
- [ ] Each phone artboard has a route at 390×844 or 844×390.
- [ ] Playwright runs the flows at phone size with touch emulation.

## Milestone 7 · Deploy

Exit:
- [ ] Deployed (Vercel or Netlify) with Storybook published alongside.
- [ ] Readme for reviewers: what to try, what's mocked, known gaps.
- [ ] Everything in "Definition of done" is ticked.

---

## Decisions log

Record decisions here as they're made, with the date.

- 2026-10-23 · Standalone prototype, not integrated into bbb-html5 yet.
- 2026-10-23 · Stack: React, TypeScript, Vite, Tailwind v4 tokens, React Aria Components.
