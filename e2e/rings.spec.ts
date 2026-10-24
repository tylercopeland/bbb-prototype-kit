/**
 * The three rings (selected, speaking, focus) share one box-shadow and
 * must compose without leaking: a focused button inside a speaking tile
 * shows no green, and a focused speaking selected toggle shows all three.
 */
import { test, expect, type Page } from '@playwright/test';
import { storyReady, storyUrl } from './stories.ts';

const globals = 'theme:light;surface:panel;a11y.manual:!true';

async function tokenRgb(page: Page, name: string) {
  return page.evaluate((n) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${n})`;
    document.body.append(probe);
    const rgb = getComputedStyle(probe).color;
    probe.remove();
    return rgb;
  }, name);
}

test('a focused button inside a speaking wrapper does not inherit the green ring', async ({ page }) => {
  await page.goto(storyUrl('components-button--inside-speaking-wrapper', globals));
  await storyReady(page, {});
  const button = page.getByRole('button', { name: 'Join' });
  await page.keyboard.press('Tab');
  await button.focus();
  await expect(button).toBeFocused();
  const shadow = await button.evaluate((el) => getComputedStyle(el).boxShadow);
  expect(shadow).toContain(await tokenRgb(page, '--bbb-focus-ring'));
  expect(shadow).not.toContain(await tokenRgb(page, '--bbb-status-live'));
  const wrapper = page.locator('.ring-speaking');
  expect(await wrapper.evaluate((el) => getComputedStyle(el).boxShadow)).toContain(
    await tokenRgb(page, '--bbb-status-live'),
  );
});

test('a focused speaking selected toggle shows the selected, speaking and focus rings', async ({ page }) => {
  await page.goto(storyUrl('components-togglebutton--speaking-and-focused', globals));
  await storyReady(page, { tags: ['wait-for-tooltip'] });
  const toggle = page.getByRole('button', { name: 'Microphone' });
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  const shadow = await toggle.evaluate((el) => getComputedStyle(el).boxShadow);
  expect(shadow).toContain('inset');
  expect(shadow).toContain(await tokenRgb(page, '--bbb-selected-ring'));
  expect(shadow).toContain(await tokenRgb(page, '--bbb-status-live'));
  expect(shadow).toContain(await tokenRgb(page, '--bbb-focus-ring'));
});

test('a selected toggle shows the inset ring without focus', async ({ page }) => {
  await page.goto(storyUrl('components-togglebutton--microphone-on', globals));
  await storyReady(page, {});
  const toggle = page.getByRole('button', { name: 'Microphone' });
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  const shadow = await toggle.evaluate((el) => getComputedStyle(el).boxShadow);
  expect(shadow).toContain('inset');
  expect(shadow).toContain(await tokenRgb(page, '--bbb-selected-ring'));
  expect(shadow).not.toContain(await tokenRgb(page, '--bbb-status-live'));
});

test.describe('in forced colors', () => {
  test.use({ contextOptions: { forcedColors: 'active' } });

  test('a selected toggle has a visible border', async ({ page }) => {
    await page.goto(storyUrl('components-togglebutton--microphone-on', globals));
    await storyReady(page, {});
    const toggle = page.getByRole('button', { name: 'Microphone' });
    const border = await toggle.evaluate((el) => getComputedStyle(el).borderTopWidth);
    expect(border).toBe('2px');
  });
});
