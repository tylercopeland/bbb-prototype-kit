# BigBlueButton 4.0 room prototype

A clickable prototype of the redesigned BigBlueButton room, built from the design canvas, with its design system in Storybook.

Deployed on Vercel:

- **Prototype:** _add the Vercel URL here_
- **Storybook:** the same URL followed by `/storybook/`, also linked from the prototype's index page

## For reviewers

### What to try

- **Start at the index.** It lists all 50 screens: 33 desktop (1400×900) and 17 phone (390×844, or 844×390 in landscape). Each opens the room in the state of one canvas artboard, and from there the room is live: open panels, raise and lower hands, chat, share, run a poll or a timer, set up and run breakout rooms.
- **Phone screens.** Open a `/mobile/…` link on a phone, or use your browser's device toolbar at 390×844. Every sheet closes with its close button, Escape or a tap outside.
- **Keyboard only.** Every flow works with Tab, Enter, Space, Escape and the arrow keys. Focus moves into each dialog and sheet, and back to the control that opened it. Icon buttons show their name and shortcut in a tooltip.
- **A screen reader.** Status is never color alone, and chat messages, raised hands, help requests, poll answers, the timer finishing and rooms closing are announced.
- **Scale.** Add a query parameter to any screen:
  - `?people=thirty`, `one`, `four`, `longNames` or `duplicateNames` changes who's in the room.
  - `?chat=empty` empties the chat.
  - `?clock=live` lets the clock run: the timer counts down and "raised 3 min" ages.
- **Dark mode and the stage.** Storybook's toolbar switches every component between light, dark and the dark video stage.

### What's mocked

There is no server, audio or video. The room is one in-browser store, seeded with the canvas's class of 14 people. Video tiles show avatars, and the clock stands still unless you add `?clock=live`. Reload to reset.

While a screen is open, you can play the other participants from the browser console, through `bbbRoom`:

```js
bbbRoom.dispatch({ type: 'raiseHand', participantId: 'anton' })
bbbRoom.dispatch({ type: 'sendMessage', from: 'rafaela', text: 'Can you repeat the last slide?' })
bbbRoom.dispatch({ type: 'requestHelp', roomIndex: 0, from: 'bruno' }) // while breakout rooms run; 0 is Room 1
bbbRoom.getState() // the whole room state
```

The participant ids are the first names in lower case (`bruno`, `rafaela`, `cibelle`, `octavio`, `frederick`, `anton`, `michelle`, …). The actions are listed in `src/mocks/reducer.ts`.

### Known gaps

- **Not built:**
  - drawing on the slide (the whiteboard toolbar works, the canvas doesn't)
  - the phone's reconnecting state and phone screen sharing
  - the landscape versions of the phone's student, More, slides and updates sheets
- **Stubbed controls** show an "isn't part of this prototype yet" message instead:
  - sharing a video, computer audio or a URL, and the blank whiteboard
  - every plugin except breakout rooms, poll and timer
  - the Learning Analytics Dashboard
  - the items on the phone's More sheet
- **Where the build differs from the canvas,** it follows `docs/review-findings.md` or an owner decision. Each one is listed in `PLAN.md` › Decisions log.

## For contributors

This repo was built with Claude Code, one milestone at a time. `PLAN.md` has the milestones and decisions, and `CLAUDE.md` the rules every session follows.

### Deploying

The site deploys on Vercel. Import the GitHub repo as a new Vercel project. `vercel.json` sets the build, which builds the app and Storybook into `dist/`, with Storybook at `/storybook/`. It also rewrites every other path to the app, so links straight to a screen, such as `/desktop/F1Bar-4roh-l8ju` or `/mobile/MB1Room`, load it. Nothing needs setting in Vercel's dashboard. Each push to `main` redeploys.

To host the app under a subfolder somewhere else, build with `BASE_PATH=/folder/`.

GitHub Actions runs CI on every push. On a private repo those minutes count against your GitHub plan's allowance, and each push uses roughly 10–15 of them.

### What's here

| File | Purpose |
|---|---|
| `PLAN.md` | Goal, definition of done, 7 milestones with exit criteria, decisions log |
| `CLAUDE.md` | Rules Claude Code follows every session: stack, tokens, accessibility, scale |
| `.claude/agents/reviewer.md` | Independent reviewer that checks work and never edits |
| `.claude/agents/component-builder.md` | Builds one component in isolation, for parallel work in milestone 3 |
| `.claude/settings.json` | Hook that runs `npm run check` after every edit once the project exists |
| `docs/artboards.md` | All 50 screens to reproduce (47 from the canvas, 3 phone states added in milestone 6), with the state each shows |
| `docs/review-findings.md` | Design and accessibility issues, as requirements with IDs |
| `src/tokens/tokens.json` | Token source (DTCG, with light, dark and stage modes). `npm run tokens` generates `src/tokens/tokens.css`; `contrast.json` lists the checked color pairs |
| `src/styles/theme.css` | Tailwind v4 entry: fonts, the generated tokens, and the hand-written utilities and base styles |
| `docs/plans/` | The approved implementation plan for each milestone |
| `docs/canvas/project/` | Source of every artboard on the two prototype pages, plus the boards they render |
| `docs/screenshots/` | Optional PNGs for visual comparison |

### Running it

Node 22 (`.nvmrc`), then `npm ci`. `npm run dev` serves the prototype, `npm run storybook` the design system, and `npm run check` runs lint, typecheck, unit tests and the token gate. `npm run test:e2e` needs a Chromium (`npx playwright install chromium`, or a pre-installed one at `/opt/pw-browsers/chromium` or `CHROMIUM_EXECUTABLE`). Every script is described in `CLAUDE.md` › Scripts.

### First session (milestone 1: done)

Open the folder in Claude Code, switch to plan mode, and send:

> Read PLAN.md and CLAUDE.md. We're starting milestone 1. Plan the scaffold, including generating the theme from docs/tokens.json with Style Dictionary, the token gaps listed in docs/review-findings.md, the arbitrary-value lint rule, and the Storybook a11y setup. Show me the plan before writing code.

### Every milestone after that

> Read PLAN.md and CLAUDE.md. We're on milestone N. Plan it, then build it. When you're done, run the reviewer agent and fix what it finds before asking me to review.

For milestone 3, ask Claude to use the `component-builder` agent, one component per git worktree, then merge.
