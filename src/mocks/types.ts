/**
 * The mock room state: the one source of meeting state every screen reads
 * (CLAUDE.md › Routes and state). It is plain data, so the reducer stays pure
 * and a fixture is a literal. Times are milliseconds on the room clock
 * (`clock.now`), never `Date.now()`, so a route renders the same at any
 * wall-clock time and tests can move time with the `tick` action.
 */

export type ParticipantId = string;

/** Teachers are moderators and start as the presenter; students are viewers. */
export type Role = 'teacher' | 'student';

/**
 * The audio column of the People list (decision 2026-10-23, Option A):
 * `live` (mic on, quiet), `speaking`, `muted`, `listening` (listen-only) and
 * `notJoined` (has not joined audio). Each has its own icon, never color alone.
 */
export type AudioState = 'live' | 'speaking' | 'muted' | 'listening' | 'notJoined';

export type EngagementLevel = 'ok' | 'low';

export interface Engagement {
  level: EngagementLevel;
  /** The insight's reason, for a low level ("Camera off · quiet for 22 min"). */
  note?: string;
}

export interface Participant {
  id: ParticipantId;
  name: string;
  role: Role;
  /** The person using this client (the teacher on every artboard). */
  isSelf: boolean;
  audio: AudioState;
  camera: boolean;
  /** When the hand went up, on the room clock; `null` while it is down. */
  handRaisedAt: number | null;
  isPresenter: boolean;
  /** Moderator rights: every teacher, plus students promoted from the ⋯ menu. */
  isModerator: boolean;
  /** Whiteboard access granted from the ⋯ menu. */
  hasWhiteboard: boolean;
  /** Public chat locked for this person from the ⋯ menu. */
  chatLocked: boolean;
  /** A teacher asked this muted person to unmute. */
  unmuteRequested: boolean;
  engagement: Engagement;
}

export interface ChatMessage {
  id: string;
  from: ParticipantId;
  sentAt: number;
  text: string;
  /** Read by the local user. Messages they sent are always read. */
  read: boolean;
}

export interface DirectThread {
  /** The other person. */
  with: ParticipantId;
  messages: ChatMessage[];
}

export interface ChatState {
  everyone: ChatMessage[];
  /** One thread per person, in the order they were opened. */
  direct: DirectThread[];
  /** The last message number the reducer handed out; ids are `m-${seq}`. Kept here so the reducer stays pure. */
  seq: number;
}

export type Panel = 'none' | 'people' | 'chat' | 'notes' | 'poll';
export type ChatScope = 'everyone' | 'direct';
export type PeopleFilter = 'all' | 'hands' | 'low';
export type ShareKind = 'none' | 'screen' | 'deck';
export type ScreenKind = 'Entire screen' | 'A window' | 'A browser tab';
export type MediaType = 'slides' | 'video' | 'screen' | 'audio' | 'url' | 'more';
export type Layout = 'bar' | 'frame' | 'corners' | 'command';

export interface Deck {
  file: string;
  /** Slide titles, in order. The count is this array's length. */
  slides: string[];
}

export interface PresentationState {
  decks: Deck[];
  /** Index into `decks`. */
  deckIndex: number;
  /** Zero-based; the UI shows `slideIndex + 1`. */
  slideIndex: number;
  minimized: boolean;
  overviewOpen: boolean;
  /** What the stage shows while something is shared. */
  share: ShareKind;
  screenKind: ScreenKind;
  /** A screen share is running even while the deck is on stage (M2). */
  screenShared: boolean;
  tool: WhiteboardTool;
  /** The whiteboard ink. */
  color: InkColor;
}

export type WhiteboardTool = 'select' | 'pen' | 'highlighter' | 'shapes' | 'text' | 'eraser';

/**
 * The whiteboard inks, named by the token each one draws with (`text`,
 * `accent`, `danger-text`, `status-live-text`, `status-hand-text`,
 * `insight-text`), so every swatch reads on the toolbar in every mode. The
 * canvas's one orange swatch (Focus.dc.html 122) is `amber`.
 */
export type InkColor = 'ink' | 'blue' | 'red' | 'green' | 'amber' | 'purple';

