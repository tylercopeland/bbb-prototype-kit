/**
 * The class timer's presets and corners (Focus.dc.html 1043–1045). The
 * quick times are one choice among four (X8), so they are a radio group.
 * The corners are the keyboard way to place the card (D1): "Move to
 * corner" lists them, and the move is announced.
 */
import type { StageCorner } from './types';

/** The quick times, in seconds: 1, 3, 5 and 10 minutes. */
export const TIMER_PRESETS = [60, 180, 300, 600];

/** "1 min", "10 min". */
export function formatPreset(seconds: number): string {
  return `${Math.round(seconds / 60)} min`;
}

/** Under this many seconds left, the timer is in its last minute (amber). */
export const TIMER_WARN_SEC = 60;
/** Under this many seconds left, the timer is almost there (red, pulsing). */
export const TIMER_URGENT_SEC = 10;

export const STAGE_CORNERS: StageCorner[] = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];

export const cornerLabels: Record<StageCorner, string> = {
  topLeft: 'Top left',
  topRight: 'Top right',
  bottomLeft: 'Bottom left',
  bottomRight: 'Bottom right',
};
