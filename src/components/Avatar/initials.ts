/** Honorifics that never make it into initials. */
const HONORIFIC = /^(?:prof|dr|mr|ms|mrs)\.?$/i;
/** A trailing "(you)" marker from the People list. */
const YOU = /\s*\(you\)\s*$/i;

/**
 * Initials for an avatar (B9). Two or more words: the first letter of the
 * first and of the last word (`Rafaela Monaco` → `RM`). One word: its first
 * two letters (`Bruno` → `BR`). Honorifics and a trailing "(you)" are
 * stripped first. Letters are taken with `Array.from`, so accented and
 * non-Latin names work, then upper-cased for the locale.
 */
export function initials(name: string): string {
  const words = name
    .replace(YOU, '')
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0 && !HONORIFIC.test(word));
  if (words.length === 0) return '';
  const first = Array.from(words[0]);
  if (words.length === 1) return first.slice(0, 2).join('').toLocaleUpperCase();
  const last = Array.from(words[words.length - 1]);
  return `${first[0]}${last[0]}`.toLocaleUpperCase();
}
