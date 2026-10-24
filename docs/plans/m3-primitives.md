# Milestone 3 "Primitive set": implementation plan (approved 2026-10-24)

## Context

Milestones 1 and 2 are merged into `main`. Milestone 3 builds the rest of the design-system primitives that milestones 4–6 assemble into screens. `PLAN.md` lists: `Popover`, `Dialog`, `Sheet`, `Menu`, `Tabs`, `ChipGroup`, `ToggleGroup`, `Stepper`, `TextField`, `TextArea`, `Switch`, `Badge`, `Toast` and an `Announcer`.

You want to keep credit use down, so this run differs from milestone 2:
- **No separate planning agent.** The pattern is already set in `CLAUDE.md` › Component pattern, and the builders derive the canvas details themselves.
- **Two build batches,** in sequence on one branch, instead of 14 parallel worktrees. That avoids the merge overhead and repeated set-up costs.
- **One reviewer pass at the end.** I fix the findings directly; there's no confirmation round.

The live canvas is unchanged (version 1792788314-4b91).

## Setup
- Branch `m3-primitives` from `main` (0c1f6b8).
- Save this plan as `docs/plans/m3-primitives.md`. Commit and push.

## Batch A: overlays and announcements (one Fable agent)

**`Popover`, `Dialog`, `Sheet`, `Menu`, `Toast` and `Announcer`**

| Component | React Aria base | Must do | Findings | Canvas source (agent finds exact lines) |
|---|---|---|---|---|
| Popover | `Popover` + `DialogTrigger` | focus in, Escape, focus back to trigger, visible close button, `useSurfaceProps()` | X1 | Plugins and Share media pickers (`Focus.dc.html`) |
| Dialog | `Modal` + `Dialog` | modal focus trap; title as accessible name; close button; confirm variant for Leave, Remove and Open rooms | X1, D5, B5 | confirmations (Breakout, Focus) |
| Sheet | `Modal` + `Dialog` | bottom sheet in portrait, side sheet in landscape; one stacking model with a single backdrop; close button | X1, P4 | `Mobile.dc.html` sheets |
| Menu | `MenuTrigger` + `Menu` | items, sections, checkbox items for switches (state announced), "Move to…" submenu support | X9, B2 | student actions menu (O2) |
| Toast | React Aria `UNSTABLE_Toast*` if usable in 1.22.1; otherwise a small region using `Announcer` | polite announcements, dismiss button, no auto-dismiss under 5s, respects reduced motion | X10 | alert pills and updates |
| Announcer | a context provider with `announce(message, 'polite' \| 'assertive')`, built on visually hidden live regions | never a ticking clock; documented call sites | X10 | — |

**Shared needs:**
- An overlay entry and exit motion that respects `prefers-reduced-motion`.
- Any new tokens (scrim and backdrop color, overlay elevation if any), added with contrast pairs.
- The `e2e/storybook.spec.ts` stories open overlays with `defaultOpen`, tagged so axe waits for them, the same mechanism as tooltips.

**The exit criterion is this batch's job:** add tests proving that Dialog, Popover and Sheet trap focus, close on Escape and return focus to the trigger.

## Batch B: inputs and selection (a second Fable agent, after A is pushed)

**`Tabs`, `ChipGroup`, `ToggleGroup`, `Stepper`, `TextField`, `TextArea`, `Switch` and `Badge`, plus the milestone 2 carry-over**

| Component | React Aria base | Must do | Findings |
|---|---|---|---|
| Tabs | `Tabs`/`TabList`/`Tab`/`TabPanel` | tabs above their panels, with arrow keys; segmented style for People/Chat and Everyone/Direct; an optional count badge | D3 |
| ChipGroup | `RadioGroup` + `Radio` styled as chips | single-select radio semantics (People filters, timer presets, durations) | X8 |
| ToggleGroup | `ToggleButtonGroup` | multi- or single-select pressed buttons (whiteboard tools) | — |
| Stepper | `NumberField` | − / value / + with a label; min and max; breakout rooms up to ~50 | B6 |
| TextField | `TextField` + `Input` + `Label` | visible label, or `aria-label` when visually hidden; error text; `focus-ring` | D2, B8 |
| TextArea | `TextField` + `TextArea` | the chat composer: auto-grow, Enter sends, Shift+Enter makes a new line (documented) | D2, P5 |
| Switch | `Switch` | the label row pattern (BO2 option rows); never nested inside a button | P5 |
| Badge | plain element with `tv()` | count badge: neutral by default, `urgent` red only; caps at "99+"; `aria-label` context | X4 |
| Button carry-over | — | a truncated Button label shows its full text in a tooltip | M2 log |

**Shared needs:** `Badge` composes onto `ToggleButton` (the panel button counts on the action bar). Add an `ActionBarOnStage` update with a count on Chat.

## Rules for both batches (in the builder prompt)
- **Follow `CLAUDE.md` › Component pattern exactly.** Copy the milestone 2 reference components. Every story file needs a `Stage` story, and every interactive component needs Tab, Enter, Space and Escape tests plus a forwarded-ref test.
- **Never copy raw canvas values:** map to tokens, and add any missing token with a contrast pair.
- **Keep `check` green after every edit** (the hook enforces this). Commit per component and push.
- **Ask, don't invent:** where the canvas is ambiguous, choose the option that matches the review findings and list it under "Owner decisions needed" in the report, rather than inventing visuals.
- **Report briefly:** commands with pass/fail, commits, deviations, decisions needed, and story IDs.

## Review and your sign-off
1. **One `reviewer` pass** over the whole milestone, after batch B.
2. **I fix the findings directly** in this session, as at the end of milestone 2.
3. **Screenshots for you:** an open popover, dialog and sheet (portrait and landscape) on the stage, the menu with checkbox items, tabs, chips, the stepper, the composer, switches, badges and a toast.
4. **You approve,** then I tick the boxes and merge into `main`.

## Verification
- `npm run check`, `npm run build` and `npm run test:e2e` pass. axe runs on every story in light, dark and stage, including the open overlays. CI is green.
- The overlay tests prove focus trap, Escape and focus return; this is milestone 3's second exit box.
- `PLAN.md`: milestone 3 boxes ticked, and decisions logged.
