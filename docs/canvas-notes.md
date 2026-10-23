# Canvas notes

The notes and section titles from the live canvas (https://claude.ai/code/artifact/faf03a8b-21a3-44b8-8eb2-d7585add6efa), copied 2026-10-23. They explain the design intent behind the artboards. Where a note conflicts with `docs/review-findings.md`, the review finding wins.

## Prototype - Desktop

Sections, top to bottom:

- People + chat: one panel, two tabs
- Share media: one button, every media type
- Presenter: switching between slides and a shared screen
- Breakout rooms: set up, watch and preview rooms
- Poll and timer: from Plugins, into the room

### How the panel works

- People and Chat open the same panel; segmented tabs at the top switch between them, and the bottom-bar button for the active tab lights up
- Chat has an Everyone / Direct switch. Direct lists private conversations, with unread ones highlighted
- Opening a conversation shows a private thread: a back arrow, a lock and ‘Direct message’ label, an ‘only you two can see this’ note, and a lock in the composer
- Every person in People has a ‘Message privately’ button that jumps straight to their thread

Try it in Play on any board: People tab → chat bubble on Frederick → back → Everyone.

Open question: should moderators be able to turn off private chat for a classroom? The thread note would then need to change.

### Share media

- Replaces the Share screen button in the media group. The icon is a plus in a frame
- Clicking it opens a white picker above the button. Types sit along the bottom: Slides, Video, Screen, Audio, URL, More
- Slides: Add slides plus your decks; the selected deck gets a blue border and check
- Screen: entire screen, a window or a browser tab (tabs can include audio)
- Video and URL: paste a link; Audio: share computer audio
- In the Command bar concept, Share media lives in the More grid

Try it in Play: click the media button, then switch types.

## Prototype - Mobile

Sections, top to bottom:

- Scaling down to a phone

### What changes on a phone

- Same model: top = information, bottom = action, slide first, webcams always visible
- Updates collapse into one dashed “3 updates” chip; tapping it opens a sheet where each update jumps to the people or chat view that resolves it
- Slide controls can’t rely on hover, so a small white pager sits under the slide (all slides · prev · 3/12 · next · annotate). Grid opens All slides, the pencil swaps the pager for a pen / highlighter / eraser toolbar with colours, Undo and Done, and the corner button minimizes the slide into a tile in the webcam grid (tap it to bring it back)
- Webcams sit on top, capped at four so faces stay readable: the speaker, then raised hands by longest wait, then recent activity. “+10 · See all” opens everyone. Minimizing the slide is the explicit “show me the class” mode, so it shows all 14
- Action bar: People & chat · Mic · Camera · React · More · Leave. React holds Raise hand, so the bar fits one thumb row
- People and Chat become one bottom sheet with the same tabs, filters and status icons as desktop. Tap a student for a second sheet with every teacher action
- Share media, notes, captions, breakout rooms, poll, timer, plugins, Learning Analytics and Room settings move into More

### Note

Landscape: the slide takes the left, webcams a two-column strip on the right, and controls sit under the slide. Sheets open from the right half so the slide stays visible.
