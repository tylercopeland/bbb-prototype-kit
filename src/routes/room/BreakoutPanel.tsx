/**
 * The breakout panel (Breakout.dc.html 200–303): the white panel down the
 * left of the room while the breakout surface is open and the rooms view is
 * showing. In setup it holds `BreakoutSetup`; live, the time left with
 * "+5 min", the message-every-room field (B8), the help queue (B3), the
 * room list with a filter (B6) and the "Close all rooms" footer, which
 * becomes the closing countdown banner while the rooms close (B5). Every
 * value comes from the store and every change is a store action.
 *
 * Focus (WCAG 2.4.3): opening the rooms unmounts the setup panel, so "+5
 * min" takes focus; cancelling the countdown or leaving a joined room
 * remounts "Close all rooms", which takes it back; "Set up new rooms"
 * lands on the heading.
 */
import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type RefObject } from 'react';
import { Button as RacButton } from 'react-aria-components';
import {
  BreakoutSetup,
  Chip,
  ChipGroup,
  ClosingCountdown,
  Avatar,
  Button,
  HelpQueue,
  IconButton,
  TextField,
  Tooltip,
  sidePanelStyles,
  useTruncationTooltip,
} from '../../components';
import { Icon } from '../../icons';
import { breakoutStudents, type Room } from '../../mocks/breakouts';
import { useRoom, useRoomDispatch } from '../../mocks/context';
import {
  roomStatus,
  selectBreakoutTimeLeft,
  selectClosingLeft,
  selectDisplayNames,
  selectHelpQueue,
  selectJoinedRoom,
  selectRoomsHelpFirst,
  selectSelf,
} from '../../mocks/selectors';
import { formatCountdown } from '../../mocks/time';
import type { HelpRequest } from '../../mocks/types';
import { tv } from '../../styles/tv';
import { filterRooms, type RoomFilter } from './breakoutView';
import { useRoomFocus } from './focus';

const breakoutPanelStyles = tv({
  slots: {
    header: 'flex items-center gap-3 border-b border-border py-3 pr-2 pl-4',
    /** The amber plugin tile beside the title (Breakout.dc.html 203). */
    tile: 'flex size-9 shrink-0 items-center justify-center rounded-control bg-status-hand-soft text-status-hand-text',
    titles: 'flex min-w-0 flex-1 flex-col',
    title: 'truncate text-lg font-semibold text-text focus-ring outline-none',
    subtitle: 'truncate text-xs text-text-muted',
    live: 'flex h-6 shrink-0 items-center gap-1 rounded-full bg-status-live-soft px-2 text-xs font-bold text-status-live-text',
    liveDot: 'size-2 rounded-full bg-status-live-text',
    body: 'flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4',
    timeCard: 'flex items-center gap-3 rounded-lg bg-surface-sunken p-3',
    timeBody: 'flex min-w-0 flex-1 flex-col',
    time: 'text-xl font-bold text-text tabular-nums',
    timeNote: 'text-xs text-text-muted',
    joined: 'flex items-center gap-3 rounded-lg border border-selected-border bg-selected p-3 text-sm text-selected-text',
    joinedText: 'min-w-0 flex-1',
    group: 'flex flex-col gap-2',
    kicker: 'text-2xs font-bold tracking-label text-text-muted uppercase',
    form: 'flex items-end gap-2',
    field: 'min-w-0 flex-1',
    listHeader: 'flex flex-col gap-2',
    rooms: 'flex list-none flex-col gap-1 p-0',
    empty: 'px-2 py-3 text-sm text-text-muted',
    footer: 'flex flex-col gap-2 border-t border-border px-4 pt-3 pb-4',
    close: 'w-full',
    hint: 'text-center text-xs text-text-muted',
  },
});

/** A room row in the live list (Breakout.dc.html 288–294): the color mark, the name and status, the members. Pressing it previews the room. */
const roomRowStyles = tv({
  base: 'flex min-h-row w-full items-center gap-2 rounded-control px-2 py-1 text-left focus-ring outline-none data-hovered:bg-surface-sunken data-pressed:bg-surface-sunken',
  variants: {
    isPeeked: { true: 'bg-selected data-hovered:bg-selected data-pressed:bg-selected' },
    hasHelp: { true: 'bg-status-hand-soft' },
  },
});

