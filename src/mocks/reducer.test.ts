import { describe, expect, it } from 'vitest';
import { CLOSING_SECONDS, MAX_ROOMS, MIN_ROOMS } from './breakouts';
import { createRoom, FIXTURE_NOW } from './fixtures';
import { REACTION_LIFETIME } from './reactions';
import { canMessagePrivately, roomReducer as reduce, type RoomAction } from './reducer';
import {
  selectBreakoutTimeLeft,
  selectCanMessage,
  selectClosingLeft,
  selectJoinedRoom,
  selectOpenHelp,
  selectReactions,
  selectRoomMessages,
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
    const manual = run(
      createRoom(),
      { type: 'setBreakoutOption', option: 'autoReturn', value: false },
      { type: 'openRooms' },
    );
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
  it('mutes a live or speaking person, asks a muted one to unmute, and cancels the request', () => {
    const s = createRoom();
    expect(find(reduce(s, { type: 'mute', participantId: 'frederick' }), 'frederick').audio).toBe('muted');
    expect(find(reduce(s, { type: 'mute', participantId: 'helena' }), 'helena').audio).toBe('muted');
    expect(reduce(s, { type: 'mute', participantId: 'bruno' })).toBe(s);
    const asked = reduce(s, { type: 'requestUnmute', participantId: 'bruno' });
    expect(find(asked, 'bruno').unmuteRequested).toBe(true);
    expect(reduce(s, { type: 'requestUnmute', participantId: 'ellen' })).toBe(s);
    const unmuted = reduce(asked, { type: 'setAudio', participantId: 'bruno', audio: 'live' });
    expect(find(unmuted, 'bruno')).toMatchObject({ audio: 'live', unmuteRequested: false });
    const cancelled = reduce(asked, { type: 'cancelUnmuteRequest', participantId: 'bruno' });
    expect(find(cancelled, 'bruno')).toMatchObject({ audio: 'muted', unmuteRequested: false });
    expect(reduce(s, { type: 'cancelUnmuteRequest', participantId: 'bruno' })).toBe(s);
  });

  it('joins audio muted (owner decision), from not joined or listening only', () => {
    const s = createRoom();
    expect(find(reduce(s, { type: 'joinAudio', participantId: 'timo' }), 'timo').audio).toBe('muted');
    expect(find(reduce(s, { type: 'joinAudio', participantId: 'ellen' }), 'ellen').audio).toBe('muted');
    expect(reduce(s, { type: 'joinAudio', participantId: 'helena' })).toBe(s);
    expect(reduce(s, { type: 'joinAudio', participantId: 'bruno' })).toBe(s);
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
    const s = reduce(createRoom(), {
      type: 'setParticipantFlag',
      participantId: 'ana',
      flag: 'hasWhiteboard',
      value: true,
    });
    expect(find(s, 'ana').hasWhiteboard).toBe(true);
    expect(
      reduce(s, { type: 'setParticipantFlag', participantId: 'ana', flag: 'hasWhiteboard', value: true }),
    ).toBe(s);
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
    expect(gone.ui.peopleMenu).toBeNull();
    expect(gone.chat.direct.some((t) => t.with === 'ana')).toBe(false);
    expect(gone.breakouts.moves).not.toHaveProperty('ana');
    expect(gone.breakouts.assignments).not.toHaveProperty('ana');
    expect(gone.breakouts.moving).toBeNull();
    expect(
      selectRooms(gone)
        .flatMap((r) => r.members)
        .some((m) => m.id === 'ana'),
    ).toBe(false);
    expect(reduce(gone, { type: 'removeParticipant', participantId: 'ana' })).toBe(gone);
  });

  it('leaves nothing pointing at a removed person: thread, alerts, help, sheet and the presenter role (S2)', () => {
    const s = run(
      createRoom(),
      { type: 'makePresenter', participantId: 'rafaela' },
      { type: 'setSheet', sheet: 'student', student: 'rafaela' },
      { type: 'openRooms' },
      { type: 'requestHelp', roomIndex: 1, from: 'rafaela' },
    );
    expect(s.chat.direct.some((t) => t.with === 'rafaela')).toBe(true);
    expect(s.alerts.some((a) => a.from === 'rafaela')).toBe(true);
    const gone = reduce(s, { type: 'removeParticipant', participantId: 'rafaela' });
    expect(gone.chat.direct.some((t) => t.with === 'rafaela')).toBe(false);
    expect(gone.alerts.some((a) => a.from === 'rafaela')).toBe(false);
    expect(gone.breakouts.helpQueue).toHaveLength(1);
    expect(gone.breakouts.helpQueue[0].from).toBeNull();
    expect(gone.ui).toMatchObject({ sheet: 'none', sheetStudent: null });
    expect(gone.participants.filter((p) => p.isPresenter).map((p) => p.id)).toEqual(['helena']);
    // Her public message stays; the chat names her "Someone who left".
    expect(gone.chat.everyone.some((m) => m.from === 'rafaela')).toBe(true);
  });
});

