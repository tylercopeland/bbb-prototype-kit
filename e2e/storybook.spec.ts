/**
 * Runs axe on every story in storybook-static/index.json, in light, dark
 * and stage. `test:e2e` builds Storybook first; Playwright serves the
 * static output on port 6007 (see playwright.config.ts).
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readStories, storyReady, storyUrl } from './stories.ts';

const stories = readStories();

// a11y.manual:!true stops the addon's own axe run, which would collide with
// the one below ("Axe is already running").
const modes = [
  { name: 'light', globals: 'theme:light;surface:panel;a11y.manual:!true', stage: false },
  { name: 'dark', globals: 'theme:dark;surface:panel;a11y.manual:!true', stage: false },
  { name: 'stage', globals: 'theme:light;surface:stage;a11y.manual:!true', stage: true },
];

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
