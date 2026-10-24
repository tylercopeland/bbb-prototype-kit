/**
 * The pure reducer over `RoomState`. Every change to meeting state is an
 * action here, so components never keep their own copy (CLAUDE.md › Routes
 * and state) and the `RoomProvider` can diff two states to announce what
 * changed. Nothing in this file reads the wall clock: time arrives in `tick`.
 */
import {
  CLOSING_SECONDS,
  EXTRA_MIN,
  balancedAround,
  breakoutStudents,
  clampRoomCount,
  roomCountFor,
  roundRobin,
  seededOrder,
} from './breakouts';
import { MINUTE, SECOND } from './time';
import type {
  AudioState,
  BreakoutAssignment,
  BreakoutMode,
  BreakoutOptions,
  BreakoutView,
  ChatMessage,
  ChatScope,
  MediaType,
  MobileSheet,
  Orientation,
  Panel,
  Participant,
  ParticipantId,
  PeopleFilter,
  PresentationState,
  RoomActivity,
  RoomState,
  ScreenKind,
  ShareKind,
} from './types';

export type RoomAction =
  // clock
  | { type: 'tick'; now: number }
  // people
  | { type: 'raiseHand'; participantId: ParticipantId }
  | { type: 'lowerHand'; participantId: ParticipantId }
  | { type: 'setAudio'; participantId: ParticipantId; audio: AudioState }
  | { type: 'mute'; participantId: ParticipantId }
  | { type: 'requestUnmute'; participantId: ParticipantId }
  | { type: 'setCamera'; participantId: ParticipantId; on: boolean }
  | { type: 'makePresenter'; participantId: ParticipantId }
  | {
      type: 'setParticipantFlag';
      participantId: ParticipantId;
      flag: 'isModerator' | 'hasWhiteboard' | 'chatLocked';
      value: boolean;
    }
  | { type: 'removeParticipant'; participantId: ParticipantId }
  // chat
  | { type: 'sendMessage'; from: ParticipantId; text: string; to?: ParticipantId }
  | { type: 'openDm'; participantId: ParticipantId }
  | { type: 'closeDm' }
  // panel and scope
  | { type: 'setPanel'; panel: Panel }
  | { type: 'togglePanel'; panel: Exclude<Panel, 'none'> }
  | { type: 'setScope'; scope: ChatScope }
  | { type: 'setPeopleFilter'; filter: PeopleFilter }
  | { type: 'openPeopleMenu'; participantId: ParticipantId | null }
  | { type: 'setPlugins'; open: boolean }
  | { type: 'setMediaPicker'; open: boolean; mediaType?: MediaType }
  | { type: 'setMediaType'; mediaType: MediaType }
  | { type: 'setAnalyticsTip'; shown: boolean }
  // presentation
  | { type: 'goToSlide'; index: number }
  | { type: 'nextSlide' }
  | { type: 'prevSlide' }
  | { type: 'setOverview'; open: boolean }
  | { type: 'setPresentationMinimized'; minimized: boolean }
  | { type: 'startScreenShare'; screenKind: ScreenKind }
  | { type: 'setShare'; share: ShareKind }
  | { type: 'stopShare' }
  | { type: 'setTool'; tool: PresentationState['tool'] }
  // poll
  | { type: 'setupPoll' }
  | { type: 'startPoll' }
  | { type: 'answerPoll'; option: number }
  | { type: 'showPollResults'; shown: boolean }
  | { type: 'endPoll' }
  | { type: 'closePoll' }
  // timer
  | { type: 'addTimer' }
  | { type: 'setTimerDuration'; durationSec: number }
  | { type: 'startTimer' }
  | { type: 'pauseTimer' }
  | { type: 'resetTimer' }
  | { type: 'addTimerMinute' }
  | { type: 'setTimerMinimized'; minimized: boolean }
  | { type: 'removeTimer' }
  // breakouts
  | { type: 'setBreakoutsOpen'; open: boolean }
  | { type: 'setBreakoutMode'; mode: BreakoutMode }
  | { type: 'setRoomCount'; roomCount: number }
  | { type: 'shuffleRooms' }
  | { type: 'evenOutRooms' }
  | { type: 'setBreakoutAssignment'; assignment: BreakoutAssignment }
  | { type: 'setBreakoutDuration'; durationMin: number }
  | { type: 'setBreakoutOption'; option: keyof BreakoutOptions; value: boolean }
  | { type: 'startMove'; participantId: ParticipantId }
  | { type: 'cancelMove' }
  | { type: 'moveParticipant'; participantId: ParticipantId; roomIndex: number }
  | { type: 'openRooms' }
  | { type: 'addRoomTime' }
  | { type: 'peekRoom'; roomIndex: number | null }
  | { type: 'setBreakoutView'; view: BreakoutView }
  | { type: 'closeRooms' }
  | { type: 'keepRoomsOpen' }
  | { type: 'bringEveryoneBack' }
  | { type: 'showRoomOnStage'; roomIndex: number | null }
  | { type: 'setUpNewRooms' }
  | { type: 'requestHelp'; roomIndex: number; from?: ParticipantId }
  | { type: 'acknowledgeHelp'; id: string }
  | { type: 'clearHelp'; id: string }
  | { type: 'setListening'; listening: boolean }
  | { type: 'setRoomActivity'; roomIndex: number; activity: RoomActivity | null }
  // mobile
  | { type: 'setOrientation'; orientation: Orientation }
  | { type: 'setSheet'; sheet: MobileSheet; student?: ParticipantId | null }
  | { type: 'setAnnotating'; annotating: boolean }
  | { type: 'setReacting'; reacting: boolean };

