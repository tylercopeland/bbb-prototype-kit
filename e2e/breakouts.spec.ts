/**
 * The milestone 5 batch C flows, by keyboard only, at the artboard size:
 * set up rooms → move a student with "Move to…" → open the rooms (confirm);
 * answer a help request; peek at a room; close the rooms; show a room's
 * work. Every walk ends with a `toBeFocused()` check, so focus is never
 * lost to <body> (WCAG 2.4.3).
 */
import { test, expect, type Page } from '@playwright/test';

const SIZE = { width: 1400, height: 900 };

/** Presses Tab (or Shift+Tab) until the focused element has the accessible name, or fails after `max` presses. */
async function tabTo(page: Page, name: string | RegExp, max = 60, key = 'Tab') {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press(key);
    const label = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return '';
      const byIds = (attr: string) =>
        el
          .getAttribute(attr)
          ?.split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
          .join(' ');
      return el.getAttribute('aria-label') ?? byIds('aria-labelledby') ?? el.textContent?.trim() ?? '';
    });
    if (typeof name === 'string' ? label === name : name.test(label)) return;
  }
  throw new Error(`Never reached a control named ${String(name)}`);
}

test.describe('breakout rooms, keyboard only', () => {
  test('BO2 → Move to… moves Ana and keeps focus on her → Open 4 rooms confirms → the live panel’s +5 min takes focus', async ({
    page,
  }) => {
    await page.setViewportSize(SIZE);
    await page.goto('/desktop/BO2SetupGroups-desk');
    await expect(page.getByRole('complementary', { name: 'Breakout rooms' })).toBeVisible();
    const board = page.getByRole('list', { name: 'Rooms' });
    await expect(board.getByRole('heading', { level: 3 })).toHaveCount(4);

    // Every student is a "Move to…" menu trigger (B2).
    await tabTo(page, 'Move Ana Souza to another room', 80);
    await page.keyboard.press('Enter');
    const menu = page.getByRole('menu', { name: 'Move Ana Souza to another room' });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: /^Room 4/ })).toHaveAttribute('aria-disabled', 'true');
    await expect(menu.getByRole('menuitem', { name: /^Room 1/ })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(menu).toHaveCount(0);
    // The move is announced and focus stays on Ana, now in Room 1.
    await expect(page.getByRole('status')).toContainText('Ana moved to Room 1');
    const room1 = page.getByRole('list', { name: 'Room 1 students' });
    await expect(room1.getByRole('button', { name: 'Move Ana Souza to another room' })).toBeFocused();
    await expect(page.getByRole('button', { name: 'Rooms are uneven · Even out' })).toBeVisible();

    // Back to the panel: Open 4 rooms asks first (B5), Cancel takes focus, then the confirm.
    await tabTo(page, 'Open 4 rooms', 20, 'Shift+Tab');
    await page.keyboard.press('Enter');
    const confirm = page.getByRole('alertdialog', { name: 'Open 4 rooms?' });
    await expect(confirm).toBeVisible();
    await expect(confirm.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(confirm.getByRole('button', { name: 'Open 4 rooms' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(confirm).toHaveCount(0);
    await expect(page.getByRole('tab', { name: /^4 rooms live/ })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('status')).toContainText('4 breakout rooms opened');
    // Ana's move survived into the live rooms (B4).
    await expect(page.getByRole('button', { name: 'Preview Room 1' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: '+5 min' })).toBeFocused();
  });

  test('BO5 → the help pill opens Room 2’s preview → a message is sent → Join → Acknowledge clears the pill and lands on Clear', async ({
    page,
  }) => {
    await page.setViewportSize(SIZE);
    await page.goto('/desktop/BO5LiveGroups-desk');
    const pill = page.getByRole('button', { name: 'Room 2 asked for help' });
    await expect(pill).toHaveAccessibleDescription('Opens the room’s preview');
    await tabTo(page, 'Room 2 asked for help', 80);
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Room 2' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleDescription(/Asked for help/);

    // A real message field (B8): Enter sends and the room chat shows it.
    await tabTo(page, 'Message Room 2', 20);
    await page.keyboard.type('On my way');
    await page.keyboard.press('Enter');
    await expect(dialog.getByRole('region', { name: 'Room chat' })).toContainText('On my way');
    await expect(dialog.getByRole('textbox', { name: 'Message Room 2' })).toHaveValue('');
    await expect(dialog.getByRole('textbox', { name: 'Message Room 2' })).toBeFocused();

    // Join is wired (B8): the preview closes, the panel says where you are, and focus returns to the pill.
    await tabTo(page, 'Join Room 2', 5);
    await page.keyboard.press('Enter');
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('group', { name: 'Your room' })).toContainText('You’re in Room 2');
    await expect(pill).toBeFocused();

    // The help queue is data (B3): acknowledging takes the pill away and focus moves to Clear.
    await tabTo(page, 'Acknowledge Room 2 · Rafaela', 40);
    await page.keyboard.press('Enter');
    await expect(pill).toHaveCount(0);
    const clear = page.getByRole('button', { name: 'Clear Room 2 · Rafaela' });
    await expect(clear).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByText('No room has asked for help.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Help requests' })).toBeFocused();
  });

  test('BO5 → Preview Room 3 → Next room → Listen in → Escape returns focus to the row that opened it', async ({
    page,
  }) => {
    await page.setViewportSize(SIZE);
    await page.goto('/desktop/BO5LiveGroups-desk');
    // The panel's room rows come first in the Tab order.
    await tabTo(page, 'Preview Room 3', 60);
    const row = page.getByRole('complementary', { name: 'Breakout rooms' }).getByRole('button', { name: 'Preview Room 3' });
    await expect(row).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Room 3' })).toBeVisible();
    await tabTo(page, 'Next room', 10);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Room 4' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next room' })).toBeFocused();
    await tabTo(page, 'Listen in', 5);
    const listen = page.getByRole('button', { name: 'Listen in' });
    await expect(listen).toHaveAttribute('aria-pressed', 'false');
    await page.keyboard.press('Space');
    await expect(listen).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(row).toBeFocused();
  });

  test('BO5 → Close all rooms → the countdown is announced → Keep rooms open returns to the button → close again → Bring everyone back lands on the share-back', async ({
    page,
  }) => {
    await page.setViewportSize(SIZE);
    await page.goto('/desktop/BO5LiveGroups-desk');
    await tabTo(page, 'Close all rooms', 80);
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Closing rooms' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('1:00')).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('Rooms close in 60 seconds');
    // The time is plain text, never a live region (X10).
    expect(await dialog.locator('[aria-live], [role="status"], [role="timer"]').count()).toBe(0);

    await tabTo(page, 'Keep rooms open', 10);
    await page.keyboard.press('Enter');
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('status')).toContainText('Rooms stay open');
    const close = page.getByRole('button', { name: 'Close all rooms' });
    await expect(close).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(dialog).toBeVisible();
    await tabTo(page, 'Bring everyone back now', 10);
    await page.keyboard.press('Enter');
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('alert')).toContainText('Breakout rooms closed. Everyone is back in the main room');
    await expect(page.getByRole('region', { name: 'Everyone is back' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Breakouts ended/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Show Room 1 on stage' })).toBeFocused();
  });

  test('BO11 → Show Room 2 on stage → Back to slides returns focus to the row', async ({ page }) => {
    await page.setViewportSize(SIZE);
    await page.goto('/desktop/BO11Back-desk');
    await expect(page.getByRole('region', { name: 'Everyone is back' })).toBeVisible();
    await tabTo(page, 'Show Room 2 on stage', 60);
    const row = page.getByRole('button', { name: 'Show Room 2 on stage' });
    await expect(row).toHaveAttribute('aria-pressed', 'false');
    await page.keyboard.press('Enter');
    await expect(row).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('region', { name: 'Room 2 on stage' })).toBeVisible();
    await expect(page.getByText('Everyone sees Room 2’s work')).toBeVisible();
    await tabTo(page, 'Back to slides', 20, 'Shift+Tab');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('region', { name: 'Presentation' })).toBeVisible();
    await expect(row).toHaveAttribute('aria-pressed', 'false');
    await expect(row).toBeFocused();
  });
});
