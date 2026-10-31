import { describe, expect, it } from 'vitest';
import { createRoom, roomReducer, selectRooms, type RoomAction, type RoomState } from '../../mocks';
import { SHARE_BACK_ROWS, boardColumns, filterRooms } from './breakoutView';

const run = (state: RoomState, ...actions: RoomAction[]) => actions.reduce(roomReducer, state);

describe('filterRooms', () => {
  it('keeps every room, the ones asking for help, or the quiet ones (B6)', () => {
    const live = run(createRoom(), { type: 'openRooms' }, { type: 'requestHelp', roomIndex: 1 });
    const rooms = selectRooms(live);
    expect(filterRooms(rooms, 'all')).toBe(rooms);
    expect(filterRooms(rooms, 'help').map((r) => r.index)).toEqual([1]);
    // Room 3 is quiet for 4 min in the fixture; room 2 has no activity entry, so it counts as quiet too.
    expect(filterRooms(rooms, 'quiet').map((r) => r.index)).toEqual([1, 2]);
    expect(filterRooms([], 'help')).toEqual([]);
  });
});

describe('boardColumns', () => {
  it('follows the canvas: as many columns as rooms up to four in setup, two or three live, four back, five or six solo', () => {
    expect(boardColumns('setup', 'groups', 2)).toBe(2);
    expect(boardColumns('setup', 'groups', 3)).toBe(3);
    expect(boardColumns('setup', 'groups', 50)).toBe(4);
    expect(boardColumns('live', 'groups', 4)).toBe(2);
    expect(boardColumns('live', 'groups', 5)).toBe(3);
    expect(boardColumns('back', 'groups', 4)).toBe(4);
    expect(boardColumns('setup', 'solo', 13)).toBe(5);
    expect(boardColumns('live', 'solo', 30)).toBe(5);
    expect(boardColumns('back', 'solo', 13)).toBe(6);
    expect(SHARE_BACK_ROWS).toBe(4);
  });
});