export type RoomActionType = RoomAction['type'];

function updateParticipant(
  state: RoomState,
  id: ParticipantId,
  change: (p: Participant) => Participant,
): RoomState {
  let changed = false;
  const participants = state.participants.map((p) => {
    if (p.id !== id) return p;
    const next = change(p);
    if (next !== p) changed = true;
    return next;
  });
  return changed ? { ...state, participants } : state;
}

export function selfId(state: RoomState): ParticipantId | null {
  return state.participants.find((p) => p.isSelf)?.id ?? null;
}

let messageSeq = 0;
let helpSeq = 0;

/** Ids are unique per process; fixtures use their own prefixes. */
function nextId(prefix: string, seq: number): string {
  return `${prefix}-${seq}`;
}

function markRead(messages: ChatMessage[]): ChatMessage[] {
  return messages.some((m) => !m.read) ? messages.map((m) => (m.read ? m : { ...m, read: true })) : messages;
}

/** Opening the chat panel reads the visible thread, so badges and alerts clear. */
function readVisibleChat(state: RoomState): RoomState {
  const { panel, scope, dm } = state.ui;
  if (panel !== 'chat') return state;
  if (scope === 'everyone') {
    const everyone = markRead(state.chat.everyone);
    return everyone === state.chat.everyone ? state : { ...state, chat: { ...state.chat, everyone } };
  }
  if (dm === null) return state;
  const direct = state.chat.direct.map((t) => {
    if (t.with !== dm) return t;
    const messages = markRead(t.messages);
    return messages === t.messages ? t : { ...t, messages };
  });
  return direct.every((t, i) => t === state.chat.direct[i]) ? state : { ...state, chat: { ...state.chat, direct } };
}

function withUi(state: RoomState, ui: Partial<RoomState['ui']>): RoomState {
  return { ...state, ui: { ...state.ui, ...ui } };
}

function withBreakouts(state: RoomState, breakouts: Partial<RoomState['breakouts']>): RoomState {
  return { ...state, breakouts: { ...state.breakouts, ...breakouts } };
}

/** Rebuilds the automatic assignment for the current students, keeping manual moves (B4). */
function reassign(state: RoomState, seed: number): RoomState {
  const students = breakoutStudents(state.participants).map((s) => s.id);
  const count = clampRoomCount(state.breakouts.roomCount);
  return withBreakouts(state, {
    seed,
    assignments: roundRobin(seededOrder(students, seed), count),
    moving: null,
  });
}

function timerLeft(state: RoomState): number {
  const { timer, clock } = state;
  if (timer.phase === 'running' && timer.endsAt !== null) return Math.max(0, (timer.endsAt - clock.now) / SECOND);
  return timer.leftSec;
}

