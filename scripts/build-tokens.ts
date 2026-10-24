/**
 * Generates src/tokens/tokens.css (Tailwind v4 @theme blocks and mode
 * overrides) from src/tokens/tokens.json with Style Dictionary.
 *
 *   npm run tokens          writes the file
 *   import { buildTokensCss } from './build-tokens'   builds in memory
 *
 * Mapping (see docs/plans/m1-foundations.md §4):
 *   primitive.color.X.Y        --color-X-Y              @theme
 *   primitive.font.family.X    --font-X
 *   primitive.font.size.X      --text-X (+ --text-X--line-height from lineHeight.X)
 *   primitive.font.weight.X    --font-weight-X
 *   primitive.font.letterSpacing.X --tracking-X
 *   component.page.max-width   --container-page (max-w-page)
 *   primitive.radius.X         --radius-X
 *   primitive.shadow.X         --shadow-X (shadow-X)
 *   primitive.space.base       --spacing
 *   component.control.sm       --spacing-control-sm
 *   component.X.radius         --radius-X
 *   component.tile.speaking-ring --spacing-speaking-ring
 *   semantic.color.X           --color-X: var(--bbb-X)   @theme inline
 *                              --bbb-X in :root, [data-theme="light"]
 *   modes.dark.color.X         --bbb-X in [data-theme="dark"]
 *   modes.stage.color.X        --bbb-X in [data-surface="stage"]
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import StyleDictionary from 'style-dictionary';
import type { DesignTokens, TransformedToken } from 'style-dictionary/types';

const here = path.dirname(fileURLToPath(import.meta.url));
export const tokensJsonPath = path.resolve(here, '../src/tokens/tokens.json');
export const tokensCssPath = path.resolve(here, '../src/tokens/tokens.css');

const TRANSFORM = 'name/tailwind';
const FORMAT = 'css/tailwind-v4';

/** The CSS custom property a token path maps to. Mode tokens get an `@mode` suffix so names stay unique. */
export function tailwindName(p: string[]): string {
  const [tier, ...rest] = p;
  if (tier === 'primitive') {
    const [group, sub, ...tail] = rest;
    if (group === 'color') return `color-${[sub, ...tail].join('-')}`;
    if (group === 'font') {
      if (sub === 'family') return `font-${tail.join('-')}`;
      if (sub === 'size') return `text-${tail.join('-')}`;
      if (sub === 'lineHeight') return `text-${tail.join('-')}--line-height`;
      if (sub === 'weight') return `font-weight-${tail.join('-')}`;
      if (sub === 'letterSpacing') return `tracking-${tail.join('-')}`;
    }
    if (group === 'radius') return `radius-${[sub, ...tail].join('-')}`;
    if (group === 'shadow') return `shadow-${[sub, ...tail].join('-')}`;
    if (group === 'space') return sub === 'base' ? 'spacing' : `space-${[sub, ...tail].join('-')}`;
  }
  if (tier === 'semantic' && rest[0] === 'color') return `color-${rest.slice(1).join('-')}`;
  if (tier === 'component') {
    const [comp, key] = rest;
    if (key === 'radius') return `radius-${comp}`;
    if (comp === 'row' && key === 'height') return 'spacing-row';
    if (comp === 'panel' && key === 'width') return 'spacing-panel';
    if (comp === 'tile' && key === 'speaking-ring') return 'spacing-speaking-ring';
    if (comp === 'page' && key === 'max-width') return 'container-page';
    return `spacing-${comp}-${key}`;
  }
  if (tier === 'modes') {
    const [mode, group, ...tail] = rest;
    if (group === 'color') return `bbb-${tail.join('-')}@${mode}`;
  }
  throw new Error(`No Tailwind variable mapping for token ${p.join('.')}`);
}

/** `{primitive.color.a.b}` → `var(--color-a-b)`; anything else is emitted as-is. */
function refToVar(value: unknown): string {
  if (typeof value !== 'string') return String(value);
  return value.replace(/\{([^}]+)\}/g, (_m, ref: string) => `var(--${tailwindName(ref.split('.'))})`);
}

function cssValue(token: TransformedToken): string {
  const v = token.$value as unknown;
  if (Array.isArray(v)) return v.map((f) => (/[\s]/.test(String(f)) ? `"${f}"` : String(f))).join(', ');
  return String(v);
}

