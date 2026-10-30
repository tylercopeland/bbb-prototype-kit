import { describe, expect, it } from 'vitest';
import {
  MAX_ROOMS,
  MIN_ROOMS,
  balancedAround,
  buildRooms,
  clampRoomCount,
  helpFirst,
  isUneven,
  roomCountFor,
  roomName,
  roundRobin,
  seededOrder,
  sortedHelpQueue,
  studentsPerRoom,
} from './breakouts';
import { breakoutsFor, createRoom } from './fixtures';
import type { HelpRequest } from './types';

const help = (
  id: string,
  roomIndex: number,
  askedAt: number,
  acknowledgedAt: number | null = null,
): HelpRequest => ({
  id,
  roomIndex,
  from: null,
  askedAt,
  acknowledgedAt,
});

describe('seededOrder', () => {
  it('keeps the joining order for seed 1 and is deterministic for others', () => {
    const ids = ['a', 'b', 'c', 'd', 'e'];
    expect(seededOrder(ids, 1)).toEqual(ids);
    const two = seededOrder(ids, 2);
    expect(two).toEqual(seededOrder(ids, 2));
    expect([...two].sort()).toEqual(ids);
    expect(two).not.toEqual(ids);
  });
});

describe('clampRoomCount', () => {
  it('allows up to 50 rooms and at least 2 (B6)', () => {
    expect(clampRoomCount(1)).toBe(MIN_ROOMS);
    expect(clampRoomCount(50)).toBe(MAX_ROOMS);
    expect(clampRoomCount(51)).toBe(MAX_ROOMS);
    expect(clampRoomCount(Number.NaN)).toBe(MIN_ROOMS);
    expect(clampRoomCount(7.4)).toBe(7);
  });
});

describe('roundRobin and balancedAround', () => {
  it('spreads students so sizes differ by one at most', () => {
    const a = roundRobin(['a', 'b', 'c', 'd', 'e'], 2);
    expect(a).toEqual({ a: 0, b: 1, c: 0, d: 1, e: 0 });
  });

  it('keeps manual moves and evens out the rest around them (B4)', () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f'];
    const moves = { a: 2, b: 2, c: 2 };
    const out = balancedAround(ids, moves, 3);
    expect(out.a).toBe(2);
    expect(out.b).toBe(2);
    expect(out.c).toBe(2);
    // The three pins fill room 3, so the others go to rooms 1 and 2.
    expect([out.d, out.e, out.f].sort()).toEqual([0, 0, 1]);
  });

  it('ignores a move into a room that no longer exists', () => {
    const out = balancedAround(['a', 'b'], { a: 9 }, 2);
    expect(out).toEqual({ a: 0, b: 1 });
  });
});

describe('roomCountFor', () => {
  it('is one room per student in solo mode, even past the groups cap (B6)', () => {
    expect(roomCountFor('solo', 4, 13)).toBe(13);
    expect(roomCountFor('solo', 4, 60)).toBe(60);
    expect(roomCountFor('solo', 4, 0)).toBe(1);
    expect(roomCountFor('groups', 4, 13)).toBe(4);
  });
});

describe('buildRooms', () => {
  it('names every room "Room N" in both modes (B7)', () => {
    const groups = createRoom();
    expect(buildRooms(groups.participants, groups.breakouts).map((r) => r.name)).toEqual([
      'Room 1',
      'Room 2',
      'Room 3',
      'Room 4',
    ]);
    const solo = createRoom({ breakouts: { mode: 'solo' } });
    const rooms = buildRooms(solo.participants, solo.breakouts);
    expect(rooms).toHaveLength(13);
    expect(rooms[0].name).toBe('Room 1');
    expect(rooms[0].subtitle).toBe('Bruno');
    expect(roomName(12)).toBe('Room 13');
  });

  it('puts every student in exactly one room and no teacher in any', () => {
    const state = createRoom({ participants: 'thirty' });
    const rooms = buildRooms(state.participants, state.breakouts);
    const ids = rooms.flatMap((r) => r.members.map((m) => m.id));
    expect(ids).toHaveLength(29);
    expect(new Set(ids).size).toBe(29);
    expect(ids).not.toContain('helena');
  });

  it('never crashes on an empty room (B1)', () => {
    const state = createRoom({ participants: 'one' });
    const rooms = buildRooms(state.participants, state.breakouts);
    expect(rooms).toHaveLength(4);
    expect(rooms.every((r) => r.members.length === 0)).toBe(true);
    const solo = createRoom({ participants: 'one', breakouts: { mode: 'solo' } });
    const soloRooms = buildRooms(solo.participants, solo.breakouts);
    expect(soloRooms).toHaveLength(1);
    expect(soloRooms[0].subtitle).toBeNull();
  });

  it('handles 50 rooms with fewer students than rooms (B1, B6)', () => {
    const state = createRoom({ participants: 'thirty', breakouts: { roomCount: 50 } });
    const rooms = buildRooms(state.participants, state.breakouts);
    expect(rooms).toHaveLength(50);
    expect(rooms.filter((r) => r.members.length === 0)).toHaveLength(21);
    expect(rooms.map((r) => r.color)).toContain(8);
  });

  it('attaches the oldest open help request to its room (B3)', () => {
    const state = createRoom();
    const breakouts = {
      ...state.breakouts,
      helpQueue: [help('h2', 1, 200), help('h1', 1, 100), help('h3', 2, 50, 60)],
    };
    const rooms = buildRooms(state.participants, breakouts);
    expect(rooms[1].help?.id).toBe('h1');
    expect(rooms[2].help).toBeNull();
    expect(rooms[0].help).toBeNull();
  });
});

describe('sortedHelpQueue and helpFirst', () => {
  it('puts open requests first, oldest first, then acknowledged ones', () => {
    const sorted = sortedHelpQueue([help('a', 0, 300), help('b', 1, 100, 150), help('c', 2, 200)]);
    expect(sorted.map((h) => h.id)).toEqual(['c', 'a', 'b']);
  });

  it('orders rooms by who asked for help first', () => {
    const state = createRoom();
    const rooms = buildRooms(state.participants, {
      ...state.breakouts,
      helpQueue: [help('a', 3, 300), help('b', 1, 100)],
    });
    expect(helpFirst(rooms).map((r) => r.index)).toEqual([1, 3, 0, 2]);
  });
});

describe('isUneven and studentsPerRoom', () => {
  it('flags rooms that differ by more than one student', () => {
    const state = createRoom();
    expect(isUneven(buildRooms(state.participants, state.breakouts))).toBe(false);
    const moved = { ...state.breakouts, moves: { bruno: 1, rafaela: 1, cibelle: 1 } };
    expect(isUneven(buildRooms(state.participants, moved))).toBe(true);
    expect(isUneven([])).toBe(false);
  });

  it('formats the per-room range', () => {
    expect(studentsPerRoom(13, 4)).toBe('3–4');
    expect(studentsPerRoom(12, 4)).toBe('3');
    expect(studentsPerRoom(0, 4)).toBe('0');
  });
});

describe('breakoutsFor', () => {
  it('builds a setup state for any class size', () => {
    const b = breakoutsFor({ participants: [] });
    expect(b.assignments).toEqual({});
    expect(b.roomCount).toBe(4);
  });
});