export function roomReducer(state: RoomState, action: RoomAction): RoomState {
  switch (action.type) {
    // ---------- clock ----------
    case 'tick': {
      if (action.now <= state.clock.now) return state;
      let next: RoomState = { ...state, clock: { now: action.now } };
      const { breakouts, timer } = next;
      if (breakouts.phase === 'live' && breakouts.closingEndsAt !== null && action.now >= breakouts.closingEndsAt) {
        next = roomReducer(next, { type: 'bringEveryoneBack' });
      }
      if (
        breakouts.phase === 'live' &&
        breakouts.closingEndsAt === null &&
        breakouts.options.autoReturn &&
        breakouts.openedAt !== null &&
        action.now >= breakouts.openedAt + (breakouts.durationMin + breakouts.extraMin) * MINUTE
      ) {
        next = roomReducer(next, { type: 'bringEveryoneBack' });
      }
      if (timer.phase === 'running' && timer.endsAt !== null && action.now >= timer.endsAt) {
        next = { ...next, timer: { ...timer, phase: 'done', leftSec: 0, endsAt: null } };
      }
      return next;
    }

    // ---------- people ----------
    case 'raiseHand':
      return updateParticipant(state, action.participantId, (p) =>
        p.handRaisedAt === null ? { ...p, handRaisedAt: state.clock.now } : p,
      );
    case 'lowerHand':
      return updateParticipant(state, action.participantId, (p) =>
        p.handRaisedAt === null ? p : { ...p, handRaisedAt: null },
      );
    case 'setAudio':
      return updateParticipant(state, action.participantId, (p) =>
        p.audio === action.audio ? p : { ...p, audio: action.audio, unmuteRequested: false },
      );
    case 'mute':
      return updateParticipant(state, action.participantId, (p) =>
        p.audio === 'live' || p.audio === 'speaking' ? { ...p, audio: 'muted' } : p,
      );
    case 'requestUnmute':
      return updateParticipant(state, action.participantId, (p) =>
        p.audio === 'muted' && !p.unmuteRequested ? { ...p, unmuteRequested: true } : p,
      );
    case 'setCamera':
      return updateParticipant(state, action.participantId, (p) =>
        p.camera === action.on ? p : { ...p, camera: action.on },
      );
    case 'makePresenter': {
      if (!state.participants.some((p) => p.id === action.participantId)) return state;
      return {
        ...state,
        participants: state.participants.map((p) =>
          p.isPresenter === (p.id === action.participantId) ? p : { ...p, isPresenter: p.id === action.participantId },
        ),
      };
    }
    case 'setParticipantFlag':
      return updateParticipant(state, action.participantId, (p) =>
        p[action.flag] === action.value ? p : { ...p, [action.flag]: action.value },
      );
    case 'removeParticipant': {
      if (!state.participants.some((p) => p.id === action.participantId)) return state;
      const participants = state.participants.filter((p) => p.id !== action.participantId);
      const ui = { ...state.ui };
      if (ui.peopleMenu === action.participantId) ui.peopleMenu = null;
      if (ui.dm === action.participantId) ui.dm = null;
      if (ui.sheetStudent === action.participantId) ui.sheetStudent = null;
      const { moves, assignments } = state.breakouts;
      const breakouts = { ...state.breakouts };
      if (action.participantId in moves) {
        breakouts.moves = { ...moves };
        delete breakouts.moves[action.participantId];
      }
      if (action.participantId in assignments) {
        breakouts.assignments = { ...assignments };
        delete breakouts.assignments[action.participantId];
      }
      if (breakouts.moving === action.participantId) breakouts.moving = null;
      return { ...state, participants, ui, breakouts };
    }

    // ---------- chat ----------
    case 'sendMessage': {
      const text = action.text.trim();
      if (text.length === 0) return state;
      const me = selfId(state);
      const message: ChatMessage = {
        id: nextId('m', ++messageSeq),
        from: action.from,
        sentAt: state.clock.now,
        text,
        read: action.from === me,
      };
      if (action.to === undefined) {
        return readVisibleChat({ ...state, chat: { ...state.chat, everyone: [...state.chat.everyone, message] } });
      }
      const other = action.from === me ? action.to : action.from;
      const exists = state.chat.direct.some((t) => t.with === other);
      const direct = exists
        ? state.chat.direct.map((t) => (t.with === other ? { ...t, messages: [...t.messages, message] } : t))
        : [...state.chat.direct, { with: other, messages: [message] }];
      return readVisibleChat({ ...state, chat: { ...state.chat, direct } });
    }
    case 'openDm': {
      if (!state.participants.some((p) => p.id === action.participantId && !p.isSelf)) return state;
      const exists = state.chat.direct.some((t) => t.with === action.participantId);
      const direct = exists ? state.chat.direct : [...state.chat.direct, { with: action.participantId, messages: [] }];
      return readVisibleChat(
        withUi(
          { ...state, chat: { ...state.chat, direct } },
          { panel: 'chat', scope: 'direct', dm: action.participantId, peopleMenu: null, sheet: 'chat' },
        ),
      );
    }
    case 'closeDm':
      return state.ui.dm === null ? state : withUi(state, { dm: null });

    // ---------- panel and scope ----------
    case 'setPanel':
      return readVisibleChat(
        withUi(state, { panel: action.panel, peopleMenu: null, ...(action.panel === 'chat' ? {} : { dm: state.ui.dm }) }),
      );
    case 'togglePanel':
      return roomReducer(state, { type: 'setPanel', panel: state.ui.panel === action.panel ? 'none' : action.panel });
    case 'setScope':
      return readVisibleChat(withUi(state, { scope: action.scope, dm: null }));
    case 'setPeopleFilter':
      return withUi(state, { peopleFilter: action.filter, panel: 'people', sheet: 'people' });
    case 'openPeopleMenu':
      return withUi(state, { peopleMenu: action.participantId });
    case 'setPlugins':
      return {
        ...withUi(state, { mediaOpen: action.open ? false : state.ui.mediaOpen }),
        plugins: state.plugins.open === action.open ? state.plugins : { ...state.plugins, open: action.open },
      };
    case 'setMediaPicker':
      return {
        ...withUi(state, {
          mediaOpen: action.open,
          mediaType: action.mediaType ?? state.ui.mediaType,
        }),
        plugins: action.open && state.plugins.open ? { ...state.plugins, open: false } : state.plugins,
      };
    case 'setMediaType':
      return withUi(state, { mediaType: action.mediaType });
    case 'setAnalyticsTip':
      return withUi(state, { analyticsTipShown: action.shown });

    // ---------- presentation ----------
    case 'goToSlide': {
      const deck = state.presentation.decks[state.presentation.deckIndex];
      const count = deck?.slides.length ?? 0;
      const index = Math.max(0, Math.min(count - 1, action.index));
      if (count === 0 || index === state.presentation.slideIndex) return state;
      return { ...state, presentation: { ...state.presentation, slideIndex: index, overviewOpen: false } };
    }
    case 'nextSlide':
      return roomReducer(state, { type: 'goToSlide', index: state.presentation.slideIndex + 1 });
    case 'prevSlide':
      return roomReducer(state, { type: 'goToSlide', index: state.presentation.slideIndex - 1 });
    case 'setOverview':
      return { ...state, presentation: { ...state.presentation, overviewOpen: action.open } };
    case 'setPresentationMinimized':
      return { ...state, presentation: { ...state.presentation, minimized: action.minimized } };
    case 'startScreenShare':
      return withUi(
        {
          ...state,
          presentation: {
            ...state.presentation,
            share: 'screen',
            screenShared: true,
            screenKind: action.screenKind,
          },
        },
        { mediaOpen: false },
      );
    case 'setShare': {
      const screenShared = action.share === 'none' ? false : state.presentation.screenShared || action.share === 'screen';
      return { ...state, presentation: { ...state.presentation, share: action.share, screenShared } };
    }
    case 'stopShare':
      return { ...state, presentation: { ...state.presentation, share: 'none', screenShared: false } };
    case 'setTool':
      return { ...state, presentation: { ...state.presentation, tool: action.tool } };

    // ---------- poll ----------
    case 'setupPoll':
      return withUi(
        { ...state, poll: { ...state.poll, phase: 'setup', shown: false, votes: state.poll.options.map(() => 0) } },
        { panel: 'poll' },
      );
    case 'startPoll':
      return { ...state, poll: { ...state.poll, phase: 'live', shown: false } };
    case 'answerPoll': {
      if (state.poll.phase !== 'live' || action.option < 0 || action.option >= state.poll.options.length) return state;
      const votes = state.poll.votes.map((v, i) => (i === action.option ? v + 1 : v));
      return { ...state, poll: { ...state.poll, votes } };
    }
    case 'showPollResults':
      return state.poll.phase === 'setup' || state.poll.phase === 'off'
        ? state
        : { ...state, poll: { ...state.poll, shown: action.shown } };
    case 'endPoll':
      return { ...state, poll: { ...state.poll, phase: 'ended' } };
    case 'closePoll':
      return withUi({ ...state, poll: { ...state.poll, phase: 'off', shown: false } }, { panel: 'none' });

    // ---------- timer ----------
    case 'addTimer':
      return {
        ...state,
        timer: {
          ...state.timer,
          phase: 'ready',
          leftSec: state.timer.durationSec,
          endsAt: null,
          minimized: false,
        },
        plugins: { ...state.plugins, open: false },
      };
    case 'setTimerDuration':
      return {
        ...state,
        timer: { ...state.timer, phase: 'ready', durationSec: action.durationSec, leftSec: action.durationSec, endsAt: null },
      };
    case 'startTimer': {
      const left = state.timer.phase === 'done' ? state.timer.durationSec : timerLeft(state);
      return { ...state, timer: { ...state.timer, phase: 'running', leftSec: left, endsAt: state.clock.now + left * SECOND } };
    }
    case 'pauseTimer':
      return state.timer.phase !== 'running'
        ? state
        : { ...state, timer: { ...state.timer, phase: 'paused', leftSec: timerLeft(state), endsAt: null } };
    case 'resetTimer':
      return { ...state, timer: { ...state.timer, phase: 'ready', leftSec: state.timer.durationSec, endsAt: null } };
    case 'addTimerMinute': {
      const base = state.timer.phase === 'done' ? 0 : timerLeft(state);
      const left = base + 60;
      const running = state.timer.phase === 'running' || state.timer.phase === 'done';
      return {
        ...state,
        timer: {
          ...state.timer,
          phase: running ? 'running' : state.timer.phase,
          durationSec: Math.max(state.timer.durationSec, left),
          leftSec: left,
          endsAt: running ? state.clock.now + left * SECOND : null,
        },
      };
    }
    case 'setTimerMinimized':
      return { ...state, timer: { ...state.timer, minimized: action.minimized } };
    case 'removeTimer':
      return { ...state, timer: { ...state.timer, phase: 'off', endsAt: null, minimized: false } };

    // ---------- breakouts ----------
    case 'setBreakoutsOpen':
      return {
        ...withUi(state, { breakoutsOpen: action.open, panel: action.open ? 'none' : state.ui.panel }),
        plugins: { ...state.plugins, open: false },
      };
    case 'setBreakoutMode':
      return withBreakouts(state, { mode: action.mode, moving: null });
    case 'setRoomCount': {
      const roomCount = clampRoomCount(action.roomCount);
      if (roomCount === state.breakouts.roomCount) return state;
      // Moves into rooms that no longer exist are dropped; the rest stay (B4).
      const moves: Record<ParticipantId, number> = {};
      for (const [id, room] of Object.entries(state.breakouts.moves)) if (room < roomCount) moves[id] = room;
      return reassign(withBreakouts(state, { roomCount, moves }), state.breakouts.seed);
    }
    case 'shuffleRooms':
      return reassign(state, state.breakouts.seed + 1);
    case 'evenOutRooms': {
      const students = breakoutStudents(state.participants).map((s) => s.id);
      const count = clampRoomCount(state.breakouts.roomCount);
      return withBreakouts(state, {
        assignments: balancedAround(students, state.breakouts.moves, count),
        moving: null,
      });
    }
    case 'setBreakoutAssignment':
      return withBreakouts(state, { assignment: action.assignment });
    case 'setBreakoutDuration':
      return withBreakouts(state, { durationMin: action.durationMin });
    case 'setBreakoutOption':
      return withBreakouts(state, { options: { ...state.breakouts.options, [action.option]: action.value } });
    case 'startMove':
      return state.breakouts.mode === 'solo' ||
        !state.participants.some((p) => p.id === action.participantId && p.role === 'student')
        ? state
        : withBreakouts(state, { moving: action.participantId });
    case 'cancelMove':
      return state.breakouts.moving === null ? state : withBreakouts(state, { moving: null });
    case 'moveParticipant': {
      const students = breakoutStudents(state.participants);
      const count = roomCountFor(state.breakouts.mode, state.breakouts.roomCount, students.length);
      if (
        state.breakouts.mode === 'solo' ||
        action.roomIndex < 0 ||
        action.roomIndex >= count ||
        !students.some((s) => s.id === action.participantId)
      ) {
        return state;
      }
      return withBreakouts(state, {
        moves: { ...state.breakouts.moves, [action.participantId]: action.roomIndex },
        moving: null,
      });
    }
    case 'openRooms':
      return state.breakouts.phase !== 'setup'
        ? state
        : withBreakouts(state, {
            phase: 'live',
            openedAt: state.clock.now,
            extraMin: 0,
            moving: null,
            peek: null,
            closingEndsAt: null,
            onStage: null,
            helpQueue: [],
            view: 'rooms',
          });
    case 'addRoomTime':
      return state.breakouts.phase !== 'live'
        ? state
        : withBreakouts(state, { extraMin: state.breakouts.extraMin + EXTRA_MIN });
    case 'peekRoom': {
      if (action.roomIndex === null) return withBreakouts(state, { peek: null, listening: false });
      const count = roomCountFor(
        state.breakouts.mode,
        state.breakouts.roomCount,
        breakoutStudents(state.participants).length,
      );
      if (action.roomIndex < 0 || action.roomIndex >= count) return state;
      return withBreakouts(state, { peek: action.roomIndex, view: 'rooms' });
    }
    case 'setBreakoutView':
      return withBreakouts(state, {
        view: action.view,
        ...(action.view === 'main' ? { peek: null, moving: null } : {}),
      });
    case 'closeRooms':
      return state.breakouts.phase !== 'live' || state.breakouts.closingEndsAt !== null
        ? state
        : withBreakouts(state, { closingEndsAt: state.clock.now + CLOSING_SECONDS * SECOND, peek: null });
    case 'keepRoomsOpen':
      return state.breakouts.closingEndsAt === null ? state : withBreakouts(state, { closingEndsAt: null });
    case 'bringEveryoneBack':
      return state.breakouts.phase !== 'live'
        ? state
        : withBreakouts(state, {
            phase: 'back',
            closingEndsAt: null,
            view: 'main',
            peek: null,
            onStage: null,
            listening: false,
            helpQueue: state.breakouts.helpQueue.map((h) =>
              h.acknowledgedAt === null ? { ...h, acknowledgedAt: state.clock.now } : h,
            ),
          });
    case 'showRoomOnStage':
      return state.breakouts.phase !== 'back'
        ? state
        : withBreakouts(state, { onStage: action.roomIndex, view: 'main' });
    case 'setUpNewRooms':
      return withBreakouts(state, {
        phase: 'setup',
        openedAt: null,
        extraMin: 0,
        view: 'rooms',
        onStage: null,
        closingEndsAt: null,
        peek: null,
        helpQueue: [],
      });
    case 'requestHelp': {
      if (state.breakouts.phase !== 'live') return state;
      const request = {
        id: nextId('help', ++helpSeq),
        roomIndex: action.roomIndex,
        from: action.from ?? null,
        askedAt: state.clock.now,
        acknowledgedAt: null,
      };
      return withBreakouts(state, { helpQueue: [...state.breakouts.helpQueue, request] });
    }
    case 'acknowledgeHelp':
      return withBreakouts(state, {
        helpQueue: state.breakouts.helpQueue.map((h) =>
          h.id === action.id && h.acknowledgedAt === null ? { ...h, acknowledgedAt: state.clock.now } : h,
        ),
      });
    case 'clearHelp':
      return withBreakouts(state, { helpQueue: state.breakouts.helpQueue.filter((h) => h.id !== action.id) });
    case 'setListening':
      return withBreakouts(state, { listening: action.listening });
    case 'setRoomActivity': {
      const activity = { ...state.breakouts.activity };
      if (action.activity === null) delete activity[action.roomIndex];
      else activity[action.roomIndex] = action.activity;
      return withBreakouts(state, { activity });
    }

    // ---------- mobile ----------
    case 'setOrientation':
      return withUi(state, { orientation: action.orientation });
    case 'setSheet':
      return readVisibleChat(
        withUi(state, {
          sheet: action.sheet,
          sheetStudent: action.sheet === 'student' ? (action.student ?? state.ui.sheetStudent) : null,
          panel: action.sheet === 'people' || action.sheet === 'chat' ? action.sheet : state.ui.panel,
        }),
      );
    case 'setAnnotating':
      return withUi(state, { annotating: action.annotating });
    case 'setReacting':
      return withUi(state, { reacting: action.reacting, sheet: action.reacting ? 'react' : 'none' });
  }
}
