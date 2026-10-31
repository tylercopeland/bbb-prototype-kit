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
import { canStartPoll, MAX_POLL_OPTIONS, MIN_POLL_OPTIONS, POLL_TYPES } from './poll';
import { MINUTE, SECOND } from './time';
import type {
  AudioState,
  BreakoutAssignment,
  BreakoutMode,
  BreakoutOptions,
  BreakoutView,
  ChatMessage,
  ChatScope,
  InkColor,
  MediaType,
  MobileSheet,
  Orientation,
  Panel,
  Participant,
  ParticipantId,
  PeopleFilter,
  PollSetting,
  PollType,
  PresentationState,
  ReactionKind,
  RoomActivity,
  RoomState,
  ScreenKind,
  ShareKind,
  StageCorner,
} from './types';

export type RoomAction =
  // clock
  | { type: 'tick'; now: number }
  // people
  | { type: 'raiseHand'; participantId: ParticipantId }
  | { type: 'lowerHand'; participantId: ParticipantId }
  | { type: 'setAudio'; participantId: ParticipantId; audio: AudioState }
  /** Joins audio muted (owner decision 2026-10-24); the person unmutes themselves. */
  | { type: 'joinAudio'; participantId: ParticipantId }
  | { type: 'mute'; participantId: ParticipantId }
  | { type: 'requestUnmute'; participantId: ParticipantId }
  | { type: 'cancelUnmuteRequest'; participantId: ParticipantId }
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
  /** The "Private chat" switch in Room settings (owner decision 2026-10-30). */
  | { type: 'setPrivateChat'; on: boolean }
  /** A reaction from the tray (D5); it shows on the sender's tile for `REACTION_LIFETIME`. */
  | { type: 'sendReaction'; from: ParticipantId; kind: ReactionKind }
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
  | { type: 'setInkColor'; color: InkColor }
  /** Present another deck from the Share media picker: its first slide goes on stage. */
  | { type: 'selectDeck'; index: number }
  /** "Add slides": a new deck with placeholder slides, presented at once. */
  | { type: 'addDeck'; file: string; slideCount?: number }
  // poll
  | { type: 'setupPoll' }
  | { type: 'setPollQuestion'; question: string }
  | { type: 'setPollType'; pollType: PollType }
  | { type: 'setPollOption'; index: number; label: string }
  | { type: 'addPollOption' }
  | { type: 'removePollOption'; index: number }
  | { type: 'setPollSetting'; setting: PollSetting; value: boolean }
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
  | { type: 'setTimerCorner'; corner: StageCorner }
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
  /** "Join Room N" from a preview (B8): the teacher moves into the room until they leave it or the rooms close. */
  | { type: 'joinRoom'; roomIndex: number }
  | { type: 'leaveRoom' }
  /** A room chat message (B8); `roomIndex: null` sends it to every room. */
  | { type: 'sendRoomMessage'; roomIndex: number | null; from: ParticipantId; text: string }
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

/**
 * Whether `from` may write privately to `to`: always while private chat is
 * on; with it off, only when one of them is a moderator (owner decision
 * 2026-10-30: teacher-to-student messages keep working, students cannot
 * message each other).
 */
export function canMessagePrivately(state: RoomState, from: ParticipantId, to: ParticipantId): boolean {
  if (state.session.privateChat) return true;
  const isModerator = (id: ParticipantId) =>
    state.participants.find((p) => p.id === id)?.isModerator ?? false;
  return isModerator(from) || isModerator(to);
}

/** Ids come from a counter in the state (`chat.seq`, `breakouts.helpSeq`, `reactions.seq`); fixtures use their own prefixes. */
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
  return direct.every((t, i) => t === state.chat.direct[i])
    ? state
    : { ...state, chat: { ...state.chat, direct } };
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
  if (timer.phase === 'running' && timer.endsAt !== null)
    return Math.max(0, (timer.endsAt - clock.now) / SECOND);
  return timer.leftSec;
}

