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
- `src/tokens/tokens.json` — the only source of colors, type, radii and sizes. `npm run tokens` generates `src/tokens/tokens.css` from it (never edit the CSS); `src/tokens/contrast.json` lists the color pairs that `npm run tokens:check` verifies, so add a pair there for every new color.

## Stack

React + TypeScript (strict), Vite, Tailwind v4, React Aria Components, tailwind-variants, Storybook, Vitest, Playwright with @axe-core/playwright.

## Rules

### Tokens

- Use token utilities only: `bg-surface`, `text-text-muted`, `rounded-md`, `h-control-md`.
- Never write arbitrary values (`bg-[#…]`, `w-[13px]`, `[color:red]`, `text-text/[0.13]`, `p-3.25`), raw hex, color functions or `px` lengths in components, and no inline `style` except `var(--…)` values. If a value is missing, add it to `tokens.json` with a contrast check (a pair in `contrast.json`) and note it in `PLAN.md` › Decisions log.
- Anything on the dark video area sits inside `<Surface kind="stage">`, never a hand-written `data-surface` (lint rejects it outside `Surface`). `Surface` sets the attribute and provides a context. Tooltips inherit the stage surface through `useSurfaceProps()`; Popover, Dialog, Sheet, Menu and Toast always render as white panels (owner decision 2026-10-24) and wrap their content in the context-only `<SurfaceProvider kind="panel">`, so a tooltip inside one is a panel tooltip.
- Never a function-form `className` (`className={({ isPressed }) => …}`) or a bare variable (`className={cls}`): the Tailwind lint cannot see inside them. Put every class string in the component's `tv()` call and merge the consumer's class with `composeRenderProps(className, (cls) => xStyles({ …, className: cls }))`; the callback may only call a `*Styles()` result. Lint rejects function-form and bare-identifier `className` and non-`*Styles()` callbacks; it does not yet catch member, conditional, logical or template expressions (`className={s.c}`, `` `… ${x}` ``), where it still rejects raw hex and brackets but not unknown classes. Don't write those either.

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

Set in milestone 2. The reference components are `Tooltip`, `Button`, `IconButton`, `ToggleButton` and `Avatar` in `src/components/`; copy their structure, naming and variant style exactly.

```
src/components/<Name>/
  <Name>.tsx          the component. Its tv() styles live at the top of the file, exported as
                      <name>Styles so other components can tv({ extend }) them
  <Name>.stories.tsx  one story per variant × tone, per size, per state, and one on the stage
                      (globals: { surface: 'stage' }). Args mirror props
  <Name>.test.tsx     roles, names, keyboard (Tab, Enter, Space, Escape), aria state
  index.ts            export { Name, nameStyles } from './Name'; export type { NameProps } from './Name'
src/components/index.ts   barrel of barrels; app code imports components only through it
src/icons/index.ts        the meaning → icon map (`icons`, `IconName`) and <Icon>
src/shortcuts.ts          the keyboard-shortcut map and useAriaKeyshortcuts; nothing else hard-codes a key
src/styles/tv.ts          the project's tv(): tailwind-variants with the token scales in its merge config.
                          Components import `tv` from here, never from 'tailwind-variants'
```

Rules for the component file:

