# Milestone 6 · Mobile flows

Approved 2026-10-31. Two sequential Fable batches on `m6-mobile`, one reviewer pass after batch B, one fix round.

## Scope

The 17 phone artboards in `docs/artboards.md` › Prototype - Mobile: the canvas's 14 (`MB1Room`–`MB14LandMin`, source board `docs/canvas/project/Mobile.dc.html`) and the P9 core set (`MB15Attendee`, `MB16Confirm`, `MB17KeyboardChat`), routes at 390×844 or 844×390.

Owner decisions (PLAN.md › Decisions log, 2026-10-31):
- **P9 core set:** the student (attendee) view, the confirm dialogs for Leave and Remove, and the keyboard-open chat. Reconnecting, phone screen share and the landscape variants of Student, More, Slides and Alerts are out of scope.
- **No swipe to close.** Sheets close with their visible close button, Escape or a tap outside.
- Earlier decisions that apply here: overlays (sheets, menus, dialogs, toasts) are white panels; landscape sheets are full-height side sheets (`Sheet position="end"`, `w-panel`); cards and controls on the stage take the stage tokens (dark); join audio muted; one neutral badge style.

Changes from the canvas, agreed in the review (PLAN.md › Milestone 6):
- In portrait the slide sits above the webcams.
- In landscape the pager sits below the slide.
- `env(safe-area-inset-*)` replaces the canvas's fixed insets, through a utility in `theme.css` (P2).
- Every target is at least 44px (`size="touch"` or `hit-area`).
- Every sheet has a visible close button.

Read `docs/review-findings.md` for every finding marked milestone 6 (P1–P9 and any X rows that touch the phone) and build the fixed version.

## Reuse

Reuse rather than fork. Extend a component with a prop or variant only when the phone really differs. The components to reuse:
- **Overlays:** `Sheet` (bottom and end, stacking), `Dialog`/`ConfirmDialog`, `Menu`, `Popover`, `Toast`.
- **Room and stage:** `ActionBar`, `SessionHeader`, `AlertPill`, `Stage`, `VideoTile`, `WebcamStrip`.
- **People and chat:** `ParticipantList`/`ParticipantRow`, `ChatMessage`, `Composer`, `DMList`, `Tabs`, `ChipGroup`.
- **Media and slides:** `ReactionTray`, `SlideOverview`, `WhiteboardToolbar`, `PresentationControls`.

The routes in `src/routes/room/` (`RoomScreen`, `PeoplePanel`, `ChatPanel`, `focus.ts`, `useRoomShortcuts`) are the desktop patterns to follow: focus requests, panel toggles, announcements. The store already has `ui.orientation`, `ui.sheet`, `ui.sheetStudent`, `reacting` and `annotating` (`setOrientation`, `setSheet`, `setReacting`, `setAnnotating`), and `initialState.ts` maps `orient`, `sheet` and `annot`.

New props, already in `KNOWN_PROPS.Mobile`, are to be mapped in `stateForArtboard` through store actions:
- `presmin=min` is the existing minimize action.
- `role=student` makes the viewer a student, with Raise hand instead of moderator controls, through a viewer/role field in the store if there isn't one.
- `confirm=leave|remove` opens the matching confirmation.
- `keyboard=open` means the chat composer is focused with the keyboard up.

## Batch A · phone shell and sheets

Build `MobileRoomScreen` (portrait and landscape) and register it for MB1–MB10, MB15 and MB16.

- **Portrait:**
  - the session header, the alert pill ("3 updates")
  - the slide above the webcam strip
  - the bottom action bar with Microphone, Camera, People & chat, React, More and Leave, as on the Mobile board
- **Landscape:**
  - the slide, with the pager below it, and the webcams beside it
  - the bar along the side or bottom, as on the board
- **Sheets:**
  - alerts (MB2)
  - People & chat with tabs (MB3, MB5)
  - student actions (MB4, a sheet over the People sheet, with checkbox switches and Remove confirming)
  - React + raise hand (MB6)
  - More (MB7)
  - the landscape People side sheet (MB9)
  - everyone (MB10, all cameras)

  Focus moves in on open; Escape and the close button close a sheet, and focus returns to the trigger. A stacked sheet draws no second scrim.
- **MB15:** the student's own view. Raise hand is a toggle (`selectedTone="hand"`). There are no moderator actions in the rows or More.
- **MB16:** Leave asks first (`ConfirmDialog`, alert dialog, Cancel autofocused). `confirm=remove` shows the Remove confirmation.
- Safe areas: add the utility, apply it to the bar, the header and the sheets.
- Unit tests per screen, and stories for any new component.
- Run `npm run check`. Push often.

## Batch B · presentation states, keyboard chat, e2e

- **MB11:** the All slides sheet (`SlideOverview` in a sheet).
- **MB12:** annotate. The pencil opens the whiteboard toolbar on the slide.
- **MB13 / MB14:** the presentation minimized, in portrait and landscape, with Restore.
- **MB17:** the chat sheet with the keyboard open. Size the sheet from `visualViewport` (or `dvh`) so the composer stays above the keyboard. The route fakes the keyboard height through the prop, so the screenshot is deterministic.
- **e2e:**
  - `e2e/mobile.spec.ts` at phone size with touch emulation (`hasTouch`, `isMobile`): tap through each flow (open and close every sheet, student actions and Remove confirm, react and raise hand, more, leave confirm, slides, annotate, minimize and restore, chat send)
  - assert focus returns to the trigger after each close
  - axe already runs on every route through `routes.spec.ts`
- Extend `e2e/visual.spec.ts` to the mobile routes at their artboard size. Leave the baselines to the update-snapshots workflow; never run `--update-snapshots` locally.
- Extend `App.test.tsx` so no `/mobile/` placeholder remains.

## Exit (PLAN.md › Milestone 6)

- [ ] Each phone artboard has a route at 390×844 or 844×390.
- [ ] Playwright runs the flows at phone size with touch emulation.

## Batch reports

Each batch appends "Build notes (batch X)" here, covering:
- what was built
- deviations from the canvas
- tokens or utilities added (also in PLAN.md › Decisions log)
- an "Owner decisions needed" list
