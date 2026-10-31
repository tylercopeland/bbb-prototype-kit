/**
 * The milestone 6 phone flows (PLAN.md › Milestone 6, exit criterion 2),
 * by touch: Chromium with touch emulation (`hasTouch`, `isMobile`), each
 * route at its artboard size (390×844 or 844×390), every press a `tap()`.
 * Every sheet is opened and closed with its close button and the control
 * that opened it holds focus again afterwards (WCAG 2.4.3); the student
 * sheet's switches and Remove, React and Raise hand, More, Leave, All
 * slides, Annotate, Minimize and Restore, the keyboard-open chat and the
 * student view (MB15) each get a walk. Axe runs on every phone route in
 * routes.spec.ts, so nothing here scans.
 */
import { test, expect, type Page } from '@playwright/test';
import { gotoArtboard } from './helpers.ts';

test.use({ hasTouch: true, isMobile: true });

const bar = (page: Page) => page.getByRole('navigation', { name: 'Actions' });

/** Focus is on `locator` or inside it (a dialog opened by touch focuses itself; opened by keyboard, its first control). */
async function expectFocusWithin(locator: ReturnType<Page['getByRole']>) {
  await expect
    .poll(() => locator.evaluate((el) => el === document.activeElement || el.contains(document.activeElement)))
    .toBe(true);
}

/** Opens a sheet from `trigger`, checks it is the named dialog holding focus, closes it with its Close button and expects focus back on the trigger. */
async function openAndClose(page: Page, trigger: ReturnType<Page['getByRole']>, title: string) {
  await trigger.tap();
  const dialog = page.getByRole('dialog', { name: title });
  await expect(dialog).toBeVisible();
  await expectFocusWithin(dialog);
  await dialog.getByRole('button', { name: 'Close' }).tap();
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
}

