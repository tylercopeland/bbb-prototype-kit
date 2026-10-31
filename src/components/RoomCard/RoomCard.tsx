import type { ComponentProps, Ref } from 'react';
import { mergeProps, useHover } from 'react-aria';
import { Button as RacButton, ToggleButton as RacToggleButton, type Key } from 'react-aria-components';
import { Icon } from '../../icons';
import type { Room } from '../../mocks/breakouts';
import type { Participant, ParticipantId } from '../../mocks/types';
import { tv, type VariantProps } from '../../styles/tv';
import { Avatar } from '../Avatar';
import { Button, buttonStyles } from '../Button';
import { IconButton } from '../IconButton';
import { Menu, MenuItem, MenuSection } from '../Menu';
import { RoomWork } from '../RoomWork';
import { Tooltip, useTruncationTooltip } from '../Tooltip';

/**
 * One breakout room on the board (Breakout.dc.html 56–72 in setup, 119–139
 * live): a card on the stage with the room's color mark, "Room N" (B7: one
 * naming rule in every mode and phase) and either the member chips (setup)
 * or the work thumbnail, the status line and the actions (live, back). The
 * card radius, a hairline border, the surface fill. A room asking for help
 * gets the amber border and the Help badge; the previewed room the selected
 * border and ring; the status line says the same in words, so nothing is
 * color alone. `compact` is the one-student card of solo mode (B6).
 */
export const roomCardStyles = tv({
  slots: {
    root: 'relative flex min-w-0 flex-col gap-2 rounded-tile border border-border bg-surface p-3 text-text',
    header: 'flex items-center gap-2',
    /** The room's color mark: a small rounded square (the canvas's 8–10px dot). */
    dot: 'size-2 shrink-0 rounded-xs',
    name: 'min-w-0 flex-1 truncate text-md font-bold',
    count: 'shrink-0 text-xs text-text-muted',
    /** The solo room's student, under the name (B7). */
    subtitle: 'truncate text-xs text-text-muted',
    members: 'flex list-none flex-col gap-1 p-0',
    /** The empty room (B1): a dashed slot where students can be moved. */
    empty: 'rounded-control border border-dashed border-border-control px-3 py-2 text-sm text-text-muted',
    avatars: 'absolute bottom-1 left-1 flex',
    /** Each stacked avatar gets a surface-colored border so the overlap reads. */
    avatar: '-ml-1 rounded-full border-2 border-surface first:ml-0',
    more: 'ml-1 flex h-6 items-center rounded-full bg-surface-overlay px-2 text-xs font-bold text-text-on-stage',
    helpBadge:
      'absolute top-1 right-1 flex h-6 items-center gap-1 rounded-full bg-status-hand px-2 text-xs font-bold text-on-status-hand',
    footer: 'flex items-center gap-2',
    body: 'flex min-w-0 flex-1 flex-col',
    status: 'truncate text-xs',
    /** "You're here" (B8) or "On stage" beside the name. */
    tag: 'shrink-0 rounded-full bg-selected px-2 text-xs font-semibold text-selected-text',
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
    density: {
      default: {},
      compact: { root: 'gap-1 p-2', name: 'text-sm' },
    },
    statusTone: {
      help: { status: 'font-semibold text-status-hand-text' },
      live: { status: 'text-status-live-text' },
      neutral: { status: 'text-text-muted' },
    },
    hasHelp: {
      true: { root: 'border-status-hand' },
    },
    isPeeked: {
      true: { root: 'border-selected-border selected-ring' },
    },
  },
  defaultVariants: { color: 1, density: 'default', statusTone: 'neutral' },
});

/**
 * The thumbnail is the preview button (live) or the show-on-stage toggle
 * (back): the whole picture is the target. Selected (the work is on stage)
 * it takes the inset ring, as the toggle beside it does.
 */
export const roomThumbStyles = tv({
  base: 'relative block w-full overflow-hidden rounded-lg focus-ring outline-none data-selected:selected-ring',
});

/**
 * A member chip in setup (Breakout.dc.html 63–67): avatar and name on a
 * 44px raised row. It is the "Move to…" menu's trigger (B2), so while its
 * menu is open (React Aria keeps a menu trigger pressed while its menu is
 * open) it takes the selected pair, as the canvas's "Moving" chip did.
 */
