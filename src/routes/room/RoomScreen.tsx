/**
 * The desktop room (the Focus board's `layout=bar`): the side panel on the
 * left when one is open, then the stage column with the session header and
 * alerts on top, the stage in the middle and the action bar at the bottom.
 * Every value comes from the store through `useRoom`; every change is a
 * store action, so a deep link and a click produce the same state. The F1,
 * G1–G5 and L1 artboards (milestone 4), M1, M2, H1, H2, N1, O1, O2 and
 * BO1 (milestone 5 batch A), PL1–PL3 and TM1–TM4 (batch B) and BO2–BO12
 * (batch C, where the breakout surface replaces the stage) all render this
 * screen in different states.
 *
 * Focus (WCAG 2.4.3): the screen holds one pending `FocusRequest` for the
 * chat flows whose pressed control unmounts, taken in `ChatPanel`. Closing
 * the panel returns focus to that panel's action-bar toggle here, and Leave
 * lands on the index page's heading. The pickers are popovers anchored to
 * their action-bar toggles, so closing one returns focus to its toggle.
 */
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  ActionBar,
  AlertPill,
  MediaPicker,
  PluginsMenu,
  PollResults,
  PresentationControls,
  RoomSettings,
  SessionHeader,
  SharePill,
  SidePanel,
  Stage,
  Surface,
  Timer,
  ToastRegion,
  showToast,
  type ActionBarPanel,
  type MediaAction,
  type StageLayout,
  type StageOverlays,
  type StagePresentation,
  type StageShare,
} from '../../components';
import { useRoom, useRoomDispatch } from '../../mocks/context';
import {
  selectAlerts,
  selectDeck,
  selectDisplayNames,
  selectElapsed,
  selectPeopleCount,
  selectPluginSubtitles,
  selectPollAnswered,
  selectPollEligible,
  selectPollResults,
  selectRaisedHands,
  selectReactions,
  selectSelf,
  selectSlideCount,
  selectTileOrder,
  selectTimerLeft,
  selectUnreadTotal,
  type Alert,
} from '../../mocks/selectors';
import { tv } from '../../styles/tv';
import { BreakoutPanel } from './BreakoutPanel';
import { BreakoutScreen } from './BreakoutScreen';
import { ChatPanel } from './ChatPanel';
import { RoomFocusContext, type FocusRequest, type FocusRequestKind, type RoomFocus } from './focus';
import { PeoplePanel } from './PeoplePanel';
import { PollPanel } from './PollPanel';
import { useRoomShortcuts } from './useRoomShortcuts';

const roomStyles = tv({
  slots: {
    root: 'flex h-dvh w-full overflow-hidden bg-surface-stage',
    main: 'flex min-w-0 flex-1 flex-col gap-3 bg-surface-stage px-6 pt-3 pb-4',
    top: 'flex min-h-control-lg items-center justify-between gap-6',
    alerts: 'flex min-w-0 shrink-0 items-center gap-2',
    stage: 'p-0',
    placeholder: 'p-4 text-sm text-text-muted',
  },
});

/** What pressing an alert opens, as its description (D4: the name stays the visible text). */
const alertDescriptions: Record<Alert['kind'], string> = {
  hands: 'Opens People',
  question: 'Opens Chat',
  insight: 'Opens People filtered to low engagement',
  help: 'Opens the room’s preview',
  back: 'Opens the rooms’ work',
};

/** What the prototype cannot do yet, said in a toast instead of a dead button. */
function notInPrototype(what: string) {
  showToast(
    { title: `${what} isn’t part of this prototype yet`, description: 'In BigBlueButton it opens here.' },
    { timeout: 6000 },
  );
}

