# Milestone 1 "Foundations": implementation plan

Approved 2026-10-23. Drafted by a planning agent and reviewed. The package versions and contrast ratios below were verified on that date.

**Amendments made at approval:**
- Add a lint rule rejecting `onClick` (and other pointer handlers) on `div` and `span` (see §7, layer 3), because `eslint-plugin-jsx-a11y` is skipped.
- Accepted: fix the three failing stage colors, change the green tint to `#edf9f2`, and use `blue-400` as a border and ring color only.
- Branch: `m1-foundations`. Merge to `main` after review.

## 0. Findings that shape the plan

- **TypeScript 7.0.2 is `latest` on npm, but `typescript-eslint` 8.72.0 needs `typescript >=4.8.4 <6.1.0`.** Pin **TypeScript 6.0.3**.
- **`eslint-plugin-jsx-a11y` 6.10.2 only supports ESLint up to 9**, and ESLint `latest` is 10.13.0. Skip jsx-a11y; React Aria supplies semantics, and the custom rule in §7 covers clickable `div`s.
- `docs/tokens.json` already has `primitive.font.lineHeight`. What it lacks compared with `docs/theme.css`: the light, dark and stage mode overrides, `--spacing: 4px`, and the `white`/`transparent`/`current` colors.
- The hook in `.claude/settings.json` greps for `'"check"'`. A script named `"tokens:check"` doesn't match, so the hook stays dormant until the literal `"check"` key is added. The hook runs `npm run --silent check` after every Edit/Write, so `check` must exclude Playwright and be fast.
- The existing `[data-surface="stage"]` block has contrast holes: `text-secondary` (neutral-800 on stage-900) is **1.82:1**, `status-hand-text` (amber-700) is **3.45:1** and `status-live-text` (green-700) is **3.81:1**. These are fixed in the stage mode (values below). Dark `border-strong` (stage-500 on stage-700) is 1.44:1, but it's decorative only; `border-control` is the ≥3:1 border.

## 1. Ordered steps (hook-safe)

The literal `"check"` script is added **last**, after every sub-script passes by hand. Until then the hook does nothing.

1. Create `.gitignore`, `.nvmrc` (`22`) and `package.json` **without** `check`: name, `"type": "module"`, `"private": true`, and scripts `dev`, `build`, `preview`, `lint`, `typecheck`, `test`, `test:e2e`, `storybook`, `build-storybook`, `tokens`, `tokens:check`, `format`.
2. `npm install` with exact pins (§2). Then `npx playwright install chromium` (local only).
3. **Tokens:**
   - `git mv docs/tokens.json src/tokens/tokens.json`.
   - Add the gaps and modes (§4–5), and add `src/tokens/contrast.json`.
   - Write `scripts/build-tokens.ts` and `scripts/tokens-check.ts`.
   - `npm run tokens` generates `src/tokens/tokens.css`; `npm run tokens:check` must pass.
   - `git mv docs/theme.css src/styles/theme.css`, then trim sections 1–2 down to an `@import "./tokens.css"`.
4. **Vite, React, Tailwind and fonts:** `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx` (a token swatch page, so e2e and axe have something to scan) and `src/styles/theme.css`. `npm run build` must pass.
5. **TypeScript:** `tsconfig.json` (solution), `tsconfig.app.json` and `tsconfig.node.json`. `npm run typecheck` must pass.
6. **ESLint and Prettier:** `eslint.config.js`, `.prettierrc` and `.prettierignore`. `npm run lint` must pass.
7. **Vitest:** `vitest.config.ts`, `src/test/setup.ts`, `src/App.test.tsx` and `src/test/lint-rules.test.ts` (the fixture test in §7). `npm test` must pass.
8. **Storybook:** `.storybook/main.ts`, `.storybook/preview.tsx` and `src/tokens/Tokens.stories.tsx`. `npm run storybook` shows the a11y panel and two toolbars.
9. **Playwright and axe:** `playwright.config.ts` and `e2e/smoke.spec.ts`. `npm run test:e2e` must pass locally.
10. **CI:** `.github/workflows/ci.yml`.
11. **Only now**, add `"check": "npm run lint && npm run typecheck && npm run test && npm run tokens:check"` to `package.json`. Run `npm run check` by hand first, because the Write that adds it triggers the hook, which must pass.
12. **Update the docs in the same commit:**
    - `CLAUDE.md`: the tokens path becomes `src/tokens/tokens.json`; list the new scripts.
    - `PLAN.md`: tick the exit criteria, and log decisions (token values, the TypeScript 6 pin, jsx-a11y skipped, the stage contrast fixes).
    - `README.md`: update the table row for `docs/tokens.json, docs/theme.css`.

