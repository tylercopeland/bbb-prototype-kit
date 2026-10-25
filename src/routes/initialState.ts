/**
 * Maps an artboard's props (the `<dc-import>` state in `docs/artboards.md`)
 * to the store's initial state, so every screen can be deep-linked. Query
 * parameters override the props (`?panel=people&pfilter=low`), and a few
 * extra ones pick the fixture: `people=one|four|class|thirty|longNames|
 * duplicateNames`, `chat=empty`, `clock=live`.
 *
 * Wherever the store has an action for the prop, the mapping dispatches it,
 * so a deep link and a click produce the same state.
 */
import {
  createRoom,
  defaultPoll,
  MINUTE,
  participantFixtures,
  roomReducer,
  SECOND,
  selectRooms,
  type BreakoutMode,
  type BreakoutView,
  type ChatScope,
  type Layout,
  type MediaType,
  type MobileSheet,
  type Orientation,
  type Panel,
  type PeopleFilter,
  type ParticipantFixture,
  type RoomAction,
  type RoomState,
} from '../mocks';
import type { Artboard } from './artboards';

export type Props = Record<string, string>;

/** Query keys that choose the fixture and the clock instead of a prop. */
export interface RouteOptions {
  people: ParticipantFixture;
  chat: 'default' | 'empty';
  liveClock: boolean;
}

export const DEFAULT_ROUTE_OPTIONS: RouteOptions = { people: 'class', chat: 'default', liveClock: false };

const isFixture = (v: string): v is ParticipantFixture => v in participantFixtures;

const oneOf =
  <T extends string>(...values: T[]) =>
  (v: string): v is T =>
    (values as string[]).includes(v);

const layouts = oneOf<Layout>('bar', 'frame', 'corners', 'command');
const panels = oneOf<Panel | 'hub'>('none', 'chat', 'people', 'notes', 'hub', 'poll');
const scopes = oneOf<ChatScope>('everyone', 'direct');
const filters = oneOf<PeopleFilter>('all', 'hands', 'low');
const mediaTypes = oneOf<MediaType>('slides', 'video', 'screen', 'audio', 'url', 'more');
const modes = oneOf<BreakoutMode>('groups', 'solo');
const views = oneOf<BreakoutView>('rooms', 'main');
const orientations = oneOf<Orientation>('portrait', 'landscape');
const sheets = oneOf<MobileSheet>('none', 'people', 'chat', 'student', 'more', 'react', 'alerts', 'cams', 'slides');

/** The canvas's live breakout timings: rooms opened 1:18 ago, help asked 1 min ago. */
const ROOMS_OPEN_FOR = MINUTE + 18 * SECOND;
const HELP_ASKED_AGO = MINUTE;
/** The canvas's running timer shows 3:42 left of 5:00. */
const TIMER_LEFT_SEC = 222;

/** Every prop the mapping understands, by board, so a test can prove the artboard list uses nothing else. */
export const KNOWN_PROPS: Record<string, readonly string[]> = {
  Focus: ['layout', 'panel', 'scope', 'dm', 'pfilter', 'pmenu', 'share', 'overview', 'media', 'mtype', 'plugins', 'lxtip', 'poll', 'timer', 'presmin', 'presctl'],
  Breakout: ['phase', 'mode', 'rooms', 'moving', 'peek', 'view', 'closing', 'onstage'],
  Mobile: ['orient', 'presmin', 'annot', 'sheet', 'pfilter'],
};

/** Splits the route query into fixture options and prop overrides. */
export function parseQuery(query: URLSearchParams | Props): { options: RouteOptions; props: Props } {
  const options = { ...DEFAULT_ROUTE_OPTIONS };
  const props: Props = {};
  const entries = query instanceof URLSearchParams ? Array.from(query.entries()) : Object.entries(query);
  for (const [key, value] of entries) {
    if (key === 'people' && isFixture(value)) options.people = value;
    else if (key === 'chat' && (value === 'empty' || value === 'default')) options.chat = value;
    else if (key === 'clock') options.liveClock = value === 'live';
    else props[key] = value;
  }
  return { options, props };
}

/** The state for an artboard, with `query` overriding its props. */
export function stateForArtboard(artboard: Artboard, query: URLSearchParams | Props = {}): RoomState {
  const { options, props } = parseQuery(query);
  return applyProps(createRoom({ participants: options.people, chat: options.chat }), { ...artboard.props, ...props }, artboard.board);
}

