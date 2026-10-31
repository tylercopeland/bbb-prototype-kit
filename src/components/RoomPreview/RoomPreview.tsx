import { useState, type FormEvent, type Ref, type RefObject } from 'react';
import { Icon } from '../../icons';
import type { Room } from '../../mocks/breakouts';
import { formatTalkTime, type TalkTime } from '../../mocks/selectors';
import { formatTimeOfDay } from '../../mocks/time';
import type { ParticipantId, RoomMessage } from '../../mocks/types';
import { tv } from '../../styles/tv';
import { Button } from '../Button';
import { ChatMessage } from '../ChatMessage';
import { Dialog } from '../Dialog';
import { IconButton } from '../IconButton';
import { FocusFallback } from '../Popover';
import { RoomWork } from '../RoomWork';
import { TextField } from '../TextField';
import { ToggleButton } from '../ToggleButton';
import { VideoTile } from '../VideoTile';

/**
 * The room preview (Breakout.dc.html 146–197): a wide white dialog over the
 * stage with the room's work, its webcams, the talk time and the room chat,
 * and a footer to message or join the room. 952px wide (the canvas), the
 * dialog radius and shadow. The header row under the title holds the
 * previous / next room buttons, the "students see you're watching" note
 * and the Listen in toggle.
 */
export const roomPreviewStyles = tv({
  slots: {
    toolbar: 'flex flex-wrap items-center gap-2',
    note: 'flex h-control-sm items-center gap-1 rounded-full bg-surface-sunken px-3 text-sm font-semibold text-text-secondary',
    grow: 'flex-1',
    body: 'flex min-h-0 gap-4',
    main: 'flex min-w-0 flex-1 flex-col gap-3',
    work: 'overflow-hidden rounded-tile border border-border',
    tiles: 'flex flex-wrap gap-2',
    emptyTiles: 'rounded-control border border-dashed border-border-control px-3 py-2 text-sm text-text-muted',
    aside: 'flex w-62 shrink-0 flex-col gap-3',
    card: 'flex flex-col gap-2 rounded-lg border border-border p-3',
    chatCard: 'flex min-h-0 flex-1 flex-col gap-2 rounded-lg border border-border p-3',
    kicker: 'text-2xs font-bold tracking-label text-text-muted uppercase',
    talkList: 'flex list-none flex-col gap-2 p-0',
    talkRow: 'flex flex-col gap-1',
    talkText: 'flex justify-between gap-2 text-sm text-text',
    talkName: 'min-w-0 truncate',
    talkMinutes: 'shrink-0 text-text-muted',
    /** The bar is decoration: the minutes carry the meaning. */
    bar: 'h-2 w-full overflow-hidden rounded-full',
    barTrack: 'fill-surface-raised',
    barFill: 'fill-accent',
    soloNote: 'text-sm text-text-muted',
    messages: 'flex max-h-60 list-none flex-col gap-3 overflow-y-auto p-0',
    emptyChat: 'text-sm text-text-muted',
    form: 'flex w-full items-end gap-2',
    field: 'min-w-0 flex-1',
  },
});

export interface RoomPreviewProps {
  room: Room;
  /** How many rooms there are, for "Room 2 of 4". */
  roomCount: number;
  /** Short names (`selectDisplayNames`, B9) for the tiles, the talk time and the chat. */
  names: Record<ParticipantId, string>;
  /** The room's status line (`roomStatus`). */
  status: string;
  /** Each member's talk time (`roomTalkTime`). */
  talk: TalkTime[];
  /** The room's chat (`selectRoomMessages`). */
  messages: RoomMessage[];
  /** Full names by id, for the chat rows; people who left read "Someone who left". */
  fullNames: Record<ParticipantId, string>;
  /** The local person, whose messages are marked as theirs. */
  selfId: ParticipantId | null;
  /** In solo mode the talk time reads "Working solo" instead of bars (B7). */
  solo?: boolean;
  isListening?: boolean;
  onListeningChange?: (listening: boolean) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  /** A message to this room (B8). */
  onSend?: (text: string) => void;
  /** "Join Room N" (B8). */
  onJoin?: () => void;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** Where focus goes when the preview closes and it was open on load (BO6, BO8): the room's preview button. */
  restoreFocusTo?: RefObject<Element | null>;
  className?: string;
  /** The dialog element. */
  ref?: Ref<HTMLElement>;
}

