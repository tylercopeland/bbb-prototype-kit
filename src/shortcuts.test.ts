import { describe, expect, it } from 'vitest';
import { ariaKeyshortcuts, formatShortcut, shortcuts } from './shortcuts';

describe('shortcuts', () => {
  it('formats the tooltip text with the Alt modifier', () => {
    expect(formatShortcut('microphone')).toBe('Alt + M');
    expect(formatShortcut('camera')).toBe('Alt + V');
    expect(formatShortcut('raiseHand')).toBe('Alt + H');
  });

  it('formats aria-keyshortcuts without spaces', () => {
    expect(ariaKeyshortcuts('microphone')).toBe('Alt+M');
  });

  it('defines only the action-bar keys for now', () => {
    expect(Object.keys(shortcuts)).toEqual(['microphone', 'camera', 'raiseHand']);
  });
});
