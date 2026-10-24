import { describe, expect, it } from 'vitest';
import { CLOSING_SECONDS, MAX_ROOMS, MIN_ROOMS } from './breakouts';
import { createRoom, FIXTURE_NOW } from './fixtures';
import { roomReducer as reduce, type RoomAction } from './reducer';
import {
  selectBreakoutTimeLeft,
  selectClosingLeft,
  selectOpenHelp,
  selectRooms,
  selectRoomsUneven,
  selectTimerLeft,
  selectUnreadTotal,
} from './selectors';
import { MINUTE, SECOND } from './time';
import type { RoomState } from './types';

const run = (state: RoomState, ...actions: RoomAction[]) => actions.reduce(reduce, state);
const find = (s: RoomState, id: string) => s.participants.find((p) => p.id === id)!;
const live = (state = createRoom()) => run(state, { type: 'openRooms' });

describe('tick', () => {
  it('moves the clock forward only', () => {
    const s = createRoom();
    expect(reduce(s, { type: 'tick', now: FIXTURE_NOW - 1 })).toBe(s);
    expect(reduce(s, { type: 'tick', now: FIXTURE_NOW + 1000 }).clock.now).toBe(FIXTURE_NOW + 1000);
  });

  it('closes the rooms when the countdown ends and finishes the timer', () => {
    let s = run(live(), { type: 'closeRooms' }, { type: 'addTimer' }, { type: 'startTimer' });
    s = reduce(s, { type: 'tick', now: FIXTURE_NOW + CLOSING_SECONDS * SECOND });
    expect(s.breakouts.phase).toBe('back');
    s = reduce(s, { type: 'tick', now: FIXTURE_NOW + 301 * SECOND });
    expect(s.timer.phase).toBe('done');
    expect(selectTimerLeft(s)).toBe(0);
  });

  it('brings everyone back when the time is up and auto return is on', () => {
    const s = reduce(live(), { type: 'tick', now: FIXTURE_NOW + 10 * MINUTE });
    expect(s.breakouts.phase).toBe('back');
    const manual = run(createRoom(), { type: 'setBreakoutOption', option: 'autoReturn', value: false }, { type: 'openRooms' });
    expect(reduce(manual, { type: 'tick', now: FIXTURE_NOW + 10 * MINUTE }).breakouts.phase).toBe('live');
  });
});

describe('hands', () => {
  it('raises a hand at the room time and lowers it', () => {
    const s = createRoom();
    const up = reduce(s, { type: 'raiseHand', participantId: 'anton' });
    expect(find(up, 'anton').handRaisedAt).toBe(FIXTURE_NOW);
    expect(reduce(up, { type: 'raiseHand', participantId: 'anton' })).toBe(up);
    const down = reduce(up, { type: 'lowerHand', participantId: 'anton' });
    expect(find(down, 'anton').handRaisedAt).toBeNull();
    expect(reduce(s, { type: 'raiseHand', participantId: 'nobody' })).toBe(s);
  });
});

describe('audio and camera', () => {
  it('mutes a live or speaking person, asks a muted one to unmute', () => {
    const s = createRoom();
    expect(find(reduce(s, { type: 'mute', participantId: 'frederick' }), 'frederick').audio).toBe('muted');
    expect(find(reduce(s, { type: 'mute', participantId: 'helena' }), 'helena').audio).toBe('muted');
    expect(reduce(s, { type: 'mute', participantId: 'bruno' })).toBe(s);
    const asked = reduce(s, { type: 'requestUnmute', participantId: 'bruno' });
    expect(find(asked, 'bruno').unmuteRequested).toBe(true);
    expect(reduce(s, { type: 'requestUnmute', participantId: 'ellen' })).toBe(s);
    const unmuted = reduce(asked, { type: 'setAudio', participantId: 'bruno', audio: 'live' });
    expect(find(unmuted, 'bruno')).toMatchObject({ audio: 'live', unmuteRequested: false });
  });

  it('turns a camera on and off', () => {
    const s = createRoom();
    expect(find(reduce(s, { type: 'setCamera', participantId: 'ana', on: true }), 'ana').camera).toBe(true);
    expect(reduce(s, { type: 'setCamera', participantId: 'ana', on: false })).toBe(s);
  });
});