/**
 * A modal dialog named by the room ("Room 2") and described by its place
 * and status ("Room 2 of 4 · Asked for help · 1 min"). Previous and next
 * room change what the same dialog shows, so focus stays on the button
 * pressed. Listen in is a toggle with a fixed label (`aria-pressed`). The
 * message field is a real `TextField` whose form sends on Enter or the
 * Send button and clears, keeping focus in the field; Join calls `onJoin`
 * and the room closes the preview. Previews are silent: the note says
 * students see an eye on their room while you watch.
 */
export function RoomPreview({
  room,
  roomCount,
  names,
  status,
  talk,
  messages,
  fullNames,
  selfId,
  solo = false,
  isListening = false,
  onListeningChange,
  onPrevious,
  onNext,
  onSend,
  onJoin,
  isOpen,
  onOpenChange,
  restoreFocusTo,
  className,
  ref,
}: RoomPreviewProps) {
  const styles = roomPreviewStyles();
  const [draft, setDraft] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (text.length === 0) return;
    onSend?.(text);
    setDraft('');
  };
  const shortName = (id: ParticipantId) => names[id] ?? fullNames[id] ?? 'Someone who left';

  return (
    <Dialog
      ref={ref}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={room.name}
      description={`${room.name} of ${roomCount} · ${status}`}
      className={className ?? 'max-w-238'}
      footer={
        <form onSubmit={submit} className={styles.form()}>
          <TextField
            label={`Message ${room.name}`}
            labelHidden
            placeholder={`Message ${room.name}…`}
            value={draft}
            onChange={setDraft}
            className={styles.field()}
          />
          <Button type="submit" size="lg">
            Send
          </Button>
          <Button variant="primary" size="lg" icon="joinRoom" onPress={onJoin}>
            Join {room.name}
          </Button>
        </form>
      }
    >
      <FocusFallback target={restoreFocusTo} />
      <div className={styles.toolbar()}>
        <IconButton label="Previous room" icon="previousSlide" variant="secondary" onPress={onPrevious} />
        <IconButton label="Next room" icon="nextSlide" variant="secondary" onPress={onNext} />
        <span className={styles.grow()} />
        <span className={styles.note()}>
          <Icon name="preview" size="sm" />
          Students see you’re watching
        </span>
        <ToggleButton
          label="Listen in"
          icon="listenIn"
          size="md"
          isSelected={isListening}
          onChange={onListeningChange}
        />
      </div>
      <div className={styles.body()}>
        <div className={styles.main()}>
          <RoomWork kind={room.work} size="full" className={styles.work()} />
          {room.members.length === 0 ? (
            <p className={styles.emptyTiles()}>Nobody is in this room.</p>
          ) : (
            <ul aria-label={`${room.name} webcams`} className={styles.tiles()}>
              {room.members.map((m) => (
                <li key={m.id}>
                  <VideoTile participant={m} shortName={shortName(m.id)} />
                </li>
              ))}
            </ul>
          )}
        </div>
        <aside className={styles.aside()}>
          <section aria-label="Talk time" className={styles.card()}>
            <h3 className={styles.kicker()}>Talk time</h3>
            {solo ? (
              <p className={styles.soloNote()}>Working solo</p>
            ) : talk.length === 0 ? (
              <p className={styles.soloNote()}>No one here yet</p>
            ) : (
              <ul className={styles.talkList()}>
                {talk.map((t) => (
                  <li key={t.participant.id} className={styles.talkRow()}>
                    <p className={styles.talkText()}>
                      <span className={styles.talkName()}>{shortName(t.participant.id)}</span>
                      <span className={styles.talkMinutes()}>{formatTalkTime(t.seconds)}</span>
                    </p>
                    <svg aria-hidden="true" className={styles.bar()} preserveAspectRatio="none" viewBox="0 0 100 1">
                      <rect width="100" height="1" className={styles.barTrack()} />
                      <rect width={Math.round(t.share * 100)} height="1" className={styles.barFill()} />
                    </svg>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section aria-label="Room chat" className={styles.chatCard()}>
            <h3 className={styles.kicker()}>Room chat</h3>
            {messages.length === 0 ? (
              <p className={styles.emptyChat()}>No messages yet.</p>
            ) : (
              <ol aria-label={`Messages in ${room.name}`} className={styles.messages()}>
                {messages.map((m) => (
                  <ChatMessage
                    key={m.id}
                    name={fullNames[m.from] ?? 'Someone who left'}
                    participantId={m.from}
                    time={formatTimeOfDay(m.sentAt)}
                    isSelf={m.from === selfId}
                  >
                    {m.text}
                  </ChatMessage>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </div>
    </Dialog>
  );
}
