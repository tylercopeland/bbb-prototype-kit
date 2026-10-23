/**
 * Runs axe on every story in storybook-static/index.json, in light, dark
 * and stage. `test:e2e` builds Storybook first; Playwright serves the
 * static output on port 6007 (see playwright.config.ts).
 */
import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { storybookUrl } from './ports.ts';

type IndexEntry = { id: string; title: string; name: string; type: 'story' | 'docs' };
type StoryIndex = { entries: Record<string, IndexEntry> };

const index = JSON.parse(readFileSync('storybook-static/index.json', 'utf8')) as StoryIndex;
const stories = Object.values(index.entries).filter((e) => e.type === 'story');

// a11y.manual:!true stops the addon's own axe run, which would collide with
// the one below ("Axe is already running").
const modes = [
  { name: 'light', globals: 'theme:light;surface:panel;a11y.manual:!true' },
  { name: 'dark', globals: 'theme:dark;surface:panel;a11y.manual:!true' },
  { name: 'stage', globals: 'theme:light;surface:stage;a11y.manual:!true' },
];

test.describe('stories', () => {
  test('index lists at least one story', () => {
    expect(stories.length).toBeGreaterThan(0);
  });

  for (const story of stories) {
    for (const mode of modes) {
      test(`${story.title} › ${story.name} [${mode.name}] has no WCAG 2.1 AA violations`, async ({
        page,
      }) => {
        const url = `${storybookUrl}/iframe.html?id=${story.id}&viewMode=story&globals=${encodeURIComponent(mode.globals)}`;
        await page.goto(url);
        const root = page.locator('#storybook-root');
        await expect(root).not.toBeEmpty();
        // A story's own `globals` win over the URL; assert on what actually applied.
        await expect(page.locator('html')).toHaveAttribute('data-theme', /light|dark/);
        await page.waitForFunction(() => !(window as { axe?: { _running?: boolean } }).axe?._running);
        const results = await new AxeBuilder({ page })
          .include('#storybook-root')
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze();
        expect(results.violations).toEqual([]);
      });
    }
  }
});