describe('presenter, flags and removal', () => {
  it('makes exactly one presenter', () => {
    const s = reduce(createRoom(), { type: 'makePresenter', participantId: 'bruno' });
    expect(s.participants.filter((p) => p.isPresenter).map((p) => p.id)).toEqual(['bruno']);
    expect(reduce(s, { type: 'makePresenter', participantId: 'nobody' })).toBe(s);
  });

  it('sets the ⋯ menu flags', () => {
    const s = reduce(createRoom(), { type: 'setParticipantFlag', participantId: 'ana', flag: 'hasWhiteboard', value: true });
    expect(find(s, 'ana').hasWhiteboard).toBe(true);
    expect(reduce(s, { type: 'setParticipantFlag', participantId: 'ana', flag: 'hasWhiteboard', value: true })).toBe(s);
  });

  it('removes a person and everything that pointed at them', () => {
    const s = run(
      createRoom(),
      { type: 'openPeopleMenu', participantId: 'ana' },
      { type: 'startMove', participantId: 'ana' },
      { type: 'moveParticipant', participantId: 'ana', roomIndex: 2 },
      { type: 'openDm', participantId: 'ana' },
    );
    const gone = reduce(s, { type: 'removeParticipant', participantId: 'ana' });
    expect(gone.participants.some((p) => p.id === 'ana')).toBe(false);
    expect(gone.ui.dm).toBeNull();
    expect(gone.breakouts.moves).not.toHaveProperty('ana');
    expect(gone.breakouts.assignments).not.toHaveProperty('ana');
    expect(selectRooms(gone).flatMap((r) => r.members).some((m) => m.id === 'ana')).toBe(false);
    expect(reduce(gone, { type: 'removeParticipant', participantId: 'ana' })).toBe(gone);
  });
});

describe('chat', () => {
  it('sends a public message at the room time, read when it is ours', () => {
    const s = reduce(createRoom(), { type: 'sendMessage', from: 'helena', text: '  Hello  ' });
    const last = s.chat.everyone[s.chat.everyone.length - 1];
    expect(last).toMatchObject({ from: 'helena', text: 'Hello', sentAt: FIXTURE_NOW, read: true });
    expect(reduce(s, { type: 'sendMessage', from: 'helena', text: '   ' })).toBe(s);
  });

  it('counts an incoming message as unread until the panel shows it', () => {
    const s = createRoom();
    const before = selectUnreadTotal(s);
    const incoming = reduce(s, { type: 'sendMessage', from: 'bruno', text: 'Hi' });
    expect(selectUnreadTotal(incoming)).toBe(before + 1);
    const read = reduce(incoming, { type: 'setPanel', panel: 'chat' });
    expect(read.chat.everyone.every((m) => m.read)).toBe(true);
    // The DM from Rafaela is still unread until her thread is open.
    expect(selectUnreadTotal(read)).toBe(1);
    expect(selectUnreadTotal(reduce(read, { type: 'openDm', participantId: 'rafaela' }))).toBe(0);
  });

  it('opens a direct thread from People, creating it when new', () => {
    const s = reduce(createRoom(), { type: 'openDm', participantId: 'frederick' });
    expect(s.ui).toMatchObject({ panel: 'chat', scope: 'direct', dm: 'frederick', sheet: 'chat' });
    expect(s.chat.direct.find((t) => t.with === 'frederick')?.messages).toEqual([]);
    expect(reduce(s, { type: 'openDm', participantId: 'helena' })).toBe(s);
    const back = reduce(s, { type: 'closeDm' });
    expect(back.ui.dm).toBeNull();
    expect(reduce(back, { type: 'closeDm' })).toBe(back);
  });

  it('files a direct message under the other person', () => {
    const s = reduce(createRoom(), { type: 'sendMessage', from: 'helena', to: 'frederick', text: 'Go ahead' });
    expect(s.chat.direct.find((t) => t.with === 'frederick')?.messages[0].text).toBe('Go ahead');
    const reply = reduce(s, { type: 'sendMessage', from: 'frederick', to: 'helena', text: 'Thanks' });
    expect(reply.chat.direct.find((t) => t.with === 'frederick')?.messages).toHaveLength(2);
  });
});

