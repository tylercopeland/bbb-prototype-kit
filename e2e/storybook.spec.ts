/**
 * Runs axe on every story in storybook-static/index.json, in light, dark
 * and stage. `test:e2e` builds Storybook first; Playwright serves the
 * static output on port 6007 (see playwright.config.ts).
 */
import { readFileSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { storybookUrl } from './ports.ts';

type IndexEntry = { id: string; title: string; name: string; type: 'story' | 'docs'; tags?: string[] };
type StoryIndex = { entries: Record<string, IndexEntry> };

// A story tagged `wait-for-tooltip` opens a tooltip on mount (defaultOpen or
// autoFocus); the scan waits for it so the portal is part of every run.
const WAIT_FOR_TOOLTIP = 'wait-for-tooltip';
// Something a story renders: a control, a landmark or widget, a glyph, text.
const RENDERED = '#storybook-root :is(button, [role], svg, span, p, table, img, input)';

const index = JSON.parse(readFileSync('storybook-static/index.json', 'utf8')) as StoryIndex;
const stories = Object.values(index.entries).filter((e) => e.type === 'story');

// a11y.manual:!true stops the addon's own axe run, which would collide with
// the one below ("Axe is already running").
const modes = [
  { name: 'light', globals: 'theme:light;surface:panel;a11y.manual:!true', stage: false },
  { name: 'dark', globals: 'theme:dark;surface:panel;a11y.manual:!true', stage: false },
  { name: 'stage', globals: 'theme:light;surface:stage;a11y.manual:!true', stage: true },
];

/** Waits until the story has rendered something real and Storybook shows no error. */
export async function storyReady(page: Page, story: Pick<IndexEntry, 'tags'>) {
  await expect(page.locator(RENDERED).first()).toBeAttached();
  await expect(page.locator('body')).not.toHaveClass(/sb-show-errordisplay/);
  await expect(page.locator('html')).toHaveAttribute('data-theme', /light|dark/);
  if (story.tags?.includes(WAIT_FOR_TOOLTIP)) {
    await expect(page.getByRole('tooltip').first()).toBeVisible();
  } else if (await page.evaluate(() => document.activeElement?.closest('#storybook-root') !== null)) {
    // The story focused something on mount (autoFocus): if that control has a
    // tooltip it opens at once, so give it one frame before scanning.
    await page
      .getByRole('tooltip')
      .first()
      .waitFor({ state: 'visible', timeout: 1000 })
      .catch(() => undefined);
  }
  await page.waitForFunction(() => !(window as { axe?: { _running?: boolean } }).axe?._running);
}

export function storyUrl(id: string, globals: string) {
  return `${storybookUrl}/iframe.html?id=${id}&viewMode=story&globals=${encodeURIComponent(globals)}`;
}

test.describe('stories', () => {
  test('index lists at least one story', () => {
    expect(stories.length).toBeGreaterThan(0);
  });

  for (const story of stories) {
    test(`${story.title} › ${story.name} has no WCAG 2.1 AA violations in any mode`, async ({ page }) => {
      // A story's own `globals` win over the URL, so the same state can come
      // up under two modes; each effective theme and surface is scanned once.
      const scanned = new Set<string>();
      for (const mode of modes) {
        await page.goto(storyUrl(story.id, mode.globals));
        await storyReady(page, story);
        const theme = await page.locator('html').getAttribute('data-theme');
        const onStage = (await page.locator('[data-surface="stage"]').count()) > 0;
        if (mode.stage) expect(onStage, 'stage mode wraps the story in data-surface="stage"').toBe(true);
        const state = `${theme}/${onStage ? 'stage' : 'panel'}`;
        if (scanned.has(state)) continue;
        scanned.add(state);
        // The whole page, so overlays that portal to <body> are scanned too.
        const results = await new AxeBuilder({ page })
          .exclude('#storybook-docs')
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze();
        expect(results.violations, `${mode.name} mode (${state})`).toEqual([]);
      }
      expect(scanned.size).toBeGreaterThan(0);
    });
  }
});