- **Build on the matching React Aria component.** Re-export its props type, minus what we fix (`Omit<RacButtonProps, 'className' | 'children'>`), and add ours. Every interactive component forwards `ref` (React 19: it is a prop), on its enabled and disabled paths; a control with a shortcut merges it in `useAriaKeyshortcuts(shortcut, ref)`, which also sets `aria-keyshortcuts` (React Aria's Button drops that attribute).
- **All class strings live inside one `tv({ base, variants, defaultVariants })` call** (slots are fine on a plain element such as Avatar; a React Aria component's root uses a slot-less `tv`, with a second `*Styles` for a chip or badge if needed). State styling uses React Aria data attributes in those strings (`data-hovered:`, `data-pressed:`, `data-selected:`, `data-disabled:`, `focus-ring`, `selected-ring`), never a function-form `className`.
- **Every component accepts `className` and merges it the same way.** On a React Aria component: `className={composeRenderProps(className, (cls) => buttonStyles({ variant, tone, size, className: cls }))}`, the only render-prop function allowed in `className`; its body must be a call to a `*Styles()` result and it only forwards `cls`. On a plain element: `className={xStyles({ …, className })}`. Because `tv` knows the token scales, a consumer's `rounded-full h-control-lg` replaces the component's radius and height instead of sitting next to them.
- **Shared sizes:** `Button` exports `buttonStyles`, the `ControlSize` type (`sm | md | lg | touch`, 32 / 36 / 40 / 44px) and `iconSizeFor(size)`; `IconButton` is `tv({ extend: buttonStyles, … })` and exports `iconButtonStyles`; `ToggleButton` is `tv({ extend: iconButtonStyles, … })`. Avatar has its own `sm | md | lg` (24 / 32 / 40px). Every component defaults its size the same way: in the destructuring (`size = 'md'`) and in `defaultVariants`.
- **Icon-only controls** take `label: string` (required; it becomes `aria-label`) and always render a `Tooltip` with the label and shortcut, with `labelHidden` so the description is the shortcut alone. When disabled they stay focusable and hoverable: a `aria-disabled` button inside `Focusable`, with no press handler, so the tooltip still names them. Text `Button`s are natively disabled. Icons are named by meaning (`icon="microphoneOff"`), never by Lucide export.
- **Toggles** (`ToggleButton`) keep a fixed label, expose state as `aria-pressed`, and mark the selected state with the inset `selected-ring` as well as the fill (never color alone; a Highlight border in forced colors). They fix `variant="soft"` and `tone="neutral"`, because every toggle on the canvas sits on the soft fill and the selected and speaking states carry the meaning; `selectedTone: 'accent' | 'hand'` recolors the selected state. `isSpeaking` adds the green ring, the `speaking` glyph and a hidden "Speaking" description.
- **Props follow React Aria's names:** `isSelected`, `isDisabled`, `defaultOpen`, `onChange`, `onPress`. Never `onClick`.
- **Tooltip** spreads `useSurfaceProps()` on its own element, so it keeps the stage colors when its trigger is on the stage. **Popover, Dialog, Sheet, Menu and Toast do not:** they always render as white panels (owner decision 2026-10-24) and wrap their content in `<SurfaceProvider kind="panel">`, so a tooltip on their close button or rows is a panel tooltip even when they were opened from the stage.
- **Every story file has a story named `Stage`**, plus any extra stage stories such as `ActionBarOnStage`, and every story must pass axe in light, dark and stage. `e2e/storybook.spec.ts` checks this automatically. A story that opens a tooltip on mount (`defaultOpen`) is tagged `wait-for-tooltip`; a story that autofocuses a control is waited for automatically.
- **Tests** use `render` and `userEvent.setup()`, and query with `getByRole` and the accessible name, never test ids. Every interactive component has Tab, Enter, Space and Escape tests and a forwarded-ref test. Hover tests move the pointer first (`user.pointer({ target: document.body })`), because React Aria treats hover as hover only in pointer modality.

## Scripts

| Script                                  | What it does                                                                                                                                                                                                                                                                                                      |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev` / `build` / `preview`     | Vite dev server, production build (`tsc -b` first), preview of `dist/`                                                                                                                                                                                                                                            |
| `npm run lint`                          | ESLint: token rules (arbitrary values, raw hex, unknown classes, including inside `tv()` objects; handlers on `div`/`span`; function-form or bare-variable `className`; `composeRenderProps` callbacks that do not call a `*Styles()`; `data-surface` outside `Surface`), hooks, Storybook                        |
| `npm run typecheck`                     | `tsc -b` over `src`, `.storybook`, `scripts` and the configs                                                                                                                                                                                                                                                      |
| `npm test`                              | Vitest (jsdom): unit tests plus `src/test/lint-rules.test.ts`, which proves the lint rules fire                                                                                                                                                                                                                   |
| `npm run test:e2e`                      | Builds the app and Storybook, then Playwright with axe (`wcag2a`, `wcag2aa`, `wcag21aa`) on `/` in light and dark, and on every story in light, dark and stage (waiting for the tooltip on stories tagged `wait-for-tooltip` or autofocused), plus `e2e/rings.spec.ts` for the selected, speaking and focus rings |
| `npm run storybook` / `build-storybook` | Storybook on port 6006 with the a11y panel and the theme and surface toolbars                                                                                                                                                                                                                                     |
| `npm run tokens`                        | Regenerates `src/tokens/tokens.css` from `tokens.json` (commit the result)                                                                                                                                                                                                                                        |
| `npm run tokens:check`                  | Contrast pairs from `contrast.json` in light, dark and stage, the required color families in every mode, the 4px grid, and that `tokens.css` is current                                                                                                                                                           |
| `npm run format`                        | Prettier (with the Tailwind class sorter)                                                                                                                                                                                                                                                                         |
| `npm run check`                         | `lint`, `typecheck`, `test`, `tokens:check`. The post-edit hook runs it after every edit (about 12 s)                                                                                                                                                                                                              |

## Working

- Run `npm run check` before saying something is done.
- When a milestone's build is finished, run the `reviewer` agent and fix what it finds before asking for review.
- Don't redesign. If a screenshot and a review finding conflict, follow the review finding and mention it. If something is ambiguous, ask.
- Keep `PLAN.md` current: tick exit criteria, log decisions.
