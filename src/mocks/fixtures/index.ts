/**
 * `createRoom(options)` builds a complete `RoomState` from the fixtures.
 * Routes call it with the artboard's props mapped on top (src/routes);
 * stories and tests call it directly.
 */
import { breakoutStudents, roundRobin } from '../breakouts';
import { MINUTE } from '../time';
import type {
  BreakoutState,
  Deck,
  PluginsState,
  PollState,
  PresentationState,
  RoomState,
  TimerState,
  UiState,
} from '../types';
import { chatFor, emptyChat, questionAlerts } from './chat';
import { FIXTURE_NOW, FIXTURE_STARTED_AT, participantFixtures, type ParticipantFixture } from './participants';

export { chatFor, emptyChat, questionAlerts } from './chat';
export * from './participants';

/** The canvas's deck (Focus.dc.html 1086) and the two others in the Share media picker. */
export const decks: Deck[] = [
  {
    file: 'bbb-4-refined.pdf',
    slides: [
      'Hack Week: Brazil 2026',
      'Agenda',
      'BigBlueButton 4.0, refined',
      'What we heard',
      'Make state visible',
      'Label the controls',
      'Fix the dead ends',
      'Presentation view',
      'Scalable UI',
      'Open questions',
      'Next steps',
      'Thank you',
    ],
  },
  { file: 'hack-week-kickoff.pdf', slides: ['Hack Week kickoff', 'Teams', 'Schedule'] },
  { file: 'research-readout.pdf', slides: ['Research readout', 'Method', 'Findings', 'Next'] },
];

export const defaultPresentation: PresentationState = {
  decks,
  deckIndex: 0,
  slideIndex: 2,
  minimized: false,
  overviewOpen: false,
  share: 'none',
  screenKind: 'Entire screen',
  screenShared: false,
  tool: 'pen',
};

/** The canvas poll (Focus.dc.html 970–972), multiple choice. */
export const defaultPoll: PollState = {
  phase: 'off',
  question: 'Which change makes it easiest to see who is muted?',
  options: ['Grey icons for muted', 'A red badge on everyone', 'Hide the mic icon', 'Text under each name'],
  votes: [6, 1, 0, 2],
  shown: false,
  anonymous: true,
};

export const defaultTimer: TimerState = {
  phase: 'off',
  durationSec: 300,
  leftSec: 300,
  endsAt: null,
  minimized: false,
};

export const defaultPlugins: PluginsState = {
  featured: [
    { id: 'breakouts', label: 'Breakout rooms', description: 'Split the class into rooms' },
    { id: 'poll', label: 'Poll', description: 'Ask the class a question' },
    { id: 'timer', label: 'Timer', description: 'A countdown everyone sees' },
  ],
  more: [
    { id: 'qa', label: 'Q&A board', description: 'Collect and upvote questions' },
    { id: 'quiz', label: 'Quiz', description: 'Quick graded questions' },
    { id: 'wordcloud', label: 'Word cloud', description: 'Gather one-word answers' },
    { id: 'picker', label: 'Random picker', description: 'Pick a person or a group' },
  ],
  open: false,
};

export const defaultUi: UiState = {
  layout: 'bar',
  panel: 'none',
  scope: 'everyone',
  dm: null,
  peopleFilter: 'all',
  peopleMenu: null,
  mediaOpen: false,
  mediaType: 'slides',
  analyticsTipShown: false,
  breakoutsOpen: false,
  orientation: 'portrait',
  sheet: 'none',
  sheetStudent: null,
  annotating: false,
  reacting: false,
};

export interface BreakoutFixtureOptions {
  roomCount?: number;
  mode?: BreakoutState['mode'];
}

/**
 * Breakouts in setup, 4 rooms, round-robin over the students in joining
 * order. The live room activity below is the canvas's (Breakout.dc.html
 * 411–419), keyed by room index, with the talking room's names coming from
 * its members; a help request is data in `helpQueue` (B3), added by the
 * route props or an action.
 */
export function breakoutsFor(state: Pick<RoomState, 'participants'>, options: BreakoutFixtureOptions = {}): BreakoutState {
  const students = breakoutStudents(state.participants).map((s) => s.id);
  const roomCount = options.roomCount ?? 4;
  return {
    phase: 'setup',
    mode: options.mode ?? 'groups',
    roomCount,
    assignment: 'even',
    durationMin: 10,
    extraMin: 0,
    options: { sendSlide: true, canReturn: true, autoReturn: true, record: false },
    seed: 1,
    assignments: roundRobin(students, roomCount),
    moves: {},
    moving: null,
    openedAt: null,
    peek: null,
    view: 'rooms',
    closingEndsAt: null,
    onStage: null,
    helpQueue: [],
    activity: {
      0: { kind: 'talking', since: FIXTURE_NOW - 2 * MINUTE },
      2: { kind: 'quiet', since: FIXTURE_NOW - 4 * MINUTE },
      3: { kind: 'drawing', since: FIXTURE_NOW - MINUTE },
      4: { kind: 'typing', since: FIXTURE_NOW - MINUTE },
      5: { kind: 'done', since: FIXTURE_NOW - 3 * MINUTE },
    },
    work: { 0: 'board', 1: 'doc', 2: 'quiz', 3: 'board', 4: 'slide', 5: 'doc' },
    listening: false,
  };
}

export interface CreateRoomOptions {
  participants?: ParticipantFixture;
  chat?: 'default' | 'empty';
  breakouts?: BreakoutFixtureOptions;
  /** Overrides merged last, for a screen's own state. */
  ui?: Partial<UiState>;
}

export function createRoom(options: CreateRoomOptions = {}): RoomState {
  const participants = participantFixtures[options.participants ?? 'class'];
  const chat = options.chat === 'empty' ? emptyChat : chatFor(participants);
  const present = new Set(participants.map((p) => p.id));
  const messageIds = new Set(chat.everyone.map((m) => m.id));
  return {
    session: { title: 'Hack Week: Brazil 2026', recording: true, startedAt: FIXTURE_STARTED_AT },
    clock: { now: FIXTURE_NOW },
    participants,
    chat,
    presentation: defaultPresentation,
    poll: defaultPoll,
    timer: defaultTimer,
    plugins: defaultPlugins,
    alerts: questionAlerts.filter((a) => present.has(a.from) && messageIds.has(a.messageId)),
    breakouts: breakoutsFor({ participants }, options.breakouts),
    ui: { ...defaultUi, ...options.ui },
  };
}
