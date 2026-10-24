# Milestone 2 "Reference primitives": implementation plan

Approved 2026-10-24. A planning agent drafted it from the canvas source; it was then reviewed, and the open questions were settled with the owner (§8). Branch: `m2-primitives`, from `main` after the milestone 1 merge.

These were verified against the installed versions:
- `react-aria-components` 1.22.1 exports `Button`, `ToggleButton`, `TooltipTrigger`, `Tooltip`, `Keyboard`, `Focusable` and `composeRenderProps`.
- `TooltipTrigger` takes `delay` (default 1500), `closeDelay` (default 500), `trigger`, `shouldCloseOnPress`, and `isOpen` / `defaultIsOpen`.

## 0. What the canvas draws (evidence for the API)

| Canvas element | File · location | Spec drawn | Token mapping |
|---|---|---|---|
| Panel buttons (People, Chat, Notes, Plugins) | `Focus.dc.html` 47–51, 239–244, 271–276 | 44×44 r12, 44×48 or 40×40 r10. Fill `#1c2738`, icon `#e6edf5`. Active `#e6eef9` / `#0f1b2b` | `size="touch"`, `rounded-control`, `bg-surface-raised text-text`. Selected is `bg-selected text-selected-text`; on stage, blue-100 / stage-800 is exactly the canvas pair |
| Mic, Camera, Share media, React, Raise hand | `Focus.dc.html` 54–56; logic 801–810 | 48×48 circles in the same fills. Mic-on adds a green ring | 44px rounded squares (decision 3). The ring only while speaking (decision 5) |
| Personal buttons with hover tooltip | `Focus.dc.html` 59–61; CSS `.tipw .tip` line 12 | 44×44 r12. White tooltip, 12.5px, weight 600 | `IconButton size="touch"` + `Tooltip` |
| Leave | `Focus.dc.html` 62, 264, 286, 306; `Shell.dc.html` 226 | Four different sizes and radii. Dark red tint `#2a161b` / `#ff9ea1` (Focus) or solid `#d93a2b` (Shell) | X2: one size (`touch`) and one radius; `variant="soft" tone="danger"` |
| Row actions (message privately, more) | `Focus.dc.html` 588 | 26×26 r7 | X14: `IconButton size="sm"` (32px) with `hit-area`; `variant="soft"` |
| Panel header buttons (close, mute everyone) | `Shell.dc.html` 113–115 | 34×34 r8, transparent | `IconButton size="sm" variant="ghost"` |
| Text buttons | all boards | Heights 28–46, radii 8–15, five fills | `Button` variants (§2.2) |
| People row avatar | `Focus.dc.html` 588; `StatusList.dc.html` 29 | 32px, 12px bold white, circle. The teacher's avatar is a rounded square. Speaking ring | `Avatar size="md"`, `shape`, `isSpeaking` |
| Status column (Option A) | `Focus.dc.html` logic 671–677; `StatusList.dc.html` 130–143 | Mic live green; speaking is white bars on a green disc; muted is a grey mic-off; listening is grey headphones; not joined is light headphones-off | Icon set (§3); colors `status-live`, `on-status-live`, `icon-subtle` |
| Tile badges (X12) | `RoomImproved.dc.html` 462–468; `Shell.dc.html` 54 | Speaking or muted glyph; amber hand badge | `Avatar badge` set + `on-status-hand` |

No board has an `<img>`, so there's no image avatar.

## 1. Component file pattern (the text for CLAUDE.md › Component pattern)

```
src/components/<Name>/
  <Name>.tsx          the component. Its tv() styles live at the top of the file, exported as
                      <name>Styles so other components can tv({ extend }) them
  <Name>.stories.tsx  one story per variant × tone, per size, per state, and one on the stage
                      (globals: { surface: 'stage' }). Args mirror props
  <Name>.test.tsx     roles, names, keyboard (Tab, Enter, Space, Escape), aria state
  index.ts            export { Name } from './Name'; export type { NameProps } from './Name'
src/components/index.ts   barrel of barrels; app code imports components only through it
src/icons/index.ts        the meaning → icon map (`icons`, `IconName`) and <Icon>
src/shortcuts.ts          the keyboard-shortcut map; nothing else hard-codes a key
```

