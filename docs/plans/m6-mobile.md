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

## Build notes (2026-10-31, batch A)

Built as planned: MB1–MB10, MB15 and MB16 render `MobileRoomScreen` (`src/routes/screens.ts` › `MILESTONE_6A`); MB11–MB14 and MB17 keep the placeholder for batch B. Axe passes on all 17 phone routes at their artboard size (`npx playwright test e2e/routes.spec.ts -g "MB"`: 17 passed) and on every story of the changed and new components.

- **Screen (`src/routes/mobile/`):** `MobileRoomScreen` (portrait: one column, header → slide and pager → webcam band → bar; landscape: the same column without the band on the left, the band in a 288px column on the right; sheets `bottom` in portrait and `end` in landscape), `MobileActionBar` (People & chat toggle with the unread badge, Microphone / Join audio, Camera, React, More, Leave; a `nav` named "Actions" like the desktop's), `MobileStage` (`PresentationBlock`: the slide with Minimize over its corner and the pager under it — All slides, Previous, "3 / 12", Next, Annotate — shown to the presenter only; `WebcamBand`: the four top-ranked tiles in two columns and the "Speaker and raised hands first · +N · See all" row), `AlertsSheet`, `PeopleSheet` (the desktop `PeoplePanel` and `ChatPanel` in the sheet's tabs, plus the stacked `StudentSheet`), `ReactSheet`, `MoreSheet`, `EveryoneSheet`.
- **Store:** `ui.confirm` + `setConfirm` (`'none' | 'leave' | 'remove'`) and `setViewer` (moves `isSelf` to a participant); `initialState.ts` maps `role=student` to `setViewer('anton')` and `confirm=leave|remove` to `setConfirm` (remove opens the student sheet first). `removeParticipant` now falls back to the People sheet (`sheet: 'people'`) instead of closing everything. `keyboard=open` is left for batch B.
- **Components extended:** `Sheet` gets `frame` (wraps header, body and footer: the People sheet's `Tabs`), `stacked` (a sheet over this one, rendered outside the frame), `bodyClassName`, and the safe-area padding on its screen edge. `Dialog` exports `StackedOverlay`. `WebcamStrip` gets `direction="grid"` (16:9 tiles, two columns). `Stage` exports `StageSlide` with `webcams="below" | "beside"` (the phone's full-width and height-fitted slides, tighter padding, no reserved corner). `SessionHeader` gets `layout="stacked"`. `ParticipantRow` / `ParticipantList` / `PeoplePanel` get `canModerate`, `actionsVisible` and `onOpenActions(participantId, trigger)`. New components `TextToggle` (a toggle with a visible label, `selectedTone="hand"` for Raise hand) and `UpdatesPill` ("3 updates" with the stacked discs), each with stories (including `Stage`) and tests. Shared hooks: `useRoomFocusState` (focus.ts) and `useParticipantActions`, and `notInPrototype` moved to its own module, so the desktop and the phone share them.
- **Utilities (theme.css):** `pt-safe-*`, `pb-safe-*`, `pl-safe-*`, `pr-safe-*`, `px-safe-*` add `env(safe-area-inset-*)` to a spacing step (P2); the header, the band, the bar and the sheets use them. `container-size` (`container-type: size`), because Tailwind's `@container` is inline-size and `cqh` then falls back to the viewport: the landscape slide fits by the height its column leaves. **No new tokens.**
- **Focus (WCAG 2.4.3):** every sheet and the Leave confirmation carry a `FocusFallback` to the control that opens them, so a sheet opened from a deep link still hands focus back. The student sheet moves focus itself when it closes (to the row's ⋯ button, else the People tab) a tick after React Aria's restore, which lands on the People dialog for a trigger inside another modal; it does nothing when "Message" closes it, so the thread's composer keeps focus. Two overlays that mount in one render (a deep link to MB4 or `confirm=remove`) hid each other through React Aria's `ariaHideOutside`, which assumes the outer registered first: `StackedOverlay` mounts the inner one a tick later. React Aria's `Tabs` renders its children twice to build its collection, so a modal inside the tabbed frame portalled a ghost copy: `stacked` renders it outside the frame.
- **Review fixes:** P1 slide above the webcams; P2 safe areas; P3 pager below the slide, sheets sized per orientation (side sheets in landscape, the Everyone sheet full height in portrait); P4 one `Sheet` with one scrim, the stacked sheet draws none, the reaction tray is a sheet with a close button; P5 real `Switch` rows, real `Composer`, buttons for the chips; P7 tiles stay non-interactive, rows carry the actions (as desktop); P8 desktop vocabulary ("People and chat", "Updates", "Everyone", "Webcams"); P9 student view and the two confirmations; X1 every sheet has a close button, Escape closes, focus returns; X14 every control 44px (`size="touch"`, `hit-area`).
- **Deviations from the canvas:** (1) the pager and the "See all" button take the stage tokens (dark), as every control on the stage does since milestone 5; the canvas draws the pager white. (2) The Everyone sheet is a white panel with the tiles on a stage surface inside it; the canvas draws a dark sheet. (3) The Everyone sheet's grid has two columns, not three, so 48px avatars and names fit at 390px. (4) The alerts pill is 44px tall (canvas 34) and the pager's buttons 44px (canvas 34). (5) The slide keeps "3 / 12" in its corner (every viewer sees the slide number) and the pager shows only for the presenter. (6) "Make presenter", "Message" and the student sheet's switches follow the desktop ⋯ menu: the camera is a "Camera" switch rather than a "Turn off camera" action. (7) The More sheet's "Whiteboard" card and the "Shared notes" label use the desktop names ("Notes" on the canvas). (8) In landscape the slide fits by height (about 346×195 at 844×390), narrower than the canvas's 466px, because the header, the pager and the bar sit in the same column (P3). (9) The band keeps the canvas's four tiles in portrait and leaves the space under them empty; it shows every tile while the presentation is minimized, with a "Show presentation" button (the canvas's slide tile is batch B, MB13).
- **Interim pieces batch B replaces:** All slides opens the desktop `SlideOverview` dialog (MB11 wants a sheet); Annotate is a toggle that only records `ui.annotating` (MB12 draws the toolbar); the minimized presentation shows the band with every tile and "Show presentation" (MB13 / MB14 want the slide tile); `keyboard=open` is unmapped (MB17).
- **Timings:** `npm run check` takes about 49 s wall clock (vitest about 26 s of it, 660 tests); the post-edit hook runs it after every edit.

### Owner decisions needed (batch A)

1. **Raise hand lives in the React sheet** for the teacher and the student alike, as the canvas notes say ("React holds Raise hand"), as a full-width `TextToggle` with the hand tone. The bar stays at six controls in both views, so a raised hand is visible on your own tile and in the People list, not in the bar. Confirm, or give the student view a seventh bar control (a `ToggleButton` Raise hand, 7 × 44px fits 358px).
2. **A student sees no updates pill.** The alerts are the teacher's triage (hands to call on, a question to answer, the engagement insight), so the student's header has only the session info. Confirm, or show students the hands and questions.
3. **Students cannot turn the slides:** the pager shows for the presenter only; everyone sees the slide number on the slide. Confirm, or give students All slides as a read-only overview.
4. **More's items say "not part of this prototype yet"** in a toast after the sheet closes (Share media, Shared notes, Captions, Whiteboard, Breakout rooms, Poll, Timer, More plugins, Learning Analytics, Room settings): none of those flows is on the phone artboards. Confirm, or open the desktop pickers (MediaPicker, PluginsMenu, RoomSettings) in sheets.
5. **The People sheet is full height** in portrait (from 64px down), as the canvas draws it (`pcT = 92`), while Updates, React and More are as tall as their content. Confirm.
6. **Dark controls on the stage** (the pager, See all) and a white Everyone sheet with a dark tile area, following the milestone 5 decisions; the canvas draws a white pager and a dark Everyone sheet. Confirm.
7. **Help and "Breakouts ended" alerts** on the phone just close the Updates sheet: breakout rooms are not on the phone artboards. Confirm, or hide those two alerts from the phone's pill.
8. **The Everyone sheet's webcam list is tabbable** (axe's scrollable-region-focusable: the body scrolls and the tiles are not interactive). Confirm, or make the sheet body itself the tabbable scroll region in `Sheet`.
