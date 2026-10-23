# Artboard index

The screens the prototype must reproduce, from the **BigBlueButton 4.0 — Current vs Improved** canvas.
Each row is one artboard. "Source board" is the large board it renders, and "State" is the props it is shown with, which map directly to the routes or story args you build.

Every state here was checked against the `<dc-import>` props in `docs/canvas/project/` (2026-10-23). The canvas source is the main reference: Claude Code reads it for copy, layout and state logic, but can't render it, because the boards only run inside the design canvas. For visual comparison, export key artboards as PNGs into `docs/screenshots/`, named by file stem (for example `MB1Room.png`).

## Prototype - Desktop

| # | Artboard | File | Size | Source board | State |
|---|---|---|---|---|---|
| 1 | 6 · Insight → People filtered to low engagement | `L1LowEngagement-qeqx` | 1400×900 | Focus | layout=bar panel=people pfilter=low |
| 2 | Presenter · sharing screen, Screen tab | `M1ShareScreen-k5tp` | 1400×900 | Focus | layout=bar panel=none share=screen |
| 3 | Presenter · sharing screen, Presentation tab | `M2ShareDeck-581i` | 1400×900 | Focus | layout=bar panel=none share=deck |
| 4 | Presenter · All slides overview | `N1Overview-xpbk` | 1400×900 | Focus | layout=bar panel=none overview=open |
| 5 | A · Action bar | `F1Bar-4roh-l8ju` | 1400×900 | Focus | layout=bar panel=none |
| 6 | 1 · People tab (clicked People) | `G1People-my6z` | 1400×900 | Focus | layout=bar panel=people scope=everyone |
| 7 | 2 · Chat tab · Everyone | `G2ChatEveryone-gqvt` | 1400×900 | Focus | layout=bar panel=chat scope=everyone |
| 8 | 3 · Chat tab · Direct conversations | `G3ChatDirect-56ch` | 1400×900 | Focus | layout=bar panel=chat scope=direct |
| 9 | 4 · Direct message with Rafaela | `G4DmRafaela-gtn4` | 1400×900 | Focus | layout=bar panel=chat scope=direct dm=rafaela |
| 10 | 5 · New direct message started from People | `G5DmFromPeople-ogjp` | 1400×900 | Focus | layout=bar panel=chat scope=direct dm=frederick |
| 11 | Share media · Slides (action bar) | `H1MediaSlides-2x0x` | 1400×900 | Focus | layout=bar panel=none media=open mtype=slides |
| 12 | Share media · Screen (action bar) | `H2MediaScreen-ez5s` | 1400×900 | Focus | layout=bar panel=none media=open mtype=screen |
| 13 | Teacher · Learning Analytics Dashboard entry point | `O1Analytics` | 1400×900 | Focus | layout=bar lxtip=show |
| 14 | Teacher · student actions (hover a person → ⋯) | `O2StudentActions` | 1400×900 | Focus | layout=bar panel=people pmenu=anton |
| 15 | Breakout · 1 · Plugins → Breakout rooms | `BO1Entry-desk` | 1400×900 | Focus | layout=bar panel=none plugins=open |
| 16 | Breakout · 2 · Set up groups (4 rooms, spread evenly) | `BO2SetupGroups-desk` | 1400×900 | Breakout | phase=setup mode=groups rooms=4 |
| 17 | Breakout · 3 · Move a student between rooms | `BO3SetupMove-desk` | 1400×900 | Breakout | phase=setup mode=groups rooms=4 moving=ana |
| 18 | Breakout · 4 · One room per student | `BO4SetupSolo-desk` | 1400×900 | Breakout | phase=setup mode=solo |
| 19 | Breakout · 5 · Rooms live: watch every group | `BO5LiveGroups-desk` | 1400×900 | Breakout | phase=live mode=groups rooms=4 |
| 20 | Breakout · 6 · Preview a group room (asked for help) | `BO6PeekGroup-desk` | 1400×900 | Breakout | phase=live mode=groups rooms=4 peek=1 |
| 21 | Breakout · 7 · Rooms live: 13 individual rooms | `BO7LiveSolo-desk` | 1400×900 | Breakout | phase=live mode=solo |
| 22 | Breakout · 8 · Preview an individual room | `BO8PeekSolo-desk` | 1400×900 | Breakout | phase=live mode=solo peek=2 |
| 23 | Breakout · 9 · Rooms live, teacher flips back to Presentation | `BO9MainView-desk` | 1400×900 | Breakout | phase=live mode=groups rooms=4 view=main |
| 24 | Breakout · 10 · Close rooms: 60-second wrap-up | `BO10Closing-desk` | 1400×900 | Breakout | phase=live mode=groups rooms=4 closing=yes |
| 25 | Breakout · 11 · Everyone is back in the main room | `BO11Back-desk` | 1400×900 | Breakout | phase=back mode=groups rooms=4 |
| 26 | Breakout · 12 · Show a room’s work to everyone | `BO12ShareBack-desk` | 1400×900 | Breakout | phase=back mode=groups rooms=4 onstage=1 |
| 27 | Poll · 1 · Set up from Plugins → Poll | `PL1Setup` | 1400×900 | Focus | layout=bar panel=poll poll=setup |
| 28 | Poll · 2 · Answers coming in (only you see them) | `PL2Live` | 1400×900 | Focus | layout=bar panel=poll poll=live |
| 29 | Poll · 3 · Results shown to everyone | `PL3Shown` | 1400×900 | Focus | layout=bar panel=poll poll=shown |
| 30 | Timer · 1 · Added from Plugins → Timer | `TM1Ready` | 1400×900 | Focus | layout=bar timer=ready |
| 31 | Timer · 2 · Running (interactive: start, pause, +1 min, move) | `TM2Running` | 1400×900 | Focus | layout=bar timer=running |
| 32 | Timer · 3 · Minimized to a pill | `TM3Min` | 1400×900 | Focus | layout=bar timer=min |
| 33 | Timer · 4 · Time’s up | `TM4Done` | 1400×900 | Focus | layout=bar timer=done |

