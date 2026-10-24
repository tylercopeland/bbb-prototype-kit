import { afterEach, describe, expect, it, vi } from 'vitest';
import { ariaKeyshortcuts, formatShortcut, isApplePlatform, shortcuts } from './shortcuts';

describe('shortcuts', () => {
  afterEach(() => vi.restoreAllMocks());

  it('formats the tooltip text with the Alt modifier outside macOS', () => {
    expect(isApplePlatform()).toBe(false);
    expect(formatShortcut('microphone')).toBe('Alt + M');
    expect(formatShortcut('camera')).toBe('Alt + V');
    expect(formatShortcut('raiseHand')).toBe('Alt + H');
  });

  it('shows the Option symbol on macOS', () => {
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('MacIntel');
    expect(formatShortcut('microphone')).toBe('⌥ + M');
    expect(ariaKeyshortcuts('microphone')).toBe('Alt+M');
  });

  it('formats aria-keyshortcuts without spaces', () => {
    expect(ariaKeyshortcuts('microphone')).toBe('Alt+M');
  });

  it('defines only the action-bar keys for now', () => {
    expect(Object.keys(shortcuts)).toEqual(['microphone', 'camera', 'raiseHand']);
  });
});