export type PollPhase = 'off' | 'setup' | 'live' | 'ended';

/** The answer presets of the poll builder (Focus.dc.html 977; X8: a radio group, not toggles). `poll.ts` has their labels and options. */
export type PollType = 'choice' | 'yesno' | 'tf' | 'rate';

/** The switches under "More options" (Focus.dc.html 980). */
export type PollSetting = 'anonymous' | 'liveResults' | 'multipleAnswers';

export interface PollState {
  phase: PollPhase;
  type: PollType;
  question: string;
  /** Editable for `choice`; the other types have fixed options (`POLL_TYPES`). */
  options: string[];
  /** Votes per option, same length as `options`. */
  votes: number[];
  /** Results are on the stage for everyone. */
  shown: boolean;
  anonymous: boolean;
  /** Students see results as they come in. */
  liveResults: boolean;
  /** Allow more than one answer. */
  multipleAnswers: boolean;
}

export type TimerPhase = 'off' | 'ready' | 'running' | 'paused' | 'done';

/**
 * A corner of the stage's overlay layer (D1): where a floating card sits.
 * The timer defaults to the top right, the reserved corner the slide's
 * title block keeps clear of.
 */
export type StageCorner = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

export interface TimerState {
  phase: TimerPhase;
  /** Seconds the timer was set to. */
  durationSec: number;
  /** Seconds left when it was last paused or set; while running, derive from `endsAt`. */
  leftSec: number;
  /** Room-clock time the timer reaches zero, while running. */
  endsAt: number | null;
  minimized: boolean;
  /** Where the card or pill sits; moved by keyboard from "Move to corner" (D1). */
  corner: StageCorner;
}

export interface PluginEntry {
  id: string;
  label: string;
  /** The second line in the Plugins list ("Collect and upvote questions"). */
  description: string;
}

export interface PluginsState {
  /** The three big cards: breakout rooms, poll and timer. Their subtitles are derived. */
  featured: PluginEntry[];
  more: PluginEntry[];
  open: boolean;
}

/** Alerts that are not derivable from the rest of the state (raised hands and low engagement are). */
export interface QuestionAlert {
  id: string;
  kind: 'question';
  from: ParticipantId;
  messageId: string;
}

export type StoredAlert = QuestionAlert;

export type BreakoutPhase = 'setup' | 'live' | 'back';
export type BreakoutMode = 'groups' | 'solo';
export type BreakoutAssignment = 'even' | 'choose';
export type BreakoutView = 'rooms' | 'main';

export interface HelpRequest {
  id: string;
  roomIndex: number;
  /** Who asked, when known (solo rooms always know). */
  from: ParticipantId | null;
  askedAt: number;
  acknowledgedAt: number | null;
}

/** What a room is doing, shown under its name; it comes from data (B3), never from the room's index. */
export type RoomActivityKind = 'talking' | 'quiet' | 'drawing' | 'typing' | 'answering' | 'done';

export interface RoomActivity {
  kind: RoomActivityKind;
  /** When the activity started (for "Quiet for 4 min"). */
  since: number;
}

export type RoomWorkKind = 'board' | 'doc' | 'quiz' | 'slide';

export interface BreakoutOptions {
  sendSlide: boolean;
  canReturn: boolean;
  autoReturn: boolean;
  record: boolean;
}

/**
 * A message in a room's chat (B8: the preview's "Message Room 2" and the
 * panel's "Message every room" are real inputs). `roomIndex` is `null` for
 * a message the teacher sent to every room.
 */
export interface RoomMessage {
  id: string;
  roomIndex: number | null;
  from: ParticipantId;
  sentAt: number;
  text: string;
}