describe('panel, scope and pickers', () => {
  it('sets and toggles the panel', () => {
    const s = createRoom();
    expect(reduce(s, { type: 'setPanel', panel: 'people' }).ui.panel).toBe('people');
    const toggled = reduce(s, { type: 'togglePanel', panel: 'people' });
    expect(toggled.ui.panel).toBe('people');
    expect(reduce(toggled, { type: 'togglePanel', panel: 'people' }).ui.panel).toBe('none');
  });

  it('switches scope, closing any open thread', () => {
    const s = run(createRoom(), { type: 'openDm', participantId: 'bruno' }, { type: 'setScope', scope: 'everyone' });
    expect(s.ui).toMatchObject({ scope: 'everyone', dm: null });
  });

  it('filters People and opens the panel with it', () => {
    const s = reduce(createRoom(), { type: 'setPeopleFilter', filter: 'low' });
    expect(s.ui).toMatchObject({ peopleFilter: 'low', panel: 'people' });
    expect(reduce(s, { type: 'openPeopleMenu', participantId: 'anton' }).ui.peopleMenu).toBe('anton');
  });

  it('keeps one popover open at a time', () => {
    const plugins = reduce(createRoom(), { type: 'setPlugins', open: true });
    expect(plugins.plugins.open).toBe(true);
    const media = reduce(plugins, { type: 'setMediaPicker', open: true, mediaType: 'screen' });
    expect(media.plugins.open).toBe(false);
    expect(media.ui).toMatchObject({ mediaOpen: true, mediaType: 'screen' });
    expect(reduce(media, { type: 'setPlugins', open: true }).ui.mediaOpen).toBe(false);
    expect(reduce(media, { type: 'setMediaType', mediaType: 'url' }).ui.mediaType).toBe('url');
    expect(reduce(media, { type: 'setAnalyticsTip', shown: true }).ui.analyticsTipShown).toBe(true);
  });
});

describe('presentation', () => {
  it('moves between slides inside the deck', () => {
    const s = createRoom();
    expect(reduce(s, { type: 'nextSlide' }).presentation.slideIndex).toBe(3);
    expect(reduce(s, { type: 'prevSlide' }).presentation.slideIndex).toBe(1);
    expect(reduce(s, { type: 'goToSlide', index: 99 }).presentation.slideIndex).toBe(11);
    expect(reduce(s, { type: 'goToSlide', index: -5 }).presentation.slideIndex).toBe(0);
    expect(reduce(s, { type: 'goToSlide', index: 2 })).toBe(s);
    const open = reduce(s, { type: 'setOverview', open: true });
    expect(reduce(open, { type: 'goToSlide', index: 0 }).presentation.overviewOpen).toBe(false);
  });

  it('shares a screen and switches the stage between it and the deck', () => {
    const s = reduce(createRoom(), { type: 'startScreenShare', screenKind: 'A window' });
    expect(s.presentation).toMatchObject({ share: 'screen', screenShared: true, screenKind: 'A window' });
    const deck = reduce(s, { type: 'setShare', share: 'deck' });
    expect(deck.presentation).toMatchObject({ share: 'deck', screenShared: true });
    expect(reduce(deck, { type: 'stopShare' }).presentation).toMatchObject({ share: 'none', screenShared: false });
    expect(reduce(s, { type: 'setPresentationMinimized', minimized: true }).presentation.minimized).toBe(true);
    expect(reduce(s, { type: 'setTool', tool: 'eraser' }).presentation.tool).toBe('eraser');
  });
});

describe('poll', () => {
  it('runs setup → live → ended and counts answers', () => {
    const setup = reduce(createRoom(), { type: 'setupPoll' });
    expect(setup.poll.phase).toBe('setup');
    expect(setup.ui.panel).toBe('poll');
    expect(setup.poll.votes).toEqual([0, 0, 0, 0]);
    expect(reduce(setup, { type: 'showPollResults', shown: true })).toBe(setup);
    const liveP = reduce(setup, { type: 'startPoll' });
    const answered = run(liveP, { type: 'answerPoll', option: 1 }, { type: 'answerPoll', option: 9 });
    expect(answered.poll.votes).toEqual([0, 1, 0, 0]);
    const shown = reduce(answered, { type: 'showPollResults', shown: true });
    expect(shown.poll.shown).toBe(true);
    const ended = reduce(shown, { type: 'endPoll' });
    expect(ended.poll.phase).toBe('ended');
    expect(reduce(ended, { type: 'answerPoll', option: 0 })).toBe(ended);
    expect(reduce(ended, { type: 'closePoll' }).poll.phase).toBe('off');
  });
});

