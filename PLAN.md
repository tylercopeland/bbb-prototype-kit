# BigBlueButton 4.0 room: prototype plan

## Goal

A live, shareable prototype of the BigBlueButton 4.0 room, built on an accessible design system. It covers the **Prototype – Desktop** and **Prototype – Mobile** flows from the canvas, scales from a 1:1 call to a classroom with breakouts, and meets WCAG 2.1 AA.

This is a standalone prototype. It does not need to fit into the bbb-html5 client yet.

## Definition of done

- [ ] Every artboard in `docs/artboards.md` has a matching route or Storybook story, set to the same state.
- [ ] axe reports zero violations on every route and story.
- [ ] Every flow can be completed with the keyboard alone (Playwright tests prove it).
- [ ] No hard-coded colors, sizes or radii outside the tokens (lint enforces it).
- [ ] CI runs `check` and `test:e2e` on every push and is green.
- [ ] Deployed to a shareable link with a short readme for reviewers.

## How each milestone runs

1. Start the session in plan mode: "Read PLAN.md and CLAUDE.md. We're on milestone N. Plan it."
2. Review the plan, adjust it, then let Claude build.
3. Run the `reviewer` agent on what was built. Fix what it finds.
4. Check the result against the canvas: the screenshots in `docs/screenshots/` where they exist, otherwise the live canvas.
5. Commit, tick the boxes below, and add anything learned to `CLAUDE.md`.

---

## Before milestone 1

- [x] `.claude/agents/` (the `reviewer` and `component-builder` agents) is in the repo.
- [x] `.claude/settings.json` (the post-edit check hook) is in the repo.
- [ ] Optional: PNGs of key artboards in `docs/screenshots/`.

## Milestone 1 · Foundations

Build: Vite + React + TypeScript, Tailwind v4, React Aria Components, tailwind-variants, Storybook with the a11y addon, Vitest, Playwright with @axe-core/playwright, ESLint, Prettier.