## 2. Packages (pin exact versions)

**dependencies:** `react 19.3.1`, `react-dom 19.3.1`, `react-aria-components 1.22.1`, `tailwind-variants 3.3.1`, `lucide-react 1.61.0`, `@fontsource/source-sans-3 5.3.1`. Use this static package, which keeps the family name "Source Sans 3". The `-variable` package registers "Source Sans 3 Variable", which would break the token.

**devDependencies:** `vite 8.3.5`, `@vitejs/plugin-react 6.1.2`, `typescript 6.0.3`, `@types/react 19.3.0`, `@types/react-dom 19.3.0`, `@types/node 26.6.5`, `tailwindcss 4.3.3`, `@tailwindcss/vite 4.3.3`, `storybook 10.6.3`, `@storybook/react-vite 10.6.3`, `@storybook/addon-a11y 10.6.3`, `@storybook/addon-docs 10.6.3`, `vitest 5.0.5`, `jsdom 30.1.3`, `@testing-library/react 16.3.3`, `@testing-library/jest-dom 7.0.1`, `@testing-library/user-event 14.6.8`, `@playwright/test 1.64.1`, `@axe-core/playwright 4.14.0`, `eslint 10.13.0`, `@eslint/js 10.0.1`, `typescript-eslint 8.72.0`, `eslint-plugin-react-hooks 7.1.1`, `eslint-plugin-react-refresh 0.5.7`, `eslint-plugin-storybook 10.6.3`, `eslint-plugin-better-tailwindcss 4.10.0`, `globals 17.13.0`, `prettier 3.9.10`, `prettier-plugin-tailwindcss 0.8.1`, `style-dictionary 5.7.0`, `tsx 4.23.15`.

**Not installed:**
- `@storybook/addon-vitest`: it needs `@vitest/browser-playwright`. Defer until stories get checked with axe in bulk.
- `eslint-plugin-jsx-a11y`: it doesn't support ESLint 10.
- `@storybook/addon-themes`: a custom decorator is about 20 lines and also handles `data-surface`.

If an exact version fails to resolve, use the nearest patch release and note it in the report.

## 3. File tree

```
.github/workflows/ci.yml
.storybook/main.ts
.storybook/preview.tsx
e2e/smoke.spec.ts
scripts/build-tokens.ts          Style Dictionary build (custom format)
scripts/tokens-check.ts          contrast and 4px grid gate
src/tokens/tokens.json           moved from docs/, extended
src/tokens/contrast.json         declared pairs and thresholds
src/tokens/tokens.css            GENERATED (committed; its header says do not edit)
src/tokens/Tokens.stories.tsx    swatches, type and radius story (exercises all three modes)
src/styles/theme.css             @import tailwindcss, fonts, ./tokens.css; hand-written utilities and base styles
src/test/setup.ts                jest-dom for vitest
src/test/lint-rules.test.ts      proves bg-[#ff0000], raw hex and onClick-on-div fail lint
src/App.tsx, src/App.test.tsx, src/main.tsx, src/vite-env.d.ts
index.html, vite.config.ts, vitest.config.ts, playwright.config.ts
eslint.config.js, .prettierrc, .prettierignore
tsconfig.json, tsconfig.app.json, tsconfig.node.json
package.json, package-lock.json, .gitignore, .nvmrc
```

Removed: `docs/tokens.json` and `docs/theme.css` (both moved).

## 4. Token restructuring (modes in DTCG, plus Style Dictionary)

