# Review findings

From a source review of the 47 screens on the **Prototype – Desktop** and **Prototype – Mobile** pages (2026-10-23). The review read the boards' code, not rendered images.

Treat these as requirements: build the fixed version. Each item has an ID so commits, tests and the reviewer agent can refer to it. "M#" is the milestone in `PLAN.md` where it gets fixed.

Source boards: **Focus** (all desktop screens except breakout 2–12), **Breakout** and **BreakoutSetup** (breakout 2–12), **Mobile** (all phone screens).

---

## Across all screens

| ID | Finding | Fix | M |
|---|---|---|---|
| X1 | Popovers, sheets and dialogs don't move focus, trap it, return it, or close on Escape. Plugins and Share media menus have no close button; on mobile, More and Updates close only via the backdrop. | One `Popover` / `Dialog` / `Sheet` set on React Aria, each with a visible close button. | 3 |
| X2 | The same control has different specs per screen: Leave is 44×44, 48×44 or radius 14; close buttons are 26–36px; media buttons 42, 44 or 48px. | One `IconButton` with sizes sm/md/lg/touch and one radius. | 2 |
| X3 | Three different "selected" styles (light blue fill, blue tint with blue text, inverted dark). | One selected token pair for light surfaces and one for the stage. | 1–2 |
| X4 | Chat badge is blue in the action bar, red on tabs. | One count-badge style; red only for urgent. | 3 |
| X5 | Icon-only buttons have no tooltips except the two personal buttons. | Tooltip on every icon button, with shortcut. | 2 |
| X6 | One grid icon means both "All slides" and "See all webcams"; Whiteboard and Annotate share a pencil; two different raised-hand icons. | One icon per meaning; record the set in Storybook. | 2–4 |
| X7 | Mic changes its label *and* its pressed state. | Fixed label ("Microphone"), state via pressed. | 2 |
| X8 | Single-select chips (timer presets, People filters, durations) built as toggles. | `ChipGroup` with radio semantics. | 3 |
| X9 | Switches in menus don't expose on/off. | Checkbox menu items. | 3 |
| X10 | No live regions anywhere; the session header (with a ticking clock) is a status region. | `Announcer`; take the clock out of live regions. | 3–5 |
| X11 | Contrast: #6b7280, #8a94a3, #9aa3af fail as text on tints; white fails on #e5484d (3.91) and #b7791f (3.64); borders, switch tracks and sheet handles ~1.4–1.6:1. | `text-muted` = #5b6574; danger fill #d93a2b or darker; control borders ≥3:1. | 1 |
| X12 | Speaking is only a green border; tiles never show mute. | Icon badge for speaking and muted on tiles. | 4 |
| X13 | Hover-only controls (row DM/More, presentation controls) can't be reached by touch. | Show on focus; always visible on touch. | 4 |
| X14 | Small targets: 34px used 26× on mobile; ink swatches 26px wide; row actions 26px. | 44px touch, `hit-area` for smaller visuals. | 2–6 |
| X15 | Counts and names hard-coded (14, 10, +9, "of 13", "3 / 12"); minimized grid fits exactly 15; no empty, error or loading states. | Data-driven from mock room state; stories at 0/1/14/30+. | 4 |

## Desktop (Focus board)

| ID | Finding | Artboards | Fix | M |
|---|---|---|---|---|
| D1 | Timer card defaults over the slide's top-right and poll results over its top-left; with alert pills and webcams the slide is never clear. | TM1–TM4, PL3 | Place floating cards outside the slide or in a reserved corner; keyboard way to move the timer (corner snap exists in the logic, unused). | 5 |
| D2 | Composer inputs set `outline:none` with no replacement; no focus-visible style anywhere. | G2–G5 | `focus-ring` utility on every interactive element. | 3 |
| D3 | Tabs (panel, chat scope, media) have no tab panels; media tabs sit below their content. | G1–G5, H1–H2 | `Tabs` with panels, tabs above content. | 3 |
| D4 | Insight pill reads "3 low engagement" but is announced as a longer sentence (label mismatch). | L1 | Accessible name starts with the visible text. | 4 |
| D5 | React does nothing; Leave has no handler or confirmation. | F1 | Wire both; confirm Leave. | 5 |
| D6 | DM names and alert pills don't truncate. | G3–G5 | Truncate with tooltip. | 4 |
| D7 | Unrelated paragraph about an Assist template is pasted into the artboard. | L1 | Delete from the canvas; don't reproduce. | — |

## Breakouts (Breakout, BreakoutSetup boards)

