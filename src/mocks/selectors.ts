/**
 * Derived views of the room state. Every count on a screen comes from one of
 * these, never from a literal (X15). Each list selector is memoized on the
 * state object it last saw, so `useRoom(selectRooms)` returns the same array
 * until the state changes and `useSyncExternalStore` stays quiet.
 */
import { buildRooms, helpFirst, isUneven, sortedHelpQueue, type Room } from './breakouts';
import { firstName, firstNameWithInitial } from './names';
import { canStartPoll, pollResults } from './poll';
import { REACTION_LIFETIME } from './reactions';
import { canMessagePrivately } from './reducer';
import { formatAgo, formatElapsed, MINUTE, SECOND } from './time';
import type {
  ChatMessage,
  DirectThread,
  HelpRequest,
  Participant,
  ParticipantId,
  PeopleFilter,
  ReactionKind,
  RoomMessage,
  RoomState,
} from './types';

/** Caches one result per state object, so the same state gives the same reference. */
export function memo<T>(select: (state: RoomState) => T): (state: RoomState) => T {
  let last: { state: RoomState; value: T } | null = null;
  return (state) => {
    if (last && last.state === state) return last.value;
    const value = select(state);
    last = { state, value };
    return value;
  };
}

// ---------- people ----------

export const selectSelf = memo((s) => s.participants.find((p) => p.isSelf) ?? null);

export const selectParticipant = (id: ParticipantId | null) => (s: RoomState) =>
  id === null ? null : (s.participants.find((p) => p.id === id) ?? null);

export const selectPeopleCount = (s: RoomState) => s.participants.length;

/** Hands up, longest wait first. */
export const selectRaisedHands = memo((s) =>
  s.participants
    .filter((p) => p.handRaisedAt !== null)
    .sort((a, b) => (a.handRaisedAt ?? 0) - (b.handRaisedAt ?? 0)),
);

export const selectLowEngagement = memo((s) => s.participants.filter((p) => p.engagement.level === 'low'));

export const selectSpeaking = memo((s) => s.participants.filter((p) => p.audio === 'speaking'));

/** The People list for a filter: the raised hands first, then everyone else, as the panel draws it. */
export const selectPeople = (filter: PeopleFilter) =>
  memo((s): { hands: Participant[]; others: Participant[] } => {
    if (filter === 'low') return { hands: [], others: selectLowEngagement(s) };
    const hands = selectRaisedHands(s);
    if (filter === 'hands') return { hands, others: [] };
    const raised = new Set(hands.map((p) => p.id));
    return { hands, others: s.participants.filter((p) => !raised.has(p.id)) };
  });

/** Counts for the People filter chips. */
export const selectPeopleFilterCounts = memo((s) => ({
  all: s.participants.length,
  hands: selectRaisedHands(s).length,
  low: selectLowEngagement(s).length,
}));

/**
 * Short names for pills, tiles and chips (B9). The first name alone, unless
 * another participant shares it; then first name plus the last initial
 * ("Ana S.", "Ana F."); and the full name when even that collides.
 * Honorifics and generational suffixes are skipped, as the avatar initials
 * skip them ("Prof. Helena Costa" → "Helena", `names.ts`).
 */
export const selectDisplayNames = memo((s): Record<ParticipantId, string> => {
  const first = firstName;
  const withInitial = firstNameWithInitial;
  const byFirst = new Map<string, number>();
  for (const p of s.participants) byFirst.set(first(p.name), (byFirst.get(first(p.name)) ?? 0) + 1);
  const byInitial = new Map<string, number>();
  for (const p of s.participants) {
    if ((byFirst.get(first(p.name)) ?? 0) > 1) {
      byInitial.set(withInitial(p.name), (byInitial.get(withInitial(p.name)) ?? 0) + 1);
    }
  }
  const names: Record<ParticipantId, string> = {};
  for (const p of s.participants) {
    if ((byFirst.get(first(p.name)) ?? 0) <= 1) names[p.id] = first(p.name);
    else if ((byInitial.get(withInitial(p.name)) ?? 0) <= 1) names[p.id] = withInitial(p.name);
    else names[p.id] = p.name;
  }
  return names;
});

