# BigBlueButton 4.0 room prototype

A live prototype and design system for the redesigned BigBlueButton room. Read `PLAN.md` for the goal and the current milestone before doing anything.

## Reference material

- `PLAN.md` — goal, milestones, exit criteria, decisions. Tick boxes when exit criteria are met.
- `docs/artboards.md` — every screen to reproduce, with the state it shows.
- **The live canvas is the design source of truth:** https://claude.ai/code/artifact/faf03a8b-21a3-44b8-8eb2-d7585add6efa. At the start of each milestone, read it with the Artifact tool and compare its `project/` files with `docs/canvas/project/`. If anything changed, update the copy, `docs/artboards.md` and `docs/canvas-notes.md` in the same commit, and say what changed.
- `docs/canvas-notes.md` — the canvas's notes and section titles: the design intent behind each flow.
- `docs/canvas/project/` — a copy of the canvas source. Each `.dc.html` is one artboard; most are small wrappers that render a big board (`Focus`, `Mobile`, `Breakout`) with props, and those props are the state to reproduce. Read the big boards for exact copy, layout and state logic. They only render inside the design canvas, so don't try to open them in a browser. `RoomCurrent`, `RoomImproved`, `Shell`, `RailRoom`, `StatusList` and `BreakoutSetup` are on the canvas's Components page: explorations and token sources, not screens to build.
- `docs/screenshots/` — optional PNGs of key artboards, named by file stem, for visual comparison.
- `docs/review-findings.md` — problems found in the design. Treat them as requirements: build the fixed version, not the flawed one.
- The canvas source uses about 200 off-token values. Never copy a raw value from it: map it to the nearest token, or add a token with a contrast check.
- `docs/tokens.json` (later `src/tokens/tokens.json`) — the only source of colors, type, radii and sizes.

## Stack

React + TypeScript (strict), Vite, Tailwind v4, React Aria Components, tailwind-variants, Storybook, Vitest, Playwright with @axe-core/playwright.

## Rules

### Tokens
- Use token utilities only: `bg-surface`, `text-text-muted`, `rounded-md`, `h-control-md`.
- Never write arbitrary values (`bg-[#…]`, `w-[13px]`) or raw hex in components. If a value is missing, add it to `tokens.json` with a contrast check and note it in `PLAN.md` › Decisions log.
- Anything on the dark video area sits inside `data-surface="stage"`.

### Accessibility
- Every interactive element is built on a React Aria component. No `onClick` on `div` or `span`.
- Icon-only buttons need `aria-label` **and** a `Tooltip` showing the name and shortcut.
- Toggles keep a fixed label and expose state with `isSelected` (aria-pressed). Never change the label and the pressed state together. Mic is "Microphone", camera is "Camera".
- Single-select chips (filters, presets, durations) are a radio group (`ChipGroup`), not toggle buttons.
- Menu switches use checkbox menu items so their state is announced.
- Dialogs, popovers and sheets: focus moves in on open, Escape closes, focus returns to the trigger, every one has a visible close button.
- Status is never color-only. Speaking, muted and raised hand each have an icon or text.
- Announce changes through `Announcer`: polite for chat messages, raised hands, help requests, poll answers; assertive for the timer finishing and rooms closing. Never put a ticking clock in a live region.
- Minimum text size 12px (11px only for uppercase section labels). Text 4.5:1, icons and control borders 3:1.
- Touch targets 44px. Smaller visual sizes use the `hit-area` utility.
- Controls that appear on hover must also appear on focus and be reachable on touch.
- Respect `prefers-reduced-motion`.

### Scale
- No hard-coded counts or names in components. Everything comes from props or the mock room state.
- Every list handles 0, 1, 14 and 30+ items and long names (truncate with a tooltip showing the full name).

### Routes and state
- One mock room-state store (`src/mocks/`) is the single source of meeting state. Components read it through props or hooks, never their own copies.
- Each artboard is a route: `/desktop/:artboard` and `/mobile/:artboard`, named by the file stem in `docs/artboards.md`. The artboard's props (for example `?panel=people&pfilter=low`) set the store's initial state, so every screen can be deep-linked.
- Playwright and axe loop over one route list generated from `docs/artboards.md`; don't hand-maintain a second list.

## Component pattern

Filled in during milestone 2, after the reference primitives are approved. Until then, follow the rules above and ask before inventing a pattern.

<!-- Example of what goes here:
src/components/IconButton/
  IconButton.tsx         component, variants via tailwind-variants
  IconButton.stories.tsx every variant, size, state; args mirror props
  IconButton.test.tsx    keyboard and role tests
  index.ts
-->

## Working

- Run `npm run check` before saying something is done.
- When a milestone's build is finished, run the `reviewer` agent and fix what it finds before asking for review.
- Don't redesign. If a screenshot and a review finding conflict, follow the review finding and mention it. If something is ambiguous, ask.
- Keep `PLAN.md` current: tick exit criteria, log decisions.
