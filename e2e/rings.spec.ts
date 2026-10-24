/**
 * The three rings (selected, speaking, focus) share one box-shadow and
 * must compose without leaking: a focused button inside a speaking tile
 * shows no green, and a focused speaking selected toggle shows all three.
 * In forced colors, where box-shadow and background colors are dropped,
 * the selected toggle, the selected chip and the switches must still read.
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

  const TRANSPARENT = 'rgba(0, 0, 0, 0)';

  /**
   * The colors of the switch glyph inside `root`: the track is the
   * `aria-hidden` span, the thumb its child. Runs in the page (Playwright
   * serializes it), so it closes over nothing.
   */
  function glyphColors(root: Element) {
    const track = root.querySelector('[aria-hidden="true"]') as HTMLElement;
    const thumb = track.firstElementChild as HTMLElement;
    return {
      track: getComputedStyle(track).backgroundColor,
      outline: getComputedStyle(track).outlineWidth,
      thumb: getComputedStyle(thumb).backgroundColor,
    };
  }

  function borderOf(el: Element) {
    return { width: getComputedStyle(el).borderTopWidth, color: getComputedStyle(el).borderTopColor };
  }

  test('a selected toggle has a visible border', async ({ page }) => {
    await page.goto(storyUrl('components-togglebutton--microphone-on', globals));
    await storyReady(page, {});
    const toggle = page.getByRole('button', { name: 'Microphone' });
    const border = await toggle.evaluate((el) => getComputedStyle(el).borderTopWidth);
    expect(border).toBe('2px');
  });

  test('a switch keeps a visible thumb, and on and off are distinguishable', async ({ page }) => {
    const read = async (story: string) => {
      await page.goto(storyUrl(story, globals));
      await storyReady(page, {});
      // The switch role is on the hidden input; the glyph sits in the label around it.
      return page.locator('label', { has: page.getByRole('switch') }).evaluate(glyphColors);
    };
    const off = await read('components-switch--off');
    const on = await read('components-switch--on');
    for (const state of [off, on]) {
      expect(state.thumb).not.toBe(TRANSPARENT);
      expect(state.thumb).not.toBe(state.track);
      expect(state.outline).toBe('2px');
    }
    expect(on.track).not.toBe(off.track);
    expect(on.thumb).not.toBe(off.thumb);
  });

  test('a menu switch glyph is visible off and on', async ({ page }) => {
    await page.goto(storyUrl('components-menu--open', globals));
    await storyReady(page, { tags: ['wait-for-overlay'] });
    const item = page.getByRole('menuitemcheckbox', { name: 'Whiteboard access' });
    await expect(item).toHaveAttribute('aria-checked', 'false');
    const off = await item.evaluate(glyphColors);
    await item.click();
    await expect(item).toHaveAttribute('aria-checked', 'true');
    const on = await item.evaluate(glyphColors);
    for (const state of [off, on]) {
      expect(state.thumb).not.toBe(TRANSPARENT);
      expect(state.thumb).not.toBe(state.track);
    }
    expect(on.track).not.toBe(off.track);
  });

  test('a selected chip has a Highlight border', async ({ page }) => {
    await page.goto(storyUrl('components-chipgroup--people-filters', globals));
    await storyReady(page, {});
    // The radio role is on the hidden input; the chip is the label around it.
    const chip = (name: string) => page.locator('label', { has: page.getByRole('radio', { name }) });
    const selected = await chip('All 14 people').evaluate(borderOf);
    const unselected = await chip('Raised hands 4 people').evaluate(borderOf);
    expect(selected.width).toBe('2px');
    expect(unselected.width).toBe('1px');
    expect(selected.color).not.toBe(unselected.color);
  });
});
