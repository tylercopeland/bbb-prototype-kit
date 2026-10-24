/**
 * The milestone 4 room flows, by keyboard only (PLAN.md › Definition of
 * done): F1 → open People → open a person's menu → Escape, and G2 → type
 * and send a message. Both at the artboard size, 1400×900.
 */
import { test, expect, type Page } from '@playwright/test';

const SIZE = { width: 1400, height: 900 };

/** Presses Tab until the focused element has the accessible name, or fails after `max` presses. */
async function tabTo(page: Page, name: string | RegExp, max = 60) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    const label = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      return el?.getAttribute('aria-label') ?? el?.textContent?.trim() ?? '';
    });
    if (typeof name === 'string' ? label === name : name.test(label)) return;
  }
  throw new Error(`Never reached a control named ${String(name)}`);
}

test.describe('room, keyboard only', () => {
  test('F1 → People → a person’s menu → Escape returns focus', async ({ page }) => {
    await page.setViewportSize(SIZE);
    await page.goto('/desktop/F1Bar-4roh-l8ju');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hack Week: Brazil 2026');
    await expect(page.getByRole('complementary')).toHaveCount(0);

    await tabTo(page, 'People');
    await page.keyboard.press('Enter');
    const panel = page.getByRole('complementary', { name: 'People' });
    await expect(panel).toBeVisible();
    await expect(page.getByRole('button', { name: 'People' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('list', { name: 'Raised hands 4' })).toBeVisible();

    // The row actions are hidden until focus reaches them (X13), then they show.
    const more = page.getByRole('button', { name: 'More actions for Bruno' });
    await expect(more).toHaveCSS('opacity', '0');
    await tabTo(page, 'More actions for Bruno');
    await expect(more).toBeFocused();
    await expect(more).toHaveCSS('opacity', '1');
    await page.keyboard.press('Enter');
    const menu = page.getByRole('menu', { name: 'More actions for Bruno' });
    await expect(menu).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Make presenter' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: 'Turn off camera' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(more).toBeFocused();

    // Escape never closes the panel by itself; the close button does.
    await tabTo(page, 'Close panel', 80);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('complementary')).toHaveCount(0);
  });

  test('G2 → type and send a message to everyone', async ({ page }) => {
    await page.setViewportSize(SIZE);
    await page.goto('/desktop/G2ChatEveryone-gqvt');
    const list = page.getByRole('list', { name: 'Messages to everyone' });
    await expect(list.getByRole('listitem')).toHaveCount(3);

    await tabTo(page, 'Message everyone');
    await page.keyboard.type('Can everyone see slide 3?');
    await page.keyboard.press('Enter');
    await expect(list.getByRole('listitem')).toHaveCount(4);
    await expect(list.getByRole('listitem').last()).toContainText('Can everyone see slide 3?');
    await expect(page.getByRole('textbox', { name: 'Message everyone' })).toHaveValue('');
    // Our own message is never announced.
    await expect(page.getByRole('status')).toBeEmpty();
  });

  test('raising a hand shows in People and is announced', async ({ page }) => {
    await page.setViewportSize(SIZE);
    await page.goto('/desktop/G1People-my6z');
    await tabTo(page, 'Raise hand', 80);
    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: 'Raise hand' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('list', { name: 'Raised hands 5' })).toBeVisible();
    await expect(page.getByRole('status')).toContainText('raised their hand');
  });
});
