/** Honorifics that never make it into initials (English and Portuguese). */
const HONORIFIC = /^(?:prof|profa|dr|dra|mr|ms|mrs|sr|sra)\.?$/i;
/** A trailing "(you)" marker from the People list. */
const YOU = /\s*\(you\)\s*$/i;
/** Scripts where one character is a whole syllable or word: the first grapheme alone is the initial. */
const CJK = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;

/** Shown when nothing is left after stripping (`"Dr."`); the avatar's accessible name still carries the full text. */
export const INITIALS_FALLBACK = '?';

const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

function graphemes(word: string): string[] {
  return Array.from(segmenter.segment(word), (s) => s.segment);
}

/**
 * Initials for an avatar (B9). Two or more words: the first letter of the
 * first and of the last word (`Rafaela Monaco` → `RM`). One word: its first
 * two letters (`Bruno` → `BR`). Honorifics and a trailing "(you)" are
 * stripped first. Names are normalized to NFC and split into graphemes with
 * `Intl.Segmenter`, so accented letters and emoji count as one; CJK names
 * take their first grapheme only (`李小龙` → `李`), because one character is
 * already a syllable. Upper-cased for the locale.
 */
export function initials(name: string): string {
  const words = name
    .normalize('NFC')
    .replace(YOU, '')
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0 && !HONORIFIC.test(word));
  if (words.length === 0) return INITIALS_FALLBACK;
  const first = graphemes(words[0]);
  if (CJK.test(first[0])) return first[0];
  if (words.length === 1) return first.slice(0, 2).join('').toLocaleUpperCase();
  const last = graphemes(words[words.length - 1]);
  return `${first[0]}${last[0]}`.toLocaleUpperCase();
}
