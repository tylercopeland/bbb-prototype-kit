/**
 * Pure helpers of the breakout surface, out of the component files so they
 * can be tested on their own and the components export nothing but
 * themselves.
 */
import type { Room } from '../../mocks/breakouts';
import type { BreakoutMode, BreakoutPhase } from '../../mocks/types';

export type RoomFilter = 'all' | 'help' | 'quiet';

/** Rooms the live list's filter keeps (B6): all, the ones asking for help, the quiet ones (no activity, or quiet). */
export function filterRooms(rooms: Room[], filter: RoomFilter): Room[] {
  if (filter === 'help') return rooms.filter((r) => r.help !== null);
  if (filter === 'quiet') return rooms.filter((r) => r.activity === null || r.activity.kind === 'quiet');
  return rooms;
}

export type BoardColumns = 2 | 3 | 4 | 5 | 6;

/** The board's columns, as the canvas lays them out (Breakout.dc.html 477, 492). */
export function boardColumns(phase: BreakoutPhase, mode: BreakoutMode, roomCount: number): BoardColumns {
  if (mode === 'solo') return phase === 'back' ? 6 : 5;
  if (phase === 'setup') return Math.min(4, Math.max(2, roomCount)) as BoardColumns;
  if (phase === 'back') return 4;
  return roomCount <= 4 ? 2 : 3;
}

/** How many rooms the share-back card lists before "See all". */
export const SHARE_BACK_ROWS = 4;