describe('timer', () => {
  it('starts, pauses, resets and adds a minute', () => {
    const ready = reduce(createRoom(), { type: 'addTimer' });
    expect(ready.timer).toMatchObject({ phase: 'ready', leftSec: 300 });
    const running = reduce(ready, { type: 'startTimer' });
    expect(running.timer.endsAt).toBe(FIXTURE_NOW + 300 * SECOND);
    const later = reduce(running, { type: 'tick', now: FIXTURE_NOW + 100 * SECOND });
    expect(selectTimerLeft(later)).toBe(200);
    const paused = reduce(later, { type: 'pauseTimer' });
    expect(paused.timer).toMatchObject({ phase: 'paused', leftSec: 200, endsAt: null });
    expect(reduce(paused, { type: 'pauseTimer' })).toBe(paused);
    expect(reduce(paused, { type: 'addTimerMinute' }).timer.leftSec).toBe(260);
    expect(reduce(later, { type: 'addTimerMinute' }).timer.endsAt).toBe(FIXTURE_NOW + 360 * SECOND);
    expect(reduce(paused, { type: 'resetTimer' }).timer.leftSec).toBe(300);
    expect(reduce(paused, { type: 'setTimerDuration', durationSec: 60 }).timer).toMatchObject({ durationSec: 60, leftSec: 60 });
    expect(reduce(paused, { type: 'setTimerMinimized', minimized: true }).timer.minimized).toBe(true);
    expect(reduce(paused, { type: 'removeTimer' }).timer.phase).toBe('off');
  });

  it('restarts from the full duration after it is done', () => {
    const done = run(createRoom(), { type: 'addTimer' }, { type: 'startTimer' }, { type: 'tick', now: FIXTURE_NOW + 400 * SECOND });
    expect(done.timer.phase).toBe('done');
    expect(reduce(done, { type: 'startTimer' }).timer.leftSec).toBe(300);
    expect(reduce(done, { type: 'addTimerMinute' }).timer).toMatchObject({ phase: 'running', leftSec: 60 });
  });
});