Rules for the component file:
- **Build on the matching React Aria component.** Re-export its props type, minus what we fix (`Omit<RacButtonProps, 'className' | 'children'>`), and add ours.
- **All class strings live inside one `tv({ base, variants, defaultVariants })` call.** State styling uses React Aria data attributes in those strings (`data-hovered:`, `data-pressed:`, `data-selected:`, `data-disabled:`, `focus-ring`), never a function-form `className`.
- **The consumer's `className` is merged with `composeRenderProps`:** `className={composeRenderProps(className, (cls) => buttonStyles({ variant, tone, size, className: cls }))}`. This is the only render-prop function allowed, and it only forwards `cls`. Lint rejects any other function in `className` (§6).
- **Shared sizes:** `IconButton` exports `iconButtonStyles`, and `ToggleButton` uses `tv({ extend: iconButtonStyles, … })`.
- **Icon-only controls** take `label: string` (required; it becomes `aria-label`) and always render a `Tooltip` with the label and shortcut.
- **Props follow React Aria's names:** `isSelected`, `isDisabled`, `onChange`, `onPress`. Never `onClick`.
- **Every story file has a `Stage` story,** and every story must pass axe in light, dark and stage. `e2e/storybook.spec.ts` checks this automatically.
- **Tests** use `render` and `userEvent.setup()`, and query with `getByRole` and the accessible name, never test ids.

## 2. Components

### 2.1 Tooltip

Wraps React Aria's `TooltipTrigger`, `Tooltip` and `Keyboard`. It reproduces `Focus.dc.html` line 12 (`.tipw .tip`) and `Shell.dc.html` line 222 (the name plus a key chip), and fixes X5.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `children` | `ReactElement` | — | The trigger: a focusable React Aria element, or one wrapped in `Focusable` |
| `label` | `ReactNode` | — | For icon buttons, this equals `aria-label` |
| `shortcut` | `ShortcutId` | — | A key from `src/shortcuts.ts`, rendered as a `<Keyboard>` chip |
| `placement` | `'top' \| 'bottom' \| 'start' \| 'end'` | `'top'` | |
| `delay` / `closeDelay` | `number` | `600` / `100` | Faster than React Aria's defaults, for toolbars |
| `isOpen` / `defaultIsOpen` | `boolean` | — | The `Open` stories use `defaultIsOpen`, so axe scans the portal |

**Behavior:**
- **Opening:** on hover after `delay`; React Aria's warm-up makes neighbouring tooltips open instantly after the first. Opens immediately on keyboard focus.
- **Closing:** on pointer leave after `closeDelay`, on blur, on Escape, and on press, so pressing Mic hides it.
- **Touch:** React Aria never opens tooltips from touch, so a tooltip is never the only way to get a name. Every icon-only control has a required `aria-label`, and `aria-keyshortcuts` carries the shortcut.
- **Content:** `{label} <Keyboard>Alt + M</Keyboard>`.
- **On the stage:** the tooltip portals to `<body>` and so leaves `data-surface="stage"`. Add a small `Surface` primitive (`src/components/Surface`): `<Surface kind="stage">` renders `<div data-surface="stage">` and provides `SurfaceContext`. `Tooltip` reads the context and sets `data-surface` on its own element.
- **Colors** are inverted relative to the surface: `bg-text text-surface`. That gives a dark tooltip on light panels and a white one with stage-700 text on the stage, which is what both boards draw.
- **Styles:**
  - tooltip: `rounded-md px-2 py-1 text-sm font-semibold max-w-64`, with no arrow and no shadow
  - kbd chip: `rounded-xs border border-current px-1 text-xs`
- **Storybook:** update `.storybook/preview.tsx` so the stage frame uses `<Surface kind="stage" className="bg-surface-stage p-6">`.