**Shape of `tokens.json`:** keep `primitive`, `semantic` and `component`. Add a fourth top-level group, `modes`, holding sparse overrides whose keys mirror `semantic.color`:

```json
"modes": {
  "$description": "Sparse overrides of semantic.color. light = semantic values. Emitted as [data-theme=dark] and [data-surface=stage].",
  "dark":  { "color": { "$type": "color", "surface": { "$value": "{primitive.color.stage.700}" } } },
  "stage": { "color": { "$type": "color", "text":    { "$value": "{primitive.color.neutral.0}" } } }
}
```

Add `primitive.space.base: 4px`, emitted as `--spacing`. Emit `--color-white`, `--color-transparent` and `--color-current` as fixed lines in the format's header, because they're Tailwind plumbing, not design values.

**`scripts/build-tokens.ts`** (run with `tsx`) uses a custom name transform `name/tailwind` and a custom format `css/tailwind-v4`, and writes `src/tokens/tokens.css`.

How token paths map to CSS variables:
- `primitive.color.X.Y` → `--color-X-Y`
- `primitive.font.family.X` → `--font-X`
- `primitive.font.size.X` → `--text-X`, plus `--text-X--line-height` from `primitive.font.lineHeight.X`
- `primitive.font.weight.X` → `--font-weight-X`
- `primitive.radius.X` → `--radius-X`
- `primitive.space.base` → `--spacing`. The other `space.N` tokens document the 4px scale; the check script asserts that `N*4` equals their value.
- `component.control.sm` → `--spacing-control-sm`; `component.avatar.md` → `--spacing-avatar-md`; `component.row.height` → `--spacing-row`; `component.panel.width` → `--spacing-panel`
- `component.*.radius` → `--radius-control`, `--radius-panel`, `--radius-tile`; `component.tile.speaking-ring` → `--spacing-speaking-ring`
- `semantic.color.X` → `--color-X` in `@theme inline`, mapped to `var(--bbb-X)`. `--bbb-X` is set in `:root, [data-theme="light"]` from the token's original `$value`, with references rewritten from `{primitive.color.a.b}` to `var(--color-a-b)`. Non-reference values (the rgba overlay) are emitted as-is.
- `modes.dark.color.X` → `--bbb-X` inside `[data-theme="dark"] { color-scheme: dark; … }`
- `modes.stage.color.X` → `--bbb-X` inside `[data-surface="stage"] { … }`

Expected output (abridged). Apart from the additions, it must match sections 1–2 of the old `docs/theme.css` line for line:

```css
/* Do not edit directly, generated from src/tokens/tokens.json */
@theme {
  --color-*: initial; --radius-*: initial; --text-*: initial; --font-*: initial;
  --color-white: #ffffff; --color-transparent: transparent; --color-current: currentColor;
  --color-neutral-0: #ffffff;
  …
  --font-sans: "Source Sans 3", "Source Sans Pro", system-ui, sans-serif;
  --text-md: 14px; --text-md--line-height: 20px;
  --radius-md: 8px;
  --spacing: 4px;
  --spacing-control-md: 36px;
}
@theme inline {
  --color-surface: var(--bbb-surface);
  …
  --color-border-control: var(--bbb-border-control);
}
:root, [data-theme="light"] { color-scheme: light; --bbb-surface: var(--color-neutral-0); … }
[data-theme="dark"] { color-scheme: dark; --bbb-surface: var(--color-stage-700); … }
[data-surface="stage"] { --bbb-text: var(--color-neutral-0); … }
```

**`src/styles/theme.css`** becomes, in order:
1. The fontsource imports: `@fontsource/source-sans-3/{400,500,600,700}.css`.
2. `@import "tailwindcss";`
3. `@import "./tokens.css";`
4. The three `@utility` blocks and `@layer base`, unchanged.

If Tailwind's import resolver rejects bare specifiers, import the four font CSS files from `src/main.tsx` and `.storybook/preview.tsx` instead.

**Equivalence check:** after generating, diff the generated blocks against the old `docs/theme.css` before deleting it. The only differences should be the new tokens and the stage fixes.

## 5. Token gaps: values and WCAG ratios

