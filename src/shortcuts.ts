/**
 * The keyboard-shortcut map. Nothing else hard-codes a key.
 *
 * Every shortcut is Alt + a letter (PLAN.md decision, 2026-10-24): bare
 * letters would fire while someone types in chat. Only the three keys the
 * action bar needs are defined; the rest arrive with their flows.
 *
 * For milestone 4's key handlers:
 * - Match on `event.code` (`KeyM`), not `event.key`: with Alt held, macOS
 *   turns `key` into a symbol (`µ`) and some layouts move letters.
 * - Call `event.preventDefault()` on a match, otherwise the browser also
 *   acts on it.
 * - Firefox on Windows and Linux opens its menu bar on Alt + V (View) and
 *   Alt + H (Help). preventDefault stops that while the room has focus,
 *   but it is a known conflict to test on Firefox.
 */
import { useCallback, useMemo, type Ref } from 'react';
import { mergeRefs } from 'react-aria';

export const shortcuts = {
  microphone: { key: 'M' },
  camera: { key: 'V' },
  raiseHand: { key: 'H' },
} as const;

export type ShortcutId = keyof typeof shortcuts;

/** True on macOS, where the modifier is drawn as the Option symbol. Tests (jsdom) are not macOS. */
export function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  const data = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData;
  const platform = data?.platform ?? navigator.platform ?? '';
  return /mac|iphone|ipad|ipod/i.test(platform);
}

/** The modifier as people read it: "⌥" on macOS, "Alt" elsewhere. */
export function shortcutModifier(): string {
  return isApplePlatform() ? '⌥' : 'Alt';
}

/** Human-readable, for tooltips: "Alt + M" (or "⌥ + M" on macOS). */
export function formatShortcut(id: ShortcutId): string {
  return `${shortcutModifier()} + ${shortcuts[id].key}`;
}

/** The `aria-keyshortcuts` value, which is always spelled "Alt+M". */
export function ariaKeyshortcuts(id: ShortcutId): string {
  return `Alt+${shortcuts[id].key}`;
}

/**
 * React Aria's Button forwards only the labelling `aria-*` props to the
 * DOM, so `aria-keyshortcuts` is set on the element itself through a
 * callback ref. The result also fills the consumer's `ref` (merged with
 * React Aria's `mergeRefs`, memoized).
 */
export function useAriaKeyshortcuts<T extends HTMLElement>(
  shortcut: ShortcutId | undefined,
  forwarded?: Ref<T>,
): Ref<T> {
  const value = shortcut ? ariaKeyshortcuts(shortcut) : undefined;
  const setAttribute = useCallback(
    (el: T | null) => {
      if (!el) return;
      if (value) el.setAttribute('aria-keyshortcuts', value);
      else el.removeAttribute('aria-keyshortcuts');
    },
    [value],
  );
  return useMemo(() => mergeRefs(setAttribute, forwarded), [setAttribute, forwarded]);
}
