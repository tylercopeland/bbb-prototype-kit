import { describe, expect, it } from 'vitest';
import { formatRaisedHands, formatUnread } from './format';

describe('format', () => {
  it('pluralizes raised hands', () => {
    expect(formatRaisedHands(1)).toBe('1 raised hand');
    expect(formatRaisedHands(0)).toBe('0 raised hands');
    expect(formatRaisedHands(4)).toBe('4 raised hands');
  });

  it('keeps unread as a mass noun', () => {
    expect(formatUnread(1)).toBe('1 unread');
    expect(formatUnread(3)).toBe('3 unread');
  });
});