const roomRowPartsStyles = tv({
  slots: {
    dot: 'size-2 shrink-0 rounded-xs',
    body: 'flex min-w-0 flex-1 flex-col',
    /** "Preview " before the room's name, for assistive technology only: the row's name is "Preview Room 2". */
    action: 'sr-only',
    name: 'truncate text-md font-semibold text-text',
    status: 'truncate text-xs text-text-muted',
    avatars: 'flex shrink-0',
    avatar: '-ml-1 rounded-full border-2 border-surface first:ml-0',
  },
  variants: {
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
    statusTone: {
      help: { status: 'font-semibold text-status-hand-text' },
      neutral: {},
    },
  },
  defaultVariants: { color: 1, statusTone: 'neutral' },
});

/** The live list's name follows its filter, so it is told apart from the board's "Rooms" list. */
const filterLabels: Record<RoomFilter, string> = {
  all: 'All rooms',
  help: 'Rooms that need help',
  quiet: 'Quiet rooms',
};

interface RoomRowProps {
  room: Room;
  status: string;
  isPeeked: boolean;
  onPreview?: () => void;
}

/**
 * A room row. Its name is "Preview Room 2" (the visible name with a hidden
 * "Preview" before it) and its status is its description, so a screen
 * reader hears "Asked for help · 1 min" after the name instead of losing
 * it. A cut-off name shows in full in a tooltip while the row is hovered
 * or focused (`useTruncationTooltip`, as the DM rows).
 */
function RoomRow({ room, status, isPeeked, onPreview }: RoomRowProps) {
  const statusId = useId();
  const parts = roomRowPartsStyles({ color: room.color as 1, statusTone: room.help ? 'help' : 'neutral' });
  const { labelRef, triggerRef, triggerProps, isOpen, onOpenChange } = useTruncationTooltip<HTMLButtonElement>();
  return (
    <RacButton
      {...triggerProps}
      ref={triggerRef}
      aria-describedby={statusId}
      onPress={onPreview}
      className={roomRowStyles({ isPeeked, hasHelp: room.help !== null && !isPeeked })}
    >
      <span aria-hidden="true" className={parts.dot()} />
      <span className={parts.body()}>
        <span className={parts.action()}>Preview</span>
        {/* The space keeps the name "Preview Room 2", not "PreviewRoom 2"; flex drops it visually. */}{' '}
        <span ref={labelRef} className={parts.name()}>
          {room.name}
        </span>
        <span id={statusId} aria-hidden="true" className={parts.status()}>
          {status}
        </span>
      </span>
      <span aria-hidden="true" className={parts.avatars()}>
        {room.members.slice(0, 3).map((m) => (
          <span key={m.id} className={parts.avatar()}>
            <Avatar aria-hidden="true" name={m.name} participantId={m.id} size="sm" />
          </span>
        ))}
      </span>
      <Tooltip label={room.name} triggerRef={triggerRef} isOpen={isOpen} onOpenChange={onOpenChange} />
    </RacButton>
  );
}

export interface BreakoutPanelProps {
  /** Close the panel and leave the breakout surface; the room moves focus to Plugins. */
  onClose?: () => void;
  /** Preview a room (the list rows and the help queue). */
  onPreview?: (roomIndex: number) => void;
  /** "Close all rooms", so the room's closing dialog can hand focus back to it. */
  closeRoomsRef?: RefObject<HTMLButtonElement | null>;
  /** "Keep rooms open" in the countdown banner, where a dismissed closing dialog leaves focus. */
  keepOpenRef?: RefObject<HTMLButtonElement | null>;
}

