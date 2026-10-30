import { describe, expect, it } from 'vitest';
import { createRoom, FIXTURE_NOW } from './fixtures';
import { roomReducer as reduce } from './reducer';
import {
  participantSubline,
  roomStatus,
  selectAlerts,
  selectDirectList,
  selectDisplayNames,
  selectElapsed,
  selectLowEngagement,
  selectPeople,
  selectPeopleFilterCounts,
  selectPluginSubtitles,
  selectPollResults,
  selectRaisedHands,
  selectRooms,
  selectSlideLabel,
  selectTileOrder,
  selectUnreadTotal,
} from './selectors';
import { MINUTE } from './time';

describe('people selectors', () => {
  it('sorts raised hands by longest wait and memoizes per state', () => {
    const s = createRoom();
    expect(selectRaisedHands(s).map((p) => p.id)).toEqual(['bruno', 'rafaela', 'cibelle', 'octavio']);
    expect(selectRaisedHands(s)).toBe(selectRaisedHands(s));
    expect(selectLowEngagement(s).map((p) => p.id)).toEqual(['timo', 'ana', 'joana']);
    expect(selectPeopleFilterCounts(s)).toEqual({ all: 14, hands: 4, low: 3 });
  });

  it('builds each People filter from data', () => {
    const s = createRoom();
    const all = selectPeople('all')(s);
    expect(all.hands).toHaveLength(4);
    expect(all.others).toHaveLength(10);
    expect(all.others[0].id).toBe('helena');
    expect(selectPeople('hands')(s).others).toEqual([]);
    expect(selectPeople('low')(s).others.map((p) => p.id)).toEqual(['timo', 'ana', 'joana']);
    const empty = createRoom({ participants: 'one' });
    expect(selectPeople('all')(empty)).toEqual({ hands: [], others: empty.participants });
    expect(selectPeopleFilterCounts(empty)).toEqual({ all: 1, hands: 0, low: 0 });
  });

  it('tells two Anas apart (B9) and leaves unique first names alone', () => {
    const names = selectDisplayNames(createRoom({ participants: 'duplicateNames' }));
    expect(names.ana).toBe('Ana S.');
    expect(names['ana-ferreira']).toBe('Ana F.');
    expect(names.bruno).toBe('Bruno');
    expect(names.rafaela).toBe('Rafaela');
  });

  it('skips honorifics and generational suffixes in short names, as the avatar initials do', () => {
    expect(selectDisplayNames(createRoom()).helena).toBe('Helena');
    const long = selectDisplayNames(createRoom({ participants: 'longNames' }));
    expect(long.frederick).toBe('Frederick');
    expect(long.michelle).toBe('Michelle');
  });

  it('describes a row’s second line', () => {
    const s = createRoom();
    const bruno = s.participants.find((p) => p.id === 'bruno')!;
    expect(participantSubline(bruno, FIXTURE_NOW)).toBe('Raised · 3 min');
    const me = s.participants.find((p) => p.isSelf)!;
    expect(participantSubline(me, FIXTURE_NOW)).toBe('Presenting');
    expect(
      participantSubline(
        { ...bruno, handRaisedAt: null, hasWhiteboard: true, chatLocked: true },
        FIXTURE_NOW,
      ),
    ).toBe('Whiteboard · Chat locked');
  });

  it('orders tiles: speakers, then hands by wait, then cameras', () => {
    const order = selectTileOrder(createRoom()).map((p) => p.id);
    expect(order.slice(0, 5)).toEqual(['frederick', 'bruno', 'rafaela', 'cibelle', 'octavio']);
    expect(order.indexOf('helena')).toBeLessThan(order.indexOf('ellen'));
  });
});

describe('session and chat selectors', () => {
  it('formats the elapsed session time', () => {
    expect(selectElapsed(createRoom())).toBe('29:36');
  });

  it('lists direct threads newest first with previews and unread counts', () => {
    const list = selectDirectList(createRoom());
    expect(list.map((t) => t.thread.with)).toEqual(['rafaela', 'bruno']);
    expect(list[0]).toMatchObject({ unread: 1, preview: 'Can I share my screen right after Frederick?' });
    expect(list[1]).toMatchObject({ unread: 0, preview: 'You: It’s in the Notes panel, right next to Chat' });
    expect(selectUnreadTotal(createRoom())).toBe(2);
    expect(selectDirectList(createRoom({ chat: 'empty' }))).toEqual([]);
  });

  it('puts a just-opened thread at the top', () => {
    const s = reduce(createRoom(), { type: 'openDm', participantId: 'frederick' });
    expect(selectDirectList(s)[0].thread.with).toBe('frederick');
  });
});

