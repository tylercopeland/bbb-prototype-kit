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

## Build notes (2026-10-24, batch A)

Deviations from the plan above, each the smallest fix that keeps the intent. The full list, with the new tokens, is in `PLAN.md` › Decisions log.

- **Tokens:** `shadow-overlay` (the one elevation), `scrim` (no contrast pair: translucent, nothing drawn on it) and the `animate-*` overlay motion in `theme.css`. The base reduced-motion rule covers every overlay; verified by reading it, nothing added per component.
- **Popover:** `DialogTrigger` + `Popover` + `Dialog`. `title` is required and `titleHidden` keeps it as the accessible name while only the close button is drawn (Share media). `OverlayHeader` is exported from here and reused by Dialog and Sheet.
- **Dialog:** `ModalOverlay` + `Modal` + `Dialog`, `trigger` optional so routes can drive it from state. `ConfirmDialog` is the `alertdialog` for Leave, Remove and Open rooms: Cancel autofocused, confirming action primary in `tone`, scrim click does not dismiss, Escape does.
- **Sheet:** `ModalOverlay` + `Modal` + `Dialog` as planned, not React Aria's new `Sheet` (scroll-driven animation, `IntersectionObserver`, `ResizeObserver`; none in jsdom; swipe not needed yet). `position="bottom" | "end"`. A Sheet inside a Sheet keeps one scrim through a depth context (P4).
- **Menu:** no `label` prop, because React Aria names the menu by its trigger. Checkbox items are a `MenuSection selectionMode="multiple"`; the switch glyph is decoration and the menu stays open while toggling. `Submenu` is "Move to…". `onAction` is `(key, value)` in 1.22.1.
- **Toast:** React Aria's `UNSTABLE_Toast*` and `ToastQueue` are usable, so they are used, minus `ToastContent` (`role="alert"`, always assertive). Announcements go through `Announcer`. Min timeout 5 s; actions never time out.
- **Announcer:** `Announcer` provider + `useAnnouncer()`; outside a provider `announce` is a no-op so other components can call it freely. The docblock lists the polite and assertive events and the no-ticking-clock rule.
- **e2e:** `wait-for-overlay` tag in `e2e/stories.ts`, the same mechanism as `wait-for-tooltip`.

### Owner decisions needed (batch A)