/** The second line of a People row: "Raised · 3 min", "Presenting", or the ⋯ menu's flags. */
export function participantSubline(p: Participant, now: number): string {
  const parts: string[] = [];
  if (p.handRaisedAt !== null) parts.push(`Raised · ${formatAgo(p.handRaisedAt, now)}`);
  if (p.isPresenter) parts.push('Presenting');
  if (p.unmuteRequested) parts.push('Asked to unmute');
  if (p.isModerator && p.role === 'student') parts.push('Moderator');
  if (p.hasWhiteboard) parts.push('Whiteboard');
  if (p.chatLocked) parts.push('Chat locked');
  return parts.join(' · ');
}

/**
 * Webcam tiles in priority order (the canvas notes): the speakers, then the
 * raised hands by longest wait, then everyone with a camera, then the rest.
 * The caller slices to what fits and shows "+N more" for the remainder.
 */
export const selectTileOrder = memo((s): Participant[] => {
  const rank = (p: Participant) => {
    if (p.audio === 'speaking') return 0;
    if (p.handRaisedAt !== null) return 1;
    if (p.camera) return 2;
    return 3;
  };
  return [...s.participants].sort((a, b) => {
    const d = rank(a) - rank(b);
    if (d !== 0) return d;
    if (a.handRaisedAt !== null && b.handRaisedAt !== null) return a.handRaisedAt - b.handRaisedAt;
    return 0;
  });
});

// ---------- session ----------

export const selectElapsed = (s: RoomState) => formatElapsed(s.clock.now - s.session.startedAt);

// ---------- chat ----------

const notFromSelf = (s: RoomState) => {
  const me = selectSelf(s)?.id;
  return (m: ChatMessage) => !m.read && m.from !== me;
};

export const selectUnreadEveryone = memo((s) => s.chat.everyone.filter(notFromSelf(s)).length);

export const selectUnreadDirect = memo((s) => {
  const unread = notFromSelf(s);
  return s.chat.direct.reduce((n, t) => n + t.messages.filter(unread).length, 0);
});

/** The Chat button's badge: every unread message, public and private. */
export const selectUnreadTotal = (s: RoomState) => selectUnreadEveryone(s) + selectUnreadDirect(s);

export interface DirectSummary {
  thread: DirectThread;
  person: Participant | null;
  last: ChatMessage | null;
  unread: number;
  /** "You: …" when the last message is ours. */
  preview: string;
}

/** The Direct list: newest conversation first, threads without messages (just opened) at the top. */
export const selectDirectList = memo((s): DirectSummary[] => {
  const me = selectSelf(s)?.id;
  const unread = notFromSelf(s);
  return s.chat.direct
    .map((thread) => {
      const last = thread.messages[thread.messages.length - 1] ?? null;
      return {
        thread,
        person: s.participants.find((p) => p.id === thread.with) ?? null,
        last,
        unread: thread.messages.filter(unread).length,
        preview: last ? `${last.from === me ? 'You: ' : ''}${last.text}` : '',
      };
    })
    .sort(
      (a, b) => (b.last?.sentAt ?? Number.POSITIVE_INFINITY) - (a.last?.sentAt ?? Number.POSITIVE_INFINITY),
    );
});

export const selectOpenThread = memo((s): DirectThread | null =>
  s.ui.dm === null ? null : (s.chat.direct.find((t) => t.with === s.ui.dm) ?? null),
);

/**
 * Whether the local person may start a private conversation with `id`
 * (owner decision 2026-10-30): always while private chat is on; with it
 * off, only when one of the two is a moderator. The People row hides
 * "Message privately" when this is false, so a student sees none.
 */
export const selectCanMessage = (id: ParticipantId) => (s: RoomState) => {
  const me = selectSelf(s);
  return me !== null && me.id !== id && canMessagePrivately(s, me.id, id);
};

// ---------- reactions ----------

/** Each person's latest reaction that is still alive at the room time (`REACTION_LIFETIME`). */
export const selectReactions = memo((s): Record<ParticipantId, ReactionKind> => {
  const out: Record<ParticipantId, ReactionKind> = {};
  for (const r of s.reactions.items) {
    if (s.clock.now - r.sentAt < REACTION_LIFETIME) out[r.from] = r.kind;
  }
  return out;
});

// ---------- alerts ----------

export type Alert =
  | { id: string; kind: 'hands'; count: number; text: string; longest: Participant | null }
  | { id: string; kind: 'question'; from: Participant | null; text: string; messageId: string }
  | { id: string; kind: 'insight'; count: number; text: string }
  | { id: string; kind: 'help'; count: number; text: string; request: HelpRequest }
  | { id: string; kind: 'back'; count: number; text: string };