export function BreakoutPanel({ onClose, onPreview, closeRoomsRef, keepOpenRef }: BreakoutPanelProps) {
  const panel = sidePanelStyles();
  const styles = breakoutPanelStyles();
  const dispatch = useRoomDispatch();
  const { requestFocus, takeFocus } = useRoomFocus();
  const breakouts = useRoom((s) => s.breakouts);
  const studentCount = useRoom((s) => breakoutStudents(s.participants).length);
  const rooms = useRoom(selectRoomsHelpFirst);
  const names = useRoom(selectDisplayNames);
  const now = useRoom((s) => s.clock.now);
  const timeLeft = useRoom(selectBreakoutTimeLeft);
  const closingLeft = useRoom(selectClosingLeft);
  const helpQueue = useRoom(selectHelpQueue);
  const joined = useRoom(selectJoinedRoom);
  const me = useRoom(selectSelf);
  const [filter, setFilter] = useState<RoomFilter>('all');
  const [draft, setDraft] = useState('');

  const headingRef = useRef<HTMLHeadingElement>(null);
  const addTimeRef = useRef<HTMLButtonElement>(null);
  const ownCloseRef = useRef<HTMLButtonElement>(null);
  const closeRef = closeRoomsRef ?? ownCloseRef;
  const { phase } = breakouts;
  const closing = closingLeft !== null;

  // The live panel just replaced the setup panel: its first control takes focus.
  useEffect(() => {
    if (phase !== 'live' || !takeFocus('breakoutLive')) return;
    // After the confirm dialog's focus scope has let go (it restores on the next frame).
    const timer = setTimeout(() => addTimeRef.current?.focus(), 0);
    return () => clearTimeout(timer);
  }, [phase, takeFocus]);
  // "Close all rooms" came back (the countdown was cancelled, or the joined room left).
  useEffect(() => {
    if (phase === 'live' && !closing && takeFocus('closeRooms')) {
      // After the dialog's exit, so React Aria's own restore does not run first.
      setTimeout(() => closeRef.current?.focus(), 0);
    }
  }, [phase, closing, joined, closeRef, takeFocus]);
  // "Set up new rooms" replaced the back view with the setup panel: the heading takes focus.
  useEffect(() => {
    if (phase === 'setup' && takeFocus('breakoutSetup')) headingRef.current?.focus();
  }, [phase, takeFocus]);

  const subtitle =
    phase === 'setup'
      ? 'Set up · nothing is sent until you open rooms'
      : `${rooms.length} ${rooms.length === 1 ? 'room' : 'rooms'} · ${breakouts.durationMin + breakouts.extraMin} min`;

  const sendToAll = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!me || text.length === 0) return;
    dispatch({ type: 'sendRoomMessage', roomIndex: null, from: me.id, text });
    setDraft('');
  };

  const visibleRooms = useMemo(() => filterRooms(rooms, filter), [rooms, filter]);
  const counts = {
    all: rooms.length,
    help: filterRooms(rooms, 'help').length,
    quiet: filterRooms(rooms, 'quiet').length,
  };

  return (
    <aside aria-label="Breakout rooms" className={panel.root()}>
      <div className={styles.header()}>
        <span aria-hidden="true" className={styles.tile()}>
          <Icon name="breakouts" size="sm" />
        </span>
        <div className={styles.titles()}>
          <h2 ref={headingRef} tabIndex={-1} className={styles.title()}>
            Breakout rooms
          </h2>
          <p className={styles.subtitle()}>{subtitle}</p>
        </div>
        {phase === 'live' && (
          <span className={styles.live()}>
            <span aria-hidden="true" className={styles.liveDot()} />
            Live
          </span>
        )}
        <IconButton label="Close panel" icon="close" onPress={onClose} />
      </div>

      {phase === 'setup' && (
        <BreakoutSetup
          mode={breakouts.mode}
          roomCount={breakouts.roomCount}
          studentCount={studentCount}
          assignment={breakouts.assignment}
          durationMin={breakouts.durationMin}
          options={breakouts.options}
          onModeChange={(mode) => dispatch({ type: 'setBreakoutMode', mode })}
          onRoomCountChange={(roomCount) => dispatch({ type: 'setRoomCount', roomCount })}
          onAssignmentChange={(assignment) => dispatch({ type: 'setBreakoutAssignment', assignment })}
          onDurationChange={(durationMin) => dispatch({ type: 'setBreakoutDuration', durationMin })}
          onOptionChange={(option, value) => dispatch({ type: 'setBreakoutOption', option, value })}
          onOpen={() => {
            // The setup panel unmounts with its Open button: the live panel's first control takes focus.
            requestFocus({ kind: 'breakoutLive' });
            dispatch({ type: 'openRooms' });
          }}
        />
      )}

      {phase === 'live' && (
        <>
          <div className={styles.body()}>
            <div className={styles.timeCard()}>
              <div className={styles.timeBody()}>
                <span className={styles.time()}>{formatCountdown(timeLeft ?? 0)}</span>
                <span className={styles.timeNote()}>
                  {breakouts.options.autoReturn ? 'left · everyone returns automatically' : 'left'}
                </span>
              </div>
              <Button ref={addTimeRef} size="lg" onPress={() => dispatch({ type: 'addRoomTime' })}>
                +5 min
              </Button>
            </div>
            {joined && (
              <div role="group" aria-label="Your room" className={styles.joined()}>
                <span className={styles.joinedText()}>
                  You’re in {joined.name} · students see you there
                </span>
                <Button
                  size="sm"
                  onPress={() => {
                    // This button unmounts with the banner: "Close all rooms" takes focus.
                    requestFocus({ kind: 'closeRooms' });
                    dispatch({ type: 'leaveRoom' });
                  }}
                >
                  Leave room
                </Button>
              </div>
            )}
            <form onSubmit={sendToAll} className={styles.group()}>
              <p className={styles.kicker()}>Message every room</p>
              <div className={styles.form()}>
                <TextField
                  label="Message every room"
                  labelHidden
                  placeholder="e.g. “5 minutes left, pick one idea”"
                  value={draft}
                  onChange={setDraft}
                  className={styles.field()}
                />
                <IconButton type="submit" label="Send to all rooms" icon="send" variant="primary" size="lg" />
              </div>
            </form>
            <HelpQueue
              requests={helpQueue}
              names={names}
              now={now}
              onOpen={(request: HelpRequest) => onPreview?.(request.roomIndex)}
              onAcknowledge={(id) => dispatch({ type: 'acknowledgeHelp', id })}
              onClear={(id) => dispatch({ type: 'clearHelp', id })}
            />
            <div className={styles.listHeader()}>
              <ChipGroup
                label={breakouts.mode === 'solo' ? 'Rooms · help first' : 'Rooms'}
                density="compact"
                value={filter}
                onChange={(value) => setFilter(value as RoomFilter)}
              >
                <Chip value="all" density="compact" badge={{ count: counts.all, label: `${counts.all} rooms` }}>
                  All
                </Chip>
                <Chip value="help" density="compact" badge={{ count: counts.help, label: `${counts.help} rooms` }}>
                  Need help
                </Chip>
                <Chip value="quiet" density="compact" badge={{ count: counts.quiet, label: `${counts.quiet} rooms` }}>
                  Quiet
                </Chip>
              </ChipGroup>
              {visibleRooms.length === 0 ? (
                <p className={styles.empty()}>No rooms match this filter.</p>
              ) : (
                <ul aria-label={filterLabels[filter]} className={styles.rooms()}>
                  {visibleRooms.map((room) => (
                    <li key={room.index}>
                      <RoomRow
                        room={room}
                        status={roomStatus(room, phase, now, names)}
                        isPeeked={breakouts.peek === room.index}
                        onPreview={() => onPreview?.(room.index)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className={styles.footer()}>
            {closing ? (
              <ClosingCountdown
                leftSec={closingLeft}
                onKeepOpen={() => {
                  requestFocus({ kind: 'closeRooms' });
                  dispatch({ type: 'keepRoomsOpen' });
                }}
                onBringBack={() => {
                  requestFocus({ kind: 'shareBack' });
                  dispatch({ type: 'bringEveryoneBack' });
                }}
                keepOpenRef={keepOpenRef}
              />
            ) : (
              <>
                <Button
                  ref={closeRef}
                  tone="danger"
                  size="touch"
                  onPress={() => dispatch({ type: 'closeRooms' })}
                  className={styles.close()}
                >
                  Close all rooms
                </Button>
                <p className={styles.hint()}>Students get 60 seconds to wrap up.</p>
              </>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
