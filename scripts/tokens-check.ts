/**
 * Token gate, run by `npm run tokens:check` (part of `check` and CI):
 *   1. every pair in src/tokens/contrast.json meets its WCAG ratio in each listed mode
 *   2. every dimension is on the 4px grid; font sizes are 11/12/13/14/16/18
 *   3. src/tokens/tokens.css matches what tokens.json generates (stale check)
 * Prints a PASS/FAIL table and exits 1 on any failure.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { buildTokensCss, tokensCssPath, tokensJsonPath } from './build-tokens.ts';

type Mode = 'light' | 'dark' | 'stage';
type Pair = { fg: string; bg: string; min: number; modes?: Mode[]; note?: string };
type Json = Record<string, unknown>;

const FONT_SIZES = new Set([11, 12, 13, 14, 16, 18]);
const MODES: Mode[] = ['light', 'dark', 'stage'];

const tokens = JSON.parse(await readFile(tokensJsonPath, 'utf8')) as Json;
const contrast = JSON.parse(
  await readFile(path.resolve(path.dirname(tokensJsonPath), 'contrast.json'), 'utf8'),
) as {
  pairs: Pair[];
};

// ---------- token lookup and reference resolution ----------

function getNode(p: string): Json | undefined {
  let node: unknown = tokens;
  for (const key of p.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Json)[key];
  }
  return typeof node === 'object' && node !== null ? (node as Json) : undefined;
}

function rawValue(p: string): unknown {
  const node = getNode(p);
  if (!node || !('$value' in node)) throw new Error(`Token not found: ${p}`);
  return node.$value;
}

function resolve(value: unknown, depth = 0): unknown {
  if (depth > 20) throw new Error('Reference loop');
  if (typeof value === 'string') {
    const m = /^\{([^}]+)\}$/.exec(value);
    if (m) return resolve(rawValue(m[1]), depth + 1);
  }
  return value;
}

/** A semantic.color.X path resolved in a mode; primitives resolve directly. */
function colorIn(p: string, mode: Mode): string {
  if (p.startsWith('semantic.color.') && mode !== 'light') {
    const key = p.slice('semantic.color.'.length);
    const override = getNode(`modes.${mode}.color.${key}`);
    if (override && '$value' in override) return String(resolve(override.$value));
  }
  return String(resolve(rawValue(p)));
}

// ---------- WCAG contrast ----------

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`Only 6-digit hex colors can be checked, got "${hex}"`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(fg: string, bg: string): number {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

// ---------- checks ----------

type Row = { ok: boolean; what: string; detail: string };
const rows: Row[] = [];

const isSemantic = (p: string) => p.startsWith('semantic.color.');

// Families that must be declared in every mode, so a mode override cannot
// silently break them (e.g. a tint that stays light while its text turns white).
const semanticNames = Object.keys(getNode('semantic.color') ?? {}).filter((k) => !k.startsWith('$'));
const required: Array<[string, string]> = [];
for (const fg of semanticNames.filter((n) => /^text(-secondary|-muted)?$/.test(n))) {
  for (const bg of ['surface', 'surface-sunken', 'surface-raised']) required.push([fg, bg]);
}
for (const fg of semanticNames.filter((n) => n.startsWith('text-on-stage'))) {
  for (const bg of ['surface-stage', 'surface-tile']) required.push([fg, bg]);
}
for (const n of semanticNames) {
  if (n.startsWith('on-') && semanticNames.includes(n.slice(3))) required.push([n, n.slice(3)]);
  if (n.endsWith('-text') && semanticNames.includes(n.replace(/-text$/, '-soft'))) {
    required.push([n, n.replace(/-text$/, '-soft')]);
  }
}
if (semanticNames.includes('selected-text')) required.push(['selected-text', 'selected']);
// The inset ring is the non-color cue of a selected toggle, so it must read
// against the selected fill and against the unselected (raised) fill.
if (semanticNames.includes('selected-ring')) {
  required.push(['selected-ring', 'selected'], ['selected-ring', 'surface-raised']);
}

for (const [fg, bg] of required) {
  const declared = new Set<string>();
  for (const pair of contrast.pairs) {
    if (pair.fg === `semantic.color.${fg}` && pair.bg === `semantic.color.${bg}`) {
      for (const m of pair.modes ?? MODES) declared.add(m);
    }
  }
  const missing = MODES.filter((m) => !declared.has(m));
  rows.push({
    ok: missing.length === 0,
    what: `declared ${fg} on ${bg}`,
    detail:
      missing.length === 0 ? 'in every mode' : `not declared in contrast.json for: ${missing.join(', ')}`,
  });
}

for (const pair of contrast.pairs) {
  const modes = pair.modes ?? (isSemantic(pair.fg) || isSemantic(pair.bg) ? MODES : ['light']);
  for (const mode of modes) {
    if (!MODES.includes(mode)) throw new Error(`Unknown mode "${mode}" for ${pair.fg} on ${pair.bg}`);
    const fg = colorIn(pair.fg, mode);
    const bg = colorIn(pair.bg, mode);
    const ratio = contrastRatio(fg, bg);
    rows.push({
      ok: ratio >= pair.min,
      what: `${short(pair.fg)} on ${short(pair.bg)} [${mode}]`,
      detail: `${ratio.toFixed(2)}:1 (min ${pair.min}) ${fg} on ${bg}${pair.note ? ` · ${pair.note}` : ''}`,
    });
  }
}

function short(p: string): string {
  return p.replace(/^semantic\.color\./, '').replace(/^primitive\.color\./, '');
}

function px(value: unknown): number | null {
  const m = /^(\d+(?:\.\d+)?)px$/.exec(String(value));
  return m ? Number(m[1]) : null;
}

function walkDimensions(
  prefix: string,
  node: Json,
  fn: (path: string, value: number) => void,
  inherited?: string,
) {
  const type = typeof node.$type === 'string' ? node.$type : inherited;
  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith('$') || typeof child !== 'object' || child === null) continue;
    const c = child as Json;
    const childPath = `${prefix}.${key}`;
    if ('$value' in c) {
      const t = typeof c.$type === 'string' ? c.$type : type;
      if (t !== 'dimension') continue;
      const resolved = resolve(c.$value);
      const n = px(resolved);
      if (n === null) {
        rows.push({ ok: false, what: `grid ${childPath}`, detail: `not a px value: ${String(resolved)}` });
        continue;
      }
      fn(childPath, n);
    } else {
      walkDimensions(childPath, c, fn, type);
    }
  }
}