/**
 * The session header's pills, in the canvas order: raised hands, questions,
 * the engagement insight. The accessible name starts with this `text` (D4).
 * While rooms are live, open help requests come first; after they close,
 * the "Breakouts ended" pill. The hands pill counts the students' hands,
 * never your own: you know you raised it, and the toggle says so.
 */
export const selectAlerts = memo((s): Alert[] => {
  const alerts: Alert[] = [];
  const { breakouts } = s;
  if (breakouts.phase === 'live') {
    const open = sortedHelpQueue(breakouts.helpQueue).filter((h) => h.acknowledgedAt === null);
    if (open.length > 0) {
      alerts.push({
        id: `help-${open[0].id}`,
        kind: 'help',
        count: open.length,
        request: open[0],
        text:
          open.length === 1
            ? `Room ${open[0].roomIndex + 1} asked for help`
            : `${open.length} rooms asked for help`,
      });
    }
  }
  if (breakouts.phase === 'back') {
    const count = selectRooms(s).length;
    alerts.push({
      id: 'back',
      kind: 'back',
      count,
      text: `Breakouts ended · ${count} ${count === 1 ? 'room’s' : 'rooms’'} work saved`,
    });
  }
  const hands = selectRaisedHands(s).filter((p) => !p.isSelf);
  if (hands.length > 0) {
    alerts.push({
      id: 'hands',
      kind: 'hands',
      count: hands.length,
      text: `${hands.length} raised`,
      longest: hands[0],
    });
  }
  const names = selectDisplayNames(s);
  for (const a of s.alerts) {
    const from = s.participants.find((p) => p.id === a.from) ?? null;
    const message = s.chat.everyone.find((m) => m.id === a.messageId);
    if (message && message.read) continue;
    alerts.push({
      id: a.id,
      kind: 'question',
      from,
      messageId: a.messageId,
      text: `${from ? names[from.id] : 'Someone'} asked`,
    });
  }
  const low = selectLowEngagement(s);
  if (low.length > 0)
    alerts.push({ id: 'insight', kind: 'insight', count: low.length, text: `${low.length} low engagement` });
  return alerts;
});

// ---------- presentation ----------

export const selectDeck = memo((s) => s.presentation.decks[s.presentation.deckIndex] ?? null);
export const selectSlideCount = (s: RoomState) => selectDeck(s)?.slides.length ?? 0;
/** "3 / 12". */
export const selectSlideLabel = (s: RoomState) =>
  selectSlideCount(s) === 0 ? '0 / 0' : `${s.presentation.slideIndex + 1} / ${selectSlideCount(s)}`;

// ---------- poll ----------

export const selectPollAnswered = (s: RoomState) => s.poll.votes.reduce((a, b) => a + b, 0);
/** Everyone who can answer: the students. */
export const selectPollEligible = (s: RoomState) => s.participants.filter((p) => p.role === 'student').length;
/** One row per answer with its count and share (`pollResults`), for the panel and the stage card. */
export const selectPollResults = memo((s) => pollResults(s.poll));
/** Whether "Ask the class" can go ahead: a question and at least two answers, none blank. */
export const selectCanStartPoll = (s: RoomState) => canStartPoll(s.poll);

// ---------- timer ----------

/** Seconds left on the class timer at the current room time. */
export const selectTimerLeft = (s: RoomState): number => {
  const { timer, clock } = s;
  if (timer.phase === 'running' && timer.endsAt !== null)
    return Math.max(0, (timer.endsAt - clock.now) / SECOND);
  return timer.leftSec;
};

// ---------- breakouts ----------

export const selectRooms = memo((s): Room[] => buildRooms(s.participants, s.breakouts));
export const selectRoomsHelpFirst = memo((s) => helpFirst(selectRooms(s)));
export const selectRoomsUneven = (s: RoomState) => isUneven(selectRooms(s));
export const selectHelpQueue = memo((s) => sortedHelpQueue(s.breakouts.helpQueue));
export const selectOpenHelp = memo((s) => selectHelpQueue(s).filter((h) => h.acknowledgedAt === null));
export const selectPeekedRoom = (s: RoomState): Room | null =>
  s.breakouts.peek === null ? null : (selectRooms(s)[s.breakouts.peek] ?? null);
export const selectRoomOnStage = (s: RoomState): Room | null =>
  s.breakouts.onStage === null ? null : (selectRooms(s)[s.breakouts.onStage] ?? null);
export const selectMovingStudent = (s: RoomState) => selectParticipant(s.breakouts.moving)(s);