describe('alerts', () => {
  it('derives the header pills from the state, in the canvas order', () => {
    const alerts = selectAlerts(createRoom());
    expect(alerts.map((a) => a.kind)).toEqual(['hands', 'question', 'insight']);
    expect(alerts.map((a) => a.text)).toEqual(['4 raised', 'Rafaela asked', '3 low engagement']);
  });

  it('drops a pill once its cause is gone', () => {
    let s = createRoom({ participants: 'four' });
    expect(selectAlerts(s).map((a) => a.kind)).toEqual(['hands']);
    s = reduce(s, { type: 'lowerHand', participantId: 'bruno' });
    expect(selectAlerts(s)).toEqual([]);
    const read = reduce(createRoom(), { type: 'setPanel', panel: 'chat' });
    expect(selectAlerts(read).map((a) => a.kind)).toEqual(['hands', 'insight']);
  });

  it('never counts your own hand in the hands pill', () => {
    const s = reduce(createRoom(), { type: 'raiseHand', participantId: 'helena' });
    expect(selectRaisedHands(s)).toHaveLength(5);
    expect(selectAlerts(s)[0]).toMatchObject({ kind: 'hands', count: 4, text: '4 raised' });
    const alone = reduce(createRoom({ participants: 'one' }), { type: 'raiseHand', participantId: 'helena' });
    expect(selectAlerts(alone)).toEqual([]);
  });

  it('drops a question pill with its author', () => {
    const s = reduce(createRoom(), { type: 'removeParticipant', participantId: 'rafaela' });
    expect(selectAlerts(s).map((a) => a.kind)).toEqual(['hands', 'insight']);
  });

  it('puts help requests first while rooms are live and the ended pill after', () => {
    const live = reduce(createRoom(), { type: 'openRooms' });
    const asked = reduce(live, { type: 'requestHelp', roomIndex: 1 });
    expect(selectAlerts(asked)[0]).toMatchObject({ kind: 'help', text: 'Room 2 asked for help' });
    const twice = reduce(asked, { type: 'requestHelp', roomIndex: 3 });
    expect(selectAlerts(twice)[0].text).toBe('2 rooms asked for help');
    const back = reduce(twice, { type: 'bringEveryoneBack' });
    expect(selectAlerts(back)[0]).toMatchObject({
      kind: 'back',
      text: 'Breakouts ended · 4 rooms’ work saved',
    });
  });
});

describe('presentation and plugins', () => {
  it('labels the slide from the deck', () => {
    expect(selectSlideLabel(createRoom())).toBe('3 / 12');
  });

  it('derives the plugin card subtitles', () => {
    expect(selectPluginSubtitles(createRoom())).toEqual({
      breakouts: '4 rooms set up',
      poll: 'Not started',
      timer: 'Not running',
    });
    const live = reduce(createRoom(), { type: 'openRooms' });
    expect(selectPluginSubtitles(live).breakouts).toBe('4 rooms live');
  });

  it('turns the poll votes into keyed rows with shares, marking the most chosen; nothing is top before any answer', () => {
    const s = createRoom();
    const rows = selectPollResults(s);
    expect(rows).toBe(selectPollResults(s));
    expect(rows.map((r) => [r.key, r.votes, r.percent, r.isTop])).toEqual([
      ['A', 6, 67, true],
      ['B', 1, 11, false],
      ['C', 0, 0, false],
      ['D', 2, 22, false],
    ]);
    const fresh = reduce(s, { type: 'setupPoll' });
    expect(selectPollResults(fresh).every((r) => r.percent === 0 && !r.isTop)).toBe(true);
    const rate = reduce(fresh, { type: 'setPollType', pollType: 'rate' });
    expect(selectPollResults(rate).map((r) => r.key)).toEqual(['★', '★', '★', '★', '★']);
  });
});

describe('roomStatus', () => {
  it('reads the room’s activity, help and emptiness from data', () => {
    const s = reduce(createRoom(), { type: 'openRooms' });
    const rooms = selectRooms(s);
    const names = selectDisplayNames(s);
    expect(roomStatus(rooms[0], 'live', FIXTURE_NOW, names)).toBe('Bruno and Frederick are talking');
    expect(roomStatus(rooms[1], 'live', FIXTURE_NOW, names)).toBe('Quiet since the rooms opened');
    expect(roomStatus(rooms[2], 'live', FIXTURE_NOW + 4 * MINUTE, names)).toBe('Quiet for 8 min');
    expect(roomStatus(rooms[3], 'live', FIXTURE_NOW, names)).toBe('Drawing on the board');
    expect(roomStatus({ ...rooms[1], members: [] }, 'live', FIXTURE_NOW, names)).toBe('Empty');
    const asked = reduce(s, { type: 'requestHelp', roomIndex: 1 });
    expect(roomStatus(selectRooms(asked)[1], 'live', FIXTURE_NOW + MINUTE, names)).toBe(
      'Asked for help · 1 min',
    );
    expect(roomStatus(rooms[1], 'back', FIXTURE_NOW, names)).toBe('Shared notes saved');
  });

  it('tells two Anas apart in a talking room (B9)', () => {
    let s = createRoom({ participants: 'duplicateNames' });
    for (const id of ['ana', 'ana-ferreira'])
      s = reduce(s, { type: 'moveParticipant', participantId: id, roomIndex: 1 });
    s = reduce(s, { type: 'openRooms' });
    s = reduce(s, {
      type: 'setRoomActivity',
      roomIndex: 1,
      activity: { kind: 'talking', since: FIXTURE_NOW },
    });
    const room = {
      ...selectRooms(s)[1],
      members: selectRooms(s)[1].members.filter((m) => m.name.startsWith('Ana')),
    };
    expect(roomStatus(room, 'live', FIXTURE_NOW, selectDisplayNames(s))).toBe(
      'Ana S. and Ana F. are talking',
    );
  });
});
