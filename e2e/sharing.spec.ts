/**
 * The milestone 5 batch A flows, by keyboard only, at the artboard size:
 * Share media → switch type → close; All slides → pick a slide → focus
 * returns; Plugins → Breakout rooms; the student menu → toggle a switch;
 * the share tabs and Stop sharing; React → a reaction; Room settings →
 * Private chat off. Every flow ends with a `toBeFocused()` check, so focus
 * is never lost to <body> (WCAG 2.4.3).
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

test.describe('sharing and media, keyboard only', () => {
  test('F1 → Share media → switch the type with the arrow keys → Escape returns focus to the toggle', async ({
    page,
  }) => {
    await page.setViewportSize(SIZE);
    await page.goto('/desktop/F1Bar-4roh-l8ju');
    await tabTo(page, 'Share media');
    const toggle = page.getByRole('button', { name: 'Share media' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('Enter');
    const picker = page.getByRole('dialog', { name: 'Share media' });
    await expect(picker).toBeVisible();
    await expect(page.getByRole('button', { name: 'Share media', includeHidden: true })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await expect(picker.getByRole('tab', { name: 'Slides' })).toHaveAttribute('aria-selected', 'true');
    await expect(picker.getByRole('radio', { name: 'Present bbb-4-refined.pdf' })).toBeChecked();

    await tabTo(page, 'Slides', 10);
    await page.keyboard.press('ArrowRight');
    await expect(picker.getByRole('tab', { name: 'Video' })).toHaveAttribute('aria-selected', 'true');
    await expect(picker.getByRole('textbox', { name: 'Video link' })).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(picker.getByRole('tab', { name: 'Screen' })).toHaveAttribute('aria-selected', 'true');
    await expect(picker.getByRole('button', { name: 'A browser tab' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(picker).toHaveCount(0);
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  test('H2 → a screen kind starts the share: the tabs and the pill appear, Stop sharing ends it', async ({
    page,
  }) => {
    await page.setViewportSize(SIZE);
    await page.goto('/desktop/H2MediaScreen-ez5s');
    const picker = page.getByRole('dialog', { name: 'Share media' });
    await expect(picker).toBeVisible();
    await tabTo(page, 'A window', 10);
    await page.keyboard.press('Enter');
    await expect(picker).toHaveCount(0);
    const tabs = page.getByRole('tablist', { name: 'What everyone sees' });
    await expect(tabs.getByRole('tab', { name: 'A window' })).toHaveAttribute('aria-selected', 'true');
    const pill = page.getByRole('group', { name: 'Screen share' });
    await expect(pill).toContainText('Everyone sees your a window');
    // The picker was open on load, so there was no press to return to: the toggle takes focus instead of the body.
    await expect(page.getByRole('button', { name: 'Share media' })).toBeFocused();
    await expect(page.getByRole('button', { name: 'Share media' })).toHaveAttribute('aria-pressed', 'true');

    await page.keyboard.press('Shift+Tab');
    await tabTo(page, 'A window', 30);
    await page.keyboard.press('ArrowLeft');
    await expect(tabs.getByRole('tab', { name: 'Presentation 3 / 12' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(pill).toContainText('your screen is still shared');
    await tabTo(page, 'Stop sharing', 10);
    await page.keyboard.press('Enter');
    await expect(pill).toHaveCount(0);
    await expect(tabs).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Share media' })).toHaveAttribute('aria-pressed', 'false');
    // The pill's button unmounted; Share media, which shows the share's state, takes focus.
    await expect(page.getByRole('button', { name: 'Share media' })).toBeFocused();
  });

  test('F1 → All slides → pick a slide → the deck moves and focus returns to All slides', async ({
    page,
  }) => {
    await page.setViewportSize(SIZE);
    await page.goto('/desktop/F1Bar-4roh-l8ju');
    // The controls are hidden until focus reaches them (X13), then they show.
    const controls = page.getByRole('group', { name: 'Presentation controls' });
    await expect(controls).toHaveCSS('opacity', '0');
    await tabTo(page, 'All slides');
    await expect(controls).toHaveCSS('opacity', '1');
    const trigger = page.getByRole('button', { name: 'All slides' });
    await expect(trigger).toBeFocused();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'All slides' });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole('button', { name: 'Go to slide 3: BigBlueButton 4.0, refined' }),
    ).toHaveAttribute('aria-current', 'true');
    await tabTo(page, 'Go to slide 7: Fix the dead ends', 20);
    await page.keyboard.press('Enter');
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 2, name: 'Fix the dead ends' })).toBeVisible();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('N1 → the overview is open on load; Escape closes it and All slides takes focus', async ({ page }) => {
    await page.setViewportSize(SIZE);
    await page.goto('/desktop/N1Overview-xpbk');
    const dialog = page.getByRole('dialog', { name: 'All slides' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'All slides' })).toBeFocused();
  });

  test('F1 → Plugins → Breakout rooms opens the breakout surface; Back to the room returns', async ({
    page,
  }) => {
    await page.setViewportSize(SIZE);
    await page.goto('/desktop/F1Bar-4roh-l8ju');
    await tabTo(page, 'Plugins');
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Plugins' });
    await expect(dialog).toBeVisible();
    await expect(page.getByRole('button', { name: 'Plugins', includeHidden: true })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    // The card's text is its label and its state line.
    await tabTo(page, /^Breakout rooms/, 10);
    await expect(page.getByRole('button', { name: 'Breakout rooms' })).toHaveAccessibleDescription(
      '4 rooms set up',
    );
    await page.keyboard.press('Enter');
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 2, name: 'Breakout rooms' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Plugins' })).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByRole('button', { name: 'Plugins' })).toBeFocused();
    await tabTo(page, 'Back to the room', 30);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('region', { name: 'Presentation' })).toBeVisible();
    await expect(page.locator(':focus')).toHaveCount(1);
  });

  test('BO1 → the Plugins picker is open on load; Close returns focus to the Plugins toggle', async ({
    page,
  }) => {
    await page.setViewportSize(SIZE);
    await page.goto('/desktop/BO1Entry-desk');
    const dialog = page.getByRole('dialog', { name: 'Plugins' });
    await expect(dialog).toBeVisible();
    await tabTo(page, 'Close', 5);
    await page.keyboard.press('Enter');
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Plugins' })).toBeFocused();
  });

  test('O2 → the student menu is open on load; a switch toggles without closing it, Escape returns focus', async ({
    page,
  }) => {
    await page.setViewportSize(SIZE);
    await page.goto('/desktop/O2StudentActions');
    const menu = page.getByRole('menu', { name: 'More actions for Anton Georgiev' });
    await expect(menu).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Make presenter' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    const whiteboard = page.getByRole('menuitemcheckbox', { name: 'Whiteboard access' });
    await expect(whiteboard).toBeFocused();
    await expect(whiteboard).toHaveAttribute('aria-checked', 'false');
    await page.keyboard.press('Space');
    await expect(whiteboard).toHaveAttribute('aria-checked', 'true');
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'More actions for Anton Georgiev' })).toBeFocused();
    await expect(page.getByText('Whiteboard', { exact: true })).toBeVisible();
  });

  test('F1 → React → a reaction goes to the store, the tray closes and focus returns to React', async ({
    page,
  }) => {
    await page.setViewportSize(SIZE);
    await page.goto('/desktop/F1Bar-4roh-l8ju');
    await tabTo(page, 'React');
    await page.keyboard.press('Enter');
    const tray = page.getByRole('dialog', { name: 'React' });
    await expect(tray).toBeVisible();
    await tabTo(page, 'Clap', 10);
    await page.keyboard.press('Enter');
    await expect(tray).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'React' })).toBeFocused();
    const reactions = await page.evaluate(() => {
      const w = window as unknown as {
        bbbRoom?: { getState: () => { reactions: { items: Array<{ from: string; kind: string }> } } };
      };
      return w.bbbRoom?.getState().reactions.items ?? [];
    });
    expect(reactions).toMatchObject([{ from: 'helena', kind: 'clap' }]);
    // Our own reaction is not announced.
    await expect(page.getByRole('status')).toBeEmpty();
  });

  test('G1 → Room settings → Private chat off: the teacher keeps Message privately and the thread note says so', async ({
    page,
  }) => {
    await page.setViewportSize(SIZE);
    await page.goto('/desktop/G1People-my6z');
    await tabTo(page, 'Room settings', 80);
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Room settings' });
    await expect(dialog).toBeVisible();
    // The dialog takes focus, then Close, then the switch (named by its label, not an aria-label).
    const sw = page.getByRole('switch', { name: 'Private chat' });
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(sw).toBeFocused();
    await expect(sw).toBeChecked();
    await page.keyboard.press('Space');
    await expect(sw).not.toBeChecked();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Room settings' })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await tabTo(page, 'Message Bruno privately', 80);
    await page.keyboard.press('Enter');
    await expect(page.getByText(/Private chat is off for students/)).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Message Bruno privately' })).toBeFocused();
  });
});
