/**
 * Generates src/routes/artboards.json from docs/artboards.md, the one list
 * of screens (CLAUDE.md › Routes and state). Each table row becomes one
 * entry: its file stem (the route name), group, number, title, size, source
 * board and the props that set the store's initial state.
 *
 *   npm run artboards          writes the JSON (commit the result)
 *   npm run artboards:check    fails when the JSON is stale (part of `check`)
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const artboardsMdPath = path.join(root, 'docs/artboards.md');
export const artboardsJsonPath = path.join(root, 'src/routes/artboards.json');

export type ArtboardGroup = 'desktop' | 'mobile';

export interface ArtboardEntry {
  /** The file stem from the canvas: the route segment after `/desktop/` or `/mobile/`. */
  stem: string;
  group: ArtboardGroup;
  /** The row number within its group. */
  number: number;
  title: string;
  size: { width: number; height: number };
  /** The big board the artboard renders: Focus, Breakout or Mobile. */
  board: string;
  /** The `<dc-import>` props, as `key=value` pairs. */
  props: Record<string, string>;
}

const GROUPS: Record<string, ArtboardGroup> = {
  'Prototype - Desktop': 'desktop',
  'Prototype - Mobile': 'mobile',
};

/** Splits a Markdown table row into trimmed cells, ignoring the outer pipes. */
function cells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

function parseProps(state: string): Record<string, string> {
  const props: Record<string, string> = {};
  for (const pair of state.split(/\s+/).filter(Boolean)) {
    const i = pair.indexOf('=');
    if (i <= 0) throw new Error(`Bad prop "${pair}" in state "${state}"`);
    props[pair.slice(0, i)] = pair.slice(i + 1);
  }
  return props;
}

export function parseArtboards(markdown: string): ArtboardEntry[] {
  const entries: ArtboardEntry[] = [];
  let group: ArtboardGroup | null = null;
  let header: string[] | null = null;
  for (const line of markdown.split('\n')) {
    const heading = /^##\s+(.+)$/.exec(line);
    if (heading) {
      group = GROUPS[heading[1].trim()] ?? null;
      header = null;
      continue;
    }
    if (!group || !line.trim().startsWith('|')) continue;
    const row = cells(line);
    if (!header) {
      header = row;
      continue;
    }
    if (row.every((c) => /^-+$/.test(c))) continue;
    const get = (name: string) => {
      const i = header!.indexOf(name);
      if (i < 0) throw new Error(`Column "${name}" missing from the ${group} table`);
      return row[i] ?? '';
    };
    const size = /^(\d+)×(\d+)$/.exec(get('Size'));
    if (!size) throw new Error(`Bad size "${get('Size')}" in row ${get('#')}`);
    const stem = get('File').replace(/^`|`$/g, '');
    if (!/^[A-Za-z0-9-]+$/.test(stem)) throw new Error(`Bad file stem "${stem}"`);
    entries.push({
      stem,
      group,
      number: Number(get('#')),
      title: get('Artboard'),
      size: { width: Number(size[1]), height: Number(size[2]) },
      board: get('Source board'),
      props: parseProps(get('State')),
    });
  }
  const stems = new Set<string>();
  for (const e of entries) {
    const key = `${e.group}/${e.stem}`;
    if (stems.has(key)) throw new Error(`Duplicate artboard ${key}`);
    stems.add(key);
  }
  return entries;
}

export async function buildArtboardsJson(): Promise<string> {
  const markdown = await readFile(artboardsMdPath, 'utf8');
  return `${JSON.stringify(parseArtboards(markdown), null, 2)}\n`;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const expected = await buildArtboardsJson();
  if (process.argv.includes('--check')) {
    const committed = await readFile(artboardsJsonPath, 'utf8').catch(() => '');
    if (committed !== expected) {
      console.log('FAIL  artboards.json is stale: run `npm run artboards` and commit the result');
      process.exit(1);
    }
    const count = (JSON.parse(expected) as ArtboardEntry[]).length;
    console.log(`PASS  src/routes/artboards.json matches docs/artboards.md (${count} artboards)`);
  } else {
    await writeFile(artboardsJsonPath, expected);
    const count = (JSON.parse(expected) as ArtboardEntry[]).length;
    console.log(`Wrote ${path.relative(root, artboardsJsonPath)} (${count} artboards)`);
  }
}
