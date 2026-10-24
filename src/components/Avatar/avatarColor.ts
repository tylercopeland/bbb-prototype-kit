/** One of the ten `avatar-*` tokens; the classes live in `avatarStyles`' `color` variant. */
export type AvatarColor = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

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