export function roomReducer(state: RoomState, action: RoomAction): RoomState {
  switch (action.type) {
    // ---------- clock ----------
    case 'tick': {
      if (action.now <= state.clock.now) return state;
      let next: RoomState = { ...state, clock: { now: action.now } };
      const { breakouts, timer } = next;
      if (
        breakouts.phase === 'live' &&
        breakouts.closingEndsAt !== null &&
        action.now >= breakouts.closingEndsAt
      ) {
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
    case 'joinAudio':
      return updateParticipant(state, action.participantId, (p) =>
        p.audio === 'notJoined' || p.audio === 'listening'
          ? { ...p, audio: 'muted', unmuteRequested: false }
          : p,
      );
    case 'mute':
      return updateParticipant(state, action.participantId, (p) =>
        p.audio === 'live' || p.audio === 'speaking' ? { ...p, audio: 'muted' } : p,
      );
    case 'requestUnmute':
      return updateParticipant(state, action.participantId, (p) =>
        p.audio === 'muted' && !p.unmuteRequested ? { ...p, unmuteRequested: true } : p,
      );
    case 'cancelUnmuteRequest':
      return updateParticipant(state, action.participantId, (p) =>
        p.unmuteRequested ? { ...p, unmuteRequested: false } : p,
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
          p.isPresenter === (p.id === action.participantId)
            ? p
            : { ...p, isPresenter: p.id === action.participantId },
        ),
      };
    }
    case 'setParticipantFlag':
      return updateParticipant(state, action.participantId, (p) =>
        p[action.flag] === action.value ? p : { ...p, [action.flag]: action.value },
      );
    case 'removeParticipant': {
      // Nothing may point at the removed person afterwards (S2): their thread, alerts, menu,
      // sheet, moves, help requests and the presenter role all go or fall back.
      const id = action.participantId;
      const removed = state.participants.find((p) => p.id === id);
      if (!removed) return state;
      let participants = state.participants.filter((p) => p.id !== id);
      if (removed.isPresenter) {
        // The presenter role goes back to the teacher (you first, then any teacher).
        const teacher =
          participants.find((p) => p.role === 'teacher' && p.isSelf) ??
          participants.find((p) => p.role === 'teacher');
        if (teacher)
          participants = participants.map((p) => (p === teacher ? { ...p, isPresenter: true } : p));
      }
      const ui = { ...state.ui };
      if (ui.peopleMenu === id) ui.peopleMenu = null;
      if (ui.dm === id) ui.dm = null;
      if (ui.sheetStudent === id) {
        ui.sheetStudent = null;
        if (ui.sheet === 'student') ui.sheet = 'none';
      }
      const chat = state.chat.direct.some((t) => t.with === id)
        ? { ...state.chat, direct: state.chat.direct.filter((t) => t.with !== id) }
        : state.chat;
      const alerts = state.alerts.some((a) => a.from === id)
        ? state.alerts.filter((a) => a.from !== id)
        : state.alerts;
      const { moves, assignments, helpQueue } = state.breakouts;
      const breakouts = { ...state.breakouts };
      if (id in moves) {
        breakouts.moves = { ...moves };
        delete breakouts.moves[id];
      }
      if (id in assignments) {
        breakouts.assignments = { ...assignments };
        delete breakouts.assignments[id];
      }
      if (breakouts.moving === id) breakouts.moving = null;
      if (id in breakouts.talkTime) {
        breakouts.talkTime = { ...breakouts.talkTime };
        delete breakouts.talkTime[id];
      }
      if (helpQueue.some((h) => h.from === id)) {
        breakouts.helpQueue = helpQueue.map((h) => (h.from === id ? { ...h, from: null } : h));
      }
      const reactions = state.reactions.items.some((r) => r.from === id)
        ? { ...state.reactions, items: state.reactions.items.filter((r) => r.from !== id) }
        : state.reactions;
      return { ...state, participants, chat, alerts, ui, breakouts, reactions };
    }

    // ---------- chat ----------
    case 'sendMessage': {
      const text = action.text.trim();
      if (text.length === 0) return state;
      // With private chat off, a private message needs a moderator at one end:
      // a teacher can still write to a student and the student can reply (owner decision 2026-10-30).
      if (action.to !== undefined && !canMessagePrivately(state, action.from, action.to)) return state;
      const me = selfId(state);
      const seq = state.chat.seq + 1;
      const message: ChatMessage = {
        id: nextId('m', seq),
        from: action.from,
        sentAt: state.clock.now,
        text,
        read: action.from === me,
      };
      if (action.to === undefined) {
        return readVisibleChat({
          ...state,
          chat: { ...state.chat, everyone: [...state.chat.everyone, message], seq },
        });
      }
      const other = action.from === me ? action.to : action.from;
      const exists = state.chat.direct.some((t) => t.with === other);
      const direct = exists
        ? state.chat.direct.map((t) => (t.with === other ? { ...t, messages: [...t.messages, message] } : t))
        : [...state.chat.direct, { with: other, messages: [message] }];
      return readVisibleChat({ ...state, chat: { ...state.chat, direct, seq } });
    }
    case 'openDm': {
      if (!state.participants.some((p) => p.id === action.participantId && !p.isSelf)) return state;
      const me = selfId(state);
      if (me !== null && !canMessagePrivately(state, me, action.participantId)) return state;
      const exists = state.chat.direct.some((t) => t.with === action.participantId);
      const direct = exists
        ? state.chat.direct
        : [...state.chat.direct, { with: action.participantId, messages: [] }];
      return readVisibleChat(
        withUi(
          { ...state, chat: { ...state.chat, direct } },
          { panel: 'chat', scope: 'direct', dm: action.participantId, peopleMenu: null, sheet: 'chat' },
        ),
      );
    }
    case 'closeDm':
      return state.ui.dm === null ? state : withUi(state, { dm: null });
    case 'setPrivateChat':
      return state.session.privateChat === action.on
        ? state
        : { ...state, session: { ...state.session, privateChat: action.on } };
    case 'sendReaction': {
      if (!state.participants.some((p) => p.id === action.from)) return state;
      const seq = state.reactions.seq + 1;
      const reaction = {
        id: nextId('r', seq),
        from: action.from,
        kind: action.kind,
        sentAt: state.clock.now,
      };
      return { ...state, reactions: { items: [...state.reactions.items, reaction], seq } };
    }

    // ---------- panel and scope ----------
    case 'setPanel':
      return readVisibleChat(withUi(state, { panel: action.panel, peopleMenu: null }));
    case 'togglePanel':
      return roomReducer(state, {
        type: 'setPanel',
        panel: state.ui.panel === action.panel ? 'none' : action.panel,
      });
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
      const screenShared =
        action.share === 'none' ? false : state.presentation.screenShared || action.share === 'screen';
      return { ...state, presentation: { ...state.presentation, share: action.share, screenShared } };
    }
    case 'stopShare':
      return { ...state, presentation: { ...state.presentation, share: 'none', screenShared: false } };
    case 'setTool':
      return state.presentation.tool === action.tool
        ? state
        : { ...state, presentation: { ...state.presentation, tool: action.tool } };
    case 'setInkColor':
      return state.presentation.color === action.color
        ? state
        : { ...state, presentation: { ...state.presentation, color: action.color } };
    case 'selectDeck': {
      const { decks, deckIndex } = state.presentation;
      if (
        !Number.isInteger(action.index) ||
        action.index < 0 ||
        action.index >= decks.length ||
        action.index === deckIndex
      ) {
        return state;
      }
      return {
        ...state,
        presentation: { ...state.presentation, deckIndex: action.index, slideIndex: 0, overviewOpen: false },
      };
    }
    case 'addDeck': {
      const file = action.file.trim();
      if (file.length === 0) return state;
      const count = Math.max(1, Math.trunc(action.slideCount ?? 1));
      const deck = { file, slides: Array.from({ length: count }, (_, i) => `Slide ${i + 1}`) };
      const decks = [...state.presentation.decks, deck];
      return {
        ...state,
        presentation: {
          ...state.presentation,
          decks,
          deckIndex: decks.length - 1,
          slideIndex: 0,
          overviewOpen: false,
        },
      };
    }

    // ---------- poll ----------
    case 'setupPoll':
      return withUi(
        {
          ...state,
          poll: { ...state.poll, phase: 'setup', shown: false, votes: state.poll.options.map(() => 0) },
        },
        { panel: 'poll' },
      );
    // The builder's edits apply while the poll is being set up, never to a live one.
    case 'setPollQuestion':
      return state.poll.phase !== 'setup' || state.poll.question === action.question
        ? state
        : { ...state, poll: { ...state.poll, question: action.question } };
    case 'setPollType': {
      if (state.poll.phase !== 'setup' || state.poll.type === action.pollType) return state;
      // Multiple choice keeps the teacher's own answers; the fixed types reset to theirs.
      const options =
        action.pollType === 'choice' && state.poll.type !== 'choice'
          ? POLL_TYPES.choice.options
          : POLL_TYPES[action.pollType].options;
      return {
        ...state,
        poll: { ...state.poll, type: action.pollType, options, votes: options.map(() => 0) },
      };
    }
    case 'setPollOption': {
      const { options } = state.poll;
      if (
        state.poll.phase !== 'setup' ||
        !POLL_TYPES[state.poll.type].editable ||
        action.index < 0 ||
        action.index >= options.length ||
        options[action.index] === action.label
      )
        return state;
      return {
        ...state,
        poll: { ...state.poll, options: options.map((o, i) => (i === action.index ? action.label : o)) },
      };
    }
    case 'addPollOption':
      if (
        state.poll.phase !== 'setup' ||
        !POLL_TYPES[state.poll.type].editable ||
        state.poll.options.length >= MAX_POLL_OPTIONS
      )
        return state;
      return {
        ...state,
        poll: { ...state.poll, options: [...state.poll.options, ''], votes: [...state.poll.votes, 0] },
      };
    case 'removePollOption':
      if (
        state.poll.phase !== 'setup' ||
        !POLL_TYPES[state.poll.type].editable ||
        state.poll.options.length <= MIN_POLL_OPTIONS ||
        action.index < 0 ||
        action.index >= state.poll.options.length
      )
        return state;
      return {
        ...state,
        poll: {
          ...state.poll,
          options: state.poll.options.filter((_, i) => i !== action.index),
          votes: state.poll.votes.filter((_, i) => i !== action.index),
        },
      };
    case 'setPollSetting':
      return state.poll.phase !== 'setup' || state.poll[action.setting] === action.value
        ? state
        : { ...state, poll: { ...state.poll, [action.setting]: action.value } };
    case 'startPoll':
      return state.poll.phase !== 'setup' || !canStartPoll(state.poll)
        ? state
        : { ...state, poll: { ...state.poll, phase: 'live', shown: false } };
    case 'answerPoll': {
      if (state.poll.phase !== 'live' || action.option < 0 || action.option >= state.poll.options.length)
        return state;
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
        timer: {
          ...state.timer,
          phase: 'ready',
          durationSec: action.durationSec,
          leftSec: action.durationSec,
          endsAt: null,
        },
      };
    case 'startTimer': {
      const left = state.timer.phase === 'done' ? state.timer.durationSec : timerLeft(state);
      return {
        ...state,
        timer: { ...state.timer, phase: 'running', leftSec: left, endsAt: state.clock.now + left * SECOND },
      };
    }
    case 'pauseTimer':
      return state.timer.phase !== 'running'
        ? state
        : { ...state, timer: { ...state.timer, phase: 'paused', leftSec: timerLeft(state), endsAt: null } };
    case 'resetTimer':
      return {
        ...state,
        timer: { ...state.timer, phase: 'ready', leftSec: state.timer.durationSec, endsAt: null },
      };
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
    case 'setTimerCorner':
      return state.timer.corner === action.corner
        ? state
        : { ...state, timer: { ...state.timer, corner: action.corner } };
    case 'removeTimer':
      return { ...state, timer: { ...state.timer, phase: 'off', endsAt: null, minimized: false } };

    // ---------- breakouts ----------
    case 'setBreakoutsOpen':
      return {
        ...withUi(state, { breakoutsOpen: action.open, panel: action.open ? 'none' : state.ui.panel }),
        plugins: { ...state.plugins, open: false },
      };
    // The setup actions change nothing once the rooms are open or closed (S3).
    case 'setBreakoutMode':
      return state.breakouts.phase !== 'setup'
        ? state
        : withBreakouts(state, { mode: action.mode, moving: null });
    case 'setRoomCount': {
      if (state.breakouts.phase !== 'setup') return state;
      const roomCount = clampRoomCount(action.roomCount);
      if (roomCount === state.breakouts.roomCount) return state;
      // Moves into rooms that no longer exist are dropped; the rest stay (B4).
      const moves: Record<ParticipantId, number> = {};
      for (const [id, room] of Object.entries(state.breakouts.moves)) if (room < roomCount) moves[id] = room;
      return reassign(withBreakouts(state, { roomCount, moves }), state.breakouts.seed);
    }
    case 'shuffleRooms':
      return state.breakouts.phase !== 'setup' ? state : reassign(state, state.breakouts.seed + 1);
    case 'evenOutRooms': {
      if (state.breakouts.phase !== 'setup') return state;
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
            joined: null,
            messages: [],
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
            joined: null,
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
        joined: null,
        messages: [],
      });
    case 'requestHelp': {
      if (state.breakouts.phase !== 'live') return state;
      const count = roomCountFor(
        state.breakouts.mode,
        state.breakouts.roomCount,
        breakoutStudents(state.participants).length,
      );
      if (!Number.isInteger(action.roomIndex) || action.roomIndex < 0 || action.roomIndex >= count)
        return state;
      const helpSeq = state.breakouts.helpSeq + 1;
      const request = {
        id: nextId('help', helpSeq),
        roomIndex: action.roomIndex,
        from: action.from ?? null,
        askedAt: state.clock.now,
        acknowledgedAt: null,
      };
      return withBreakouts(state, { helpQueue: [...state.breakouts.helpQueue, request], helpSeq });
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
    case 'joinRoom': {
      if (state.breakouts.phase !== 'live') return state;
      const count = roomCountFor(
        state.breakouts.mode,
        state.breakouts.roomCount,
        breakoutStudents(state.participants).length,
      );
      if (!Number.isInteger(action.roomIndex) || action.roomIndex < 0 || action.roomIndex >= count)
        return state;
      // Joining a room closes its preview: you are in the room now, not looking in.
      return withBreakouts(state, { joined: action.roomIndex, peek: null, listening: false });
    }
    case 'leaveRoom':
      return state.breakouts.joined === null ? state : withBreakouts(state, { joined: null });
    case 'sendRoomMessage': {
      const text = action.text.trim();
      if (state.breakouts.phase !== 'live' || text.length === 0) return state;
      if (!state.participants.some((p) => p.id === action.from)) return state;
      const count = roomCountFor(
        state.breakouts.mode,
        state.breakouts.roomCount,
        breakoutStudents(state.participants).length,
      );
      if (action.roomIndex !== null && (action.roomIndex < 0 || action.roomIndex >= count)) return state;
      const messageSeq = state.breakouts.messageSeq + 1;
      const message = {
        id: nextId('rm', messageSeq),
        roomIndex: action.roomIndex,
        from: action.from,
        sentAt: state.clock.now,
        text,
      };
      return withBreakouts(state, { messages: [...state.breakouts.messages, message], messageSeq });
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
