/**
 * The keyboard-shortcut map. Nothing else hard-codes a key.
 *
 * Every shortcut is Alt + a letter (PLAN.md decision, 2026-10-24): bare
 * letters would fire while someone types in chat. Only the three keys the
 * action bar needs are defined; the rest arrive with their flows.
 */
export const shortcutModifier = 'Alt';

export const shortcuts = {
  microphone: { key: 'M' },
  camera: { key: 'V' },
  raiseHand: { key: 'H' },
} as const;

export type ShortcutId = keyof typeof shortcuts;

/** Human-readable, for tooltips: "Alt + M". */
export function formatShortcut(id: ShortcutId): string {
  return `${shortcutModifier} + ${shortcuts[id].key}`;
}

/** The `aria-keyshortcuts` value: "Alt+M". */
export function ariaKeyshortcuts(id: ShortcutId): string {
  return `${shortcutModifier}+${shortcuts[id].key}`;
}