**Stories:** `Default` (on an IconButton), `WithShortcut`, `Open`, `OpenOnStage`, `LongLabel`, `Placements`.

**Tests:**
- Tab to the trigger: the tooltip is visible, and the trigger's `aria-describedby` points to it.
- Escape hides it.
- Hover, then unhover, closes it. Use `delay={0}` or fake timers.
- The shortcut renders inside `kbd`, and the trigger has `aria-keyshortcuts="Alt+M"`.

### 2.2 Button

Wraps React Aria's `Button`. The variants come from a survey of every board:

| Canvas fill | Examples | Variant |
|---|---|---|
| `#1f62d0` with white text | Start sharing, Open N rooms, Done | `primary` |
| White, grey border, dark text | Upload a file, Export, Keep rooms open, Cancel | `secondary` (default) |
| Light fill, no border | Join, Show on stage, Return to main room | `soft` |
| Transparent with blue text | Show 18 more, See all rooms' work | `ghost` |
| Red with white text | Stop sharing | `primary` + `tone="danger"` |
| White, red border, red text | Close all rooms, End all rooms | `secondary` + `tone="danger"` |

| Prop | Type | Default |
|---|---|---|
| `variant` | `'primary' \| 'secondary' \| 'soft' \| 'ghost'` | `'secondary'` |
| `tone` | `'neutral' \| 'danger'` | `'neutral'` |
| `size` | `'sm' \| 'md' \| 'lg' \| 'touch'` | `'md'` |
| `icon` / `iconEnd` | `IconName` | — |
| `children` | `ReactNode` | required |
| rest | React Aria `ButtonProps` (`onPress`, `isDisabled`, `type`, `aria-*`) | |

**Sizes:**
- `sm`: `h-control-sm px-3 text-sm`
- `md`: `h-control-md px-4 text-md`
- `lg`: `h-control-lg px-4 text-md`
- `touch`: `h-control-touch px-5 text-lg`
- All sizes also get `rounded-control font-semibold gap-2 hit-area focus-ring`.

**States:**

| Variant | Rest | Hover / pressed | Disabled |
|---|---|---|---|
| primary | `bg-accent text-on-accent` | `bg-accent-hover` | `bg-surface-raised text-text-muted` |
| primary · danger | `bg-danger text-on-danger` | `bg-danger-hover` | same as primary |
| secondary | `bg-surface border border-border-control text-text` | `bg-surface-sunken` | `text-text-muted border-border` |
| secondary · danger | `border-danger-text text-danger-text` | `bg-danger-soft` | same |
| soft | `bg-surface-raised text-text` | `bg-surface-sunken` | `text-text-muted` |
| soft · danger | `bg-danger-soft text-danger-text` | `bg-danger-soft` (hover via opacity is banned, so use `data-hovered:bg-danger-hover data-hovered:text-on-danger`) | `text-text-muted` |
| ghost | `bg-transparent text-accent` | `bg-surface-sunken` | `text-text-muted` |
| ghost · danger | `text-danger-text` | `bg-danger-soft` | |

Stage values come from the existing stage-mode overrides. Every variant gets `focus-ring` (D2).

**Stories:** `Primary`, `Secondary`, `Soft`, `Ghost`, `Danger`, `DangerSecondary`, `Sizes`, `WithIcon`, `Disabled`, `Stage`.

**Tests:**
- It has `role="button"` and the text as its name.
- `onPress` fires on click, Enter and Space.
- `isDisabled` sets `disabled` and blocks `onPress`.
- Tab reaches it and adds `data-focus-visible`.

### 2.3 IconButton

Wraps React Aria's `Button`. It's always icon-only and always has a tooltip. Fixes X2, X5 and X14.

| Prop | Type | Default |
|---|---|---|
| `label` | `string` | required; becomes `aria-label` and the tooltip text |
| `icon` | `IconName` | required |
| `variant` | `'primary' \| 'secondary' \| 'soft' \| 'ghost'` | `'ghost'` |
| `tone` | `'neutral' \| 'danger'` | `'neutral'` |
| `size` | `'sm' \| 'md' \| 'lg' \| 'touch'` | `'md'` |
| `shortcut` | `ShortcutId` | — (adds `aria-keyshortcuts` and the key chip) |
| `tooltipPlacement` | `Placement` | `'top'` |
| rest | React Aria `ButtonProps` | |