export function RoomScreen() {
  const styles = roomStyles();
  const dispatch = useRoomDispatch();
  const navigate = useNavigate();
  useRoomShortcuts();

  const session = useRoom((s) => s.session);
  const elapsed = useRoom(selectElapsed);
  const peopleCount = useRoom(selectPeopleCount);
  const alerts = useRoom(selectAlerts);
  const panel = useRoom((s) => s.ui.panel);
  const pluginsOpen = useRoom((s) => s.plugins.open);
  const plugins = useRoom((s) => s.plugins);
  const pluginSubtitles = useRoom(selectPluginSubtitles);
  const mediaOpen = useRoom((s) => s.ui.mediaOpen);
  const mediaType = useRoom((s) => s.ui.mediaType);
  const analyticsTip = useRoom((s) => s.ui.analyticsTipShown);
  const breakoutsOpen = useRoom((s) => s.ui.breakoutsOpen);
  const breakoutPhase = useRoom((s) => s.breakouts.phase);
  const breakoutView = useRoom((s) => s.breakouts.view);
  const raisedHands = useRoom(selectRaisedHands).length;
  const unread = useRoom(selectUnreadTotal);
  const me = useRoom(selectSelf);
  const tiles = useRoom(selectTileOrder);
  const names = useRoom(selectDisplayNames);
  const reactions = useRoom(selectReactions);
  const deck = useRoom(selectDeck);
  const slideCount = useRoom(selectSlideCount);
  const presentation = useRoom((s) => s.presentation);
  const poll = useRoom((s) => s.poll);
  const pollResults = useRoom(selectPollResults);
  const pollAnswered = useRoom(selectPollAnswered);
  const pollEligible = useRoom(selectPollEligible);
  const timer = useRoom((s) => s.timer);
  const timerLeft = useRoom(selectTimerLeft);

  // One pending focus request, written by a handler and taken by the target's mount effect.
  const pendingFocus = useRef<FocusRequest | null>(null);
  const requestFocus = useCallback((request: FocusRequest) => {
    pendingFocus.current = request;
  }, []);
  const takeFocus = useCallback(<K extends FocusRequestKind>(kind: K) => {
    const pending = pendingFocus.current;
    if (pending?.kind !== kind) return null;
    pendingFocus.current = null;
    return pending as Extract<FocusRequest, { kind: K }>;
  }, []);
  const focus = useMemo<RoomFocus>(() => ({ requestFocus, takeFocus }), [requestFocus, takeFocus]);

  // The action-bar toggles, so closing a panel can hand focus back to the one that opened it.
  const peopleButton = useRef<HTMLButtonElement>(null);
  const chatButton = useRef<HTMLButtonElement>(null);
  const notesButton = useRef<HTMLButtonElement>(null);
  const pluginsButton = useRef<HTMLButtonElement>(null);
  const mediaButton = useRef<HTMLButtonElement>(null);
  // The Poll panel's "Show results to everyone": the stage card's Hide lands there when the panel is open.
  const pollShowButton = useRef<HTMLButtonElement>(null);
  // The timer's "Move to corner": a move remounts the card in another corner slot, so the
  // new button takes focus once the move has rendered (WCAG 2.4.3).
  const timerMoveButton = useRef<HTMLButtonElement>(null);
  const timerMovePending = useRef(false);
  // The breakout panel's "Close all rooms" and the countdown banner's "Keep rooms open": where the
  // closing dialog leaves focus when it is cancelled or dismissed (WCAG 2.4.3).
  const closeRoomsButton = useRef<HTMLButtonElement>(null);
  const keepOpenButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!timerMovePending.current) return;
    timerMovePending.current = false;
    timerMoveButton.current?.focus();
  }, [timer.corner]);

  const stagePresentation: StagePresentation | undefined = deck
    ? {
        deckName: deck.file,
        slideTitle: deck.slides[presentation.slideIndex] ?? '',
        slideNumber: presentation.slideIndex + 1,
        slideCount,
      }
    : undefined;
  const layout: StageLayout = !deck
    ? 'grid'
    : presentation.minimized
      ? 'minimized'
      : presentation.share !== 'none'
        ? 'presenter'
        : 'presentation';
  const share: StageShare | undefined =
    presentation.share !== 'none'
      ? { kind: presentation.screenKind, showing: presentation.share === 'screen' ? 'screen' : 'slides' }
      : undefined;

  const onAlert = (alert: Alert) => {
    if (alert.kind === 'hands') dispatch({ type: 'setPanel', panel: 'people' });
    else if (alert.kind === 'question') dispatch({ type: 'setPanel', panel: 'chat' });
    else if (alert.kind === 'insight') dispatch({ type: 'setPeopleFilter', filter: 'low' });
    else if (alert.kind === 'help') {
      // The room that asked, in its preview (B3).
      dispatch({ type: 'setBreakoutsOpen', open: true });
      dispatch({ type: 'setBreakoutView', view: 'rooms' });
      dispatch({ type: 'peekRoom', roomIndex: alert.request.roomIndex });
    } else if (alert.kind === 'back') {
      dispatch({ type: 'setBreakoutsOpen', open: true });
      dispatch({ type: 'setBreakoutView', view: 'rooms' });
    }
  };

  /** Leave the breakout surface (the rooms keep running): Plugins, which opened it, takes focus (WCAG 2.4.3). */
  const closeBreakouts = () => {
    dispatch({ type: 'setBreakoutsOpen', open: false });
    pluginsButton.current?.focus();
  };

  const closePanel = () => {
    dispatch({ type: 'setPanel', panel: 'none' });
    // The close button unmounts with the panel: focus its toggle now, before the commit.
    // Poll has no bar button of its own; it opens from Plugins.
    const toggle = {
      people: peopleButton,
      chat: chatButton,
      notes: notesButton,
      poll: pluginsButton,
      none: null,
    }[panel];
    toggle?.current?.focus();
  };

  /** The poll's Close: the poll ends for good and the panel goes; Plugins, which opened it, takes focus (WCAG 2.4.3). */
  const closePoll = () => {
    dispatch({ type: 'closePoll' });
    pluginsButton.current?.focus();
  };

  /** Hide from the stage card: the card unmounts, so the panel's show button (or Plugins) takes focus. */
  const hidePollResults = () => {
    if (panel === 'poll') requestFocus({ kind: 'pollShow' });
    dispatch({ type: 'showPollResults', shown: false });
    if (panel !== 'poll') pluginsButton.current?.focus();
  };

  /** Remove the timer: the card unmounts, so Plugins, which added it, takes focus. */
  const removeTimer = () => {
    dispatch({ type: 'removeTimer' });
    pluginsButton.current?.focus();
  };

  /** The floating cards (D1): the poll results in the reserved top-right corner, the timer in its own. */
  const overlays: StageOverlays = {};
  if (poll.shown && (poll.phase === 'live' || poll.phase === 'ended')) {
    overlays.topRight = (
      <PollResults
        key="poll"
        variant="stage"
        question={poll.question}
        results={pollResults}
        answered={pollAnswered}
        eligible={pollEligible}
        phase={poll.phase}
        shown
        anonymous={poll.anonymous}
        onHide={hidePollResults}
      />
    );
  }
  if (timer.phase !== 'off') {
    overlays[timer.corner] = (
      <>
        {overlays[timer.corner]}
        <Timer
          key="timer"
          phase={timer.phase}
          leftSec={timerLeft}
          durationSec={timer.durationSec}
          corner={timer.corner}
          minimized={timer.minimized}
          onStart={() => dispatch({ type: 'startTimer' })}
          onPause={() => dispatch({ type: 'pauseTimer' })}
          onReset={() => dispatch({ type: 'resetTimer' })}
          onAddMinute={() => dispatch({ type: 'addTimerMinute' })}
          onDurationChange={(durationSec) => dispatch({ type: 'setTimerDuration', durationSec })}
          onCornerChange={(corner) => {
            timerMovePending.current = true;
            dispatch({ type: 'setTimerCorner', corner });
          }}
          moveButtonRef={timerMoveButton}
          onMinimizedChange={(minimized) => dispatch({ type: 'setTimerMinimized', minimized })}
          onRemove={removeTimer}
        />
      </>
    );
  }

  /** Every choice in the Share media picker (canvas notes › Share media). */
  const onMediaPick = (action: MediaAction) => {
    switch (action.type) {
      case 'deck':
        return dispatch({ type: 'selectDeck', index: action.index });
      case 'addDeck':
        return dispatch({ type: 'addDeck', file: action.file });
      case 'screen':
        return dispatch({ type: 'startScreenShare', screenKind: action.kind });
      case 'poll':
        dispatch({ type: 'setMediaPicker', open: false });
        return dispatch({ type: 'setupPoll' });
      case 'plugins':
        return dispatch({ type: 'setPlugins', open: true });
      case 'video':
      case 'audio':
      case 'url':
      case 'whiteboard':
        dispatch({ type: 'setMediaPicker', open: false });
        return notInPrototype(
          {
            video: 'Sharing a video',
            audio: 'Sharing computer audio',
            url: 'Opening a web page',
            whiteboard: 'A blank whiteboard',
          }[action.type],
        );
    }
  };

  /** A plugin from the Plugins picker: the three featured ones do something, the rest say so. */
  const onPluginPick = (id: string) => {
    if (id === 'breakouts') return dispatch({ type: 'setBreakoutsOpen', open: true });
    if (id === 'timer') return dispatch({ type: 'addTimer' });
    dispatch({ type: 'setPlugins', open: false });
    if (id === 'poll') return dispatch({ type: 'setupPoll' });
    const label = plugins.more.find((p) => p.id === id)?.label ?? 'That plugin';
    notInPrototype(label);
  };

  const controls =
    stagePresentation && deck && layout !== 'minimized' && share?.showing !== 'screen' ? (
      <PresentationControls
        deckName={deck.file}
        slides={deck.slides}
        slideIndex={presentation.slideIndex}
        overviewOpen={presentation.overviewOpen}
        onOverviewChange={(open) => dispatch({ type: 'setOverview', open })}
        onGoToSlide={(index) => dispatch({ type: 'goToSlide', index })}
        onPrevious={() => dispatch({ type: 'prevSlide' })}
        onNext={() => dispatch({ type: 'nextSlide' })}
        tool={presentation.tool}
        color={presentation.color}
        onToolChange={(tool) => dispatch({ type: 'setTool', tool })}
        onColorChange={(color) => dispatch({ type: 'setInkColor', color })}
      />
    ) : undefined;

  const stage = (
    <Stage
      layout={layout}
      participants={tiles}
      names={names}
      reactions={reactions}
      webcams={panel === 'none' ? 'side' : 'top'}
      presentation={stagePresentation}
      share={share}
      controls={controls}
      sharePill={
        share ? (
          <SharePill
            showing={share.showing}
            kind={share.kind}
            onStop={() => {
              dispatch({ type: 'stopShare' });
              // The pill unmounts with its button: Share media, which shows the share's state, takes focus (WCAG 2.4.3).
              mediaButton.current?.focus();
            }}
          />
        ) : undefined
      }
      onShowAll={() => dispatch({ type: 'setPanel', panel: 'people' })}
      onMinimize={() => dispatch({ type: 'setPresentationMinimized', minimized: true })}
      onRestore={() => dispatch({ type: 'setPresentationMinimized', minimized: false })}
      onShowingChange={(showing) => dispatch({ type: 'setShare', share: showing === 'screen' ? 'screen' : 'deck' })}
      overlays={overlays}
      className={styles.stage()}
    />
  );
  // The breakout panel shows while the rooms view is open and the rooms have not closed (Breakout.dc.html 458).
  const breakoutPanelOpen = breakoutsOpen && breakoutView === 'rooms' && breakoutPhase !== 'back';

  return (
    <RoomFocusContext.Provider value={focus}>
      <div className={styles.root()}>
        {panel === 'none' && breakoutPanelOpen && (
          <BreakoutPanel
            onClose={closeBreakouts}
            onPreview={(roomIndex) => dispatch({ type: 'peekRoom', roomIndex })}
            closeRoomsRef={closeRoomsButton}
            keepOpenRef={keepOpenButton}
          />
        )}
        {panel !== 'none' && (
          <SidePanel
            panel={panel}
            raisedHands={raisedHands}
            unread={unread}
            onPanelChange={(p) => dispatch({ type: 'setPanel', panel: p })}
            onClose={closePanel}
            people={<PeoplePanel />}
            chat={<ChatPanel />}
          >
            {panel === 'poll' ? (
              <PollPanel onClose={closePoll} showButtonRef={pollShowButton} />
            ) : (
              <p className={styles.placeholder()}>Not built yet (milestone 5).</p>
            )}
          </SidePanel>
        )}
        <Surface as="main" kind="stage" className={styles.main()}>
          <div className={styles.top()}>
            <SessionHeader
              title={session.title}
              recording={session.recording}
              peopleCount={peopleCount}
              elapsed={elapsed}
            />
            {alerts.length > 0 && (
              <div aria-label="Alerts" role="group" className={styles.alerts()}>
                {alerts.map((a) => (
                  <AlertPill
                    key={a.id}
                    kind={a.kind}
                    description={alertDescriptions[a.kind]}
                    onPress={() => onAlert(a)}
                  >
                    {a.text}
                  </AlertPill>
                ))}
              </div>
            )}
          </div>
          {breakoutsOpen ? <BreakoutScreen stage={stage} keepOpenRef={keepOpenButton} /> : stage}
          <ActionBar
            panel={panel}
            pluginsOpen={pluginsOpen}
            mediaOpen={mediaOpen}
            raisedHands={raisedHands}
            unread={unread}
            audio={me?.audio ?? 'notJoined'}
            camera={me?.camera ?? false}
            handRaised={me?.handRaisedAt != null}
            isSharing={presentation.share !== 'none'}
            analyticsTipOpen={analyticsTip}
            panelRefs={{
              people: peopleButton,
              chat: chatButton,
              notes: notesButton,
              plugins: pluginsButton,
              media: mediaButton,
            }}
            onTogglePanel={(p: ActionBarPanel) => dispatch({ type: 'togglePanel', panel: p })}
            onPluginsOpenChange={(open) => dispatch({ type: 'setPlugins', open })}
            onMediaOpenChange={(open) => dispatch({ type: 'setMediaPicker', open })}
            onJoinAudio={() => me && dispatch({ type: 'joinAudio', participantId: me.id })}
            onMicrophoneChange={(on) =>
              me && dispatch({ type: 'setAudio', participantId: me.id, audio: on ? 'live' : 'muted' })
            }
            onCameraChange={(on) => me && dispatch({ type: 'setCamera', participantId: me.id, on })}
            onRaiseHandChange={(raised) =>
              me && dispatch({ type: raised ? 'raiseHand' : 'lowerHand', participantId: me.id })
            }
            onReaction={(kind) => me && dispatch({ type: 'sendReaction', from: me.id, kind })}
            onAnalytics={() => notInPrototype('The Learning Analytics Dashboard')}
            onLeave={() => void navigate('/')}
            pluginsPicker={
              <PluginsMenu
                featured={plugins.featured}
                more={plugins.more}
                subtitles={pluginSubtitles}
                onPick={onPluginPick}
              />
            }
            mediaPicker={
              <MediaPicker
                decks={presentation.decks}
                deckIndex={presentation.deckIndex}
                mediaType={mediaType}
                onMediaTypeChange={(type) => dispatch({ type: 'setMediaType', mediaType: type })}
                onPick={onMediaPick}
              />
            }
            settings={
              <RoomSettings
                privateChat={session.privateChat}
                onPrivateChatChange={(on) => dispatch({ type: 'setPrivateChat', on })}
              />
            }
          />
        </Surface>
        <ToastRegion />
      </div>
    </RoomFocusContext.Provider>
  );
}