const gridGroups = ['primitive.space', 'primitive.radius', 'primitive.font.lineHeight', 'component'];
for (const group of gridGroups) {
  const node = getNode(group);
  if (!node) throw new Error(`Missing token group ${group}`);
  walkDimensions(group, node, (p, n) => {
    // `full` is a pill, and the speaking ring is a 2px stroke, not layout.
    if (p === 'primitive.radius.full' || p === 'component.tile.speaking-ring') return;
    rows.push({
      ok: n % 4 === 0,
      what: `grid ${p}`,
      detail: `${n}px${n % 4 === 0 ? '' : ' is not a multiple of 4'}`,
    });
    if (p.startsWith('primitive.space.') && !p.endsWith('.base')) {
      const step = Number(p.split('.').pop());
      rows.push({ ok: step * 4 === n, what: `scale ${p}`, detail: `${n}px = ${step} × 4px` });
    }
  });
}

const sizes = getNode('primitive.font.size');
if (!sizes) throw new Error('Missing primitive.font.size');
walkDimensions('primitive.font.size', sizes, (p, n) => {
  rows.push({
    ok: FONT_SIZES.has(n),
    what: `font size ${p}`,
    detail: `${n}px${FONT_SIZES.has(n) ? '' : ` is not one of ${[...FONT_SIZES].join('/')}`}`,
  });
});

const expectedCss = await buildTokensCss();
const committedCss = await readFile(tokensCssPath, 'utf8').catch(() => '');
rows.push({
  ok: expectedCss === committedCss,
  what: 'tokens.css is current',
  detail:
    expectedCss === committedCss
      ? 'matches tokens.json'
      : 'stale: run `npm run tokens` and commit the result',
});

// ---------- report ----------

const failures = rows.filter((r) => !r.ok);
const width = Math.max(...rows.map((r) => r.what.length));
for (const r of rows) {
  if (!r.ok || process.argv.includes('--verbose')) {
    console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.what.padEnd(width)}  ${r.detail}`);
  }
}
const counts = {
  contrast: rows.filter(
    (r) =>
      !r.what.startsWith('grid') &&
      !r.what.startsWith('scale') &&
      !r.what.startsWith('font size') &&
      !r.what.startsWith('declared') &&
      !r.what.startsWith('tokens.css'),
  ).length,
  declared: rows.filter((r) => r.what.startsWith('declared')).length,
  grid: rows.filter((r) => /^(grid|scale|font size)/.test(r.what)).length,
};
console.log(
  `${rows.length - failures.length}/${rows.length} token checks passed (${counts.contrast} contrast pairs by mode, ${counts.declared} required families, ${counts.grid} grid and size checks, 1 freshness check)`,
);
if (failures.length > 0) process.exit(1);
