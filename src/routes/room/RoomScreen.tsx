/**
 * The desktop room (the Focus board's `layout=bar`): the side panel on the
 * left when one is open, then the stage column with the session header and
 * alerts on top, the stage in the middle and the action bar at the bottom.
 * Every value comes from the store through `useRoom`; every change is a
 * store action, so a deep link and a click produce the same state. The F1,
 * G1–G5 and L1 artboards all render this screen in different states.
 *
 * Focus (WCAG 2.4.3): the screen holds one pending `FocusRequest` for the
 * chat flows whose pressed control unmounts, taken in `ChatPanel`. Closing
 * the panel returns focus to that panel's action-bar toggle here, and Leave
 * lands on the index page's heading.
 */
import { useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  ActionBar,
  AlertPill,
  SessionHeader,
  SidePanel,
  Stage,
  Surface,
  type ActionBarPanel,
  type StageLayout,
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
  selectRaisedHands,
  selectSelf,
  selectSlideCount,
  selectTileOrder,
  selectUnreadTotal,
  type Alert,
} from '../../mocks/selectors';
import { tv } from '../../styles/tv';
import { ChatPanel } from './ChatPanel';
import { RoomFocusContext, type FocusRequest, type FocusRequestKind, type RoomFocus } from './focus';
import { PeoplePanel } from './PeoplePanel';
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
  help: 'Opens the breakout rooms',
  back: 'Shows the rooms’ work',
};

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
  const raisedHands = useRoom(selectRaisedHands).length;
  const unread = useRoom(selectUnreadTotal);
  const me = useRoom(selectSelf);
  const tiles = useRoom(selectTileOrder);
  const names = useRoom(selectDisplayNames);
  const deck = useRoom(selectDeck);
  const slideCount = useRoom(selectSlideCount);
  const presentation = useRoom((s) => s.presentation);

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
    // help and back open the breakout surface in milestone 5.
  };

  const closePanel = () => {
    dispatch({ type: 'setPanel', panel: 'none' });
    // The close button unmounts with the panel: focus its toggle now, before the commit.
    // Poll has no bar button of its own; it opens from Plugins.
    const toggle = { people: peopleButton, chat: chatButton, notes: notesButton, poll: pluginsButton, none: null }[panel];
    toggle?.current?.focus();
  };

  return (
    <RoomFocusContext.Provider value={focus}>
      <div className={styles.root()}>
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
            <p className={styles.placeholder()}>Not built yet (milestone 5).</p>
          </SidePanel>
        )}
        <Surface kind="stage" className={styles.main()}>
          <div className={styles.top()}>
            <SessionHeader title={session.title} recording={session.recording} peopleCount={peopleCount} elapsed={elapsed} />
            {alerts.length > 0 && (
              <div aria-label="Alerts" role="group" className={styles.alerts()}>
                {alerts.map((a) => (
                  <AlertPill key={a.id} kind={a.kind} description={alertDescriptions[a.kind]} onPress={() => onAlert(a)}>
                    {a.text}
                  </AlertPill>
                ))}
              </div>
            )}
          </div>
          <Stage
            layout={layout}
            participants={tiles}
            names={names}
            webcams={panel === 'none' ? 'side' : 'top'}
            presentation={stagePresentation}
            share={share}
            onShowAll={() => dispatch({ type: 'setPanel', panel: 'people' })}
            onMinimize={() => dispatch({ type: 'setPresentationMinimized', minimized: true })}
            onRestore={() => dispatch({ type: 'setPresentationMinimized', minimized: false })}
            onShowingChange={(showing) => dispatch({ type: 'setShare', share: showing === 'screen' ? 'screen' : 'deck' })}
            className={styles.stage()}
          />
          <ActionBar
            panel={panel}
            pluginsOpen={pluginsOpen}
            raisedHands={raisedHands}
            unread={unread}
            audio={me?.audio ?? 'notJoined'}
            camera={me?.camera ?? false}
            handRaised={me?.handRaisedAt != null}
            isSharing={presentation.share !== 'none'}
            panelRefs={{ people: peopleButton, chat: chatButton, notes: notesButton, plugins: pluginsButton }}
            onTogglePanel={(p: ActionBarPanel) => dispatch({ type: 'togglePanel', panel: p })}
            onTogglePlugins={() => dispatch({ type: 'setPlugins', open: !pluginsOpen })}
            onJoinAudio={() => me && dispatch({ type: 'joinAudio', participantId: me.id })}
            onMicrophoneChange={(on) => me && dispatch({ type: 'setAudio', participantId: me.id, audio: on ? 'live' : 'muted' })}
            onCameraChange={(on) => me && dispatch({ type: 'setCamera', participantId: me.id, on })}
            onRaiseHandChange={(raised) => me && dispatch({ type: raised ? 'raiseHand' : 'lowerHand', participantId: me.id })}
            onLeave={() => void navigate('/')}
          />
        </Surface>
      </div>
    </RoomFocusContext.Provider>
  );
}