**Sizes:**
- `size-control-sm`: 32px, with a 16px icon
- `size-control-md`: 36px, 20px icon
- `size-control-lg`: 40px, 20px icon
- `size-control-touch`: 44px, 20px icon

Every size uses one radius, `rounded-control`, plus `hit-area`.

**Variant colors** follow the Button table. The `ghost` icon color is `text-icon`.

**Leave** is `variant="soft" tone="danger" size="touch" icon="leave" label="Leave session"`.

**Stories:** `Ghost`, `Soft`, `Primary`, `Secondary`, `Danger` (Leave), `Sizes`, `Disabled`, `WithShortcut` (tooltip open), and `ActionBarOnStage` (the four panel buttons and Leave in the stage frame).

**Tests:**
- It's found by role and name.
- Tab shows the tooltip.
- `aria-keyshortcuts` is present when `shortcut` is given.
- There's no visible text content.
- Enter and Space fire `onPress`.
- The `svg` is `aria-hidden`.

### 2.4 ToggleButton (mic and camera)

Wraps React Aria's `ToggleButton`, with `tv({ extend: iconButtonStyles })`. Fixes X7.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `label` | `string` | required | Fixed: "Microphone", "Camera" or "Raise hand" |
| `icon` | `IconName` | required | Shown when not selected |
| `selectedIcon` | `IconName` | `icon` | The icon can swap; the label never changes |
| `isSelected` / `defaultSelected` / `onChange` | React Aria | | State is exposed as `aria-pressed` |
| `size` | as IconButton | `'touch'` | |
| `shortcut` | `ShortcutId` | — | |
| `isSpeaking` | `boolean` | `false` | Adds `ring-speaking` (decision 5) |
| `tone` | `'neutral' \| 'hand'` | `'neutral'` | Selected Raise hand is `bg-status-hand text-on-status-hand` (decision 6) |

**Microphone:**
- Off: `icon="microphoneOff"` on the neutral fill (`bg-surface-raised text-text`). On the stage this is neutral grey (decision 4).
- On: `selectedIcon="microphone"` with `bg-selected text-selected-text`.

**Camera:** `cameraOff` / `camera`, the same way.

**Screen readers** hear "Microphone, toggle button, pressed".

**Muted versus not joined:** "audio not joined" is a third state, and it isn't a ToggleButton prop. In milestone 4, the action bar renders a "Join audio" button (`icon="audioNotJoined"`) in the mic slot until audio is joined. Say so in the docblock, so nobody adds a tri-state later.

**Stories:** `MicrophoneOff`, `MicrophoneOn`, `MicrophoneSpeaking`, `CameraOff`, `CameraOn`, `RaiseHand`, `Disabled`, `Sizes`, `ActionBarOnStage` (mic, camera, share media, react and hand on the stage).

**Tests:**
- The name stays "Microphone" while `aria-pressed` flips from false to true, on click and on Space. This is the X7 regression test.
- The icon swaps; check it via the `data-icon` attribute.
- Tab then Enter toggles it.
- `isDisabled` blocks it.

### 2.5 Avatar

A plain `<span>`, not interactive. It reproduces `Focus.dc.html` 588 and `StatusList.dc.html` 29, takes its badges from `Shell.dc.html` 54 and `RoomImproved.dc.html` 464–467, fixes B9 and prepares for X12.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `name` | `string` | required | The initials source and the accessible label |
| `id` | `string` | `name` | The color seed. Stable across renames, and distinct for two "Ana"s |
| `initials` | `string` | derived | An override from the data layer, for duplicate first names |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 24 / 32 / 40px, from the `avatar.*` tokens. xl is deferred to milestone 4 (decision 9) |
| `shape` | `'circle' \| 'square'` | `'circle'` | The teacher's avatar is a rounded square (`rounded-md`); the row decides which |
| `isSpeaking` | `boolean` | `false` | `ring-speaking` |
| `badge` | `'speaking' \| 'muted' \| 'hand'` | — | A 16px disc at the bottom right |
| `color` | `1…10` | hashed | An override for stories and tests |
| `aria-hidden` | | — | Rows pass it, because the name is next to the avatar |

