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
- **Focus (WCAG 2.4.3):** every sheet and the Leave confirmation carry a `FocusFallback` to the control that opens them, so a sheet opened from a deep link still hands focus back. The student sheet moves focus itself when it closes (to the row's ⋯ button, else the People tab), and its cancelled Remove confirmation back to the Remove button, through `focusAfterOverlay` (focus.ts): React Aria's restore lands on the enclosing dialog for a trigger inside another modal, and its focus containment re-focuses that dialog a frame later, so the move runs a tick later and settles over the next frames; it does nothing when "Message" closes the sheet, so the thread's composer keeps focus. Two overlays that mount in one render (a deep link to MB4 or `confirm=remove`) hid each other through React Aria's `ariaHideOutside`, which assumes the outer registered first: `StackedOverlay` mounts the inner one a tick later. React Aria's `Tabs` renders its children twice to build its collection, so a modal inside the tabbed frame portalled a ghost copy: `stacked` renders it outside the frame.
- **Review fixes:** P1 slide above the webcams; P2 safe areas; P3 pager below the slide, sheets sized per orientation (side sheets in landscape, the Everyone sheet full height in portrait); P4 one `Sheet` with one scrim, the stacked sheet draws none, the reaction tray is a sheet with a close button; P5 real `Switch` rows, real `Composer`, buttons for the chips; P7 tiles stay non-interactive, rows carry the actions (as desktop); P8 desktop vocabulary ("People and chat", "Updates", "Everyone", "Webcams"); P9 student view and the two confirmations; X1 every sheet has a close button, Escape closes, focus returns; X14 every control 44px (`size="touch"`, `hit-area`).
- **Deviations from the canvas:** (1) the pager and the "See all" button take the stage tokens (dark), as every control on the stage does since milestone 5; the canvas draws the pager white. (2) The Everyone sheet is a white panel with the tiles on a stage surface inside it; the canvas draws a dark sheet. (3) The Everyone sheet's grid has two columns, not three, so 48px avatars and names fit at 390px. (4) The alerts pill is 44px tall (canvas 34) and the pager's buttons 44px (canvas 34). (5) The slide keeps "3 / 12" in its corner (every viewer sees the slide number) and the pager shows only for the presenter. (6) "Make presenter", "Message" and the student sheet's switches follow the desktop ⋯ menu: the camera is a "Camera" switch rather than a "Turn off camera" action. (7) The More sheet's "Whiteboard" card and the "Shared notes" label use the desktop names ("Notes" on the canvas). (8) In landscape the slide fits by height (about 346×195 at 844×390), narrower than the canvas's 466px, because the header, the pager and the bar sit in the same column (P3). (9) The band keeps the canvas's four tiles in portrait and leaves the space under them empty; it shows every tile while the presentation is minimized, with a "Show presentation" button (the canvas's slide tile is batch B, MB13).
- **Interim pieces batch B replaces:** All slides opens the desktop `SlideOverview` dialog (MB11 wants a sheet); Annotate is a toggle that only records `ui.annotating` (MB12 draws the toolbar); the minimized presentation shows the band with every tile and "Show presentation" (MB13 / MB14 want the slide tile); `keyboard=open` is unmapped (MB17).
- **Timings:** `npm run check` takes about 49 s wall clock (vitest about 26 s of it, 660 tests); the post-edit hook runs it after every edit.

### Owner decisions needed (batch A) — approved as built 2026-11-01

1. **Raise hand lives in the React sheet** for the teacher and the student alike, as the canvas notes say ("React holds Raise hand"), as a full-width `TextToggle` with the hand tone. The bar stays at six controls in both views, so a raised hand is visible on your own tile and in the People list, not in the bar. Confirm, or give the student view a seventh bar control (a `ToggleButton` Raise hand, 7 × 44px fits 358px).
2. **A student sees no updates pill.** The alerts are the teacher's triage (hands to call on, a question to answer, the engagement insight), so the student's header has only the session info. Confirm, or show students the hands and questions.
3. **Students cannot turn the slides:** the pager shows for the presenter only; everyone sees the slide number on the slide. Confirm, or give students All slides as a read-only overview.
4. **More's items say "not part of this prototype yet"** in a toast after the sheet closes (Share media, Shared notes, Captions, Whiteboard, Breakout rooms, Poll, Timer, More plugins, Learning Analytics, Room settings): none of those flows is on the phone artboards. Confirm, or open the desktop pickers (MediaPicker, PluginsMenu, RoomSettings) in sheets.
5. **The People sheet is full height** in portrait (from 64px down), as the canvas draws it (`pcT = 92`), while Updates, React and More are as tall as their content. Confirm.
6. **Dark controls on the stage** (the pager, See all) and a white Everyone sheet with a dark tile area, following the milestone 5 decisions; the canvas draws a white pager and a dark Everyone sheet. Confirm.
7. **Help and "Breakouts ended" alerts** on the phone just close the Updates sheet: breakout rooms are not on the phone artboards. Confirm, or hide those two alerts from the phone's pill.
8. **The Everyone sheet's webcam list is tabbable** (axe's scrollable-region-focusable: the body scrolls and the tiles are not interactive). Confirm, or make the sheet body itself the tabbable scroll region in `Sheet`.

## Build notes (2026-10-31, batch B)

Built as planned: MB11–MB14 and MB17 render `MobileRoomScreen` (`src/routes/screens.ts` › `MILESTONE_6B`), so every artboard, desktop and phone, has a screen and `App.test.tsx` proves no placeholder remains (the placeholder itself is still tested, rendered on its own). Axe passes on all 17 phone routes at their artboard size (`npx playwright test e2e/routes.spec.ts -g "MB"`: 17 passed), the twelve touch walks of `e2e/mobile.spec.ts` pass, and every story of the changed components (WhiteboardToolbar, Stage, WebcamStrip, Sheet, SlideOverview) passes axe in light, dark and stage.

- **MB11, All slides (`SlidesSheet`):** the pager's All slides button (`aria-haspopup="dialog"`, `aria-expanded`) opens a `Sheet` named "All slides" with the slide count beside the title ("3 / 12", named "Slide 3 of 12") and the deck's `SlideThumb`s three to a row, the current one with the selected border and `aria-current`. Picking one dispatches `goToSlide` and closes the sheet; focus returns to the button, also from a deep link (`FocusFallback`). `SlideThumb` is now exported from `SlideOverview`, so the desktop popover and the phone sheet share one thumbnail (12px captions, P6). The interim desktop popover is gone from the phone.
- **MB12, Annotate:** the Annotate toggle (fixed label, `aria-pressed`) swaps the pager for the desktop `WhiteboardToolbar` under the slide, in a new `size="touch"` (44px tools and inks, X14) and `wrap` mode (two rows in the 358px column, the hairline hidden). The slide takes the `selected-ring` as the canvas's blue outline and loses its Minimize button while drawing (the canvas's `notAnnot`). The toggle stays in the same place in both states, so toggling off keeps focus on it; Escape ends annotating when no sheet or confirmation is open (a capture-phase listener, so a tool's open tooltip goes with the toolbar instead of eating the key) and moves focus to the toggle only when it was inside the toolbar. The tool and ink go through `setTool` / `setInkColor`, the same store fields as the desktop. Drawing itself is not built (as on desktop: no strokes, no undo).
- **MB13 / MB14, minimized:** the band shows everyone with the presentation first as a `PresentationTile` (exported from `Stage`, now also the desktop grid's cell) in a new `variant="button"`: the whole cell is the Restore button, named by its visible plate ("Presentation · 3 / 12, restore", WCAG 2.5.3) with the restore glyph in its corner, so a small cell still has a 44px target. `WebcamStrip` grows `columns` (2 / 3 / 5) and `leading` (a list item before the tiles); the list is named "Webcams and minimized presentation" like the desktop grid's. Portrait: three columns; landscape: the screen goes back to one column, five tiles a row across the width and the bar centred at the portrait bar's width (`w-panel`), as the canvas draws it. Minimize hands focus to the tile and Restore hands it back to Minimize through two new focus requests (`presentationRestore`, `presentationMinimize`), since each button unmounts with the other's appearance (WCAG 2.4.3). The interim "Show presentation" row is gone.
- **MB17, keyboard-open chat:** `ui.keyboardInset` (px) + `setKeyboardInset`; `keyboard=open` maps to `KEYBOARD_INSET` = 336, a fixed fake, so the screenshot is deterministic. `useKeyboardInset` (`src/routes/mobile/keyboard.ts`) writes the inset to `--bbb-keyboard-inset` on the document and keeps it current from `visualViewport` (`innerHeight − height − offsetTop`, on `resize` and `scroll`); a zero before any keyboard was seen is ignored, so a window resize never flattens the fake, while a real keyboard going down still clears it. The new `pb-keyboard` utility pads every `Sheet` overlay's bottom by the variable, so the sheet and its composer end above the keyboard (the e2e walk checks both end at or above 508px on the 844px screen). `ChatPanel` gets `autoFocusComposer`, which `PeopleSheet` sets while the keyboard is up, so the composer holds focus on the route. React Aria defers a modal's reveal on a touch device while an autofocused field may open the keyboard (`runAfterKeyboard`), so the sheet appears about 300 ms after load; `visual.spec.ts` waits for that hidden state to clear before a shot.
- **e2e:** `e2e/mobile.spec.ts` runs with `hasTouch` and `isMobile`, each route at its artboard size through the new `gotoArtboard` helper (`e2e/helpers.ts`, which also exports `readArtboards`), every press a `tap()`: every sheet opened and closed with Close and focus back on its control; the student sheet's switch (tapped on its label, as a thumb would), Remove → Cancel → focus on Remove → Remove, People keeping focus; React → Raise hand → a reaction, the hand and the reaction on your tile; More → Poll's toast; Leave → Cancel; All slides → a pick; Annotate on and off and Escape, with 44px measured; Minimize and Restore with the focus hand-offs; MB14's five columns; MB17's composer above the keyboard and a sent message; MB15's raised hand. `visual.spec.ts` adds the 17 phone routes at their sizes as `mobile-<stem>.png` (no collision with the desktop names), and each group skips until its own baselines exist, so the desktop ones keep comparing while the phone waits for the update-snapshots workflow.
- **No new tokens.** One new utility, `pb-keyboard`. The keyboard inset is a measured length written as a CSS variable from `useKeyboardInset` (`style.setProperty`), not a token: it is whatever the device reports.
- **Deviations from the canvas:** (1) the canvas's "Done" button ends annotating; here the pressed Annotate toggle does (fixed label, X7), and Escape as well, so no second control is needed. (2) The canvas's toolbar has three tools, four inks and Undo; the desktop toolbar's six tools and six inks are reused unchanged (one toolbar), with no Undo (no undo state, as on desktop). (3) The minimized tiles stay 16:9 like every tile (the canvas's 124px rows are squarer), so in portrait the presentation tile's plate truncates to "Presentation…"; its full name is on the button. (4) The All slides sheet's count sits in the header beside the title, as the canvas draws it; the thumbnails carry the number and title under the paper as on desktop (the canvas's number alone is 12px, P6). (5) In landscape with the presentation minimized the bar is 360px wide (the portrait bar's width), not the canvas's 466px: no token is that size and six 44px controls fit.
- **Timings:** `npm run check` takes about 43 s wall clock (vitest about 26 s, 667 tests, 43% of it jsdom environment setup across 69 files). The batch's new tests run 0.2–1 s each, like batch A's; no heavy render or real timer stands out, and the slowest single tests remain the lint-rules test and `RoomScreen`'s route-level flows.

### Owner decisions needed (batch B) — approved as built 2026-11-01

1. **Annotate ends with the toggle or Escape, not a "Done" button.** The pressed Annotate toggle stays where the pager's pencil was and ends the mode; the canvas draws a blue "Done" at the toolbar's end instead. Confirm, or add Done beside the toggle.
2. **The phone reuses the desktop toolbar as is:** six tools and six inks, no Undo, wrapped onto two rows at 44px each. The canvas draws three tools, four inks and Undo in one 34px row. Confirm, or pick a phone subset (Pen, Highlighter, Eraser; four inks).
3. **Drawing is not built.** The toolbar's state changes, the slide carries the ring, but tapping the slide draws nothing (as on desktop). Confirm it stays out of the prototype.
4. **The minimized presentation tile is one whole-tile button** ("Presentation · 3 / 12, restore"), the canvas's model, which keeps a 44px target in a 115px cell; tiles of people stay non-interactive (P7). Confirm.
5. **Landscape minimized goes back to one column** (five tiles a row, the bar centred at 360px), as the canvas draws it, rather than keeping the two-column landscape with the tiles in the right column. Confirm.
6. **The fake keyboard is 336px** (`keyboard=open`), and a measured zero is ignored until a keyboard was seen, so a desktop window resize never flattens the deep link. Confirm the height, or pick another phone's.
7. **Every sheet shrinks above the keyboard,** not only the chat sheet (`pb-keyboard` on the Sheet overlay). Confirm.

## Review fixes (2026-10-31)

The reviewer's findings after batch B, fixed on `m6-mobile`:

- **Updates sheet rows (blocking, WCAG 1.4.11):** each row now takes its kind's soft fill with a dashed border in the kind's text color, as the canvas tints them (Mobile.dc.html 263, 497–499): hands `bg-status-hand-soft` + `border-status-hand-text`, question `bg-accent-soft` + `border-accent`, insight `bg-insight-soft` + `border-insight-text`, help `bg-danger-soft` + `border-danger-text`, back `bg-status-live-soft` + `border-status-live-text`. The `*-text` tokens are the borders because the fills do not pass in dark mode (`insight` is 2.4:1 on the dark tint); every border is at least 3:1 on its tint and on the sheet in light, dark and stage through pairs that already existed. **No new tokens.** Fifteen pairs added to `contrast.json`: `text`, `text-muted` and `icon-subtle` on the five soft tints (title, second line, chevron). Hover and press turn the border solid instead of swapping the fill away.
- The row chevron is the `submenu` icon (ChevronRight); the question row's title comes from the alert's sender (`names[from.id] ?? from.name`, "Someone" without one), not a regex on its text; `AlertPill` exports `alertPillKindIcon` and the rows reuse it.
- **Stories and tests** for every variant batch B added: `Sheet` `frame`, `stacked` and `bodyClassName`; `WebcamStrip` `direction="grid"` with 2, 3 and 5 columns and `leading`, at 0, 1, 14 and 30 people; `PresentationTile variant="button"` (named "Presentation · 3 / 12, restore", Enter, Space, forwarded ref) and `StageSlide webcams="below" | "beside"`; `SessionHeader layout="stacked"`; `ParticipantRow` and `ParticipantList` with `canModerate={false}` and the sheet-opening ⋯ (`onOpenActions`, `aria-haspopup="dialog"`). Every story file keeps its `Stage` story; axe passes in light, dark and stage.
- **e2e (`e2e/mobile.spec.ts`):** MB9 opens People as a side sheet on the right edge of the landscape screen and Close returns focus to the bar; a tap on the scrim above the More sheet dismisses it with focus back on More; MB16 cancels Leave back onto Leave; `?confirm=remove` opens the student sheet and the Remove confirmation together, Cancel lands on Remove from session, Remove takes the person out with focus kept in People.
- The phone's ⋯ reports a real `aria-expanded`: `PeoplePanel` passes `ui.sheet === 'student' ? ui.sheetStudent : null` as the open row when `onOpenActions` is set. `MoreSheet` drops its unused `rowIcon` slot (the Learning Analytics row keeps the ghost button's icon color).
