/**
 * The milestone 5 batch B flows, by keyboard only, at the artboard size:
 * Plugins → Poll → set up → Ask the class → an answer arrives → Show
 * results to everyone → End poll → Close; Plugins → Timer → a quick time →
 * Start → Pause → Move to corner → Minimize → restore. Every flow ends with
 * a `toBeFocused()` check, so focus is never lost to <body> (WCAG 2.4.3).
 * Other participants act through `window.bbbRoom`, the store the
 * `RoomProvider` exposes.
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

/** Presses Tab until `locator` holds focus (a radio input is named by its label element, which `tabTo` cannot read). */
async function tabUntilFocused(page: Page, locator: ReturnType<Page['getByRole']>, max = 60, key = 'Tab') {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press(key);
    if (await locator.evaluate((el) => el === document.activeElement)) return;
  }
  throw new Error('Never reached the control');
}

/** Dispatches a store action as if another participant acted. */
async function dispatch(page: Page, action: Record<string, unknown>) {
  await page.evaluate((a) => {
    const w = window as unknown as { bbbRoom?: { dispatch: (action: unknown) => void } };
    w.bbbRoom?.dispatch(a);
  }, action);
}

test.describe('poll and timer, keyboard only', () => {
  test('F1 → Plugins → Poll → set up → Ask the class → an answer arrives → Show results → End poll → Close returns focus to Plugins', async ({
    page,
  }) => {
    await page.setViewportSize(SIZE);
    await page.goto('/desktop/F1Bar-4roh-l8ju');
    await tabTo(page, 'Plugins');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Plugins' })).toBeVisible();
    await tabTo(page, /^Poll/, 10);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const panel = page.getByRole('complementary', { name: 'Poll' });
    await expect(panel).toBeVisible();
    // The picker closed, so its trigger took focus; Tab reaches the question from there.
    await expect(page.getByRole('button', { name: 'Plugins' })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await tabTo(page, 'Question', 80);
    await page.keyboard.press('End');
    await page.keyboard.type(' Really?');
    await expect(panel.getByRole('textbox', { name: 'Question' })).toHaveValue(
      'Which change makes it easiest to see who is muted? Really?',
    );
    // The answer type is a radio group: the arrow keys move the check (X8).
    await page.keyboard.press('Tab');
    await expect(panel.getByRole('radio', { name: 'Multiple choice' })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(panel.getByRole('radio', { name: 'Yes / No' })).toBeChecked();
    await page.keyboard.press('ArrowLeft');
    await expect(panel.getByRole('radio', { name: 'Multiple choice' })).toBeChecked();
    await tabTo(page, 'Remove answer D', 20);
    await page.keyboard.press('Enter');
    await expect(panel.getByRole('textbox', { name: 'Answer D' })).toHaveCount(0);
    await tabTo(page, 'Add an answer', 5);
    await page.keyboard.press('Enter');
    const answerD = panel.getByRole('textbox', { name: 'Answer D' });
    await expect(answerD).toHaveValue('');
    // Blank answer: Ask the class waits.
    await expect(panel.getByRole('button', { name: 'Ask the class' })).toBeDisabled();
    await answerD.focus();
    await page.keyboard.type('Something else');
    await tabTo(page, 'More options', 10);
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    const anonymous = panel.getByRole('switch', { name: 'Anonymous answers' });
    await expect(anonymous).toBeFocused();
    await expect(anonymous).toBeChecked();
    await page.keyboard.press('Space');
    await expect(anonymous).not.toBeChecked();
    await expect(
      panel.getByText('Names visible to you · results stay with you until you show them'),
    ).toBeVisible();
    await tabTo(page, 'Ask the class', 10);
    await page.keyboard.press('Enter');

    // Live: the builder is gone, "Show results to everyone" holds focus, nobody has answered yet.
    const show = panel.getByRole('button', { name: 'Show results to everyone' });
    await expect(show).toBeFocused();
    await expect(panel.getByText('Live · 0 of 13 answered')).toBeVisible();
    await dispatch(page, { type: 'answerPoll', option: 3 });
    await expect(panel.getByText('Live · 1 of 13 answered')).toBeVisible();
    await expect(panel.getByRole('listitem').filter({ hasText: 'Something else' })).toContainText('1 · 100%');
    // The answer is announced politely, as the running count.
    await expect(page.getByRole('status')).toContainText('Poll: 1 of 13 answered');
    await expect(page.getByRole('alert')).toBeEmpty();
    await page.keyboard.press('Enter');
    const card = page.getByRole('region', { name: 'Poll results shown to everyone' });
    await expect(card).toBeVisible();
    await expect(card).toContainText('1 of 13 answered · shown to everyone');
    await expect(panel.getByRole('button', { name: 'Hide results from everyone' })).toBeFocused();
    await expect(panel.getByText(/Results are shown to everyone on the stage/)).toBeVisible();
    await tabTo(page, 'End poll', 5);
    await page.keyboard.press('Enter');
    await expect(panel.getByText('Poll closed · 1 of 13 answered')).toBeVisible();
    await tabTo(page, 'Close', 5);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('complementary')).toHaveCount(0);
    await expect(card).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Plugins' })).toBeFocused();
  });

  test('PL3 → Hide results from everyone on the stage card lands on the panel’s show button', async ({
    page,
  }) => {
    await page.setViewportSize(SIZE);
    await page.goto('/desktop/PL3Shown');
    const card = page.getByRole('region', { name: 'Poll results shown to everyone' });
    await expect(card).toBeVisible();
    await tabTo(page, 'Hide results from everyone', 80);
    await page.keyboard.press('Enter');
    await expect(card).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Show results to everyone' })).toBeFocused();
  });

  test('F1 → Plugins → Timer → 3 min → Start → Pause → Move to corner → Minimize → restore lands on Minimize', async ({
    page,
  }) => {
    await page.setViewportSize(SIZE);
    await page.goto('/desktop/F1Bar-4roh-l8ju');
    await tabTo(page, 'Plugins');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Plugins' })).toBeVisible();
    await tabTo(page, /^Timer/, 10);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const card = page.getByRole('group', { name: 'Timer' });
    await expect(card).toBeVisible();
    await expect(card).toContainText('5:00');
    await expect(card).toContainText('Ready');
    await expect(page.getByRole('button', { name: 'Plugins' })).toBeFocused();
    // The quick times are one radio group (X8): Tab lands on the checked one, the arrows move it.
    await page.keyboard.press('Shift+Tab');
    await tabUntilFocused(page, card.getByRole('radio', { name: '5 min' }), 80);
    await page.keyboard.press('ArrowLeft');
    await expect(card.getByRole('radio', { name: '3 min' })).toBeChecked();
    await expect(card).toContainText('3:00');
    await tabTo(page, 'Start', 5);
    await page.keyboard.press('Enter');
    await expect(card).toContainText('Running');
    const pause = card.getByRole('button', { name: 'Pause' });
    await expect(pause).toBeFocused();
    await page.keyboard.press('Space');
    await expect(card).toContainText('Paused');
    await expect(card.getByRole('button', { name: 'Start' })).toBeFocused();
    // The ticking time is never announced (X10): nothing so far in either live region.
    await expect(page.getByRole('status')).toBeEmpty();
    await expect(page.getByRole('alert')).toBeEmpty();

    // Back up through Reset, the quick times and the header to Move to corner.
    await tabUntilFocused(page, card.getByRole('button', { name: 'Move to corner' }), 10, 'Shift+Tab');
    await page.keyboard.press('Enter');
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('menuitemradio', { name: 'Top right' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(menu.getByRole('menuitemradio', { name: 'Bottom left' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(menu).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Move to corner' })).toBeFocused();
    await expect(page.getByRole('status')).toContainText('Timer moved to bottom left');
    // The card really moved: its corner slot is the bottom-left one.
    const cardBox = await card.boundingBox();
    const slide = await page.getByRole('heading', { level: 2 }).locator('..').locator('..').boundingBox();
    expect(cardBox && slide && cardBox.x < slide.x + slide.width / 2).toBe(true);
    expect(cardBox && slide && cardBox.y + cardBox.height > slide.y + slide.height / 2).toBe(true);

    await tabTo(page, 'Minimize timer', 3);
    await page.keyboard.press('Enter');
    const pill = page.getByRole('button', { name: 'Expand timer, 3:00 left' });
    await expect(pill).toBeFocused();
    await expect(card).toHaveCount(0);
    await page.keyboard.press('Enter');
    await expect(card).toBeVisible();
    await expect(page.getByRole('button', { name: 'Minimize timer' })).toBeFocused();
  });

  test('TM2 → Remove timer hands focus to Plugins; the clock reaching zero announces assertively', async ({
    page,
  }) => {
    await page.setViewportSize(SIZE);
    await page.goto('/desktop/TM2Running');
    const card = page.getByRole('group', { name: 'Timer' });
    await expect(card).toContainText('3:42');
    const endsAt = await page.evaluate(() => {
      const w = window as unknown as { bbbRoom?: { getState: () => { timer: { endsAt: number } } } };
      return w.bbbRoom?.getState().timer.endsAt ?? 0;
    });
    await dispatch(page, { type: 'tick', now: endsAt });
    await expect(card).toContainText('Time’s up!');
    await expect(page.getByRole('alert')).toContainText('Time’s up');
    await tabTo(page, 'Remove timer', 80);
    await page.keyboard.press('Enter');
    await expect(card).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Plugins' })).toBeFocused();
  });
});