describe('breakout setup', () => {
  it('opens the breakout surface from Plugins', () => {
    const s = run(createRoom(), { type: 'setPlugins', open: true }, { type: 'setBreakoutsOpen', open: true });
    expect(s.ui.breakoutsOpen).toBe(true);
    expect(s.plugins.open).toBe(false);
  });

  it('changes mode, assignment, duration and options', () => {
    const s = run(
      createRoom(),
      { type: 'setBreakoutMode', mode: 'solo' },
      { type: 'setBreakoutAssignment', assignment: 'choose' },
      { type: 'setBreakoutDuration', durationMin: 15 },
      { type: 'setBreakoutOption', option: 'record', value: true },
    );
    expect(s.breakouts).toMatchObject({ mode: 'solo', assignment: 'choose', durationMin: 15 });
    expect(s.breakouts.options.record).toBe(true);
    expect(selectRooms(s)).toHaveLength(13);
  });

  it('clamps the room count to 2..50 and keeps manual moves (B4, B6)', () => {
    const s = reduce(createRoom(), { type: 'moveParticipant', participantId: 'ana', roomIndex: 1 });
    const five = reduce(s, { type: 'setRoomCount', roomCount: 5 });
    expect(five.breakouts.roomCount).toBe(5);
    expect(selectRooms(five)[1].members.map((m) => m.id)).toContain('ana');
    expect(reduce(s, { type: 'setRoomCount', roomCount: 0 }).breakouts.roomCount).toBe(MIN_ROOMS);
    const fifty = reduce(s, { type: 'setRoomCount', roomCount: 500 });
    expect(fifty.breakouts.roomCount).toBe(MAX_ROOMS);
    expect(selectRooms(fifty)).toHaveLength(MAX_ROOMS);
    expect(reduce(s, { type: 'setRoomCount', roomCount: 4 })).toBe(s);
  });

  it('drops a move into a room that no longer exists', () => {
    const s = run(
      createRoom(),
      { type: 'moveParticipant', participantId: 'ana', roomIndex: 3 },
      { type: 'setRoomCount', roomCount: 2 },
    );
    expect(s.breakouts.moves).toEqual({});
    expect(selectRooms(s)).toHaveLength(2);
  });

  it('shuffles with a new seed and keeps manual moves (B4)', () => {
    const s = reduce(createRoom(), { type: 'moveParticipant', participantId: 'ana', roomIndex: 3 });
    const shuffled = reduce(s, { type: 'shuffleRooms' });
    expect(shuffled.breakouts.seed).toBe(2);
    expect(shuffled.breakouts.assignments).not.toEqual(s.breakouts.assignments);
    expect(shuffled.breakouts.moves).toEqual({ ana: 3 });
    expect(selectRooms(shuffled)[3].members.map((m) => m.id)).toContain('ana');
  });

  it('evens out around manual moves instead of resetting them (B4)', () => {
    const uneven = run(
      createRoom(),
      { type: 'moveParticipant', participantId: 'bruno', roomIndex: 0 },
      { type: 'moveParticipant', participantId: 'rafaela', roomIndex: 0 },
      { type: 'moveParticipant', participantId: 'cibelle', roomIndex: 0 },
    );
    expect(selectRoomsUneven(uneven)).toBe(true);
    const even = reduce(uneven, { type: 'evenOutRooms' });
    expect(selectRoomsUneven(even)).toBe(false);
    expect(even.breakouts.moves).toEqual({ bruno: 0, rafaela: 0, cibelle: 0 });
    const roomOne = selectRooms(even)[0].members.map((m) => m.id);
    expect(roomOne).toEqual(expect.arrayContaining(['bruno', 'rafaela', 'cibelle']));
    expect(selectRooms(even).map((r) => r.members.length)).toEqual([4, 3, 3, 3]);
  });

  it('starts, cancels and completes a move (BO3)', () => {
    const s = createRoom();
    const moving = reduce(s, { type: 'startMove', participantId: 'ana' });
    expect(moving.breakouts.moving).toBe('ana');
    expect(reduce(moving, { type: 'cancelMove' }).breakouts.moving).toBeNull();
    expect(reduce(s, { type: 'cancelMove' })).toBe(s);
    expect(reduce(s, { type: 'startMove', participantId: 'helena' })).toBe(s);
    const moved = reduce(moving, { type: 'moveParticipant', participantId: 'ana', roomIndex: 2 });
    expect(moved.breakouts).toMatchObject({ moving: null, moves: { ana: 2 } });
    expect(reduce(s, { type: 'moveParticipant', participantId: 'ana', roomIndex: 9 })).toBe(s);
    expect(reduce(s, { type: 'moveParticipant', participantId: 'helena', roomIndex: 1 })).toBe(s);
    const solo = reduce(s, { type: 'setBreakoutMode', mode: 'solo' });
    expect(reduce(solo, { type: 'startMove', participantId: 'ana' })).toBe(solo);
  });

  it('can empty a room without crashing anything that reads it (B1)', () => {
    let s = createRoom({ participants: 'four' });
    const rooms = selectRooms(s);
    for (const m of rooms[0].members) s = reduce(s, { type: 'moveParticipant', participantId: m.id, roomIndex: 1 });
    expect(selectRooms(s)[0].members).toEqual([]);
    s = run(s, { type: 'openRooms' }, { type: 'peekRoom', roomIndex: 0 });
    expect(s.breakouts.peek).toBe(0);
    expect(selectRooms(s)[0].name).toBe('Room 1');
  });
});

