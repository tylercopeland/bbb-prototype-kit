export type AvatarColor = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** The ten `avatar-*` tokens; every one passes 4.5:1 with white initials. */
export const avatarColorClass: Record<AvatarColor, string> = {
  1: 'bg-avatar-1',
  2: 'bg-avatar-2',
  3: 'bg-avatar-3',
  4: 'bg-avatar-4',
  5: 'bg-avatar-5',
  6: 'bg-avatar-6',
  7: 'bg-avatar-7',
  8: 'bg-avatar-8',
  9: 'bg-avatar-9',
  10: 'bg-avatar-10',
};

/**
 * A stable color for a participant: a 32-bit FNV-1a hash of their id,
 * `% 10 + 1`. Seeded by the id, not the name, so the color survives a
 * rename and two people called Ana differ.
 */
export function avatarColor(id: string): AvatarColor {
  let hash = 0x811c9dc5;
  for (const char of id) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return ((hash % 10) + 1) as AvatarColor;
}