**Initials** (`initials.ts`, unit-tested):
- Strip honorifics (`Prof.`, `Dr.`, `Mr.`, `Ms.`, `Mrs.`) and a trailing `(you)`.
- Two or more words: the first letter of the first word and of the last word (`Rafaela Monaco` → `RM`).
- One word: its first two letters (`Bruno` → `BR`).
- Use `Array.from` so accented and non-Latin names work, then `toLocaleUpperCase()`.
- Text size: `text-xs` (12px, the B9 minimum) for `sm` and `md`; `text-md` for `lg`. Always `font-bold text-white`.

**Color:** an FNV-1a hash of `id`, `% 10 + 1`, looked up in a literal map in `avatarColor.ts` (`{ 1: 'bg-avatar-1', … }`).

**Badges** (Option A keeps status in the row's columns; badges are for tiles, avatar stacks and mobile):

| badge | Fill | Glyph |
|---|---|---|
| `speaking` | `bg-status-live` | `speaking` in `text-on-status-live` |
| `muted` | `bg-surface-raised` | `microphoneOff` in `text-icon` |
| `hand` | `bg-status-hand` | `raiseHand` in `text-on-status-hand` |

The badge disc is `size-4 rounded-full border-2 border-ring-offset`, and the glyph is `size-icon-xs` (12px).

**The speaking ring and focus ring compose through CSS variables** in `src/styles/theme.css`, so a focused speaking element shows the green ring inside and the blue focus ring outside:

```css
@utility ring-speaking {
  --bbb-shadow-speaking: 0 0 0 var(--spacing-speaking-ring) var(--bbb-ring-offset),
                         0 0 0 calc(var(--spacing-speaking-ring) * 2) var(--bbb-status-live);
  --bbb-ring-base: calc(var(--spacing-speaking-ring) * 2);
  box-shadow: var(--bbb-shadow-speaking);
}
@utility focus-ring {
  outline: none;
  &:focus-visible, &[data-focus-visible] {
    outline: 2px solid transparent; outline-offset: 2px;
    box-shadow:
      var(--bbb-shadow-speaking, 0 0 0 0 transparent),
      0 0 0 calc(var(--bbb-ring-base, 0px) + 2px) var(--bbb-ring-offset),
      0 0 0 calc(var(--bbb-ring-base, 0px) + 4px) var(--bbb-focus-ring);
  }
}
```

Keep the forced-colors behavior from milestone 1: the outline appears only on focus. The existing smoke tests must keep passing.

**Accessibility:** `role="img" aria-label="{name}{, speaking | , muted | , hand raised}"`, unless `aria-hidden` is set. The badge icon is `aria-hidden`.

**Stories:** `Sizes`, `Shapes`, `Colors` (all ten), `Speaking`, `Badges`, `SpeakingAndFocused` (inside `Focusable` with a tooltip, autofocused), `InitialsRules`, `Stage`.

**Tests:**
- Initials, for every rule above.
- The color is stable for the same `id` and differs between two ids.
- The role name includes the status.
- `aria-hidden` suppresses the role.
- `isSpeaking` adds `ring-speaking`.
- The hand badge renders its icon, `aria-hidden`.

## 3. Icon module and story (X6)

**`src/icons/index.ts`:**
- `export const icons = { microphone: Mic, … } as const`
- `export type IconName = keyof typeof icons`

**`src/icons/Icon.tsx`:** `<Icon name size="xs|sm|md|lg" label?>`.
- It's `aria-hidden` unless `label` is given, in which case it's `role="img"`.
- Classes come from a literal size map.
- It sets `data-icon={name}`.

| Meaning | Lucide | Canvas source | X6 note |
|---|---|---|---|
| microphone / microphoneOff | `Mic` / `MicOff` | Focus 652–653 | |
| speaking | `AudioLines` | Focus 670 | Distinct from mic-on |
| listenOnly | `Headphones` | Focus 669 | Muted and listening now differ: mic-off versus headphones |
| audioNotJoined | `HeadphoneOff` | Focus 676 | |
| camera / cameraOff | `Video` / `VideoOff` | Focus 718, 654 | |
| shareMedia | `SquarePlus` | Focus 741 | |
| react | custom SVG smiley in `src/icons/` (decision 8) | Focus 720 | Lucide has no smiley |
| raiseHand | `Hand` | Focus 721, 928 | Two hand glyphs become one |
| leave | `LogOut` | Focus 722 | |
| people / chat / notes | `Users` / `MessageSquare` / `FileText` | Focus 723–725 | |
| plugins / breakouts | `Blocks` / `Grid2x2` | Focus 727, 726 | |
| slidesOverview | `LayoutGrid` | Focus 728 | The grid icon meant both "All slides" and "See all webcams" |
| webcamsAll | `Grid3x3` | Mobile "See all" | Now distinct from slidesOverview |
| presenter | `Presentation` | Focus 655 | |
| whiteboardAccess / annotate | `SquarePen` / `Pencil` | Focus 659; Mobile pager | The pencil meant both Whiteboard and Annotate |
| more / moreVertical | `Ellipsis` / `EllipsisVertical` | Shell 262; row actions | |
| close / settings | `X` / `Settings` | Focus 729–730 | |
| analytics / insight | `ChartColumn` / `Lightbulb` | Focus 733–734 | |
| poll / timer | `Vote` / `Timer` | Focus 779–780 | |
| externalLink | `ExternalLink` | Focus 60 | |
| captions / recording / shortcuts | `Captions` / `Disc` / `Keyboard` | Focus 751–753 | |
| moderator / lockChat / removeFromSession | `ShieldCheck` / `Lock` / `CircleX` | Focus 656–660 | |

Verify every Lucide export name against the installed version before use.

`src/icons/Icons.stories.tsx` is a table with columns for glyph, meaning, icon name, where it's used, and a "conflict resolved" note for the three X6 cases.

## 4. Shortcut map

`src/shortcuts.ts`:
- `shortcuts = { microphone: { key: 'M' }, camera: { key: 'V' }, raiseHand: { key: 'H' } } as const`, with the modifier held separately. It's **Alt** (decision 1).
- `ShortcutId`
- `formatShortcut(id)` returns `"Alt + M"`.
- `ariaKeyshortcuts(id)` returns `"Alt+M"`.

Only these three keys are defined now; the rest are added when their flows are built.

## 5. Token additions (`tokens.json` and `contrast.json`)

| Token | Value | Pair added (min) | Approx. ratio |
|---|---|---|---|
| `component.icon.xs/sm/md/lg` | 12 / 16 / 20 / 24px | grid gate | — |
| `semantic.color.on-status-live` | light: neutral-0; dark and stage: stage-900 | `on-status-live` on `status-live` (3, icon) | 3.4 / 9.4 |
| `semantic.color.on-status-hand` | amber-950 | `on-status-hand` on `status-hand` (4.5) | 8.9 |
| `semantic.color.on-danger` | neutral-0 | `on-danger` on `danger` (4.5) | 4.6 |
| `semantic.color.danger-hover` | red-700 | `on-danger` on `danger-hover` (4.5) | 6.6 |
| `primitive.color.blue.700` | `#1a53b0` | — | |
| `semantic.color.accent-hover` | light: blue-700; dark and stage: blue-400 | `on-accent` on `accent-hover` (4.5) | 7.2 / 5.8 |
| `primitive.color.red.900` | `#2a161b` | — | |
| `modes.stage` and `modes.dark`: `danger-soft` → red-900 (decision 10) | | `danger-text` on `danger-soft`, in every mode | ~7.8 |

`tokens:check` is the authority on these ratios. Its family check requires every new `on-*` pair in all three modes. Log each token in `PLAN.md` › Decisions.

## 6. Lint and e2e

- **New `no-restricted-syntax` selector:** `JSXAttribute[name.name="className"] > JSXExpressionContainer > :matches(ArrowFunctionExpression, FunctionExpression)`, with the message "Route render-prop classNames through tv() with composeRenderProps."
- **Fixtures:**
  - rejected: `className={({ isPressed }) => 'bg-surface'}`
  - accepted: `className={composeRenderProps(c, (x) => x)}`
  - rejected: `tv({ base: 'bg-[#fff]' })`, which proves the plugin lints `tv` objects
- **`e2e/storybook.spec.ts`:** no change expected; the whole-page scan already covers portals. If an open-tooltip story flakes, support `parameters.e2e.waitFor: '[role=tooltip]'`.

## 7. Step order (keep `check` green; commit after each step)

1. Tokens (§5); run `npm run tokens`.
2. `theme.css` ring layering, `Surface`, `src/shortcuts.ts`, `src/icons/` with `Icons.stories.tsx`, and the `.storybook/preview.tsx` `Surface` frame.
3. The lint rule and fixtures.
4. Tooltip.
5. Button.
6. IconButton (export `iconButtonStyles`).
7. ToggleButton.
8. Avatar (`initials.ts`, `avatarColor.ts`).
9. The `src/components/index.ts` barrel. Run `npm run test:e2e` locally.
10. Docs: `CLAUDE.md` › Component pattern (the §1 text), the lint rule in Rules and Scripts, `PLAN.md` decisions and exit-criteria notes (leave "You approve the API and look" unticked). Push, and check CI.

## 8. Decisions (settled 2026-10-24)

| # | Question | Decision |
|---|---|---|
| 1 | Shortcut modifier | **Alt + M / V / H** (owner). Bare letters would fire while typing in chat |
| 2 | Button API | `variant` × `tone` |
| 3 | Action-bar shape | **All 44px rounded squares with one radius, per X2** (owner). No `shape` prop on ToggleButton |
| 4 | Muted look on the stage | **Neutral grey** (owner); red is reserved for Leave and errors |
| 5 | Green ring on the mic | **Only while speaking** (`isSpeaking`) (owner), so green means one thing everywhere |
| 6 | `tone="hand"` on ToggleButton | Build it now |
| 7 | `soft` variant | Keep it |
| 8 | React icon | One custom SVG smiley in `src/icons/` |
| 9 | Avatar xl (48px) | Defer to milestone 4 |
| 10 | Stage and dark `danger-soft` | red-900 `#2a161b`, as the canvas draws Leave |

## 9. Verification against the milestone 2 exit criteria

- **"Each has stories for every variant, size and state, plus a keyboard test":** the story and test lists in §2. `npm run check` passes. `npm run test:e2e` scans every story in light, dark and stage with zero violations, including open tooltips.
- **"You approve the API and look":** the owner reviews screenshots of the `ActionBarOnStage` stories (which reproduce `Focus.dc.html` 45–62), the avatars against `docs/screenshots/O2StudentActions.png`, the `Icons` story (X6), `ToggleButton › MicrophoneOn/Off` (X7), `IconButton › WithShortcut` (X5) and `Avatar › SpeakingAndFocused`.
- **"File pattern and new rules written into CLAUDE.md":** the §1 text and the className lint rule. `component-builder.md` already points to CLAUDE.md, so the milestone 3 agents inherit it.

## Build notes (2026-10-24)

Deviations from the plan above, each the smallest fix that keeps the intent. The full list, with the new tokens, is in `PLAN.md` › Decisions log.

- **§3 / decision 8:** Lucide does ship a smiley (`Smile`), so `react` maps to it and no custom SVG was added.
- **§2.1:** React Aria's prop is `defaultOpen`, not `defaultIsOpen`. The `Open` stories use `defaultOpen`.
- **§2.1 / §2.3:** React Aria's `Button` drops `aria-keyshortcuts` (it forwards only `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-details`). `useAriaKeyshortcuts` in `IconButton.tsx` sets it on the element through a callback ref. Because the React Compiler lint forbids writing to a forwarded ref, `IconButton` and `ToggleButton` omit `ref` from their props; React Aria triggers reach the button through `ButtonContext`.
- **§6:** `parameters.e2e.waitFor` is not possible, because `index.json` has tags but no parameters. Stories that open a tooltip on mount carry `tags: ['wait-for-tooltip']` and the e2e waits for `role="tooltip"` before scanning. `IconButton › WithShortcut` and `Avatar › SpeakingAndFocused` open theirs with `autoFocus`; the `Tooltip` stories use `defaultOpen`.
- **§1:** the icon map is in `src/icons/icons.ts`; `src/icons/index.ts` re-exports it together with `<Icon>` (a map in `index.ts` imported by `Icon.tsx` would be a cycle). `react-refresh/only-export-components` is off for component and icon files, which export styles and hooks by design.
- **§2.4:** a selected ToggleButton keeps its selected fill on hover and press; the canvas defines no hover state for it.
- **§2.1:** the key chip also has `font-sans font-medium`, so `<kbd>` does not render in the browser's monospace.
- **§2.2:** `Button` sizes the leading and trailing icons `sm` (16px) at `size="sm"` and `md` (20px) otherwise; the plan did not say.
- **§2.5:** the badge sits at `-right-1 -bottom-1` (a 4px overhang); the plan only said "bottom right".

### After the independent review (2026-10-24)

The reviewer's blocking, should-fix and nit items were all addressed; `PLAN.md` › Decisions log has the full list. Where they change this plan:

- **§2.4 (blocking):** a selected toggle was color-only. `data-selected` now also draws the inset 2px `selected-ring` (new token: blue-600 / blue-300 / blue-500 `#4d82d8` by mode, at least 3:1 on the selected fill and on surface-raised everywhere; `tokens:check` requires the family) and a Highlight border in forced colors. `tone` is `selectedTone: 'accent' | 'hand'`; `variant` and the danger tone are fixed to soft / neutral. While speaking the glyph is `speaking` and a hidden "Speaking" describes the button.
- **§2.5 / §1:** the speaking ring leaked onto focused children; the ring variables are registered `inherits: false` and `e2e/rings.spec.ts` checks the composition.
- **§2.1:** icon controls pass `labelHidden`, so the description is the shortcut alone, with a space before the key chip. `Tooltip` takes `className`.
- **§2.3 / §2.4:** `ref` is back, merged with `mergeRefs` from `react-aria` (explicit dependency) in `useAriaKeyshortcuts`, which lives in `src/shortcuts.ts`. Disabled icon controls are a focusable `aria-disabled` button inside `Focusable`, so their tooltip still works.
- **§1:** `src/styles/tv.ts` (`createTV` with the token scales) is the project's `tv`; one `ControlSize` and `iconSizeFor` come from Button; `Icon` and `Surface` use `tv()`; every story file has a literal `Stage` story; `useSurfaceProps()` replaces hand-written `data-surface`.
- **§2.5:** Avatar's `id` is `participantId`; a badge is only allowed at md and lg (by type); `on-avatar` replaces `text-white`; the label prefers the badge state; initials use NFC and `Intl.Segmenter`, strip Portuguese honorifics, take one grapheme for CJK and fall back to `?`. `SpeakingAndFocused` moved to ToggleButton, since avatar stacks will be buttons.
- **§3:** `breakouts` is `DoorOpen`; `moreVertical` is folded into `more`.
- **§6:** lint also rejects a bare-variable `className`, a `composeRenderProps` callback that does not call a `*Styles()` result, and `data-surface` outside `Surface`. The e2e readiness check requires a real descendant and no Storybook error display; autofocused stories are waited for automatically.
- **Left as is, by the reviewer's instruction:** `rounded-control` is 8px where the canvas draws the action bar at 12px; the owner decides from the screenshots.
