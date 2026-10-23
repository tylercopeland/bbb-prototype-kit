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
- [ ] `npm run check` passes locally and in CI; Storybook runs with the a11y panel. _2026-10-23: `check`, `build`, `test:e2e` and `build-storybook` pass locally. `a11y.test: 'error'` is set globally in `.storybook/preview.tsx` (it only annotates the panel; it runs nothing by itself), so `e2e/storybook.spec.ts` runs axe on every story in `index.json` in light, dark and stage, and `test:e2e` builds Storybook first. Left to tick: the first green CI run on `m1-foundations`, and a human opening Storybook to see the Accessibility tab._
- [x] A story that uses `bg-[#ff0000]` fails lint. _Verified 2026-10-23 by `src/test/lint-rules.test.ts` (runs in `check`) and by `eslint --stdin` on a story fixture, exit 1._
- [ ] Light, dark and `data-surface="stage"` themes switch in Storybook. Dark is a smoke test only: no artboard uses it, so it gets no design review. _2026-10-23: the theme and surface toolbars and the decorator are in `.storybook/preview.tsx`, every story passes axe in all three modes (`e2e/storybook.spec.ts`) and `tokens:check` proves every declared pair in all three modes. Not ticked until a person has looked at the Tokens story in each mode._

## Milestone 2 · Reference primitives (you review closely)

Build: `Tooltip`, `Button`, `IconButton` (with tooltip and shortcut hint), `ToggleButton` (mic and camera pattern), `Avatar` (initials, status badge, speaking ring), and an icon story listing the set with each icon's meaning.

