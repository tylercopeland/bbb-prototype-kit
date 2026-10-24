/**
 * Runs axe on the index and on every artboard route in src/routes/artboards.json
 * (generated from docs/artboards.md by `npm run artboards`), each at its
 * artboard size. Routes that are not built yet render the placeholder, so the
 * whole list is scanned from day one.
 */
import { readFileSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

type Artboard = {
  stem: string;
  group: 'desktop' | 'mobile';
  number: number;
  title: string;
  size: { width: number; height: number };
};

const artboards = JSON.parse(readFileSync('src/routes/artboards.json', 'utf8')) as Artboard[];
const wcag = ['wcag2a', 'wcag2aa', 'wcag21aa'];

async function noViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(wcag).analyze();
  expect(results.violations, label).toEqual([]);
}

test.describe('artboard routes', () => {
  test('the list has every artboard', () => {
    expect(artboards.length).toBeGreaterThan(0);
    expect(artboards.some((a) => a.group === 'desktop')).toBe(true);
    expect(artboards.some((a) => a.group === 'mobile')).toBe(true);
  });

  test('the index links to every artboard and has no WCAG 2.1 AA violations', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('BigBlueButton 4.0 prototype');
    for (const a of artboards) {
      await expect(page.locator(`a[href="/${a.group}/${a.stem}"]`)).toHaveCount(1);
    }
    await noViolations(page, 'index');
  });

  test('an unknown route shows the not-found page without violations', async ({ page }) => {
    await page.goto('/desktop/does-not-exist');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('No artboard here');
    await noViolations(page, 'not found');
  });

  for (const a of artboards) {
    test(`${a.group} ${a.number} · ${a.stem} renders at ${a.size.width}×${a.size.height} with no WCAG 2.1 AA violations`, async ({
      page,
    }) => {
      await page.setViewportSize(a.size);
      await page.goto(`/${a.group}/${a.stem}`);
      // Either the built screen or the placeholder: both start with the artboard's h1.
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
      await expect(page).toHaveTitle(new RegExp(a.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      await noViolations(page, `${a.group}/${a.stem}`);
    });
  }
});