function formatTailwindV4({ dictionary }: { dictionary: { allTokens: TransformedToken[] } }): string {
  const all = dictionary.allTokens;
  const byPath = new Map(all.map((t) => [t.path.join('.'), t]));
  const line = (name: string, value: string) => `  --${name}: ${value};`;

  const theme: string[] = [
    '  --color-*: initial;',
    '  --radius-*: initial;',
    '  --text-*: initial;',
    '  --font-*: initial;',
    '  --font-weight-*: initial;',
    '  --leading-*: initial;',
    '  --tracking-*: initial;',
    '  --shadow-*: initial;',
    '  --inset-shadow-*: initial;',
    '  --drop-shadow-*: initial;',
    '  --container-*: initial;',
    '',
    '  --color-white: #ffffff;',
    '  --color-transparent: transparent;',
    '  --color-current: currentColor;',
    '',
  ];
  const inline: string[] = [];
  const light: string[] = [];
  const modes = new Map<string, string[]>();

  let lastGroup = '';
  const section = (key: string) => {
    if (lastGroup && lastGroup !== key) theme.push('');
    lastGroup = key;
  };

  for (const t of all) {
    const [tier, ...rest] = t.path;
    if (tier === 'primitive') {
      const [group, sub] = rest;
      if (group === 'font' && sub === 'lineHeight') continue; // emitted next to its size
      if (group === 'space' && sub !== 'base') continue; // documents the scale only
      section(group === 'color' ? `color-${sub}` : group);
      theme.push(line(t.name, cssValue(t)));
      if (group === 'font' && sub === 'size') {
        const lh = byPath.get(['primitive', 'font', 'lineHeight', ...rest.slice(2)].join('.'));
        if (!lh) throw new Error(`Missing line height for ${t.path.join('.')}`);
        theme.push(line(lh.name, cssValue(lh)));
      }
    } else if (tier === 'component') {
      section('component');
      theme.push(line(t.name, refToVar(t.original.$value)));
    } else if (tier === 'semantic') {
      const key = rest.slice(1).join('-');
      inline.push(line(t.name, `var(--bbb-${key})`));
      light.push(line(`bbb-${key}`, refToVar(t.original.$value)));
    } else if (tier === 'modes') {
      const [name, mode] = t.name.split('@');
      const list = modes.get(mode) ?? [];
      list.push(line(name, refToVar(t.original.$value)));
      modes.set(mode, list);
    }
  }

  const out: string[] = [
    '/* Do not edit directly, generated from src/tokens/tokens.json by `npm run tokens` */',
    '',
    "/* 1. Primitives. Tailwind's default palette and scales are removed, so only these names produce utilities. */",
    '@theme {',
    ...theme,
    '}',
    '',
    '/* 2. Semantic tokens. Runtime CSS variables, so themes swap without rebuilding. `inline` makes utilities read the variable. */',
    '@theme inline {',
    ...inline,
    '}',
    '',
    ':root,',
    '[data-theme="light"] {',
    '  color-scheme: light;',
    ...light,
    '}',
  ];
  const selectors: Record<string, { selector: string; head: string[] }> = {
    dark: { selector: '[data-theme="dark"]', head: ['  color-scheme: dark;'] },
    stage: { selector: '[data-surface="stage"]', head: [] },
  };
  for (const [mode, lines] of modes) {
    const sel = selectors[mode];
    if (!sel) throw new Error(`Unknown mode "${mode}" in tokens.json`);
    out.push('', `${sel.selector} {`, ...sel.head, ...lines, '}');
  }
  return out.join('\n') + '\n';
}

let registered = false;
function register() {
  if (registered) return;
  registered = true;
  StyleDictionary.registerTransform({
    name: TRANSFORM,
    type: 'name',
    transform: (token) => tailwindName(token.path),
  });
  StyleDictionary.registerFormat({ name: FORMAT, format: formatTailwindV4 });
}

export async function buildTokensCss(): Promise<string> {
  register();
  const tokens = JSON.parse(await readFile(tokensJsonPath, 'utf8')) as DesignTokens;
  const sd = new StyleDictionary({
    tokens,
    log: { verbosity: 'silent' },
    platforms: {
      css: {
        transforms: [TRANSFORM],
        files: [{ destination: 'tokens.css', format: FORMAT }],
      },
    },
  });
  const [file] = await sd.formatPlatform('css');
  return String(file.output);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const css = await buildTokensCss();
  await writeFile(tokensCssPath, css);
  console.log(`Wrote ${path.relative(process.cwd(), tokensCssPath)} (${css.split('\n').length} lines)`);
}
