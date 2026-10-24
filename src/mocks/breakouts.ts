/**
 * Breakout-room logic, ported from `docs/canvas/project/Breakout.dc.html`
 * with the review fixes:
 *
 * - B1: a room can be empty; nothing here indexes `members[0]`.
 * - B3: help requests are data (`helpQueue`), sorted oldest first with the
 *   unacknowledged ones ahead.
 * - B4: manual moves live in `moves` and survive shuffle, even out and
 *   room-count changes; the automatic part is rebuilt around them.
 * - B6: up to `MAX_ROOMS` rooms.
 * - B7: one naming rule, "Room N", in both modes and every phase; a solo
 *   room carries its student's name as `subtitle`.
 */
import type {
  BreakoutMode,
  BreakoutState,
  HelpRequest,
  Participant,
  ParticipantId,
  RoomActivity,
  RoomWorkKind,
} from './types';

export const MIN_ROOMS = 2;
export const MAX_ROOMS = 50;
export const ROOM_COLORS = 8;
/** Seconds students get to wrap up after "Close all rooms" (BO10). */
export const CLOSING_SECONDS = 60;
export const DURATIONS_MIN = [5, 10, 15, 20, 30];
export const EXTRA_MIN = 5;

/** The people who go into rooms: everyone but the teachers. */
export function breakoutStudents(participants: Participant[]): Participant[] {
  return participants.filter((p) => p.role === 'student');
}

/** A seeded shuffle, so the same seed always gives the same order (the canvas's LCG). */
export function seededOrder(ids: ParticipantId[], seed: number): ParticipantId[] {
  const order = [...ids];
  if (seed <= 1) return order;
  let x = seed * 9301 + 49297;
  const rnd = () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export function clampRoomCount(n: number): number {
  if (!Number.isFinite(n)) return MIN_ROOMS;
  return Math.max(MIN_ROOMS, Math.min(MAX_ROOMS, Math.round(n)));
}

/** Round-robin over `order`: room sizes differ by one at most. */
export function roundRobin(order: ParticipantId[], roomCount: number): Record<ParticipantId, number> {
  const assignments: Record<ParticipantId, number> = {};
  order.forEach((id, i) => {
    assignments[id] = i % roomCount;
  });
  return assignments;
}

/**
 * Even out around the manual moves (B4): moved students stay put and the
 * others fill the rooms with the fewest people first, so the sizes end up
 * as even as the pins allow.
 */
export function balancedAround(
  order: ParticipantId[],
  moves: Record<ParticipantId, number>,
  roomCount: number,
): Record<ParticipantId, number> {
  const sizes = Array.from({ length: roomCount }, () => 0);
  for (const id of order) {
    const pinned = moves[id];
    if (pinned !== undefined && pinned < roomCount) sizes[pinned] += 1;
  }
  const assignments: Record<ParticipantId, number> = {};
  for (const id of order) {
    const pinned = moves[id];
    if (pinned !== undefined && pinned < roomCount) {
      assignments[id] = pinned;
      continue;
    }
    let room = 0;
    for (let i = 1; i < roomCount; i++) if (sizes[i] < sizes[room]) room = i;
    sizes[room] += 1;
    assignments[id] = room;
  }
  return assignments;
}

/** How many rooms exist: one per student in solo mode (B6: no cap below the students). */
export function roomCountFor(mode: BreakoutMode, roomCount: number, studentCount: number): number {
  return mode === 'solo' ? Math.max(1, studentCount) : clampRoomCount(roomCount);
}

/** Which room a student is in: the manual move wins, then the assignment, then round-robin by position. */
export function roomOf(
  id: ParticipantId,
  position: number,
  breakouts: Pick<BreakoutState, 'mode' | 'assignments' | 'moves'>,
  roomCount: number,
): number {
  if (breakouts.mode === 'solo') return position;
  const moved = breakouts.moves[id];
  if (moved !== undefined && moved < roomCount) return moved;
  const assigned = breakouts.assignments[id];
  if (assigned !== undefined && assigned < roomCount) return assigned;
  return position % roomCount;
}

export interface Room {
  index: number;
  /** "Room N" in every mode and phase (B7). */
  name: string;
  /** The student's name in solo mode, for the card's second line. */
  subtitle: string | null;
  /** 1-based index into the `room-*` tokens. */
  color: number;
  members: Participant[];
  activity: RoomActivity | null;
  work: RoomWorkKind;
  /** The open help request for this room, if any (B3). */
  help: HelpRequest | null;
}

export function roomName(index: number): string {
  return `Room ${index + 1}`;
}

export function roomColor(index: number): number {
  return (index % ROOM_COLORS) + 1;
}

/** Open requests first, oldest first; acknowledged ones follow, oldest first (B3). */
export function sortedHelpQueue(queue: HelpRequest[]): HelpRequest[] {
  return [...queue].sort((a, b) => {
    const openA = a.acknowledgedAt === null ? 0 : 1;
    const openB = b.acknowledgedAt === null ? 0 : 1;
    return openA - openB || a.askedAt - b.askedAt;
  });
}

/** The rooms with their members, from the state. Never throws on an empty room (B1). */
export function buildRooms(participants: Participant[], breakouts: BreakoutState): Room[] {
  const students = breakoutStudents(participants);
  const count = roomCountFor(breakouts.mode, breakouts.roomCount, students.length);
  const members: Participant[][] = Array.from({ length: count }, () => []);
  students.forEach((s, i) => {
    members[roomOf(s.id, i, breakouts, count)].push(s);
  });
  const help = new Map<number, HelpRequest>();
  for (const request of sortedHelpQueue(breakouts.helpQueue)) {
    if (request.acknowledgedAt === null && !help.has(request.roomIndex)) help.set(request.roomIndex, request);
  }
  return members.map((ms, index) => ({
    index,
    name: roomName(index),
    subtitle: breakouts.mode === 'solo' ? (ms[0]?.name ?? null) : null,
    color: roomColor(index),
    members: ms,
    activity: breakouts.activity[index] ?? null,
    work: breakouts.work[index] ?? 'board',
    help: help.get(index) ?? null,
  }));
}

/** Rooms differ by more than one student (the "Even out" hint). */
export function isUneven(rooms: Room[]): boolean {
  if (rooms.length === 0) return false;
  const sizes = rooms.map((r) => r.members.length);
  return Math.max(...sizes) - Math.min(...sizes) > 1;
}

/** "3–4 students per room" for the setup panel. */
export function studentsPerRoom(studentCount: number, roomCount: number): string {
  if (roomCount <= 0) return '0';
  const lo = Math.floor(studentCount / roomCount);
  const hi = Math.ceil(studentCount / roomCount);
  return lo === hi ? String(lo) : `${lo}–${hi}`;
}

/** Rooms needing help first, then by index: the live list order ("Rooms · help first"). */
export function helpFirst(rooms: Room[]): Room[] {
  return [...rooms].sort((a, b) => {
    const ha = a.help ? a.help.askedAt : Number.POSITIVE_INFINITY;
    const hb = b.help ? b.help.askedAt : Number.POSITIVE_INFINITY;
    return ha - hb || a.index - b.index;
  });
}
