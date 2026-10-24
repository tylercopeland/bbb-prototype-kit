/** Shared helpers for the Storybook e2e specs: the story index, URLs and the readiness check. */
import { readFileSync } from 'node:fs';
import { expect, type Page } from '@playwright/test';
import { storybookUrl } from './ports.ts';

export type IndexEntry = { id: string; title: string; name: string; type: 'story' | 'docs'; tags?: string[] };
type StoryIndex = { entries: Record<string, IndexEntry> };

// A story tagged `wait-for-tooltip` opens a tooltip on mount (defaultOpen or
// autoFocus); the scan waits for it so the portal is part of every run.
export const WAIT_FOR_TOOLTIP = 'wait-for-tooltip';
// A story tagged `wait-for-overlay` opens a popover, dialog, sheet, menu or
// toast on mount (defaultOpen); the scan waits for the overlay the same way.
export const WAIT_FOR_OVERLAY = 'wait-for-overlay';
const OVERLAY = '[role="dialog"], [role="alertdialog"], [role="menu"]';
// Something a story renders: a control, a landmark or widget, a glyph, text.
const RENDERED = '#storybook-root :is(button, [role], svg, span, p, table, img, input)';

export function readStories(): IndexEntry[] {
  const index = JSON.parse(readFileSync('storybook-static/index.json', 'utf8')) as StoryIndex;
  return Object.values(index.entries).filter((e) => e.type === 'story');
}

export function storyUrl(id: string, globals: string) {
  return `${storybookUrl}/iframe.html?id=${id}&viewMode=story&globals=${encodeURIComponent(globals)}`;
}

/** Waits until the story has rendered something real and Storybook shows no error. */
export async function storyReady(page: Page, story: Pick<IndexEntry, 'tags'>) {
  // An overlay story may render nothing but its portal (a dialog driven from
  // state, with no trigger), so the overlay itself counts as rendered.
  const overlay = story.tags?.includes(WAIT_FOR_OVERLAY);
  await expect(page.locator(overlay ? `${RENDERED}, ${OVERLAY}` : RENDERED).first()).toBeAttached();
  await expect(page.locator('body')).not.toHaveClass(/sb-show-errordisplay/);
  await expect(page.locator('html')).toHaveAttribute('data-theme', /light|dark/);
  if (story.tags?.includes(WAIT_FOR_TOOLTIP)) {
    await expect(page.getByRole('tooltip').first()).toBeVisible();
  } else if (overlay) {
    await expect(page.locator(OVERLAY).first()).toBeVisible();
    // Scan after the entering animation: a mid-fade overlay reads as blended colors to axe.
    await expect(page.locator('[data-entering]')).toHaveCount(0);
  } else if (await page.evaluate(() => document.activeElement?.closest('#storybook-root') !== null)) {
    // The story focused something on mount (autoFocus): if that control has a
    // tooltip it opens at once, so give it a moment before scanning.
    await page
      .getByRole('tooltip')
      .first()
      .waitFor({ state: 'visible', timeout: 1000 })
      .catch(() => undefined);
  }
  await page.waitForFunction(() => !(window as { axe?: { _running?: boolean } }).axe?._running);
}