test.describe('phone, by touch', () => {
  test('MB1 → every sheet opens from its control and closes with Close, focus back on the control', async ({ page }) => {
    await gotoArtboard(page, 'mobile', 'MB1Room');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hack Week: Brazil 2026');
    await openAndClose(page, bar(page).getByRole('button', { name: 'People and chat' }), 'People and chat');
    await expect(bar(page).getByRole('button', { name: 'People and chat' })).toHaveAttribute('aria-pressed', 'false');
    await openAndClose(page, bar(page).getByRole('button', { name: 'React' }), 'React');
    await openAndClose(page, bar(page).getByRole('button', { name: 'More' }), 'More');
    await openAndClose(page, page.getByRole('button', { name: '3 updates' }), 'Updates');
    await openAndClose(page, page.getByRole('button', { name: '+10 more, see all 14 people' }), 'Everyone');
    await openAndClose(page, page.getByRole('button', { name: 'All slides' }), 'All slides');
  });

  test('MB3 → a student’s ⋯ → a switch → Remove → Cancel returns to Remove → Remove removes and People keeps focus', async ({
    page,
  }) => {
    await gotoArtboard(page, 'mobile', 'MB3People');
    const people = page.getByRole('dialog', { name: 'People and chat' });
    await expect(people).toBeVisible();
    const more = people.getByRole('button', { name: 'More actions for Anton Georgiev' });
    await more.tap();
    const student = page.getByRole('dialog', { name: 'Anton Georgiev' });
    await expect(student).toBeVisible();
    const moderator = student.getByRole('switch', { name: 'Moderator' });
    await expect(moderator).not.toBeChecked();
    // The switch's input is visually hidden; the tap lands on its label, as a thumb would.
    await student.getByText('Moderator', { exact: true }).tap();
    await expect(moderator).toBeChecked();
    await expect(student.getByText('Muted, camera on · Moderator')).toBeVisible();

    const remove = student.getByRole('button', { name: 'Remove from session' });
    await remove.tap();
    const confirm = page.getByRole('alertdialog', { name: 'Remove Anton Georgiev?' });
    await expect(confirm).toBeVisible();
    await expect(confirm.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await confirm.getByRole('button', { name: 'Cancel' }).tap();
    await expect(confirm).toHaveCount(0);
    await expect(remove).toBeFocused();

    await remove.tap();
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: 'Remove' }).tap();
    await expect(confirm).toHaveCount(0);
    await expect(student).toHaveCount(0);
    await expect(people).toBeVisible();
    await expect(people.getByText('Anton Georgiev')).toHaveCount(0);
    await expect(people.getByRole('list', { name: 'Everyone 9' })).toBeVisible();
    await expect(page.getByRole('status')).toContainText('Anton removed');
    // The row that opened the sheet is gone: focus stays in the People sheet, never on <body>.
    await expectFocusWithin(people);
    // Close returns to the bar.
    await people.getByRole('button', { name: 'Close' }).tap();
    await expect(bar(page).getByRole('button', { name: 'People and chat' })).toBeFocused();
  });

  test('MB1 → React → Raise hand → a reaction closes the sheet; the hand and the reaction show on your tile', async ({
    page,
  }) => {
    await gotoArtboard(page, 'mobile', 'MB1Room');
    const react = bar(page).getByRole('button', { name: 'React' });
    await react.tap();
    const sheet = page.getByRole('dialog', { name: 'React' });
    await expect(react).toHaveAttribute('aria-expanded', 'true');
    const hand = sheet.getByRole('button', { name: 'Raise hand' });
    await expect(hand).toHaveAttribute('aria-pressed', 'false');
    await hand.tap();
    await expect(hand).toHaveAttribute('aria-pressed', 'true');
    await expect(hand).toHaveText('Raise hand');
    await sheet.getByRole('button', { name: 'Thumbs up' }).tap();
    await expect(sheet).toHaveCount(0);
    await expect(react).toBeFocused();
    await expect(react).toHaveAttribute('aria-expanded', 'false');
    await page.getByRole('button', { name: '+10 more, see all 14 people' }).tap();
    const everyone = page.getByRole('dialog', { name: 'Everyone' });
    const you = everyone.getByRole('figure', { name: /^You ?, .*hand raised/ });
    await expect(you).toBeVisible();
    await expect(you.getByRole('img', { name: 'Reacted: Thumbs up' })).toBeVisible();
  });

  test('MB1 → More → an item closes the sheet, says what is not built and returns focus to More', async ({ page }) => {
    await gotoArtboard(page, 'mobile', 'MB1Room');
    const more = bar(page).getByRole('button', { name: 'More' });
    await more.tap();
    const sheet = page.getByRole('dialog', { name: 'More' });
    await expect(sheet.getByRole('group', { name: 'Present' }).getByRole('button')).toHaveCount(4);
    await expect(sheet.getByRole('group', { name: 'Class tools' }).getByRole('button')).toHaveCount(4);
    await sheet.getByRole('button', { name: 'Poll' }).tap();
    await expect(sheet).toHaveCount(0);
    await expect(page.getByText('Poll isn’t part of this prototype yet', { exact: true })).toBeVisible();
    await expect(more).toBeFocused();
  });

  test('MB1 → Leave asks first with Cancel focused; Cancel returns focus to Leave', async ({ page }) => {
    await gotoArtboard(page, 'mobile', 'MB1Room');
    const leave = bar(page).getByRole('button', { name: 'Leave session' });
    await leave.tap();
    const confirm = page.getByRole('alertdialog', { name: 'Leave the session?' });
    await expect(confirm).toBeVisible();
    await expect(confirm.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await confirm.getByRole('button', { name: 'Cancel' }).tap();
    await expect(confirm).toHaveCount(0);
    await expect(leave).toBeFocused();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hack Week: Brazil 2026');
  });

  test('MB1 → All slides → a thumbnail moves the deck, closes the sheet and returns focus to All slides', async ({
    page,
  }) => {
    await gotoArtboard(page, 'mobile', 'MB1Room');
    const allSlides = page.getByRole('button', { name: 'All slides' });
    await allSlides.tap();
    const sheet = page.getByRole('dialog', { name: 'All slides' });
    await expect(sheet).toBeVisible();
    await expect(allSlides).toHaveAttribute('aria-expanded', 'true');
    await expect(sheet.getByLabel('Slide 3 of 12')).toHaveText('3 / 12');
    await expect(sheet.getByRole('list', { name: 'Slides' }).getByRole('listitem')).toHaveCount(12);
    await expect(sheet.getByRole('button', { name: 'Go to slide 3: BigBlueButton 4.0, refined' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await sheet.getByRole('button', { name: 'Go to slide 9: Scalable UI' }).tap();
    await expect(sheet).toHaveCount(0);
    await expect(page.getByRole('group', { name: 'Slides' })).toContainText('9 / 12');
    await expect(page.getByRole('heading', { level: 2 })).toHaveText('Scalable UI');
    await expect(allSlides).toBeFocused();
    await expect(allSlides).toHaveAttribute('aria-expanded', 'false');
  });

  test('MB1 → Annotate shows the whiteboard toolbar in the pager’s place; tapping it again ends it with focus kept', async ({
    page,
  }) => {
    await gotoArtboard(page, 'mobile', 'MB1Room');
    const row = page.getByRole('group', { name: 'Slides' });
    const annotate = row.getByRole('button', { name: 'Annotate' });
    await expect(annotate).toHaveAttribute('aria-pressed', 'false');
    await annotate.tap();
    await expect(annotate).toHaveAttribute('aria-pressed', 'true');
    const tools = row.getByRole('group', { name: 'Whiteboard tools' });
    await expect(tools).toBeVisible();
    await expect(row.getByRole('button', { name: 'All slides' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Minimize presentation' })).toHaveCount(0);
    await expect(tools.getByRole('radio', { name: 'Pen' })).toBeChecked();
    await tools.getByRole('radio', { name: 'Highlighter' }).tap();
    await expect(tools.getByRole('radio', { name: 'Highlighter' })).toBeChecked();
    await tools.getByRole('radio', { name: 'Red' }).tap();
    await expect(tools.getByRole('radio', { name: 'Red' })).toBeChecked();
    // Every control is a 44px target (X14).
    for (const control of await tools.getByRole('radio').all()) {
      const box = await control.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
    await annotate.tap();
    await expect(annotate).toHaveAttribute('aria-pressed', 'false');
    await expect(tools).toHaveCount(0);
    await expect(row.getByRole('button', { name: 'All slides' })).toBeVisible();
    await expect(annotate).toBeFocused();
  });

  test('MB12 → Escape from the toolbar ends annotating and lands on the Annotate toggle', async ({ page }) => {
    await gotoArtboard(page, 'mobile', 'MB12Annotate');
    const row = page.getByRole('group', { name: 'Slides' });
    await expect(row.getByRole('group', { name: 'Whiteboard tools' })).toBeVisible();
    await row.getByRole('radio', { name: 'Pen' }).focus();
    await page.keyboard.press('Escape');
    await expect(row.getByRole('group', { name: 'Whiteboard tools' })).toHaveCount(0);
    await expect(row.getByRole('button', { name: 'Annotate' })).toHaveAttribute('aria-pressed', 'false');
    await expect(row.getByRole('button', { name: 'Annotate' })).toBeFocused();
  });

  test('MB1 → Minimize puts everyone in the band with the presentation tile focused; the tile restores and lands on Minimize', async ({
    page,
  }) => {
    await gotoArtboard(page, 'mobile', 'MB1Room');
    await expect(page.getByRole('list', { name: 'Webcams' }).getByRole('listitem')).toHaveCount(4);
    await page.getByRole('button', { name: 'Minimize presentation' }).tap();
    await expect(page.getByRole('region', { name: 'Presentation' })).toHaveCount(0);
    const list = page.getByRole('list', { name: 'Webcams and minimized presentation' });
    await expect(list.getByRole('listitem')).toHaveCount(15);
    await expect(page.getByRole('button', { name: /See all/ })).toHaveCount(0);
    const restore = list.getByRole('button', { name: 'Presentation · 3 / 12, restore' });
    await expect(restore).toBeFocused();
    const box = await restore.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    await restore.tap();
    await expect(page.getByRole('region', { name: 'Presentation' })).toBeVisible();
    await expect(page.getByRole('list', { name: 'Webcams' }).getByRole('listitem')).toHaveCount(4);
    await expect(page.getByRole('button', { name: 'Minimize presentation' })).toBeFocused();
  });

  test('MB14 → landscape minimized: five tiles a row across the width, the tile restores to the two-column landscape', async ({
    page,
  }) => {
    await gotoArtboard(page, 'mobile', 'MB14LandMin');
    const list = page.getByRole('list', { name: 'Webcams and minimized presentation' });
    await expect(list.getByRole('listitem')).toHaveCount(15);
    const first = await list.getByRole('listitem').first().boundingBox();
    const sixth = await list.getByRole('listitem').nth(5).boundingBox();
    // The sixth cell starts a new row under the first.
    expect(sixth?.x).toBeCloseTo(first?.x ?? -1, 0);
    expect(sixth?.y).toBeGreaterThan((first?.y ?? 0) + (first?.height ?? 0) - 1);
    await list.getByRole('button', { name: 'Presentation · 3 / 12, restore' }).tap();
    await expect(page.getByRole('region', { name: 'Presentation' })).toBeVisible();
    await expect(page.getByRole('list', { name: 'Webcams' }).getByRole('listitem')).toHaveCount(4);
  });

  test('MB17 → the composer is focused above the keyboard; typing and Enter send to everyone', async ({ page }) => {
    await gotoArtboard(page, 'mobile', 'MB17KeyboardChat');
    const sheet = page.getByRole('dialog', { name: 'People and chat' });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('tab', { name: 'Chat' })).toHaveAttribute('aria-selected', 'true');
    const composer = sheet.getByRole('textbox', { name: 'Message everyone' });
    await expect(composer).toBeFocused();
    // The sheet ends above the fake keyboard (336px) instead of at the bottom of the 844px screen.
    const sheetBox = await sheet.boundingBox();
    expect((sheetBox?.y ?? 0) + (sheetBox?.height ?? 0)).toBeLessThanOrEqual(844 - 336 + 1);
    const composerBox = await composer.boundingBox();
    expect((composerBox?.y ?? 0) + (composerBox?.height ?? 0)).toBeLessThanOrEqual(844 - 336 + 1);
    const list = sheet.getByRole('list', { name: 'Messages to everyone' });
    await expect(list.getByRole('listitem')).toHaveCount(3);
    await page.keyboard.type('Hello from the phone');
    await page.keyboard.press('Enter');
    await expect(list.getByRole('listitem')).toHaveCount(4);
    await expect(list.getByRole('listitem').last()).toContainText('Hello from the phone');
    await expect(composer).toHaveValue('');
    await expect(composer).toBeFocused();
  });

  test('MB15 → the student raises a hand from React; it shows in People, with no moderator controls anywhere', async ({
    page,
  }) => {
    await gotoArtboard(page, 'mobile', 'MB15Attendee');
    await expect(page.getByRole('button', { name: /updates$/ })).toHaveCount(0);
    await expect(page.getByRole('group', { name: 'Slides' })).toHaveCount(0);
    const react = bar(page).getByRole('button', { name: 'React' });
    await react.tap();
    const sheet = page.getByRole('dialog', { name: 'React' });
    const hand = sheet.getByRole('button', { name: 'Raise hand' });
    await hand.tap();
    await expect(hand).toHaveAttribute('aria-pressed', 'true');
    await sheet.getByRole('button', { name: 'Close' }).tap();
    await expect(sheet).toHaveCount(0);
    await expect(react).toBeFocused();
    await bar(page).getByRole('button', { name: 'People and chat' }).tap();
    const people = page.getByRole('dialog', { name: 'People and chat' });
    await expect(people.getByRole('list', { name: 'Raised hands 5' })).toBeVisible();
    await expect(people.getByRole('button', { name: /^More actions for/ })).toHaveCount(0);
    await expect(people.getByText('(you)')).toBeVisible();
    await people.getByRole('button', { name: 'Close' }).tap();
    await expect(bar(page).getByRole('button', { name: 'People and chat' })).toBeFocused();
    // Lowering the hand: the same toggle, the same label (X7).
    await react.tap();
    await expect(hand).toHaveAttribute('aria-pressed', 'true');
    await hand.tap();
    await expect(hand).toHaveAttribute('aria-pressed', 'false');
    await expect(hand).toHaveText('Raise hand');
  });
});