Also:
- Move `docs/tokens.json` to `src/tokens/` and generate `src/tokens/tokens.css` from it with Style Dictionary (a custom Tailwind v4 `@theme` format), so `tokens.json` is the only place a value is edited. First add what `theme.css` has and `tokens.json` lacks: line heights, and light, dark and stage modes. The utilities (`focus-ring`, `hit-area`, `ring-speaking`) and base styles stay hand-written in `src/styles/theme.css`, which imports the generated file.
- Add the token gaps the review found (see `docs/review-findings.md`, "Token gaps"): purple insight family, status tints, selected-on-dark, room palette, a 9th and 10th avatar color, `border-control`. Every spacing, size, radius and line-height token is a multiple of 4px. Run a contrast check on every new pair.
- Lint rule that rejects Tailwind arbitrary values (`bg-[#…]`, `p-[13px]`) and raw hex in TSX.
- Icon set: Lucide (`lucide-react`), one icon per meaning (X6).
- Self-host Source Sans 3 with `@fontsource`, so screenshots are stable and the prototype works offline.
- npm scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`, `storybook`, and `check` (lint + typecheck + unit tests).
- GitHub Actions workflow running `check` and `test:e2e` on every push.

Exit:
- [ ] `npm run check` passes locally and in CI; Storybook runs with the a11y panel.
- [ ] A story that uses `bg-[#ff0000]` fails lint.
- [ ] Light, dark and `data-surface="stage"` themes switch in Storybook. Dark is a smoke test only: no artboard uses it, so it gets no design review.

## Milestone 2 · Reference primitives (you review closely)

Build: `Tooltip`, `Button`, `IconButton` (with tooltip and shortcut hint), `ToggleButton` (mic and camera pattern), `Avatar` (initials, status badge, speaking ring), and an icon story listing the set with each icon's meaning.

These set the pattern every later component copies, so review them line by line.

Exit:
- [ ] Each has stories for every variant, size and state, plus a keyboard test.
- [ ] You approve the API and look.
- [ ] The file pattern and any new rules are written into `CLAUDE.md` under "Component pattern".

## Milestone 3 · Primitive set

Build: `Popover`, `Dialog`, `Sheet` (mobile bottom sheet and landscape side sheet), `Menu` (with switch items), `Tabs` (with panels), `ChipGroup` (single-select, radio semantics), `ToggleGroup`, `Stepper`, `TextField`, `TextArea` (composer), `Switch`, `Badge`, `Toast` plus an `Announcer` for live-region messages.

These don't depend on each other, so they can be built in parallel with the `component-builder` agent, one per git worktree, then merged.

Exit:
- [ ] Every component has stories, a keyboard test and zero axe violations.
- [ ] Dialog, Popover and Sheet trap focus, close on Escape and return focus to the trigger.

## Milestone 4 · Room shell and state

Build:
- The mock room-state store (`src/mocks/`): participants, chat, DMs, presentation, plugins and breakouts, with actions (raise hand, send message, move student, open and close rooms). Port the breakout phases, moves and closing countdown from `docs/canvas/project/Breakout.dc.html`. Fixtures for 1, 4, 14 and 30 participants, long names, duplicate first names and an empty chat.
- Routing: `/desktop/:artboard` and `/mobile/:artboard`, where the artboard's props set the store's initial state (see `CLAUDE.md` › Routes and state), and an index page listing every artboard.
- Shell components: `ActionBar`, `SessionHeader`, `AlertPill`, `Stage` (grid, presentation, presenter, minimized), `VideoTile`, `WebcamStrip`, `SidePanel`, `ParticipantRow` and `ParticipantList`, `ChatMessage`, `Composer`, `DMList`.

Exit:
- [ ] Each component has stories at 1, 14 and 30 participants and with long names.
- [ ] No hard-coded counts.
- [ ] The F1, G1–G5 and L1 routes render from the store.

## Milestone 5 · Desktop flows

Build the routes for `docs/artboards.md` › Prototype – Desktop, in this order: room and action bar → People and chat (including DMs) → sharing and media → slides overview → poll → timer → learning analytics → breakouts 1–12.

Build each flow's components with the flow, not ahead of it: `MediaPicker`, `PresentationControls`, `WhiteboardToolbar`, `SlideOverview`, `PluginsMenu`, `PollBuilder`, `PollResults`, `Timer` (card and pill), `RoomCard`, `RoomPreview`.

Fix the review issues as you go: empty-room crash, data-driven help queue, "Move to…" menu for students, confirm before opening rooms, keyboard way to place the timer.

Exit:
- [ ] Each desktop artboard has a route that reproduces it, linked from the index page.
- [ ] Playwright walks each flow by keyboard, and axe passes on every route.
- [ ] Playwright screenshot baselines exist for every route, approved by you against the canvas.

## Milestone 6 · Mobile flows

Decide first: which P9 states (student view, keyboard-open chat, confirm Leave and Remove, reconnecting, screen share, landscape sheets) are built and which are out of scope.

Build the 14 phone artboards using the same components.

Changes from the canvas, agreed in the review: slide above the webcams in portrait, pager below the slide in landscape, `env(safe-area-inset-*)` instead of fixed insets, 44px minimum touch targets, a visible close button on every sheet.

Exit:
- [ ] Each phone artboard has a route at 390×844 or 844×390.
- [ ] Playwright runs the flows at phone size with touch emulation.

## Milestone 7 · Deploy

Decide first: the host (see "Open decisions").

Exit:
- [ ] Deployed with Storybook published alongside.
- [ ] Readme for reviewers: what to try, what's mocked, known gaps.
- [ ] Everything in "Definition of done" is ticked.

---

## Open decisions

Move each one to the decisions log once it's made.

| Decision | Options | Needed by |
|---|---|---|
| Private chat | Can moderators turn off private chat for a classroom? (open question on the canvas; the DM thread note changes if so) | M5 |
| P9 mobile states | Build, or log as out of scope | M6 |
| Deploy host | GitHub Pages (no new account; private repos need a paid plan), Vercel or Netlify | M7 |

## Decisions log

Record decisions here as they're made, with the date.

- 2026-10-23 · Standalone prototype, not integrated into bbb-html5 yet.
- 2026-10-23 · Stack: React, TypeScript, Vite, Tailwind v4 tokens, React Aria Components.
- 2026-10-23 · Plan review: `Tooltip` moved to M2; M4 narrowed to the room shell, store and routing; flow-specific components built in M5; Lucide icons; self-hosted font; CI from M1; screenshot comparison via Playwright baselines.
- 2026-10-23 · 4px grid: spacing, sizes, radii and line heights are multiples of 4. Font sizes keep their scale (11 for uppercase labels, 12, 13, 14, 16, 18). Radius scale is 4 / 8 / 12 / 16 / full: the 6px step is removed and the canvas's 10px radius snaps to 8 (controls, chips) or 12 (cards, tiles, sheets). Line heights move to 16 / 20 / 24. 15px mobile text snaps to 14.
- 2026-10-23 · People status: Option A, as drawn in the Focus board's People panel (`O2StudentActions`): fixed mic and camera columns, grey except a live mic (green) or speaking (green badge and ring), and a second line only for raised hand or presenting. Muted and listening-only need clearly different icons (the `StatusList` board notes they look alike). Reference: `docs/screenshots/O2StudentActions.png` (cropped to the People panel).
- 2026-10-23 · Breakout setup (B10): keep the Breakout board's own setup panel (`BO2SetupGroups-desk`) as the structure: split type cards (Groups / One per student), room stepper with Spread evenly or Let students choose, time chips, option switches, Open rooms footer. The `BreakoutSetup` variants are not used. Review fixes still apply: X8 chips, B4 keep manual moves, B5 confirm open, B6 up to ~50 rooms. Reference: `docs/screenshots/BO2SetupGroups-desk.png` (cropped to the setup panel).
- 2026-10-23 · Text on the stage is white. Insight highlights stay purple, as one contrast-checked ramp.