1. **Overlays on the stage.** CLAUDE.md says everything that portals spreads `useSurfaceProps()`, so a popover, dialog, sheet or menu opened from the stage renders on the stage ramp (dark). The canvas draws the Plugins and Share media pickers, the student actions menu and every confirmation **white** over the dark stage. Keep the rule (consistent with tooltips), or make overlays always panels?
2. **Landscape sheet.** Built as a full-height side sheet at the end (`w-panel`), per the plan and the canvas notes ("sheets open from the right half so the slide stays visible"). The canvas itself draws a 380px bottom-anchored sheet on the right half (Mobile.dc.html 402). Confirm the side sheet for M6.
3. **Swipe to dismiss** on sheets: not built. React Aria's `Sheet` would give it; decide before M6.
4. **Toast position**: above the action bar, bottom center (`bottom-24`). The canvas has no toast; its "updates" pills live in the session header (M4's `AlertPill`).
5. **Dialog width** 416px (`max-w-104`) for the canvas's 420, and the dialog title at `text-lg` (16px) for the canvas's 22px, which is off the type scale.

## Build notes (2026-10-24, batch B)

Built as planned; no new tokens. Two hand-written utilities in `theme.css` and seven icons. The deviations, each the smallest fix that keeps the intent, are also in `PLAN.md` › Decisions log.

- **Utilities:** `focus-ring-within` draws the focus ring on a box when a `textarea` or `input` inside it is focus-visible (the composer); `group-focus-ring` draws it on a child of a focus-visible `.group` (the switch track, since React Aria marks the `<label>`). Both reuse the ring variables, nothing new in `tokens.json`.
- **Icons:** `send`, `increase`, `decrease`, `select`, `shapes`, `text`, `eraser`, each with a row in the Icons table.
- **Badge:** a `span` with `role="img"` named by `label` ("3 unread"), so digits never reach assistive technology without their unit. One style (X4): neutral is the inverted text-on-surface pair the tooltip uses, so it reads on a soft button, a tab and a chip in every mode; `urgent` is the danger fill; `inverted` swaps the neutral pair for a selected (dark) chip. 20px tall with 12px digits (the canvas's 17–18px with 10.5–11px is under the 12px minimum). "99+" above 99.
- **Tabs:** `Tabs`, `TabList`, `Tab`, `TabPanel`. One segmented style (D3) for People / Chat, Everyone / Direct and the stage's Slides / Screen; the canvas drew Everyone / Direct as pills. The selected segment lifts to the surface and carries the inset `selected-ring` as its non-color cue (the canvas's white on grey alone is 1.1:1). `Tab` takes `badge`, and a space between label and badge keeps the name "Chat 2 unread".
- **ChipGroup:** `RadioGroup` + `Radio` (X8). One chip look, the canvas pill (dark selected, inverted text), also used for the breakout durations the canvas drew blue; a `className="flex-1"` stretches them. The label is visible (the "Time" kicker) or `sr-only` (the People filters). The People filter counts are plain neutral badges, not the canvas's amber and purple (X4).
- **ToggleGroup:** `ToggleButtonGroup` around the existing `ToggleButton`s. In `single` mode React Aria makes it a radio group of `role="radio"` / `aria-checked` buttons; in `multiple` a toolbar of `aria-pressed` buttons. The arrow keys move focus only. The floating card is milestone 5's WhiteboardToolbar; the stories show it as a `className`.
- **Stepper:** `NumberField` + `Group` + two `IconButton`s in the `decrement` / `increment` slots + `Input`. React Aria names the buttons with the field label ("Fewer Rooms", "More Rooms"; the defaults are `Fewer` and `More`) and keeps them out of the tab order, as steppers are: the input takes ArrowUp / ArrowDown, PageUp / PageDown, Home / End and clamps on blur. 40px buttons (`lg`) as drawn, 44px on touch through `hit-area`; `size="touch"` for the phone.
- **TextField:** `TextField` + `Label` + `Input` + `Text` + `FieldError`. The label is always an element, visible or `sr-only`, so the name never rests on the placeholder. The error line is danger text with the `error` glyph and is linked while `isInvalid` (B8). The ring sits on the input (D2). `fieldStyles`, `fieldLabelStyles`, `fieldDescriptionStyles` and `fieldErrorStyles` are shared with TextArea.
- **TextArea:** the composer. One bordered box holds the `TextArea` and a `Send` IconButton (P5); the box rings through `focus-ring-within`, as the canvas's blue active border. Auto-grow is CSS (`field-sizing-content`, 24px lines, `max-h-40`, then scroll), no JavaScript measuring. **Enter sends, Shift + Enter adds a line**, Enter during IME composition is left alone; Send is disabled (still named and focusable) while the message is empty; uncontrolled it clears after sending. Escape does nothing so a sheet around it can close.
- **Switch:** `Switch` as the option row: one `<label>` around the hidden checkbox (P5), 48px tall with a hairline. The track is `border-control` off and `accent` on, the thumb moves 16px, the ring draws on the track (`group-focus-ring`). The second line is `aria-describedby` through a hidden-from-name span, not part of the name. Enter does not toggle (a native checkbox toggles on Space); the tests say so.
- **Button carry-over:** a truncated label shows its full text in a Tooltip on hover and focus. No observer: the tooltip trigger asks to open and the button measures `scrollWidth > clientWidth` at that moment. `LongLabel` autofocuses and is tagged `wait-for-tooltip`.
- **ToggleButton:** `badge` prop (count, label, tone) over the top-right corner with a `ring-offset` border; the label describes the button through hidden text, joined with "Speaking". `ActionBarOnStage` shows Chat with 2 unread; `WithBadge` shows neutral, 99+ and urgent.

### Owner decisions needed (batch B)

1. **One badge color.** Every count is the neutral inverted pill (dark on light panels, white on the stage); red only for `urgent`. The canvas drew the action-bar count blue, the People count amber and the insight count purple. Confirm, and say which counts (if any) are urgent: help requests, perhaps; unread chat is drawn neutral.
2. **Selected chip color.** Chips invert to text on surface as the canvas pill does; the breakout durations, which the canvas drew blue, use the same look. Alternatively the `selected` tokens (blue-50 / blue-600) as on the selected toggle. Pick one for every chip.
3. **Everyone / Direct** is the same segmented control as People / Chat, not a pair of pills. Confirm, or ask for a pill-tab variant.
4. **Selected segment cue.** The selected tab carries the inset `selected-ring` (as toggles do), because white on the sunken track is 1.1:1 on its own. Alternatives: an accent underline, or the `selected` fill as on the stage.
5. **Stepper button names.** React Aria names them "Fewer Rooms" / "More Rooms" (label + field label) and keeps them out of the tab order. Keep, or rename to "Fewer rooms" by passing the full label and accepting the doubled field name.