describe('breakouts live', () => {
  it('opens rooms at the room time and resets the live state', () => {
    const s = live();
    expect(s.breakouts).toMatchObject({ phase: 'live', openedAt: FIXTURE_NOW, extraMin: 0, view: 'rooms' });
    expect(selectBreakoutTimeLeft(s)).toBe(600);
    expect(reduce(s, { type: 'openRooms' })).toBe(s);
    expect(selectBreakoutTimeLeft(reduce(s, { type: 'addRoomTime' }))).toBe(900);
    expect(reduce(createRoom(), { type: 'addRoomTime' }).breakouts.extraMin).toBe(0);
  });

  it('previews a room and switches views', () => {
    const s = live();
    expect(reduce(s, { type: 'peekRoom', roomIndex: 2 }).breakouts.peek).toBe(2);
    expect(reduce(s, { type: 'peekRoom', roomIndex: 9 })).toBe(s);
    const peeked = run(s, { type: 'peekRoom', roomIndex: 1 }, { type: 'setListening', listening: true });
    expect(reduce(peeked, { type: 'peekRoom', roomIndex: null }).breakouts).toMatchObject({ peek: null, listening: false });
    expect(reduce(peeked, { type: 'setBreakoutView', view: 'main' }).breakouts).toMatchObject({ view: 'main', peek: null });
  });

  it('closes rooms with a countdown that can be kept open or cut short (B5)', () => {
    const closing = reduce(live(), { type: 'closeRooms' });
    expect(selectClosingLeft(closing)).toBe(CLOSING_SECONDS);
    expect(reduce(closing, { type: 'closeRooms' })).toBe(closing);
    const kept = reduce(closing, { type: 'keepRoomsOpen' });
    expect(kept.breakouts).toMatchObject({ phase: 'live', closingEndsAt: null });
    expect(reduce(kept, { type: 'keepRoomsOpen' })).toBe(kept);
    const back = reduce(closing, { type: 'bringEveryoneBack' });
    expect(back.breakouts).toMatchObject({ phase: 'back', view: 'main', closingEndsAt: null });
    const setup = createRoom();
    expect(reduce(setup, { type: 'closeRooms' })).toBe(setup);
  });

  it('shows a room on stage after the rooms closed, and sets up new ones', () => {
    const back = run(live(), { type: 'bringEveryoneBack' });
    const open = live();
    expect(reduce(open, { type: 'showRoomOnStage', roomIndex: 1 })).toBe(open);
    const staged = reduce(back, { type: 'showRoomOnStage', roomIndex: 1 });
    expect(staged.breakouts.onStage).toBe(1);
    expect(reduce(staged, { type: 'showRoomOnStage', roomIndex: null }).breakouts.onStage).toBeNull();
    const fresh = reduce(staged, { type: 'setUpNewRooms' });
    expect(fresh.breakouts).toMatchObject({ phase: 'setup', openedAt: null, onStage: null, helpQueue: [] });
  });

  it('queues, acknowledges and clears help requests from data (B3)', () => {
    const s = run(
      live(),
      { type: 'requestHelp', roomIndex: 2 },
      { type: 'tick', now: FIXTURE_NOW + MINUTE },
      { type: 'requestHelp', roomIndex: 0, from: 'bruno' },
    );
    expect(selectOpenHelp(s).map((h) => h.roomIndex)).toEqual([2, 0]);
    expect(selectRooms(s)[2].help?.roomIndex).toBe(2);
    const [first] = selectOpenHelp(s);
    const acknowledged = reduce(s, { type: 'acknowledgeHelp', id: first.id });
    expect(selectOpenHelp(acknowledged).map((h) => h.roomIndex)).toEqual([0]);
    expect(acknowledged.breakouts.helpQueue.find((h) => h.id === first.id)?.acknowledgedAt).toBe(FIXTURE_NOW + MINUTE);
    const cleared = reduce(acknowledged, { type: 'clearHelp', id: first.id });
    expect(cleared.breakouts.helpQueue).toHaveLength(1);
    const setup = createRoom();
    expect(reduce(setup, { type: 'requestHelp', roomIndex: 1 })).toBe(setup);
  });

  it('acknowledges every open request when the rooms close', () => {
    const s = run(live(), { type: 'requestHelp', roomIndex: 1 }, { type: 'bringEveryoneBack' });
    expect(selectOpenHelp(s)).toEqual([]);
  });

  it('records what a room is doing', () => {
    const s = reduce(live(), { type: 'setRoomActivity', roomIndex: 1, activity: { kind: 'drawing', since: FIXTURE_NOW } });
    expect(selectRooms(s)[1].activity?.kind).toBe('drawing');
    expect(reduce(s, { type: 'setRoomActivity', roomIndex: 1, activity: null }).breakouts.activity).not.toHaveProperty('1');
  });
});

describe('mobile', () => {
  it('opens sheets, sets orientation and annotation', () => {
    const s = run(
      createRoom(),
      { type: 'setOrientation', orientation: 'landscape' },
      { type: 'setSheet', sheet: 'student', student: 'anton' },
    );
    expect(s.ui).toMatchObject({ orientation: 'landscape', sheet: 'student', sheetStudent: 'anton' });
    const people = reduce(s, { type: 'setSheet', sheet: 'people' });
    expect(people.ui).toMatchObject({ sheet: 'people', sheetStudent: null, panel: 'people' });
    expect(reduce(s, { type: 'setAnnotating', annotating: true }).ui.annotating).toBe(true);
    expect(reduce(s, { type: 'setReacting', reacting: true }).ui).toMatchObject({ reacting: true, sheet: 'react' });
  });
});
