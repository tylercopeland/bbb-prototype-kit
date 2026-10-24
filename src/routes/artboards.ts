/**
 * Typed access to `artboards.json`, which `npm run artboards` generates from
 * `docs/artboards.md`. Every artboard is a route: `/desktop/<stem>` or
 * `/mobile/<stem>`. Nothing else keeps a list of screens.
 */
import entries from './artboards.json';

export type ArtboardGroup = 'desktop' | 'mobile';

export interface Artboard {
  stem: string;
  group: ArtboardGroup;
  number: number;
  title: string;
  size: { width: number; height: number };
  board: string;
  props: Record<string, string>;
}

// The JSON's inferred type has every prop key as optional; the generator guarantees the shape.
export const artboards: readonly Artboard[] = entries as unknown as Artboard[];

export const groups: readonly ArtboardGroup[] = ['desktop', 'mobile'];

export const groupTitles: Record<ArtboardGroup, string> = {
  desktop: 'Desktop',
  mobile: 'Mobile',
};

export function isGroup(value: string | undefined): value is ArtboardGroup {
  return value === 'desktop' || value === 'mobile';
}

export function findArtboard(group: ArtboardGroup, stem: string): Artboard | undefined {
  return artboards.find((a) => a.group === group && a.stem === stem);
}

export function artboardPath(artboard: Pick<Artboard, 'group' | 'stem'>): string {
  return `/${artboard.group}/${artboard.stem}`;
}

export function artboardsIn(group: ArtboardGroup): Artboard[] {
  return artboards.filter((a) => a.group === group);
}