## Prototype - Mobile

| # | Artboard | File | Size | Source board | State |
|---|---|---|---|---|---|
| 1 | Phone · room (teacher presenting) | `MB1Room` | 390×844 | Mobile | orient=portrait sheet=none |
| 2 | Phone · tap “3 updates” | `MB2Updates` | 390×844 | Mobile | orient=portrait sheet=alerts |
| 3 | Phone · People & chat sheet | `MB3People` | 390×844 | Mobile | orient=portrait sheet=people |
| 4 | Phone · tap a student → actions | `MB4Student` | 390×844 | Mobile | orient=portrait sheet=student |
| 5 | Phone · Chat tab | `MB5Chat` | 390×844 | Mobile | orient=portrait sheet=chat |
| 6 | Phone · React + raise hand | `MB6React` | 390×844 | Mobile | orient=portrait sheet=react |
| 7 | Phone · More sheet | `MB7More` | 390×844 | Mobile | orient=portrait sheet=more |
| 8 | Phone landscape · room | `MB8Landscape` | 844×390 | Mobile | orient=landscape sheet=none |
| 9 | Phone landscape · People sheet | `MB9LandscapePeople` | 844×390 | Mobile | orient=landscape sheet=people |
| 10 | Phone · See all → everyone | `MB10Everyone` | 390×844 | Mobile | orient=portrait sheet=cams |
| 11 | Phone · All slides (grid button) | `MB11Slides` | 390×844 | Mobile | orient=portrait sheet=slides |
| 12 | Phone · Annotate (pencil) | `MB12Annotate` | 390×844 | Mobile | orient=portrait sheet=none annot=on |
| 13 | Phone · Presentation minimized | `MB13Minimized` | 390×844 | Mobile | orient=portrait sheet=none presmin=min |
| 14 | Phone landscape · Presentation minimized | `MB14LandMin` | 844×390 | Mobile | orient=landscape sheet=none presmin=min |