export const memberChipStyles = tv({
  base: 'flex h-control-touch w-full min-w-0 items-center gap-2 rounded-control border border-border bg-surface-raised px-2 text-left text-md font-semibold text-text focus-ring outline-none data-hovered:bg-surface-sunken data-pressed:border-selected-border data-pressed:bg-selected data-pressed:text-selected-text',
});

export const memberChipNameStyles = tv({ base: 'min-w-0 flex-1 truncate' });

/** The solo card's one member: the same chip, not interactive (there is nowhere to move them). */
export const memberStyles = tv({
  base: 'flex h-control-md w-full min-w-0 items-center gap-2 rounded-control bg-surface-raised px-2 text-sm font-semibold text-text',
});

/** "Show on stage" (back): a toggle with a fixed label; the selected pair and the inset ring mark the room on stage. */
export const stageToggleStyles = tv({
  extend: buttonStyles,
  base: 'data-selected:border-selected-border data-selected:bg-selected data-selected:text-selected-text data-selected:selected-ring',
  defaultVariants: { variant: 'secondary', tone: 'neutral', size: 'sm' },
});

export type RoomCardVariant = 'setup' | 'live' | 'back';
export type RoomCardDensity = NonNullable<VariantProps<typeof roomCardStyles>['density']>;
export type RoomStatusTone = NonNullable<VariantProps<typeof roomCardStyles>['statusTone']>;

/** The status line's color family, said in the status text as well: amber for help, green for talking or done, muted otherwise. */
export function roomStatusTone(room: Room, phase: 'setup' | 'live' | 'back'): RoomStatusTone {
  if (phase === 'back') return 'live';
  if (room.help) return 'help';
  if (room.activity?.kind === 'talking' || room.activity?.kind === 'done') return 'live';
  return 'neutral';
}

/** A room a student can be moved to, for the "Move to…" menu. */
export interface MoveTarget {
  index: number;
  name: string;
  count: number;
}

/** "3 students", "1 student", "Empty". */
export function formatMembers(count: number): string {
  if (count === 0) return 'Empty';
  return `${count} ${count === 1 ? 'student' : 'students'}`;
}

/** How many avatars stack on a thumbnail before "+N". */
export const MAX_THUMB_AVATARS = 4;

export interface RoomCardProps extends Omit<ComponentProps<'li'>, 'children'> {
  room: Room;
  /** Short names for the chips and the stack (`selectDisplayNames`, B9). */
  names: Record<ParticipantId, string>;
  /** `setup`: the member chips; `live`: the thumbnail, status, Preview and Join; `back`: the thumbnail and Show on stage. */
  variant: RoomCardVariant;
  /** The line under the name while live or back (`roomStatus`). */
  status?: string;
  /** `compact` for solo mode's one-student rooms (B6). @default 'default' */
  density?: RoomCardDensity;
  /** Setup, groups: every room, for the "Move to…" menu; the current one is disabled there. */
  moveTargets?: MoveTarget[];
  /** Setup: whose "Move to…" menu is open (`breakouts.moving`). */
  movingId?: ParticipantId | null;
  onMoveMenuOpenChange?: (participantId: ParticipantId, isOpen: boolean) => void;
  onMove?: (participantId: ParticipantId, roomIndex: number) => void;
  /** Setup: the chip of each member, so the board can keep focus on a student after a move (B2). */
  memberRef?: (participantId: ParticipantId, element: HTMLButtonElement | null) => void;
  /** This room is being previewed. */
  isPeeked?: boolean;
  /** The teacher joined this room (B8). */
  isJoined?: boolean;
  /** This room's work is on the main stage (back). */
  isOnStage?: boolean;
  onPreview?: () => void;
  onJoin?: () => void;
  /** Back: show the room's work to everyone, or take it off the stage. */
  onShowOnStage?: (show: boolean) => void;
  /** The preview button, so a closed preview can hand focus back to the card that opened it. */
  previewRef?: Ref<HTMLButtonElement>;
  className?: string;
}

interface MemberProps {
  member: Participant;
  /** The short name shown (B9); the chip's label contains it. */
  name: string;
}

