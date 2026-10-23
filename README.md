# BBB 4.0 prototype · Claude Code starter kit

Everything Claude Code needs to build the BigBlueButton 4.0 room prototype from the canvas, one milestone at a time.

## What's here

| File | Purpose |
|---|---|
| `PLAN.md` | Goal, definition of done, 7 milestones with exit criteria, decisions log |
| `CLAUDE.md` | Rules Claude Code follows every session: stack, tokens, accessibility, scale |
| `.claude/agents/reviewer.md` | Independent reviewer that checks work and never edits |
| `.claude/agents/component-builder.md` | Builds one component in isolation, for parallel work in milestone 3 |
| `.claude/settings.json` | Hook that runs `npm run check` after every edit once the project exists |
| `docs/artboards.md` | All 47 screens to reproduce, with the state each shows |
| `docs/review-findings.md` | Design and accessibility issues, as requirements with IDs |
| `docs/tokens.json`, `docs/theme.css` | Token source and the Tailwind v4 theme |
| `docs/canvas/project/` | Source of every artboard on the two prototype pages, plus the boards they render |
| `docs/screenshots/` | Optional PNGs for visual comparison |

## Before the first session

1. Put this folder in a new git repo: `git init && git add -A && git commit -m "Starter kit"`.
2. Optional: export a few key artboards as PNGs into `docs/screenshots/`.
3. Check `.claude/` made it into the repo. Browser uploads to GitHub skip hidden folders.
4. Delete the stray Assist paragraph from the low-engagement artboard on the live canvas. It's already removed from the copy in `docs/canvas/project/`.
5. Review "Open decisions" in `PLAN.md`. The token ones are needed in milestone 1; people status and breakout setup by milestone 4.

## First session

Open the folder in Claude Code, switch to plan mode, and send:

> Read PLAN.md and CLAUDE.md. We're starting milestone 1. Plan the scaffold, including generating the theme from docs/tokens.json with Style Dictionary, the token gaps listed in docs/review-findings.md, the arbitrary-value lint rule, and the Storybook a11y setup. Show me the plan before writing code.

## Every milestone after that

> Read PLAN.md and CLAUDE.md. We're on milestone N. Plan it, then build it. When you're done, run the reviewer agent and fix what it finds before asking me to review.

For milestone 3, ask Claude to use the `component-builder` agent, one component per git worktree, then merge.