Notes from the M1 review:
- Function-form `className` (React Aria render props) is not linted by `eslint-plugin-better-tailwindcss`; only the raw-string layer catches hex and brackets inside it. Route render-prop classNames through `tv()` with `composeRenderProps`, so every class string is a `tv()` argument the plugin resolves.
- `focus-ring` and `ring-speaking` both set `box-shadow`, so a focused speaking avatar shows only one of them. Decide the combined ring (for example a single utility that layers both) when `Avatar` is built.

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
- 2026-10-23 · M1 plan approved: `docs/plans/m1-foundations.md`. Branch `m1-foundations`, merged to `main` after review.
- 2026-10-23 · TypeScript pinned to 6.0.3, not 7: `typescript-eslint` 8.72 supports `<6.1`. Revisit when it supports 7.
- 2026-10-23 · `eslint-plugin-jsx-a11y` skipped (no ESLint 10 support). In its place a `no-restricted-syntax` rule makes `onClick`, mouse and key handlers on `div` and `span` an error; React Aria supplies the rest of the semantics. Revisit in M2.
- 2026-10-23 · Token modes live in `tokens.json` under `modes.dark` and `modes.stage` as sparse overrides of `semantic.color`, and `src/tokens/tokens.css` is generated by Style Dictionary (`npm run tokens`). `tokens:check` runs inside `check` and counts one check per contrast pair per mode (from `src/tokens/contrast.json`), one per required color family per mode, one per dimension on the grid, one per font size, and one freshness check of `tokens.css`; the summary line prints the breakdown.
- 2026-10-23 · Stage contrast fixes: on `data-surface="stage"`, `text-secondary` is neutral-300 (12.3:1 on stage-900; was neutral-800 at 1.8:1), `status-hand-text` is amber-400 (9.2:1; was amber-700 at 3.5:1), `status-live-text` is green-300 (9.4:1; was green-700 at 3.8:1) and `icon-subtle` is neutral-400.
- 2026-10-23 · Green tint `green-50` is `#edf9f2`, not the canvas's `#e6f6ee`: green-700 text reaches 4.55:1 on it (4.40 on the canvas value). Other tints: `amber-50 #fff8eb`, `red-50 #fdecea`. Icons on the amber tint use `status-hand-text`, never `status-hand` (1.9:1).
- 2026-10-23 · `blue-400 #5b8fe0` is a border and ring color only (the stage `selected-border`): white on it is 3.26:1, so never put text on it. Its `$description` says so.
- 2026-10-23 · New tokens from the review's gaps: purple insight ramp (`purple-50/100/300/500/600/700`; semantic `insight`, `on-insight`, `insight-text`, `insight-soft`), status tints (`status-live-soft`, `status-hand-soft`, `danger-soft`), selected pairs (`selected`, `selected-text`, `selected-border`), `border-control` (neutral-500 light, neutral-400 dark and stage), `room-1…8`, `avatar-9` `#006d8f` and `avatar-10` `#556b8a`. Every value is listed with its ratio in `docs/plans/m1-foundations.md` §5.
- 2026-10-23 · M1 review round: `data-surface="stage"` now overrides the panel surfaces, borders, `on-accent` and every soft tint onto the stage ramp (as dark does), keeping the stricter stage `selected` values; before this, white text sat on light tints inside the stage. Every semantic pair is declared in all three modes unless its note says why not (light text never sits on `surface-stage`; red-500 as an icon on the dark danger tint is 2.7:1, so icons on tints use `*-text`; the stage `selected-border` is checked against the stage surfaces around the row). `tokens:check` now fails when a `text*` on `surface*`, `on-X` on `X`, `X-text` on `X-soft` or `selected-text` on `selected` family is missing a mode. Tailwind's default `leading`, `tracking`, `shadow`, `inset-shadow`, `drop-shadow`, `container` and `font-weight` scales are reset; new tokens: `ring-offset` (the gap color of the focus and speaking rings: surface in light and dark, `surface-stage` on the stage), `page.max-width` 1152px (`max-w-page`) and `font.letterSpacing.label` 0.04em (`tracking-label`, for the 11px uppercase kicker only). `focus-ring` also sets a transparent 2px outline for forced-colors mode, and `ring-speaking` reads `--spacing-speaking-ring`.
- 2026-10-23 · Lint, after review: interpolated template literals (`` `bg-[#${c}]` ``), arbitrary properties (`[color:red]`), opacity modifiers (`text-text/[0.13]`), fractional spacing (`p-3.25`), color functions (`rgb()`, `oklch()` …), raw `px` lengths and any `style` value that is not `var(--…)` or `0` are errors; pointer and keyboard handlers are errors on every lowercase element except `button`, `a`, `input`, `select`, `textarea`, `label` and `summary`. Bracket groups followed by `:` (`data-[focus-visible]:`, `aria-[pressed=true]:`) and URL fragments in `href`/`to`/`id`/`src` are allowed. `src/test/lint-rules.test.ts` holds one fixture per case (23 rejected, 6 accepted). Tailwind's sources are registered explicitly (`source(none)`, then `src` and `.storybook` minus `src/test`), because automatic detection also read the Markdown docs and the fixture strings, and emitted their example classes into `dist`.
- 2026-10-23 · `tsconfig.app.json` keeps `node` in `types` instead of a separate test project: the test files import app sources (`App.test.tsx` renders `App`), and a referenced `composite` project cannot include another project's files without emitted declarations, which `noEmit` rules out. `tsconfig.node.json` now covers `e2e/` (with the DOM lib, for `page.evaluate` callbacks).
- 2026-10-23 · Deviations from the M1 plan while building: (1) `component.tile.speaking-ring` stays 2px and is exempt from the 4px grid gate, like `radius.full`: it is a stroke width, not layout. (2) The stage pair `selected-border` on `selected` (2.8:1) is not declared; on the stage the border is checked against `surface-stage` (5.8:1) and `surface-tile` (4.8:1), the colors around a selected row. (3) The `callees: ["tv","cn","clsx"]` setting for `eslint-plugin-better-tailwindcss` is left out: those three are in the plugin's defaults, which also lint the object values inside `tv({ base, variants })`, whereas a plain string list only matched string arguments (proved by the fixture test). (4) `surface-overlay` is written as `rgb(4 12 24 / 0.75)` in `tokens.json` so the generated CSS matches the old theme line for line. (5) `--font-weight-*` variables are emitted too, so `font-medium`/`font-semibold` resolve. (6) `tsconfig.app.json` lists `node` in `types` because the lint fixture test uses the ESLint Node API. (7) `playwright.config.ts` uses a pre-installed Chromium (`CHROMIUM_EXECUTABLE` or `/opt/pw-browsers/chromium`) when present outside CI; CI still runs `npx playwright install --with-deps chromium`.
