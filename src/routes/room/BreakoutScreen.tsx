/**
 * The breakout surface (Breakout.dc.html 34–197, 324–335): what replaces
 * the stage while the breakout plugin is open. A row of two tabs switches
 * between the Presentation (the main room: the stage with a side card) and
 * the rooms (the setup board of `RoomCard`s with "Move to…" on every
 * student, or the live board with previews, Join and Show on stage); the
 * room preview and the closing countdown are dialogs over it. Every value
 * comes from the store and every change is a store action.
 *
 * Focus (WCAG 2.4.3): a moved student's chip remounts in another card, so
 * the board refocuses it by id; a preview opened on load (BO6, BO8) returns
 * focus to the room's preview button; "Back to slides" unmounts itself and
 * lands on that room's share-back row; "Bring everyone back now" lands on
 * the first share-back row; "Even out" unmounts itself and lands on
 * "Shuffle evenly".
 */
import { useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react';
import { ToggleButton as RacToggleButton, type Key } from 'react-aria-components';
import {
  Button,
  ClosingCountdown,
  Dialog,
  FocusFallback,
  RoomCard,
  RoomPreview,
  RoomWork,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  type MoveTarget,
} from '../../components';
import { Icon } from '../../icons';
import { breakoutStudents } from '../../mocks/breakouts';
import { useRoom, useRoomDispatch } from '../../mocks/context';
import {
  roomStatus,
  roomTalkTime,
  selectBreakoutTimeLeft,
  selectClosingLeft,
  selectDisplayNames,
  selectRoomMessages,
  selectRoomOnStage,
  selectRooms,
  selectRoomsUneven,
  selectSelf,
  selectSlideLabel,
} from '../../mocks/selectors';
import { formatCountdown } from '../../mocks/time';
import type { ParticipantId } from '../../mocks/types';
import { tv } from '../../styles/tv';
import { SHARE_BACK_ROWS, boardColumns } from './breakoutView';
import { useRoomFocus } from './focus';

const breakoutScreenStyles = tv({
  slots: {
    root: 'flex min-h-0 min-w-0 flex-1 flex-col gap-3',
    tabs: 'min-h-0 flex-1 gap-3',
    header: 'flex min-h-control-md flex-wrap items-center gap-3',
    /** Wide enough for "Presentation 3 / 12" and "13 rooms live · 8:42" side by side without truncating. */
    tabList: 'w-96 shrink-0',
    hint: 'min-w-0 truncate text-sm text-text-muted',
    grow: 'flex-1',
    note: 'flex h-control-sm shrink-0 items-center gap-1 rounded-full border border-border bg-surface px-3 text-xs font-semibold text-text-secondary',
    panel: 'flex min-h-0 flex-1 flex-col',
    /** The board: a grid of room cards that scrolls. */
    board: 'grid min-h-0 flex-1 list-none content-start gap-3 overflow-y-auto p-0 pr-1',
    /** The main view: the stage, then the side card. */
    main: 'flex min-h-0 flex-1 gap-4',
    side: 'flex w-60 shrink-0 flex-col gap-3',
    card: 'flex flex-col gap-2 rounded-lg border border-border bg-surface p-3 text-text',
    dashedCard: 'flex flex-col gap-2 rounded-lg border border-dashed border-border-control p-3 text-text',
    cardTitle: 'text-md font-bold',
    cardText: 'text-sm leading-5 text-text-secondary',
    kicker: 'pt-1 text-2xs font-bold tracking-label text-text-muted uppercase',
    shareList: 'flex list-none flex-col gap-1 p-0',
    /** The room's work on the stage (BO12). */
    stage: 'flex min-h-0 flex-1 flex-col gap-3',
    stageChrome: 'flex min-h-control-md items-center gap-3',
    stagePill: 'flex h-control-sm items-center gap-2 rounded-full bg-surface-overlay px-3 text-sm font-semibold text-text-on-stage',
    stageFit: '@container relative flex min-h-0 min-w-0 flex-1 items-center justify-center',
    stageWork: 'slide-fit overflow-hidden rounded-tile shadow-overlay',
    dot: 'size-2 shrink-0 rounded-xs',
  },
  variants: {
    columns: {
      2: { board: 'grid-cols-2' },
      3: { board: 'grid-cols-3' },
      4: { board: 'grid-cols-4' },
      5: { board: 'grid-cols-5' },
      6: { board: 'grid-cols-6' },
    },
    color: {
      1: { dot: 'bg-room-1' },
      2: { dot: 'bg-room-2' },
      3: { dot: 'bg-room-3' },
      4: { dot: 'bg-room-4' },
      5: { dot: 'bg-room-5' },
      6: { dot: 'bg-room-6' },
      7: { dot: 'bg-room-7' },
      8: { dot: 'bg-room-8' },
    },
  },
  defaultVariants: { columns: 4, color: 1 },
});

/** A share-back row (Breakout.dc.html 98): a toggle named "Show Room N on stage"; selected shows the check. */
const shareRowStyles = tv({
  base: 'flex h-control-md w-full items-center gap-2 rounded-control border border-border bg-surface px-2 text-left text-sm font-semibold text-text focus-ring outline-none data-hovered:bg-surface-sunken data-pressed:bg-surface-sunken data-selected:border-selected-border data-selected:bg-selected data-selected:text-selected-text data-selected:selected-ring data-selected:data-hovered:bg-selected data-selected:data-pressed:bg-selected',
});

const shareRowPartsStyles = tv({
  slots: {
    name: 'min-w-0 flex-1 truncate',
    check: 'shrink-0 text-accent',
  },
  variants: {
    isSelected: {
      true: {},
      false: { check: 'invisible' },
    },
  },
  defaultVariants: { isSelected: false },
});

export interface BreakoutScreenProps {
  /** The stage as the room renders it (the slide and the webcams), shown in the main view. */
  stage: ReactNode;
  /** "Keep rooms open" in the panel's countdown banner, where a dismissed closing dialog leaves focus. */
  keepOpenRef?: RefObject<HTMLButtonElement | null>;
}

export function BreakoutScreen({ stage, keepOpenRef }: BreakoutScreenProps) {
  const dispatch = useRoomDispatch();
  const { requestFocus, takeFocus } = useRoomFocus();
  const breakouts = useRoom((s) => s.breakouts);
  const rooms = useRoom(selectRooms);
  const uneven = useRoom(selectRoomsUneven);
  const names = useRoom(selectDisplayNames);
  const participants = useRoom((s) => s.participants);
  const now = useRoom((s) => s.clock.now);
  const timeLeft = useRoom(selectBreakoutTimeLeft);
  const closingLeft = useRoom(selectClosingLeft);
  const onStage = useRoom(selectRoomOnStage);
  const slideLabel = useRoom(selectSlideLabel);
  const me = useRoom(selectSelf);
  const closingDismissed = useRoom((s) => s.ui.closingNoticeDismissed);
  const peekIndex = breakouts.peek ?? -1;
  const peekMessages = useRoom(useMemo(() => selectRoomMessages(peekIndex), [peekIndex]));
  const { phase, mode, view } = breakouts;
  const studentCount = breakoutStudents(participants).length;
  const fullNames = useMemo(() => Object.fromEntries(participants.map((p) => [p.id, p.name])), [participants]);
  const peeked = breakouts.peek === null ? null : (rooms[breakouts.peek] ?? null);

  // Refs the focus rules need: member chips by student, preview buttons and share rows by room.
  const memberButtons = useRef(new Map<ParticipantId, HTMLButtonElement>());
  const previewButtons = useRef(new Map<number, HTMLButtonElement>());
  const shareRows = useRef(new Map<number, HTMLButtonElement>());
  const backToSlidesFrom = useRef<number | null>(null);

  // A moved student's chip remounted in another card: keep focus on the student (B2).
  useEffect(() => {
    const request = takeFocus('breakoutStudent');
    if (request) memberButtons.current.get(request.participantId)?.focus();
  }, [breakouts.moves, takeFocus]);
  // Everyone is back: the first share-back row takes focus, after the dialog's exit.
  useEffect(() => {
    if (phase === 'back' && takeFocus('shareBack')) {
      setTimeout(() => shareRows.current.get(rooms[0]?.index ?? 0)?.focus(), 0);
    }
  }, [phase, rooms, takeFocus]);
  // The preview closed and nothing took focus (it was open on load, BO6 and BO8, so there was no
  // press to return to): the room's preview button takes it, a tick later so React Aria's own
  // restore goes first when it has somewhere to go.
  const lastPeek = useRef<number | null>(null);
  useEffect(() => {
    if (breakouts.peek !== null) {
      lastPeek.current = breakouts.peek;
      return;
    }
    const index = lastPeek.current;
    lastPeek.current = null;
    if (index === null) return;
    const timer = setTimeout(() => {
      if (document.activeElement === null || document.activeElement === document.body) {
        previewButtons.current.get(index)?.focus();
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [breakouts.peek]);
  // "Back to slides" unmounted itself: the room's share-back row takes focus.
  useEffect(() => {
    if (breakouts.onStage === null && backToSlidesFrom.current !== null) {
      shareRows.current.get(backToSlidesFrom.current)?.focus();
      backToSlidesFrom.current = null;
    }
  }, [breakouts.onStage]);
  // "Even out" unmounts itself once the rooms are even: "Shuffle evenly" beside it takes focus.
  const shuffleButton = useRef<HTMLButtonElement>(null);
  const evenedOut = useRef(false);
  useEffect(() => {
    if (!uneven && evenedOut.current) {
      evenedOut.current = false;
      shuffleButton.current?.focus();
    }
  }, [uneven]);

  const styles = breakoutScreenStyles({ columns: boardColumns(phase, mode, rooms.length) });
  const moveTargets: MoveTarget[] = rooms.map((r) => ({ index: r.index, name: r.name, count: r.members.length }));
  const movingName = breakouts.moving ? names[breakouts.moving] : null;

  // The live tab's name is stable ("4 rooms live"); the ticking time beside it is visual only (X10).
  const roomsTabLabel =
    phase === 'back'
      ? `Room work · ${rooms.length}`
      : phase === 'live'
        ? `${rooms.length} rooms live`
        : 'Breakout setup';

  const hint =
    phase === 'back'
      ? view === 'main'
        ? onStage
          ? `Everyone sees ${onStage.name}’s work`
          : 'Everyone is back · room work saved'
        : 'Pick a room’s work to show everyone'
      : view === 'main'
        ? phase === 'live'
          ? breakouts.options.sendSlide
            ? 'Every room can see this slide'
            : 'Only you are in the main room'
          : 'Rooms aren’t open yet · setup is saved'
        : phase === 'setup'
          ? mode === 'solo'
            ? 'One student per room'
            : movingName
              ? `Pick a room for ${movingName}`
              : 'Choose a student to move them'
          : mode === 'solo'
            ? 'Open any room for a closer look'
            : 'Open a room to preview it';

  const onView = (key: Key) => dispatch({ type: 'setBreakoutView', view: key === 'main' ? 'main' : 'rooms' });

  const showOnStage = (roomIndex: number, show: boolean) =>
    dispatch({ type: 'showRoomOnStage', roomIndex: show ? roomIndex : null });

  const setUpNewRooms = () => {
    requestFocus({ kind: 'breakoutSetup' });
    dispatch({ type: 'setUpNewRooms' });
  };

  const closing = closingLeft !== null;
  const closingOpen = closing && !closingDismissed;

  return (
    <div className={styles.root()}>
      <Tabs selectedKey={view} onSelectionChange={onView} className={styles.tabs()}>
        <div className={styles.header()}>
          <TabList label="What you’re looking at" className={styles.tabList()}>
            <Tab id="main">{`Presentation ${slideLabel}`}</Tab>
            <Tab id="rooms" detail={phase === 'live' ? formatCountdown(timeLeft ?? 0) : undefined}>
              {roomsTabLabel}
            </Tab>
          </TabList>
          <p className={styles.hint()}>{hint}</p>
          <span className={styles.grow()} />
          {view === 'rooms' && phase === 'setup' && mode === 'groups' && (
            <>
              {uneven && (
                <Button
                  size="sm"
                  icon="evenOut"
                  onPress={() => {
                    evenedOut.current = true;
                    dispatch({ type: 'evenOutRooms' });
                  }}
                >
                  Rooms are uneven · Even out
                </Button>
              )}
              <Button ref={shuffleButton} size="sm" icon="shuffle" onPress={() => dispatch({ type: 'shuffleRooms' })}>
                Shuffle evenly
              </Button>
            </>
          )}
          {view === 'rooms' && phase === 'live' && (
            <p className={styles.note()}>
              <Icon name="preview" size="xs" />
              Silent previews · students see when you watch
            </p>
          )}
        </div>

        <TabPanel id="main" className={styles.panel()}>
          <div className={styles.main()}>
            {phase === 'back' && onStage ? (
              <section aria-label={`${onStage.name} on stage`} className={styles.stage()}>
                <div className={styles.stageChrome()}>
                  <span className={styles.stagePill()}>
                    <span aria-hidden="true" className={breakoutScreenStyles({ color: onStage.color as 1 }).dot()} />
                    {onStage.name} · shown to everyone
                  </span>
                  <Button
                    size="sm"
                    onPress={() => {
                      backToSlidesFrom.current = onStage.index;
                      showOnStage(onStage.index, false);
                    }}
                  >
                    Back to slides
                  </Button>
                </div>
                <div className={styles.stageFit()}>
                  <RoomWork kind={onStage.work} size="full" className={styles.stageWork()} />
                </div>
              </section>
            ) : (
              stage
            )}
            <div className={styles.side()}>
              {phase === 'back' ? (
                <section aria-label="Everyone is back" className={styles.card()}>
                  <h3 className={styles.cardTitle()}>Everyone is back</h3>
                  <p className={styles.cardText()}>
                    All {studentCount} {studentCount === 1 ? 'student is' : 'students are'} in the main room. Each
                    room’s board, notes and chat are saved to Shared notes.
                  </p>
                  <p className={styles.kicker()}>Share back</p>
                  <ul aria-label="Share back" className={styles.shareList()}>
                    {rooms.slice(0, SHARE_BACK_ROWS).map((r) => {
                      const selected = breakouts.onStage === r.index;
                      const parts = shareRowPartsStyles({ isSelected: selected });
                      return (
                        <li key={r.index}>
                          <RacToggleButton
                            ref={(el) => {
                              if (el) shareRows.current.set(r.index, el);
                              else shareRows.current.delete(r.index);
                            }}
                            aria-label={`Show ${r.name} on stage`}
                            isSelected={selected}
                            onChange={(show) => showOnStage(r.index, show)}
                            className={shareRowStyles()}
                          >
                            <span aria-hidden="true" className={breakoutScreenStyles({ color: r.color as 1 }).dot()} />
                            <span className={parts.name()}>{r.name}</span>
                            <Icon name="check" size="sm" className={parts.check()} />
                          </RacToggleButton>
                        </li>
                      );
                    })}
                  </ul>
                  {rooms.length > SHARE_BACK_ROWS && (
                    <Button variant="ghost" size="sm" onPress={() => onView('rooms')}>
                      See all {rooms.length} rooms’ work
                    </Button>
                  )}
                  <Button onPress={setUpNewRooms}>Set up new rooms</Button>
                </section>
              ) : (
                <section aria-label="Main room" className={styles.dashedCard()}>
                  <h3 className={styles.cardTitle()}>Main room</h3>
                  <p className={styles.cardText()}>
                    {phase === 'live'
                      ? `Students are in ${rooms.length} rooms. Help requests still appear at the top.`
                      : 'Setup is saved. Open rooms whenever you are ready.'}
                  </p>
                  <Button variant="primary" onPress={() => onView('rooms')}>
                    {phase === 'live' ? 'Back to rooms' : 'Back to setup'}
                  </Button>
                </section>
              )}
            </div>
          </div>
        </TabPanel>

        <TabPanel id="rooms" className={styles.panel()}>
          <ul aria-label="Rooms" className={styles.board()}>
            {rooms.map((room) =>
              phase === 'setup' ? (
                <RoomCard
                  key={room.index}
                  room={room}
                  names={names}
                  variant="setup"
                  density={mode === 'solo' ? 'compact' : 'default'}
                  moveTargets={mode === 'groups' ? moveTargets : undefined}
                  movingId={breakouts.moving}
                  onMoveMenuOpenChange={(participantId, open) =>
                    dispatch(open ? { type: 'startMove', participantId } : { type: 'cancelMove' })
                  }
                  onMove={(participantId, roomIndex) => {
                    requestFocus({ kind: 'breakoutStudent', participantId });
                    dispatch({ type: 'moveParticipant', participantId, roomIndex });
                  }}
                  memberRef={(id, el) => {
                    if (el) memberButtons.current.set(id, el);
                    else memberButtons.current.delete(id);
                  }}
                />
              ) : (
                <RoomCard
                  key={room.index}
                  room={room}
                  names={names}
                  variant={phase}
                  density={mode === 'solo' ? 'compact' : 'default'}
                  status={roomStatus(room, phase, now, names)}
                  isPeeked={breakouts.peek === room.index}
                  isJoined={breakouts.joined === room.index}
                  isOnStage={breakouts.onStage === room.index}
                  onPreview={() => dispatch({ type: 'peekRoom', roomIndex: room.index })}
                  onJoin={() => dispatch({ type: 'joinRoom', roomIndex: room.index })}
                  onShowOnStage={(show) => showOnStage(room.index, show)}
                  previewRef={(el) => {
                    if (el) previewButtons.current.set(room.index, el);
                    else previewButtons.current.delete(room.index);
                  }}
                />
              ),
            )}
          </ul>
        </TabPanel>
      </Tabs>

      {peeked && phase === 'live' && (
        <RoomPreview
          room={peeked}
          roomCount={rooms.length}
          names={names}
          status={roomStatus(peeked, phase, now, names)}
          talk={roomTalkTime(peeked, breakouts.talkTime)}
          messages={peekMessages}
          fullNames={fullNames}
          selfId={me?.id ?? null}
          solo={mode === 'solo'}
          isListening={breakouts.listening}
          onListeningChange={(listening) => dispatch({ type: 'setListening', listening })}
          onPrevious={() => dispatch({ type: 'peekRoom', roomIndex: (peeked.index - 1 + rooms.length) % rooms.length })}
          onNext={() => dispatch({ type: 'peekRoom', roomIndex: (peeked.index + 1) % rooms.length })}
          onSend={(text) => me && dispatch({ type: 'sendRoomMessage', roomIndex: peeked.index, from: me.id, text })}
          onJoin={() => dispatch({ type: 'joinRoom', roomIndex: peeked.index })}
          isOpen
          onOpenChange={(open) => {
            if (!open) dispatch({ type: 'peekRoom', roomIndex: null });
          }}
        />
      )}

      {phase === 'live' && (
        <Dialog
          isOpen={closingOpen}
          onOpenChange={(open) => {
            if (!open) dispatch({ type: 'dismissClosingNotice' });
          }}
          kicker="Wrapping up"
          kickerTone="hand"
          title="Closing rooms"
          description="Students see a countdown so they can finish their thought. Boards, notes and room chat are saved to Shared notes automatically."
        >
          <FocusFallback target={keepOpenRef} />
          <ClosingCountdown
            variant="dialog"
            leftSec={closingLeft ?? 0}
            onKeepOpen={() => {
              requestFocus({ kind: 'closeRooms' });
              dispatch({ type: 'keepRoomsOpen' });
            }}
            onBringBack={() => {
              requestFocus({ kind: 'shareBack' });
              dispatch({ type: 'bringEveryoneBack' });
            }}
          />
        </Dialog>
      )}
    </div>
  );
}