Light surfaces: white `#ffffff`, sunken `#eef1f5`, raised `#e6eaef`. Stage: stage-900 `#0b1220`, tile stage-700 `#16233a`, dark-raised stage-600 `#26364b`.

**Purple insight ramp:**
- Primitives: `purple-50 #f3effa`, `purple-100 #e6def7`, `purple-300 #a78bfa`, `purple-500 #7c5cc4`, `purple-600 #5b3fb0`, `purple-700 #4a3290`.
- Semantic, light: `insight = purple-600`, `on-insight = neutral-0`, `insight-text = purple-700`, `insight-soft = purple-50`.
- Stage and dark: `insight = purple-500`, `insight-text = purple-300`. Dark only: `insight-soft = stage-600`.
- Ratios:
  - white on purple-600: 7.55
  - purple-700 on purple-50: 8.62
  - purple-300 on stage-900: 6.88; on stage-700: 5.78; on stage-600: 4.51
  - white on purple-500: 5.02
  - purple-500 fill on stage-900: 3.73. (purple-600 is only 2.48 there, which is why the stage uses purple-500.)

**Status tints:**
- Primitives: `green-50 #edf9f2` (replaces the canvas's `#e6f6ee`, where green-700 text is only 4.40), `amber-50 #fff8eb` (exists), `red-50 #fdecea`.
- Semantic: `status-live-soft = green-50`, `status-hand-soft = amber-50`, `danger-soft = red-50`. Dark: all three are stage-600.
- Ratios:
  - green-700 on green-50: 4.55; a green-500 icon on green-50: 3.11
  - amber-700 on amber-50: 5.14
  - an amber-400 icon on amber-50: **1.93, fails**. Rule: icons on the amber tint use `status-hand-text`, never `status-hand`.
  - red-700 on red-50: 5.75; a red-500 icon on red-50: 4.00
  - dark mode, on stage-600: green-300 6.15, amber-400 6.01, red-300 5.60

**Selected pairs (X3):**
- Primitives: `blue-100 #e6eef9`, `blue-400 #5b8fe0`.
- Light: `selected = blue-50`, `selected-text = blue-600`, `selected-border = blue-600`.
- Stage: `selected = blue-100`, `selected-text = stage-800`, `selected-border = blue-400`.
- Dark: `selected = stage-600`, `selected-text = neutral-0`, `selected-border = blue-300`.
- Ratios:
  - blue-600 on blue-50: 4.93
  - stage-800 on blue-100: 15.37
  - blue-400 border on stage-900: 5.75; on stage-700: 4.83
  - white on blue-400: **3.26, fails**, so blue-400 is a border and ring color only (say so in its `$description`)

**Room palette** (`primitive.color.room.1–8`): each needs white text at 4.5:1 or better, and a fill of at least 3:1 on stage-900. Listed as white text / fill on stage:
- room-1 `#2a63c8`: 5.65 / 3.31
- room-2 `#0f7b7b`: 5.07 / 3.69
- room-3 `#2e7d32`: 5.13 / 3.65
- room-4 `#806000`: 5.85 / 3.20
- room-5 `#b4531c`: 5.01 / 3.74
- room-6 `#c0392b`: 5.44 / 3.44
- room-7 `#a8327a`: 6.17 / 3.03
- room-8 `#6457c4`: 5.67 / 3.30

Rooms still carry a number or name, because color is never the only cue.

**Avatars 9 and 10:** `#006d8f` (white text 5.86) and `#556b8a` (white text 5.45).

**`border-control`:**
- Light: `neutral-500 #7b8594`. 3.73 on white, 3.30 on sunken, 3.09 on raised.
- Dark and stage: `neutral-400 #a9b6c6`. 7.63 on stage-700, 5.96 on stage-600.

**Stage block fixes:**
- `text-secondary = neutral-300`: 12.26 on stage-900
- `status-hand-text = amber-400`: 9.17
- `status-live-text = green-300`: 9.38
- `icon-subtle = neutral-400`

## 6. `npm run tokens:check` (`scripts/tokens-check.ts`, run with `tsx`)

- Loads `tokens.json` and resolves `{refs}` recursively, without depending on Style Dictionary. Builds three value maps: light (semantic), dark (semantic plus `modes.dark`) and stage (semantic plus `modes.stage`).
- Reads `src/tokens/contrast.json`, a list of entries like `{ "fg": "semantic.color.text-muted", "bg": "semantic.color.surface", "min": 4.5, "modes": ["light","dark"] }`. Paths may also be primitives.
- Prints a PASS/FAIL table (ratio, threshold, colors, mode) and exits 1 on any failure.
- Seed the pairs with everything in §5, plus the pairs already documented in `tokens.json`: text-muted on white, sunken and raised; white on red-500; white on blue-600; amber-950 on amber-400; and the stage text colors on stage-900.
- **Grid gate:** every dimension under `primitive.space`, `primitive.radius` (except `full`), `primitive.font.lineHeight` and `component.*` must be a multiple of 4. Font sizes must be one of 11, 12, 13, 14, 16 or 18.
- **Stale check:** regenerate `tokens.css` in memory and fail if it differs from the committed file.
- Runs last inside `check`, and in CI.

## 7. Lint rules for arbitrary values, raw hex and clickable divs

`eslint.config.js` is a flat ESM config with three layers:

1. **`eslint-plugin-better-tailwindcss`**, with `entryPoint: "src/styles/theme.css"` and `callees: ["tv", "cn", "clsx"]`. Rules:
   - `no-restricted-classes` with the pattern `^(?:[a-z-]+:)*[a-z-]+-\[.+\]$` and the message "Arbitrary Tailwind value. Add a token to src/tokens/tokens.json."
   - `no-unknown-classes: "error"`
   
   This covers `className` strings, template literals and `tv()` objects.
2. **Core `no-restricted-syntax` on `src/**/*.{ts,tsx}`**, to catch hex and arbitrary values in any string. Selectors: `Literal[value=/#[0-9a-fA-F]{3,8}\b/]`, `TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}\b/]`, `Literal[value=/\b[a-z-]+-\[[^\]]+\]/]` and its TemplateElement twin. Exempt `scripts/**`, `src/tokens/*.ts`, `*.test.ts` and `.storybook/**`.
3. **(Amendment)** In the same `no-restricted-syntax` rule, reject pointer and keyboard handlers on non-interactive elements: `JSXOpeningElement[name.name=/^(div|span)$/] > JSXAttribute[name.name=/^on(Click|MouseDown|MouseUp|KeyDown|KeyUp|KeyPress)$/]`. Message: "Use a React Aria component; no handlers on div or span."

**Proof without a failing story in the repo:** `src/test/lint-rules.test.ts` uses the ESLint Node API (`new ESLint({ cwd: repoRoot })`, then `lintText(fixture, { filePath: 'src/components/Fixture.stories.tsx' })` with a virtual path).
- These inline fixtures must each report an error: `className="bg-[#ff0000]"`, `className="p-[13px]"`, `style={{ color: '#ff0000' }}` and `<div onClick={() => {}} />`.
- A clean fixture, `className="bg-surface rounded-md h-control-md focus-ring"`, must report zero errors.
- The test runs in `npm test`, so it also runs in `check` and CI. Give this file a 30-second test timeout.

## 8. Storybook

- `.storybook/main.ts`: `framework: '@storybook/react-vite'`, `stories: ['../src/**/*.stories.@(ts|tsx)']`, `addons: ['@storybook/addon-a11y', '@storybook/addon-docs']`.
- `.storybook/preview.tsx`:
  - imports `../src/styles/theme.css`
  - sets `parameters.a11y = { test: 'error' }`
  - adds a `theme` toolbar (light / dark) and a `surface` toolbar (panel / stage)
  - adds one decorator that sets `document.documentElement.dataset.theme`, and wraps the story in `<div data-surface="stage" className="bg-surface-stage p-6">` when the surface is stage
- `src/tokens/Tokens.stories.tsx` shows the swatches, text sizes and radii.
- Set Storybook up by hand rather than with `storybook init`, which would pull in browser-test dependencies.

## 9. Vitest, and Playwright with axe

- **`vitest.config.ts`:** `mergeConfig(viteConfig, { test: { environment: 'jsdom', setupFiles: ['src/test/setup.ts'], include: ['src/**/*.test.{ts,tsx}'], exclude: ['e2e/**'] } })`.
  - The smoke test, `src/App.test.tsx`, renders `<App/>` and checks the heading.
  - The setup file imports `@testing-library/jest-dom/vitest`.
- **`playwright.config.ts`:**
  - `testDir: 'e2e'`, with a Chromium project only
  - `webServer: npm run preview -- --port 4173 --strictPort`
  - `reporter: CI ? 'github' : 'list'`
- **`e2e/smoke.spec.ts`:** run axe on `/` with the tags `wcag2a`, `wcag2aa` and `wcag21aa`, and expect no violations. Also check that the first focusable element shows the focus ring after Tab.

## 10. npm scripts

```
dev: vite · build: tsc -b && vite build · preview: vite preview
lint: eslint . · typecheck: tsc -b · test: vitest run --reporter=dot
test:e2e: vite build && playwright test
storybook: storybook dev -p 6006 · build-storybook: storybook build
tokens: tsx scripts/build-tokens.ts · tokens:check: tsx scripts/tokens-check.ts
format: prettier --write . · check: npm run lint && npm run typecheck && npm run test && npm run tokens:check
```

## 11. CI (`.github/workflows/ci.yml`)

- Triggered `on: push`, with `concurrency: { group: ${{ github.ref }}, cancel-in-progress: true }`.
- **`check` job:** checkout, `setup-node@v4` (`node-version-file: .nvmrc`, `cache: npm`), `npm ci`, `npm run check`.
- **`e2e` job:** checkout, setup-node, `npm ci`, `npx playwright install --with-deps chromium`, `npm run test:e2e`, then upload `playwright-report` if the job fails.

## 12. Config notes

- **`tsconfig.app.json`:** `strict`, `moduleResolution: bundler`, `verbatimModuleSyntax`, `jsx: react-jsx`, `noEmit`, `types: ["vite/client"]`. Include `src` and `.storybook`.
- **`tsconfig.node.json`:** includes `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts` and `scripts`. TypeScript 6 defaults `types` to `[]`, so list types explicitly.
- **`.gitignore`:** add `*.tsbuildinfo`.
- **`.prettierrc`:** `plugins: ["prettier-plugin-tailwindcss"]`, `tailwindStylesheet: "./src/styles/theme.css"`, `tailwindFunctions: ["tv", "cn"]`.
- **ESLint ignores:** `dist`, `storybook-static`, `src/tokens/tokens.css`, `playwright-report`, `test-results`.
- **Keep lint fast:** use `typescript-eslint`'s non-type-aware `recommended` config.

## 13. Risks

1. **TypeScript 7 versus 6:** pinned 6.0.3. Revisit once `typescript-eslint` supports 7.
2. **jsx-a11y skipped:** the onClick rule in §7 covers the most important case. Revisit in milestone 2.
3. **`no-unknown-classes` may flag React Aria `data-[…]` variant classes.** Narrow the pattern if needed, and verify with the fixture test.
4. **`@fontsource` imports through Tailwind's resolver:** the fallback is in §4.
5. **Speed:** if the lint fixture test takes more than 10 seconds, move it to a `test:lint-rules` script that `check` still runs.

## 14. Verification against the exit criteria

- **`npm run check` passes locally and in CI, and Storybook runs with the a11y panel:** steps 10–11. The Tokens story's Accessibility tab reports 0 violations.
- **A story using `bg-[#ff0000]` fails lint:** `src/test/lint-rules.test.ts`, plus `echo '…bg-[#ff0000]…' | npx eslint --stdin --stdin-filename src/x.stories.tsx`, which exits 1.
- **Light, dark and `data-surface="stage"` switch in Storybook:** use the toolbar globals on the Tokens story. `tokens:check` proves every declared pair in all three modes.
- **Also:** `npm run tokens && git diff --exit-code src/tokens/tokens.css` shows no change, and `test:e2e` axe reports 0 violations on `/`.
