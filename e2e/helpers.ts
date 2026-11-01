/**
 * Shared helpers for the keyboard walks (`room`, `sharing`, `poll-timer`,
 * `breakouts`): the artboard size, Tab-until-named, Tab-until-focused and
 * acting as another participant through the store the `RoomProvider`
 * exposes as `window.bbbRoom`.
 */
import { readFileSync } from 'node:fs';
import type { Locator, Page } from '@playwright/test';

/**
 * Waits until overlays opened on load have finished entering, so axe and the
 * screenshots never read a mid-fade colour (a white panel half-faded over the
 * stage reads as grey). Covers React Aria's hidden pre-entry state (it alone
 * sets `mask-image`; VisuallyHidden text also uses `clip-path: inset(50%)`),
 * `data-entering`, and every finite CSS animation or transition still running.
 */
export async function settleAnimations(page: Page) {
  await page.waitForFunction(
    () => document.querySelectorAll('[style*="mask-image"], [data-entering]').length === 0,
  );
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => undefined)),
    ),
  );
}

/** The desktop artboard size. */
export const SIZE = { width: 1400, height: 900 };

export type ArtboardEntry = {
  stem: string;
  group: 'desktop' | 'mobile';
  number: number;
  title: string;
  size: { width: number; height: number };
};

/** Every artboard, from the list `npm run artboards` generates out of docs/artboards.md. */
export function readArtboards(): ArtboardEntry[] {
  return JSON.parse(readFileSync('src/routes/artboards.json', 'utf8')) as ArtboardEntry[];
}

/** Opens an artboard's route at its own size (390×844 or 844×390 for the phone), with any extra query. */
export async function gotoArtboard(page: Page, group: ArtboardEntry['group'], stem: string, query = '') {
  const artboard = readArtboards().find((a) => a.group === group && a.stem === stem);
  if (!artboard) throw new Error(`No artboard ${group}/${stem} in src/routes/artboards.json`);
  await page.setViewportSize(artboard.size);
  await page.goto(`/${group}/${stem}${query}`);
}

/**
 * Presses Tab (or `key`, such as Shift+Tab) until the focused element has
 * the accessible name, or fails after `max` presses. The name is read from
 * `aria-label`, then `aria-labelledby`, then the text with `aria-hidden`
 * parts left out; a radio input is named by its label element, which this
 * cannot see, so use `tabUntilFocused` for one.
 */
export async function tabTo(page: Page, name: string | RegExp, max = 60, key = 'Tab') {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press(key);
    const label = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return '';
      const visibleText = (node: Node): string => {
        if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
        if (!(node instanceof Element) || node.getAttribute('aria-hidden') === 'true') return '';
        return Array.from(node.childNodes).map(visibleText).join('');
      };
      const byIds = (attr: string) =>
        el
          .getAttribute(attr)
          ?.split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
          .join(' ');
      return (
        el.getAttribute('aria-label') ??
        byIds('aria-labelledby') ??
        visibleText(el).replace(/\s+/g, ' ').trim()
      );
    });
    if (typeof name === 'string' ? label === name : name.test(label)) return;
  }
  throw new Error(`Never reached a control named ${String(name)}`);
}

/** Presses Tab (or `key`) until `locator` holds focus, or fails after `max` presses. */
export async function tabUntilFocused(page: Page, locator: Locator, max = 60, key = 'Tab') {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press(key);
    if (await locator.evaluate((el) => el === document.activeElement)) return;
  }
  throw new Error('Never reached the control');
}

/** Dispatches a store action as if another participant acted. */
export async function dispatch(page: Page, action: Record<string, unknown>) {
  await page.evaluate((a) => {
    const w = window as unknown as { bbbRoom?: { dispatch: (action: unknown) => void } };
    w.bbbRoom?.dispatch(a);
  }, action);
}