interface MemberChipProps extends MemberProps {
  room: Room;
  moveTargets: MoveTarget[];
  isOpen: boolean;
  onOpenChange?: (participantId: ParticipantId, isOpen: boolean) => void;
  onMove?: (participantId: ParticipantId, roomIndex: number) => void;
  memberRef?: (participantId: ParticipantId, element: HTMLButtonElement | null) => void;
}

/**
 * A member chip in setup: the "Move to…" menu trigger, named "Move Ana to
 * another room" with the same short name it shows (B9). A cut-off name
 * shows in full in a tooltip while the chip is hovered or focused
 * (`useTruncationTooltip`, as the People and DM rows).
 */
function MemberChip({ member, name, room, moveTargets, isOpen, onOpenChange, onMove, memberRef }: MemberChipProps) {
  const { labelRef, triggerRef, triggerProps, isOpen: tooltipOpen, onOpenChange: onTooltipChange } =
    useTruncationTooltip<HTMLButtonElement>((el) => memberRef?.(member.id, el));
  return (
    <Menu
      isOpen={isOpen}
      onOpenChange={(open) => onOpenChange?.(member.id, open)}
      onAction={(key: Key) => onMove?.(member.id, Number(key))}
      placement="bottom start"
      trigger={
        <RacButton
          {...triggerProps}
          ref={triggerRef}
          aria-label={`Move ${name} to another room`}
          className={memberChipStyles()}
        >
          <Avatar aria-hidden="true" name={member.name} participantId={member.id} size="sm" />
          <span ref={labelRef} className={memberChipNameStyles()}>
            {name}
          </span>
          <Tooltip label={name} triggerRef={triggerRef} isOpen={tooltipOpen} onOpenChange={onTooltipChange} />
        </RacButton>
      }
    >
      <MenuSection title="Move to">
        {moveTargets.map((t) => (
          <MenuItem
            key={t.index}
            id={String(t.index)}
            isDisabled={t.index === room.index}
            description={t.index === room.index ? 'Current room' : formatMembers(t.count)}
          >
            {t.name}
          </MenuItem>
        ))}
      </MenuSection>
    </Menu>
  );
}

/** A member that cannot be moved (solo mode, or a card without move targets): the same chip, not interactive; hover shows a cut-off name in full. */
function Member({ member, name }: MemberProps) {
  const { labelRef, triggerRef, triggerProps, isOpen, onOpenChange } = useTruncationTooltip<HTMLParagraphElement>();
  const { hoverProps } = useHover({ onHoverStart: triggerProps.onHoverStart, onHoverEnd: triggerProps.onHoverEnd });
  return (
    <p {...mergeProps(hoverProps)} ref={triggerRef} className={memberStyles()}>
      <Avatar aria-hidden="true" name={member.name} participantId={member.id} size="sm" />
      <span ref={labelRef} className={memberChipNameStyles()}>
        {name}
      </span>
      <Tooltip label={name} triggerRef={labelRef} isOpen={isOpen} onOpenChange={onOpenChange} />
    </p>
  );
}

/**
 * A list item with the room's name as a heading. In setup every member is
 * a "Move to…" menu trigger named "Move Ana to another room" (B2, with the
 * short name the chip shows, B9): the menu lists the rooms with their
 * counts, the current one disabled, and choosing one calls `onMove`; the
 * board then keeps focus on the student in their new card and the room
 * announces the move. Live, the thumbnail is the "Preview Room N" button
 * and Join is a text button; back, the thumbnail ("Show Room N on stage")
 * and the "Show on stage" button are both toggles with `aria-pressed`, so
 * either says whether the work is on stage. An empty room (B1) says so
 * instead of crashing or showing nothing.
 */