/** The room the teacher joined from a preview (B8), or `null` in the main room. */
export const selectJoinedRoom = (s: RoomState): Room | null =>
  s.breakouts.joined === null ? null : (selectRooms(s)[s.breakouts.joined] ?? null);

/**
 * A room's chat (B8): its own messages plus what the teacher sent to every
 * room, oldest first. A factory, so memoize the selector per room with
 * `useMemo` as the People list does with `selectPeople`.
 */
export const selectRoomMessages = (roomIndex: number) =>
  memo((s): RoomMessage[] =>
    s.breakouts.messages.filter((m) => m.roomIndex === roomIndex || m.roomIndex === null),
  );

export interface TalkTime {
  participant: Participant;
  /** Seconds talked in the room. */
  seconds: number;
  /** This person's share of the room's talking, 0–1, for the bar. */
  share: number;
}

/** "Talk time" in the preview: each member's seconds and share of the room's total, in member order. */
export function roomTalkTime(room: Room, talkTime: Record<ParticipantId, number>): TalkTime[] {
  const seconds = room.members.map((m) => talkTime[m.id] ?? 0);
  const total = seconds.reduce((a, b) => a + b, 0);
  return room.members.map((participant, i) => ({
    participant,
    seconds: seconds[i],
    share: total === 0 ? 0 : seconds[i] / total,
  }));
}

/** "9 min", "40 s", "Quiet so far". */
export function formatTalkTime(seconds: number): string {
  if (seconds <= 0) return 'Quiet so far';
  if (seconds < 60) return `${Math.round(seconds)} s`;
  return `${Math.round(seconds / 60)} min`;
}

/** Seconds left in the rooms, or `null` when they are not open. */
export const selectBreakoutTimeLeft = (s: RoomState): number | null => {
  const { breakouts, clock } = s;
  if (breakouts.phase !== 'live' || breakouts.openedAt === null) return null;
  const total = (breakouts.durationMin + breakouts.extraMin) * MINUTE;
  return Math.max(0, (breakouts.openedAt + total - clock.now) / SECOND);
};

/** Seconds left in the closing countdown, or `null` when rooms are not closing. */
export const selectClosingLeft = (s: RoomState): number | null => {
  const { closingEndsAt } = s.breakouts;
  return closingEndsAt === null ? null : Math.max(0, (closingEndsAt - s.clock.now) / SECOND);
};

/**
 * The line under a room's name (BO5): what the room is doing, from data
 * (B3). `names` is `selectDisplayNames(state)`, so two Anas read "Ana S.
 * and Ana F. are talking" (B9).
 */
export function roomStatus(
  room: Room,
  phase: RoomState['breakouts']['phase'],
  now: number,
  names: Record<ParticipantId, string>,
): string {
  if (phase === 'back') {
    const label = {
      board: 'Shared whiteboard',
      doc: 'Shared notes',
      quiz: 'Practice quiz',
      slide: 'Your slides',
    }[room.work];
    return `${label} saved`;
  }
  if (room.members.length === 0) return 'Empty';
  if (room.help) return `Asked for help · ${formatAgo(room.help.askedAt, now)}`;
  const a = room.activity;
  if (!a) return `Quiet since the rooms opened`;
  switch (a.kind) {
    case 'talking': {
      const who = room.members.slice(0, 2).map((m) => names[m.id] ?? firstName(m.name));
      return who.length === 1 ? `${who[0]} is talking` : `${who.join(' and ')} are talking`;
    }
    case 'quiet':
      return `Quiet for ${formatAgo(a.since, now)}`;
    case 'drawing':
      return 'Drawing on the board';
    case 'typing':
      return 'Typing in notes';
    case 'answering':
      return 'Answering a question';
    case 'done':
      return 'Done · waiting';
  }
}

/** The featured Plugins card subtitles, from state (X15). */
export const selectPluginSubtitles = memo((s): Record<string, string> => {
  const rooms = selectRooms(s).length;
  const answered = selectPollAnswered(s);
  return {
    breakouts:
      s.breakouts.phase === 'live'
        ? `${rooms} rooms live`
        : s.breakouts.phase === 'back'
          ? `${rooms} rooms closed`
          : `${rooms} rooms set up`,
    poll:
      s.poll.phase === 'live'
        ? `${answered} answered`
        : s.poll.phase === 'off'
          ? 'Not started'
          : '1 draft ready',
    timer: s.timer.phase === 'running' ? 'Running' : 'Not running',
  };
});
