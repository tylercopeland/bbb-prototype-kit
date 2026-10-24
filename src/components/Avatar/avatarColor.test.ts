import { describe, expect, it } from 'vitest';
import { avatarColor } from './avatarColor';

describe('avatarColor', () => {
  it('is stable for the same id', () => {
    expect(avatarColor('ana-souza')).toBe(avatarColor('ana-souza'));
  });

  it('differs between two ids with the same first name', () => {
    expect(avatarColor('ana-souza')).not.toBe(avatarColor('ana-lima'));
  });

  it('stays within the ten tokens', () => {
    const ids = [
      'me',
      'frederick',
      'bruno',
      'rafaela',
      'cibelle',
      'octavio',
      'anton',
      'michelle',
      'ellen',
      'timo',
    ];
    for (const id of ids) {
      const color = avatarColor(id);
      expect(color).toBeGreaterThanOrEqual(1);
      expect(color).toBeLessThanOrEqual(10);
    }
  });

  it('spreads across the palette', () => {
    const colors = new Set(Array.from({ length: 40 }, (_, i) => avatarColor(`participant-${i}`)));
    expect(colors.size).toBeGreaterThanOrEqual(8);
  });
});