describe('chat', () => {
  it('sends a public message at the room time, read when it is ours', () => {
    const s = reduce(createRoom(), { type: 'sendMessage', from: 'helena', text: '  Hello  ' });
    const last = s.chat.everyone[s.chat.everyone.length - 1];
    expect(last).toMatchObject({ from: 'helena', text: 'Hello', sentAt: FIXTURE_NOW, read: true });
    expect(reduce(s, { type: 'sendMessage', from: 'helena', text: '   ' })).toBe(s);
  });

  it('numbers messages from a counter in the state, so the reducer is pure', () => {
    const a = run(
      createRoom(),
      { type: 'sendMessage', from: 'bruno', text: 'One' },
      { type: 'sendMessage', from: 'helena', to: 'bruno', text: 'Two' },
    );
    expect(a.chat.everyone.at(-1)?.id).toBe('m-1');
    expect(a.chat.direct.find((t) => t.with === 'bruno')?.messages.at(-1)?.id).toBe('m-2');
    expect(a.chat.seq).toBe(2);
    // The same state and action give the same id every time.
    const b = reduce(createRoom(), { type: 'sendMessage', from: 'bruno', text: 'One' });
    expect(b.chat.everyone.at(-1)?.id).toBe('m-1');
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
    const s = reduce(createRoom(), {
      type: 'sendMessage',
      from: 'helena',
      to: 'frederick',
      text: 'Go ahead',
    });
    expect(s.chat.direct.find((t) => t.with === 'frederick')?.messages[0].text).toBe('Go ahead');
    const reply = reduce(s, { type: 'sendMessage', from: 'frederick', to: 'helena', text: 'Thanks' });
    expect(reply.chat.direct.find((t) => t.with === 'frederick')?.messages).toHaveLength(2);
  });
});

