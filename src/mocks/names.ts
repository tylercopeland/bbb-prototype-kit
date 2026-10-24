/**
 * How a person's name is shortened, in one place: the display names (B9),
 * the avatar initials and a room's "Ana and Bruno are talking" all agree
 * on what counts as the first and last name. Honorifics ("Prof.", "Dra.")
 * are never a first name and generational suffixes ("III", "Jr.") are
 * never a last name.
 */

/** Honorifics that never make it into a short name (English and Portuguese). */
export const HONORIFIC = /^(?:prof|profa|dr|dra|mr|ms|mrs|sr|sra)\.?$/i;

/** Generational suffixes that are never the last name: "Frederick Dixon III" → "Frederick D.". */
export const GENERATIONAL_SUFFIX = /^(?:jr|sr|ii|iii|iv|v)\.?$/i;

/**
 * The words of a name without honorifics, and without a trailing
 * generational suffix when another word is left. NFC-normalized, so an
 * accented first letter is one grapheme.
 */
export function nameWords(name: string): string[] {
  const words = name
    .normalize('NFC')
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0 && !HONORIFIC.test(word));
  while (words.length > 1 && GENERATIONAL_SUFFIX.test(words[words.length - 1])) words.pop();
  return words;
}

/** "Prof. Helena Costa" → "Helena". A name of only honorifics stays as written. */
export function firstName(name: string): string {
  return nameWords(name)[0] ?? name.trim();
}

/** "Ana Souza" → "Ana S."; a single word stays as it is. */
export function firstNameWithInitial(name: string): string {
  const words = nameWords(name);
  if (words.length === 0) return name.trim();
  return words.length > 1 ? `${words[0]} ${words[words.length - 1][0]}.` : words[0];
}
