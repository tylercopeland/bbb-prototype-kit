import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('token sheet', () => {
  test('has no WCAG 2.1 AA violations', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('shows the focus ring on the first focusable element after Tab', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toHaveText('Dark theme');
    const shadow = await focused.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(shadow).not.toBe('none');
  });
});