describe('panel, scope and pickers', () => {
  it('sets and toggles the panel, keeping the open thread for when Chat comes back', () => {
    const s = createRoom();
    expect(reduce(s, { type: 'setPanel', panel: 'people' }).ui.panel).toBe('people');
    const toggled = reduce(s, { type: 'togglePanel', panel: 'people' });
    expect(toggled.ui.panel).toBe('people');
    expect(reduce(toggled, { type: 'togglePanel', panel: 'people' }).ui.panel).toBe('none');
    const thread = run(s, { type: 'openDm', participantId: 'bruno' }, { type: 'setPanel', panel: 'people' });
    expect(thread.ui).toMatchObject({ panel: 'people', dm: 'bruno' });
  });

  it('switches scope, closing any open thread', () => {
    const s = run(
      createRoom(),
      { type: 'openDm', participantId: 'bruno' },
      { type: 'setScope', scope: 'everyone' },
    );
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
    expect(reduce(deck, { type: 'stopShare' }).presentation).toMatchObject({
      share: 'none',
      screenShared: false,
    });
    expect(reduce(s, { type: 'setPresentationMinimized', minimized: true }).presentation.minimized).toBe(
      true,
    );
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

  it('edits the question, answers and settings while in setup, within the bounds, and never live', () => {
    const setup = reduce(createRoom(), { type: 'setupPoll' });
    const asked = reduce(setup, { type: 'setPollQuestion', question: 'Ready for the quiz?' });
    expect(asked.poll.question).toBe('Ready for the quiz?');
    expect(reduce(asked, { type: 'setPollQuestion', question: 'Ready for the quiz?' })).toBe(asked);
    const five = run(setup, { type: 'addPollOption' }, { type: 'addPollOption' });
    expect(five.poll.options).toHaveLength(5);
    expect(five.poll.votes).toHaveLength(5);
    expect(reduce(five, { type: 'addPollOption' })).toBe(five);
    const named = reduce(five, { type: 'setPollOption', index: 4, label: 'Something else' });
    expect(named.poll.options[4]).toBe('Something else');
    expect(reduce(named, { type: 'setPollOption', index: 9, label: 'x' })).toBe(named);
    const two = run(
      named,
      { type: 'removePollOption', index: 4 },
      { type: 'removePollOption', index: 3 },
      { type: 'removePollOption', index: 2 },
    );
    expect(two.poll.options).toEqual(['Grey icons for muted', 'A red badge on everyone']);
    expect(reduce(two, { type: 'removePollOption', index: 0 })).toBe(two);
    // A blank answer cannot be asked.
    const blank = reduce(two, { type: 'setPollOption', index: 1, label: ' ' });
    expect(reduce(blank, { type: 'startPoll' })).toBe(blank);
    expect(reduce(two, { type: 'startPoll' }).poll.phase).toBe('live');
    // The fixed types replace the answers and cannot be edited; back to choice restores the defaults.
    const yesno = reduce(two, { type: 'setPollType', pollType: 'yesno' });
    expect(yesno.poll.options).toEqual(['Yes', 'No']);
    expect(reduce(yesno, { type: 'addPollOption' })).toBe(yesno);
    expect(reduce(yesno, { type: 'setPollOption', index: 0, label: 'Yep' })).toBe(yesno);
    expect(reduce(yesno, { type: 'setPollType', pollType: 'rate' }).poll.options).toHaveLength(5);
    expect(reduce(yesno, { type: 'setPollType', pollType: 'choice' }).poll.options).toHaveLength(4);
    const open = reduce(setup, { type: 'setPollSetting', setting: 'anonymous', value: false });
    expect(open.poll.anonymous).toBe(false);
    expect(reduce(open, { type: 'setPollSetting', setting: 'anonymous', value: false })).toBe(open);
    const liveP = reduce(setup, { type: 'startPoll' });
    expect(reduce(liveP, { type: 'setPollQuestion', question: 'Later' })).toBe(liveP);
    expect(reduce(liveP, { type: 'addPollOption' })).toBe(liveP);
    expect(reduce(liveP, { type: 'setPollSetting', setting: 'liveResults', value: true })).toBe(liveP);
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
    expect(reduce(paused, { type: 'setTimerDuration', durationSec: 60 }).timer).toMatchObject({
      durationSec: 60,
      leftSec: 60,
    });
    expect(reduce(paused, { type: 'setTimerMinimized', minimized: true }).timer.minimized).toBe(true);
    expect(reduce(paused, { type: 'setTimerCorner', corner: 'bottomLeft' }).timer.corner).toBe('bottomLeft');
    expect(reduce(paused, { type: 'setTimerCorner', corner: 'topRight' })).toBe(paused);
    expect(reduce(paused, { type: 'removeTimer' }).timer.phase).toBe('off');
  });

  it('restarts from the full duration after it is done', () => {
    const done = run(
      createRoom(),
      { type: 'addTimer' },
      { type: 'startTimer' },
      { type: 'tick', now: FIXTURE_NOW + 400 * SECOND },
    );
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

  it('ignores the setup actions once the rooms are open or closed (S3)', () => {
    const open = live(run(createRoom(), { type: 'moveParticipant', participantId: 'ana', roomIndex: 1 }));
    expect(reduce(open, { type: 'setBreakoutMode', mode: 'solo' })).toBe(open);
    expect(reduce(open, { type: 'setRoomCount', roomCount: 6 })).toBe(open);
    expect(reduce(open, { type: 'shuffleRooms' })).toBe(open);
    expect(reduce(open, { type: 'evenOutRooms' })).toBe(open);
    const back = reduce(open, { type: 'bringEveryoneBack' });
    expect(reduce(back, { type: 'setRoomCount', roomCount: 6 })).toBe(back);
    // Set up new rooms, and they work again.
    const fresh = reduce(back, { type: 'setUpNewRooms' });
    expect(reduce(fresh, { type: 'setRoomCount', roomCount: 6 }).breakouts.roomCount).toBe(6);
  });

  it('can empty a room without crashing anything that reads it (B1)', () => {
    let s = createRoom({ participants: 'four' });
    const rooms = selectRooms(s);
    for (const m of rooms[0].members)
      s = reduce(s, { type: 'moveParticipant', participantId: m.id, roomIndex: 1 });
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
    expect(reduce(peeked, { type: 'peekRoom', roomIndex: null }).breakouts).toMatchObject({
      peek: null,
      listening: false,
    });
    expect(reduce(peeked, { type: 'setBreakoutView', view: 'main' }).breakouts).toMatchObject({
      view: 'main',
      peek: null,
    });
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
    expect(acknowledged.breakouts.helpQueue.find((h) => h.id === first.id)?.acknowledgedAt).toBe(
      FIXTURE_NOW + MINUTE,
    );
    const cleared = reduce(acknowledged, { type: 'clearHelp', id: first.id });
    expect(cleared.breakouts.helpQueue).toHaveLength(1);
    const setup = createRoom();
    expect(reduce(setup, { type: 'requestHelp', roomIndex: 1 })).toBe(setup);
  });

  it('joins a room from a preview and leaves it; closing the rooms brings the teacher back (B8)', () => {
    const s = run(live(), { type: 'peekRoom', roomIndex: 1 }, { type: 'setListening', listening: true });
    const joined = reduce(s, { type: 'joinRoom', roomIndex: 1 });
    expect(joined.breakouts).toMatchObject({ joined: 1, peek: null, listening: false });
    expect(selectJoinedRoom(joined)?.name).toBe('Room 2');
    expect(reduce(s, { type: 'joinRoom', roomIndex: 7 })).toBe(s);
    expect(reduce(joined, { type: 'leaveRoom' }).breakouts.joined).toBeNull();
    expect(reduce(s, { type: 'leaveRoom' })).toBe(s);
    expect(reduce(joined, { type: 'bringEveryoneBack' }).breakouts.joined).toBeNull();
    const setup = createRoom();
    expect(reduce(setup, { type: 'joinRoom', roomIndex: 0 })).toBe(setup);
  });

  it('keeps room chat as data, per room or to every room (B8), and clears it for new rooms', () => {
    const s = run(
      live(),
      { type: 'sendRoomMessage', roomIndex: 1, from: 'bruno', text: ' Stuck on question 2 ' },
      { type: 'sendRoomMessage', roomIndex: null, from: 'helena', text: '5 minutes left' },
      { type: 'sendRoomMessage', roomIndex: 0, from: 'ana', text: 'Done here' },
    );
    expect(s.breakouts.messages.map((m) => [m.id, m.roomIndex, m.text])).toEqual([
      ['rm-1', 1, 'Stuck on question 2'],
      ['rm-2', null, '5 minutes left'],
      ['rm-3', 0, 'Done here'],
    ]);
    expect(selectRoomMessages(1)(s).map((m) => m.id)).toEqual(['rm-1', 'rm-2']);
    expect(selectRoomMessages(2)(s).map((m) => m.id)).toEqual(['rm-2']);
    expect(reduce(s, { type: 'sendRoomMessage', roomIndex: 1, from: 'bruno', text: '   ' })).toBe(s);
    expect(reduce(s, { type: 'sendRoomMessage', roomIndex: 9, from: 'bruno', text: 'x' })).toBe(s);
    expect(reduce(s, { type: 'sendRoomMessage', roomIndex: 1, from: 'nobody', text: 'x' })).toBe(s);
    const setup = createRoom();
    expect(reduce(setup, { type: 'sendRoomMessage', roomIndex: 0, from: 'bruno', text: 'x' })).toBe(setup);
    const fresh = run(s, { type: 'bringEveryoneBack' }, { type: 'setUpNewRooms' }, { type: 'openRooms' });
    expect(fresh.breakouts.messages).toEqual([]);
    expect(fresh.breakouts.messageSeq).toBe(3);
  });

  it('numbers help requests from the state and refuses a room that does not exist (S3)', () => {
    const s = live();
    expect(reduce(s, { type: 'requestHelp', roomIndex: 4 })).toBe(s);
    expect(reduce(s, { type: 'requestHelp', roomIndex: -1 })).toBe(s);
    expect(reduce(s, { type: 'requestHelp', roomIndex: 1.5 })).toBe(s);
    const asked = run(s, { type: 'requestHelp', roomIndex: 0 }, { type: 'requestHelp', roomIndex: 3 });
    expect(asked.breakouts.helpQueue.map((h) => h.id)).toEqual(['help-1', 'help-2']);
    expect(asked.breakouts.helpSeq).toBe(2);
    const solo = live(
      reduce(createRoom({ participants: 'four' }), { type: 'setBreakoutMode', mode: 'solo' }),
    );
    expect(reduce(solo, { type: 'requestHelp', roomIndex: 2 }).breakouts.helpQueue).toHaveLength(1);
    expect(reduce(solo, { type: 'requestHelp', roomIndex: 3 })).toBe(solo);
  });

  it('acknowledges every open request when the rooms close', () => {
    const s = run(live(), { type: 'requestHelp', roomIndex: 1 }, { type: 'bringEveryoneBack' });
    expect(selectOpenHelp(s)).toEqual([]);
  });

  it('records what a room is doing', () => {
    const s = reduce(live(), {
      type: 'setRoomActivity',
      roomIndex: 1,
      activity: { kind: 'drawing', since: FIXTURE_NOW },
    });
    expect(selectRooms(s)[1].activity?.kind).toBe('drawing');
    expect(
      reduce(s, { type: 'setRoomActivity', roomIndex: 1, activity: null }).breakouts.activity,
    ).not.toHaveProperty('1');
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
    expect(reduce(s, { type: 'setReacting', reacting: true }).ui).toMatchObject({
      reacting: true,
      sheet: 'react',
    });
  });
});

describe('private chat (owner decision 2026-10-30)', () => {
  /** The same room seen by a student: Anton is the local person, Helena a moderator. */
  const asStudent = (state = createRoom()): RoomState => ({
    ...state,
    participants: state.participants.map((p) => ({ ...p, isSelf: p.id === 'anton' })),
  });
  const off = (state: RoomState) => reduce(state, { type: 'setPrivateChat', on: false });

  it('is on by default and the switch flips it without touching anything else', () => {
    const s = createRoom();
    expect(s.session.privateChat).toBe(true);
    expect(reduce(s, { type: 'setPrivateChat', on: true })).toBe(s);
    const s2 = off(s);
    expect(s2.session.privateChat).toBe(false);
    expect(s2.chat).toBe(s.chat);
    expect(reduce(s2, { type: 'setPrivateChat', on: true }).session.privateChat).toBe(true);
  });

  it('off: a student can neither open nor write a private thread to another student', () => {
    const s = off(asStudent());
    expect(canMessagePrivately(s, 'anton', 'bruno')).toBe(false);
    expect(reduce(s, { type: 'openDm', participantId: 'bruno' })).toBe(s);
    expect(reduce(s, { type: 'sendMessage', from: 'anton', text: 'psst', to: 'bruno' })).toBe(s);
    expect(selectCanMessage('bruno')(s)).toBe(false);
    expect(selectCanMessage('helena')(s)).toBe(true);
  });

  it('off: teacher-to-student messages keep working, and the student can reply', () => {
    const s = off(createRoom());
    expect(canMessagePrivately(s, 'helena', 'anton')).toBe(true);
    const opened = reduce(s, { type: 'openDm', participantId: 'anton' });
    expect(opened.ui.dm).toBe('anton');
    const sent = reduce(opened, { type: 'sendMessage', from: 'helena', text: 'All good?', to: 'anton' });
    expect(sent.chat.direct.find((t) => t.with === 'anton')?.messages.map((m) => m.text)).toEqual([
      'All good?',
    ]);
    const reply = reduce(sent, { type: 'sendMessage', from: 'anton', text: 'Yes', to: 'helena' });
    expect(reply.chat.direct.find((t) => t.with === 'anton')?.messages).toHaveLength(2);
    expect(selectCanMessage('anton')(s)).toBe(true);
  });

  it('on: students can message each other', () => {
    const s = asStudent();
    expect(canMessagePrivately(s, 'anton', 'bruno')).toBe(true);
    expect(reduce(s, { type: 'openDm', participantId: 'bruno' }).ui.dm).toBe('bruno');
    expect(selectCanMessage('bruno')(s)).toBe(true);
    expect(selectCanMessage('anton')(s)).toBe(false);
  });
});

describe('reactions (D5)', () => {
  it('records a reaction at the room time and shows it on the sender for its lifetime', () => {
    const s = reduce(createRoom(), { type: 'sendReaction', from: 'anton', kind: 'clap' });
    expect(s.reactions.items).toEqual([{ id: 'r-1', from: 'anton', kind: 'clap', sentAt: FIXTURE_NOW }]);
    expect(selectReactions(s)).toEqual({ anton: 'clap' });
    const later = reduce(s, { type: 'sendReaction', from: 'anton', kind: 'love' });
    expect(selectReactions(later)).toEqual({ anton: 'love' });
    const gone = reduce(later, { type: 'tick', now: FIXTURE_NOW + REACTION_LIFETIME });
    expect(selectReactions(gone)).toEqual({});
    expect(reduce(s, { type: 'sendReaction', from: 'nobody', kind: 'clap' })).toBe(s);
  });

  it('drops a removed person’s reactions', () => {
    const s = run(
      createRoom(),
      { type: 'sendReaction', from: 'anton', kind: 'clap' },
      { type: 'removeParticipant', participantId: 'anton' },
    );
    expect(s.reactions.items).toEqual([]);
  });
});

describe('decks and the whiteboard', () => {
  it('presents another deck from its first slide, and ignores a bad or current index', () => {
    const s = run(createRoom(), { type: 'setOverview', open: true });
    const next = reduce(s, { type: 'selectDeck', index: 1 });
    expect(next.presentation).toMatchObject({ deckIndex: 1, slideIndex: 0, overviewOpen: false });
    expect(reduce(s, { type: 'selectDeck', index: 0 })).toBe(s);
    expect(reduce(s, { type: 'selectDeck', index: 9 })).toBe(s);
    expect(reduce(s, { type: 'selectDeck', index: -1 })).toBe(s);
  });

  it('adds a deck with placeholder slides and presents it', () => {
    const s = reduce(createRoom(), { type: 'addDeck', file: 'lesson-2.pdf', slideCount: 3 });
    expect(s.presentation.decks).toHaveLength(4);
    expect(s.presentation.decks[3]).toEqual({
      file: 'lesson-2.pdf',
      slides: ['Slide 1', 'Slide 2', 'Slide 3'],
    });
    expect(s.presentation).toMatchObject({ deckIndex: 3, slideIndex: 0 });
    expect(reduce(s, { type: 'addDeck', file: '  ' })).toBe(s);
    expect(reduce(s, { type: 'addDeck', file: 'one.pdf' }).presentation.decks.at(-1)?.slides).toEqual([
      'Slide 1',
    ]);
  });

  it('switches the tool and the ink, returning the same state for no change', () => {
    const s = createRoom();
    expect(reduce(s, { type: 'setTool', tool: 'pen' })).toBe(s);
    expect(reduce(s, { type: 'setTool', tool: 'eraser' }).presentation.tool).toBe('eraser');
    expect(reduce(s, { type: 'setInkColor', color: 'amber' })).toBe(s);
    expect(reduce(s, { type: 'setInkColor', color: 'blue' }).presentation.color).toBe('blue');
  });
});