/** Applies props to a state, through the reducer where an action exists. Unknown props are ignored. */
export function applyProps(initial: RoomState, props: Props, board: string): RoomState {
  let state = initial;
  const run = (...actions: RoomAction[]) => {
    state = actions.reduce(roomReducer, state);
  };
  const get = (key: string) => props[key];

  // ---------- Focus and Mobile share the panel and People props ----------
  const layout = get('layout');
  if (layout !== undefined && layouts(layout)) state = { ...state, ui: { ...state.ui, layout } };
  const scope = get('scope');
  if (scope !== undefined && scopes(scope)) run({ type: 'setScope', scope });
  const panel = get('panel');
  if (panel !== undefined && panels(panel)) run({ type: 'setPanel', panel: panel === 'hub' ? 'none' : panel });
  const pfilter = get('pfilter');
  if (pfilter !== undefined && filters(pfilter)) {
    run({ type: 'setPeopleFilter', filter: pfilter });
    // The filter alone does not open the panel on a route; the panel prop does.
    if (panel === undefined && board !== 'Focus') state = { ...state, ui: { ...state.ui, panel: initial.ui.panel, sheet: initial.ui.sheet } };
  }
  const dm = get('dm');
  if (dm) run({ type: 'openDm', participantId: dm });
  const pmenu = get('pmenu');
  if (pmenu) run({ type: 'openPeopleMenu', participantId: pmenu });
  if (get('plugins') === 'open') run({ type: 'setPlugins', open: true });
  const mtype = get('mtype');
  if (get('media') === 'open') run({ type: 'setMediaPicker', open: true, mediaType: mtype && mediaTypes(mtype) ? mtype : undefined });
  else if (mtype && mediaTypes(mtype)) run({ type: 'setMediaType', mediaType: mtype });
  if (get('overview') === 'open') run({ type: 'setOverview', open: true });
  const share = get('share');
  if (share === 'screen' || share === 'deck') {
    run({ type: 'startScreenShare', screenKind: 'Entire screen' });
    if (share === 'deck') run({ type: 'setShare', share: 'deck' });
  }
  const presmin = get('presmin');
  if (presmin === 'yes' || presmin === 'min') run({ type: 'setPresentationMinimized', minimized: true });
  if (get('lxtip') === 'show') run({ type: 'setAnalyticsTip', shown: true });

  // ---------- poll ----------
  const poll = get('poll');
  if (poll === 'setup' || poll === 'live' || poll === 'shown') {
    run({ type: 'setupPoll' });
    if (poll !== 'setup') {
      run({ type: 'startPoll' });
      state = { ...state, poll: { ...state.poll, votes: defaultPoll.votes } };
      if (poll === 'shown') run({ type: 'showPollResults', shown: true });
    }
  }

  // ---------- timer ----------
  const timer = get('timer');
  if (timer === 'ready' || timer === 'running' || timer === 'min' || timer === 'done') {
    run({ type: 'addTimer' });
    if (timer === 'running' || timer === 'min') {
      state = { ...state, timer: { ...state.timer, leftSec: TIMER_LEFT_SEC } };
      run({ type: 'startTimer' });
      if (timer === 'min') run({ type: 'setTimerMinimized', minimized: true });
    }
    if (timer === 'done') state = { ...state, timer: { ...state.timer, phase: 'done', leftSec: 0, endsAt: null } };
  }

  // ---------- breakouts ----------
  if (board === 'Breakout') {
    run({ type: 'setBreakoutsOpen', open: true });
    const mode = get('mode');
    if (mode !== undefined && modes(mode)) run({ type: 'setBreakoutMode', mode });
    const rooms = get('rooms');
    if (rooms !== undefined) run({ type: 'setRoomCount', roomCount: Number(rooms) });
    const moving = get('moving');
    if (moving) run({ type: 'startMove', participantId: moving });
    const phase = get('phase');
    if (phase === 'live' || phase === 'back') {
      run({ type: 'openRooms' });
      state = { ...state, breakouts: { ...state.breakouts, openedAt: state.clock.now - ROOMS_OPEN_FOR } };
      // The canvas's help request (B3): room 2 in groups, room 3 in solo mode, asked a minute ago.
      const helpRoom = state.breakouts.mode === 'solo' ? 2 : 1;
      const room = selectRooms(state)[helpRoom];
      if (room) {
        run({ type: 'requestHelp', roomIndex: helpRoom, from: room.members[0]?.id });
        state = {
          ...state,
          breakouts: {
            ...state.breakouts,
            helpQueue: state.breakouts.helpQueue.map((h) => ({ ...h, askedAt: state.clock.now - HELP_ASKED_AGO })),
          },
        };
      }
      const peek = get('peek');
      if (peek !== undefined && peek !== '') run({ type: 'peekRoom', roomIndex: Number(peek) });
      if (get('closing') === 'yes') run({ type: 'closeRooms' });
      if (phase === 'back') {
        run({ type: 'bringEveryoneBack' });
        const onstage = get('onstage');
        if (onstage !== undefined && onstage !== '') run({ type: 'showRoomOnStage', roomIndex: Number(onstage) });
      }
    }
    const view = get('view');
    if (view !== undefined && views(view)) run({ type: 'setBreakoutView', view });
  }

  // ---------- mobile ----------
  if (board === 'Mobile') {
    const orient = get('orient');
    if (orient !== undefined && orientations(orient)) run({ type: 'setOrientation', orientation: orient });
    const sheet = get('sheet');
    if (sheet !== undefined && sheets(sheet)) {
      run({ type: 'setSheet', sheet, student: sheet === 'student' ? 'anton' : null });
      if (sheet === 'react') run({ type: 'setReacting', reacting: true });
    }
    if (get('annot') === 'on') run({ type: 'setAnnotating', annotating: true });
  }

  return state;
}
