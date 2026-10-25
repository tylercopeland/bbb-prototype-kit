import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { artboardsJsonPath, artboardsMdPath, buildArtboardsJson, parseArtboards, type ArtboardEntry } from './artboards.ts';

const sample = `
# Artboard index

## Prototype - Desktop

| # | Artboard | File | Size | Source board | State |
|---|---|---|---|---|---|
| 1 | A · Action bar | \`F1Bar-4roh-l8ju\` | 1400×900 | Focus | layout=bar panel=none |
| 2 | Breakout · 3 · Move | \`BO3SetupMove-desk\` | 1400×900 | Breakout | phase=setup mode=groups rooms=4 moving=ana |

## Prototype - Mobile

| # | Artboard | File | Size | Source board | State |
|---|---|---|---|---|---|
| 1 | Phone · room | \`MB1Room\` | 390×844 | Mobile | orient=portrait sheet=none |
| 8 | Phone landscape · room | \`MB8Landscape\` | 844×390 | Mobile | orient=landscape sheet=none |

## Something else

| # | Artboard | File | Size | Source board | State |
|---|---|---|---|---|---|
| 1 | Ignored | \`Nope\` | 1×1 | X | a=b |
`;

describe('parseArtboards', () => {
  it('reads each table row of the two prototype sections', () => {
    const entries = parseArtboards(sample);
    expect(entries.map((e) => `${e.group}/${e.stem}`)).toEqual([
      'desktop/F1Bar-4roh-l8ju',
      'desktop/BO3SetupMove-desk',
      'mobile/MB1Room',
      'mobile/MB8Landscape',
    ]);
    expect(entries[1]).toEqual<ArtboardEntry>({
      stem: 'BO3SetupMove-desk',
      group: 'desktop',
      number: 2,
      title: 'Breakout · 3 · Move',
      size: { width: 1400, height: 900 },
      board: 'Breakout',
      props: { phase: 'setup', mode: 'groups', rooms: '4', moving: 'ana' },
    });
    expect(entries[3].size).toEqual({ width: 844, height: 390 });
    expect(entries[3].number).toBe(8);
  });

  it('rejects a bad size, a bad prop and a duplicate stem', () => {
    expect(() => parseArtboards(sample.replace('1400×900', 'big'))).toThrow(/Bad size/);
    expect(() => parseArtboards(sample.replace('layout=bar', 'layout'))).toThrow(/Bad prop/);
    expect(() => parseArtboards(sample.replace('MB8Landscape', 'MB1Room'))).toThrow(/Duplicate/);
  });

  it('matches the committed JSON, so `check` catches a stale file', async () => {
    const committed = await readFile(artboardsJsonPath, 'utf8');
    expect(committed).toBe(await buildArtboardsJson());
    const entries = parseArtboards(await readFile(artboardsMdPath, 'utf8'));
    expect(entries.filter((e) => e.group === 'desktop')).toHaveLength(33);
    expect(entries.filter((e) => e.group === 'mobile')).toHaveLength(14);
  });
});
