/**
 * The room clock counts milliseconds since midnight of the session day, not
 * since the Unix epoch, so a time of day formats the same in every time zone
 * and a fixture can say "9:02" as a number.
 */

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;

/** `timeOfDay(9, 2)` is 09:02:00 on the room clock. */
export function timeOfDay(hours: number, minutes = 0, seconds = 0): number {
  return hours * HOUR + minutes * MINUTE + seconds * SECOND;
}

/** "9:02", as chat and DM rows show it. */
export function formatTimeOfDay(ms: number): string {
  const total = Math.floor(ms / MINUTE);
  const hours = Math.floor(total / 60) % 24;
  const minutes = total % 60;
  return `${hours}:${String(minutes).padStart(2, '0')}`;
}

/** "29:36" or "1:02:05": elapsed time for the session header; never in a live region (X10). */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / SECOND));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const mmss = `${hours > 0 ? String(minutes).padStart(2, '0') : minutes}:${String(seconds).padStart(2, '0')}`;
  return hours > 0 ? `${hours}:${mmss}` : mmss;
}

/** "0:59" for a countdown, from seconds. */
export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** "just now", "1 min", "22 min", "1 h 5 min": how long ago something happened. */
export function formatAgo(sinceMs: number, nowMs: number): string {
  const minutes = Math.floor(Math.max(0, nowMs - sinceMs) / MINUTE);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
