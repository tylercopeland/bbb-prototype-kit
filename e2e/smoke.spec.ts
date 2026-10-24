import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const wcag = ['wcag2a', 'wcag2aa', 'wcag21aa'];

/** The computed value of a --bbb-* token on <html>, as the browser resolves it. */
async function token(page: Page, name: string) {
  return page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);
}

function hexToRgb(hex: string) {
  // The minifier shortens #ffffff to #fff.
  const full = hex.length === 4 ? hex.replace(/[0-9a-f]/gi, (c) => c + c) : hex;
  const n = parseInt(full.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

test.describe('token sheet', () => {
  test('has no WCAG 2.1 AA violations in light and dark', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const light = await new AxeBuilder({ page }).withTags(wcag).analyze();
    expect(light.violations).toEqual([]);

    await page.getByRole('button', { name: 'Dark theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const dark = await new AxeBuilder({ page }).withTags(wcag).analyze();
    expect(dark.violations).toEqual([]);
  });

  test('shows the focus ring in the focus-ring token color after Tab', async ({ page }) => {
    await page.goto('/');
    // Tab only once the app has rendered, or nothing is there to focus yet.
    await expect(page.getByRole('button', { name: 'Dark theme' })).toBeVisible();
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toHaveText('Dark theme');
    const ring = await token(page, '--bbb-focus-ring');
    expect(ring).toMatch(/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/);
    const shadow = await focused.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(shadow).toContain(hexToRgb(ring));
    expect(shadow).toContain(hexToRgb(await token(page, '--bbb-ring-offset')));
  });
});

test.describe('token sheet in forced colors', () => {
  test.use({ contextOptions: { forcedColors: 'active' } });

  test('shows an outline only on the focused element', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Dark theme' });
    expect(await toggle.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('none');
    await page.keyboard.press('Tab');
    await expect(toggle).toBeFocused();
    expect(await toggle.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
  });
});