export function RoomCard({
  room,
  names,
  variant,
  status,
  density = 'default',
  moveTargets,
  movingId = null,
  onMoveMenuOpenChange,
  onMove,
  memberRef,
  isPeeked = false,
  isJoined = false,
  isOnStage = false,
  onPreview,
  onJoin,
  onShowOnStage,
  previewRef,
  className,
  ...props
}: RoomCardProps) {
  const phase = variant === 'setup' ? 'setup' : variant;
  const styles = roomCardStyles({
    color: room.color as 1,
    density,
    statusTone: roomStatusTone(room, phase),
    hasHelp: room.help !== null && variant === 'live',
    isPeeked,
  });
  const nameOf = (id: ParticipantId) => names[id] ?? room.members.find((m) => m.id === id)?.name ?? '';
  const canMove = variant === 'setup' && !!moveTargets && !!onMove;

  const header = (
    <div className={styles.header()}>
      <span aria-hidden="true" className={styles.dot()} />
      <h3 className={styles.name()}>{room.name}</h3>
      {isJoined && <span className={styles.tag()}>You’re here</span>}
      {isOnStage && <span className={styles.tag()}>On stage</span>}
      {variant === 'setup' && room.subtitle === null && (
        <span className={styles.count()}>{formatMembers(room.members.length)}</span>
      )}
    </div>
  );

  if (variant === 'setup') {
    return (
      <li aria-current={isPeeked || undefined} {...props} className={styles.root({ className })}>
        {header}
        {room.subtitle !== null ? (
          // Solo mode: one student, nowhere to move them; the card just says who (B7).
          room.members.length === 0 ? (
            <p className={styles.empty()}>No student yet</p>
          ) : (
            <Member member={room.members[0]} name={room.subtitle} />
          )
        ) : room.members.length === 0 ? (
          <p className={styles.empty()}>No students yet. Move someone here from another room.</p>
        ) : (
          <ul aria-label={`${room.name} students`} className={styles.members()}>
            {room.members.map((m) => (
              <li key={m.id}>
                {canMove ? (
                  <MemberChip
                    member={m}
                    name={nameOf(m.id)}
                    room={room}
                    moveTargets={moveTargets}
                    isOpen={movingId === m.id}
                    onOpenChange={onMoveMenuOpenChange}
                    onMove={onMove}
                    memberRef={memberRef}
                  />
                ) : (
                  <Member member={m} name={nameOf(m.id)} />
                )}
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  }

  const shown = room.members.slice(0, MAX_THUMB_AVATARS);
  const rest = room.members.length - shown.length;
  const thumbContent = (
    <>
      <RoomWork aria-hidden="true" kind={room.work} showLabel={false} />
      {shown.length > 0 && (
        <span aria-hidden="true" className={styles.avatars()}>
          {shown.map((m) => (
            <span key={m.id} className={styles.avatar()}>
              <Avatar aria-hidden="true" name={m.name} participantId={m.id} size="sm" />
            </span>
          ))}
          {rest > 0 && <span className={styles.more()}>+{rest}</span>}
        </span>
      )}
      {variant === 'live' && room.help && (
        <span aria-hidden="true" className={styles.helpBadge()}>
          <Icon name="help" size="xs" />
          Help
        </span>
      )}
    </>
  );
  return (
    <li aria-current={isPeeked || undefined} {...props} className={styles.root({ className })}>
      {variant === 'back' ? (
        // The same toggle as "Show on stage" below, with the room in its fixed label and `aria-pressed`.
        <RacToggleButton
          ref={previewRef}
          aria-label={`Show ${room.name} on stage`}
          isSelected={isOnStage}
          onChange={(show) => onShowOnStage?.(show)}
          className={roomThumbStyles()}
        >
          {thumbContent}
        </RacToggleButton>
      ) : (
        <RacButton ref={previewRef} aria-label={`Preview ${room.name}`} onPress={onPreview} className={roomThumbStyles()}>
          {thumbContent}
        </RacButton>
      )}
      <div className={styles.footer()}>
        <span aria-hidden="true" className={styles.dot()} />
        <div className={styles.body()}>
          <h3 className={styles.name()}>{room.name}</h3>
          {status && <p className={styles.status()}>{status}</p>}
        </div>
        {isJoined && <span className={styles.tag()}>You’re here</span>}
        {isOnStage && <span className={styles.tag()}>On stage</span>}
        {variant === 'live' &&
          !isJoined &&
          (density === 'compact' ? (
            <IconButton label={`Join ${room.name}`} icon="joinRoom" variant="soft" size="sm" onPress={onJoin} />
          ) : (
            <Button aria-label={`Join ${room.name}`} icon="joinRoom" variant="soft" size="sm" onPress={onJoin}>
              Join
            </Button>
          ))}
        {variant === 'back' && (
          <RacToggleButton
            isSelected={isOnStage}
            onChange={(show) => onShowOnStage?.(show)}
            className={stageToggleStyles()}
          >
            Show on stage
          </RacToggleButton>
        )}
      </div>
    </li>
  );
}
