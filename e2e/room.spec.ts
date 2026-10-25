/**
 * The milestone 4 room flows, by keyboard only (PLAN.md › Definition of
 * done), at the artboard size, 1400×900: F1 → People → a person's menu →
 * Escape → close the panel; remove a person; G2 → type and send; message
 * privately and back; Leave. Every flow whose pressed control unmounts
 * ends with a `toBeFocused()` check, so focus is never lost to <body>
 * (WCAG 2.4.3). Other participants act through `window.bbbRoom`, the store
 * the `RoomProvider` exposes.
 */
import { test, expect, type Page } from '@playwright/test';

const SIZE = { width: 1400, height: 900 };

/** Presses Tab until the focused element has the accessible name, or fails after `max` presses. */
async function tabTo(page: Page, name: string | RegExp, max = 60) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
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

/** Dispatches a store action as if another participant acted. */
async function dispatch(page: Page, action: Record<string, unknown>) {
  await page.evaluate((a) => {
    const w = window as unknown as { bbbRoom?: { dispatch: (action: unknown) => void } };
    w.bbbRoom?.dispatch(a);
  }, action);
}

test.describe('room, keyboard only', () => {
  test('F1 → People → a person’s menu → Escape returns focus → Close returns focus to the People toggle', async ({ page }) => {
    await page.setViewportSize(SIZE);
    await page.goto('/desktop/F1Bar-4roh-l8ju');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hack Week: Brazil 2026');
    await expect(page.getByRole('complementary')).toHaveCount(0);

    await tabTo(page, 'People');
    await page.keyboard.press('Enter');
    const panel = page.getByRole('complementary', { name: 'People' });
    await expect(panel).toBeVisible();
    const peopleToggle = page.getByRole('button', { name: 'People', exact: true });
    await expect(peopleToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('list', { name: 'Raised hands 4' })).toBeVisible();

    // The row actions are hidden until focus reaches them (X13), then they show.
    const more = page.getByRole('button', { name: 'More actions for Bruno' });
    const actions = more.locator('..');
    await expect(actions).toHaveCSS('opacity', '0');
    await tabTo(page, 'More actions for Bruno');
    await expect(more).toBeFocused();
    await expect(actions).toHaveCSS('opacity', '1');
    await page.keyboard.press('Enter');
    const menu = page.getByRole('menu', { name: 'More actions for Bruno' });
    await expect(menu).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Make presenter' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: 'Turn off camera' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(more).toBeFocused();

    // Escape never closes the panel by itself; the close button does, and focus lands on the toggle that opened it.
    await tabTo(page, 'Close panel', 80);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('complementary')).toHaveCount(0);
    await expect(peopleToggle).toBeFocused();
    await expect(peopleToggle).toHaveAttribute('aria-pressed', 'false');
  });

  test('removing a person is announced and moves focus to the next row’s ⋯ button', async ({ page }) => {
    await page.setViewportSize(SIZE);
    await page.goto('/desktop/G1People-my6z');
    await tabTo(page, 'More actions for Bruno', 80);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menu', { name: 'More actions for Bruno' })).toBeVisible();
    await page.keyboard.press('End');
    await expect(page.getByRole('menuitem', { name: 'Remove from session' })).toBeFocused();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('alertdialog', { name: 'Remove Bruno?' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', { name: 'Remove' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(dialog).toHaveCount(0);
    await expect(page.getByText('Bruno', { exact: true })).toHaveCount(0);
    await expect(page.getByText(/13 people/)).toBeVisible();
    await expect(page.getByRole('status')).toContainText('Bruno removed');
    // Bruno was the first raised hand; Rafaela's row follows.
    await expect(page.getByRole('button', { name: 'More actions for Rafaela Monaco' })).toBeFocused();
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

  test('G1 → Message privately focuses the composer → Back focuses the person’s row', async ({ page }) => {
    await page.setViewportSize(SIZE);
    await page.goto('/desktop/G1People-my6z');
    await tabTo(page, 'Message Bruno privately', 80);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('complementary', { name: 'Chat' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Bruno' })).toBeVisible();
    const composer = page.getByRole('textbox', { name: 'Message Bruno privately' });
    await expect(composer).toBeFocused();
    await page.keyboard.type('Yes, here it is');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('list', { name: 'Messages with Bruno' }).getByRole('listitem')).toHaveCount(4);

    await tabTo(page, 'Back to direct messages', 80);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('list', { name: 'Direct messages' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Bruno You: Yes, here it is/ })).toBeFocused();
  });

  test('a student’s raised hand shows in People and is announced; your own is not', async ({ page }) => {
    await page.setViewportSize(SIZE);
    await page.goto('/desktop/G1People-my6z');
    await tabTo(page, 'Raise hand', 80);
    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: 'Raise hand' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('list', { name: 'Raised hands 5' })).toBeVisible();
    await expect(page.getByRole('status')).toBeEmpty();
    await dispatch(page, { type: 'raiseHand', participantId: 'anton' });
    await expect(page.getByRole('list', { name: 'Raised hands 6' })).toBeVisible();
    await expect(page.getByRole('status')).toContainText('Anton raised their hand');
  });

  test('Leave confirms and lands on the index page’s heading', async ({ page }) => {
    await page.setViewportSize(SIZE);
    await page.goto('/desktop/F1Bar-4roh-l8ju');
    await tabTo(page, 'Leave session', 80);
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('alertdialog', { name: 'Leave the session?' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', { name: 'Leave session' })).toBeFocused();
    await page.keyboard.press('Enter');
    const heading = page.getByRole('heading', { level: 1, name: 'BigBlueButton 4.0 prototype' });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();
  });
});