export interface BreakoutState {
  phase: BreakoutPhase;
  mode: BreakoutMode;
  /** Rooms in `groups` mode, `MIN_ROOMS..MAX_ROOMS`. Solo mode has one room per student. */
  roomCount: number;
  assignment: BreakoutAssignment;
  durationMin: number;
  /** Minutes added with "+5 min" while live. */
  extraMin: number;
  options: BreakoutOptions;
  /** The shuffle seed; `1` is the joining order, each shuffle adds one. */
  seed: number;
  /** The automatic assignment, one room index per student; rebuilt by shuffle, even out and room-count changes. */
  assignments: Record<ParticipantId, number>;
  /** Manual moves on top of `assignments`; they survive shuffle, even out and room-count changes (B4). */
  moves: Record<ParticipantId, number>;
  /** The student being moved (BO3). */
  moving: ParticipantId | null;
  /** Room-clock time the rooms opened, while live or back. */
  openedAt: number | null;
  /** Room index being previewed. */
  peek: number | null;
  view: BreakoutView;
  /** Room-clock time the closing countdown ends; `null` while rooms are not closing. */
  closingEndsAt: number | null;
  /** Room whose work is on the main stage after the rooms closed. */
  onStage: number | null;
  helpQueue: HelpRequest[];
  /** The last help-request number handed out; ids are `help-${helpSeq}`. */
  helpSeq: number;
  /** Per room index; a room without an entry is quiet since it opened. */
  activity: Record<number, RoomActivity>;
  /** Per room index; a room without an entry is on the shared whiteboard. */
  work: Record<number, RoomWorkKind>;
  /** The teacher is listening in on the previewed room. */
  listening: boolean;
  /** The room the teacher joined from a preview (B8), while live; `null` in the main room. */
  joined: number | null;
  /** Room chat, every room's messages in one list; ids are `rm-${messageSeq}`. */
  messages: RoomMessage[];
  messageSeq: number;
  /** Seconds each student has talked in their room, for the preview's "Talk time". */
  talkTime: Record<ParticipantId, number>;
}

export type Orientation = 'portrait' | 'landscape';
export type MobileSheet =
  'none' | 'people' | 'chat' | 'student' | 'more' | 'react' | 'alerts' | 'cams' | 'slides';

export interface UiState {
  layout: Layout;
  panel: Panel;
  scope: ChatScope;
  /** The open direct thread, in the chat panel. */
  dm: ParticipantId | null;
  peopleFilter: PeopleFilter;
  /** The person whose ⋯ menu is open. */
  peopleMenu: ParticipantId | null;
  mediaOpen: boolean;
  mediaType: MediaType;
  /** The Learning Analytics tooltip is pinned open (O1). */
  analyticsTipShown: boolean;
  /** The breakout surface replaces the Focus stage (BO2 onwards). */
  breakoutsOpen: boolean;
  /** Mobile. */
  orientation: Orientation;
  sheet: MobileSheet;
  /** The student sheet's subject (MB4). */
  sheetStudent: ParticipantId | null;
  annotating: boolean;
  /** Reactions bar open (MB6). */
  reacting: boolean;
}

export interface SessionState {
  title: string;
  recording: boolean;
  /** Room-clock time the session started. */
  startedAt: number;
  /**
   * Students may start private conversations (owner decision 2026-10-30,
   * the "Private chat" switch in Room settings). Off, students see no
   * "Message privately" and cannot message each other, while a moderator
   * can still message a student and the student can reply in that thread.
   */
  privateChat: boolean;
}

/** The reaction tray's set, shared with the phone (Mobile.dc.html 470; P8). */
export type ReactionKind = 'thumbsUp' | 'clap' | 'laugh' | 'surprised' | 'love' | 'celebrate';

export interface Reaction {
  id: string;
  from: ParticipantId;
  kind: ReactionKind;
  /** When it was sent, on the room clock; it shows for `REACTION_LIFETIME`. */
  sentAt: number;
}

export interface ReactionsState {
  items: Reaction[];
  /** The last reaction number handed out; ids are `r-${seq}`. */
  seq: number;
}

export interface ClockState {
  /** The room clock, in milliseconds; moved only by the `tick` action. */
  now: number;
}

export interface RoomState {
  session: SessionState;
  clock: ClockState;
  participants: Participant[];
  chat: ChatState;
  presentation: PresentationState;
  poll: PollState;
  timer: TimerState;
  plugins: PluginsState;
  alerts: StoredAlert[];
  breakouts: BreakoutState;
  reactions: ReactionsState;
  ui: UiState;
}