| ID | Finding | Artboards | Fix | M |
|---|---|---|---|---|
| B1 | Moving every student out of a room crashes the live view; no empty-room state. | BO3, BO5 | Empty-room state; never assume a room has members. | 5 |
| B2 | Move is click-to-move (good) but focus is lost after a move, the "Move here" buttons appear elsewhere with no announcement, no Escape to cancel. | BO3 | "Move to…" `Menu` on each student, focus stays on the student, result announced. | 5 |
| B3 | Help request is fixed to "Room 2"; in solo mode it opens the wrong student's room; no queue or acknowledge. | BO6, BO8 | Help queue from data, sorted first, acknowledge and clear. | 5 |
| B4 | "Even out", "Shuffle" and changing room count erase manual moves silently. | BO2–BO4 | Rebalance instead of reset, or confirm with undo. | 5 |
| B5 | Opening rooms has no confirmation; closing starts the countdown immediately ("Keep open" works as undo). | BO2, BO10 | Confirm open; make clear the close countdown is running; announce it. | 5 |
| B6 | Room count capped at 2–6; "13" hard-coded; solo mode with 30 students is 30 cards. | BO2, BO4, BO7 | Support up to ~50 rooms; condensed list for solo; filter and sort. | 4–5 |
| B7 | Solo setup cards say "Room N", live cards use the student's name; solo live cards have no Join or preview. | BO4, BO7 | One naming rule; same actions in both modes. | 5 |
| B8 | Message fields are not real inputs; Send, Join and close-panel have no handlers. | BO6, BO8 | Real `TextField` and wired buttons. | 5 |
| B9 | Avatar initials at 8.5–9px; first-name-only pills make two "Ana"s indistinguishable. | BO2–BO4 | 12px minimum; disambiguate duplicate names. | 4 |
| B10 | Three setup variants exist (wizard, sentence, toolbar) with different controls. | BreakoutSetup | Pick one before milestone 5. | — |

## Mobile (Mobile board)

| ID | Finding | Artboards | Fix | M |
|---|---|---|---|---|
| P1 | Portrait puts webcams above the slide and gives them more space; slide is 366×206 with an empty band below. | MB1 | Slide on top, webcams below. | 6 |
| P2 | Insets are fixed pixels; no safe-area handling; landscape bar overlaps the home indicator; notch assumed on the left. | MB8, MB9, MB14 | `env(safe-area-inset-*)`. | 6 |
| P3 | Landscape pager sits on top of the slide; side sheet covers the slide's right edge; Everyone sheet uses portrait geometry. | MB8, MB9, MB10 | Pager below slide; sheets sized per orientation. | 6 |
| P4 | Only 2 of 7 sheets have dialog semantics; Student opens over People with two backdrops; reaction tray has no backdrop. | MB2–MB7, MB10–MB11 | `Sheet` with one stacking model and one backdrop. | 3, 6 |
| P5 | Chat composer is a span; send and channel chips are spans; switches are nested inside buttons. | MB4, MB5 | Real `TextField`, buttons, `Switch` rows. | 6 |
| P6 | Slide thumbnail titles 9px; several labels 10.5–11px. | MB11 | 12px minimum. | 6 |
| P7 | Webcam tiles can't be tapped but participant rows can. | MB1, MB10 | Decide and make consistent. | 6 |
| P8 | Names vary from desktop: "Everyone" means three things; "3 updates" vs "Updates"; "Webcams" vs "cams". | all | One vocabulary shared with desktop. | 4 |
| P9 | Missing: student/attendee view (teacher sees "Raise hand"), keyboard-open chat, confirm Leave and Remove, reconnecting, screen share on phone, landscape versions of Student, More, Slides, Alerts. | — | Add as states or log as out of scope. | 6 |

## Token gaps (fix in milestone 1)

Colors the boards use repeatedly that `tokens.json` doesn't cover yet:

- **Purple "insight" family** — 9 values in use (#5b3fb0, #7c5cc4, #a78bfa, #f3effa …). Add a ramp or remap insights to blue.
- **Status tints** — light green, amber and red backgrounds (#dcf5e6, #e6f6ee, #fff3dc …).
- **Selected on dark** — #e6eef9 / #0f1b2b and the #5b8fe0 focus/selected blue used on the stage.
- **Text on stage** — #e6edf5 is used often; decide between it and white.
- **Room palette** — breakout rooms are told apart by color; needs about 8 categorical colors that pass with white text.
- **Avatar palette** — boards use 9–10 colors; tokens have 8.
- **10px radius** — the most-used radius on two boards; add it rather than snap to 8 or 12.
- **15px text** on mobile — decide: add it or snap to 14/16.

Snap everything else: 12.5 / 13.5 / 14.5px text → nearest step; 30 / 34 / 38 / 42px controls → 32 / 36 / 40 / 44; radii 7 / 9 / 11 / 14 → 8 / 10 / 12 / 16; half-height pills → `full`.
