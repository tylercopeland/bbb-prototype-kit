import { useState, type ComponentProps, type Ref } from 'react';
import { mergeProps, useHover } from 'react-aria';
import type { Key, Selection } from 'react-aria-components';
import { Icon, type IconName } from '../../icons';
import { participantSubline } from '../../mocks/selectors';
import type { AudioState, Participant } from '../../mocks/types';
import { tv, type VariantProps } from '../../styles/tv';
import { Avatar } from '../Avatar';
import { ConfirmDialog } from '../Dialog';
import { IconButton } from '../IconButton';
import { Menu, MenuItem, MenuSection, MenuSeparator } from '../Menu';
import { Tooltip, useTruncationTooltip } from '../Tooltip';

/**
 * A People row (Focus.dc.html 588, docs/screenshots/O2StudentActions.png),
 * Option A: avatar, name and second line, the two row actions, then the
 * fixed mic and camera columns. 44px tall, 8px side padding, the control
 * radius. The row actions are hidden until the row is hovered or holds
 * focus, and always shown on touch (X13): they fade with opacity, so they
 * stay focusable and appear as soon as Tab reaches them.
 */
export const participantRowStyles = tv({
  slots: {
    root: 'group flex min-h-row items-center gap-2 rounded-control px-2 py-1 hover:bg-surface-sunken focus-within:bg-surface-sunken',
    body: 'flex min-w-0 flex-1 flex-col',
    name: 'flex min-w-0 items-baseline gap-1 text-md font-semibold text-text',
    nameText: 'min-w-0 truncate',
    you: 'shrink-0 font-medium text-text-muted',
    subline: 'flex items-center gap-1 text-xs',
    actions:
      'flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:opacity-100',
    status: 'flex shrink-0 items-center gap-2',
    mic: 'flex size-6 items-center justify-center rounded-full',
    camera: 'flex w-5 items-center justify-center',
    cameraIcon: 'text-icon-subtle',
    /** The ⋯ menu's header: the name wraps rather than truncating, so a long name is read in full. */
    menuHeaderBody: 'flex min-w-0 flex-col',
    menuHeaderName: 'text-md font-bold break-words',
    menuHeaderStatus: 'text-xs text-text-muted',
  },
  variants: {
    isMenuOpen: {
      true: { root: 'bg-surface-sunken', actions: 'opacity-100' },
    },
    sublineTone: {
      hand: { subline: 'text-status-hand-text' },
      presenting: { subline: 'text-accent' },
      muted: { subline: 'text-text-muted' },
    },
    audio: {
      live: { mic: 'text-status-live-text' },
      speaking: { mic: 'bg-status-live text-on-status-live' },
      muted: { mic: 'text-icon-subtle' },
      listening: { mic: 'text-icon-subtle' },
      notJoined: { mic: 'text-icon-subtle' },
    },
  },
  defaultVariants: { sublineTone: 'muted', audio: 'notJoined' },
});

export type ParticipantRowSublineTone = NonNullable<VariantProps<typeof participantRowStyles>['sublineTone']>;

const micIcon: Record<AudioState, IconName> = {
  live: 'microphone',
  speaking: 'speaking',
  muted: 'microphoneOff',
  listening: 'listenOnly',
  notJoined: 'audioNotJoined',
};

export const audioLabel: Record<AudioState, string> = {
  live: 'Microphone on',
  speaking: 'Speaking',
  muted: 'Muted',
  listening: 'Listening only',
  notJoined: 'Audio not joined',
};

/** "Muted, camera on": the status columns as text, for the row's image and the menu header. */
export function participantStatus(p: Pick<Participant, 'audio' | 'camera'>): string {
  return `${audioLabel[p.audio]}, camera ${p.camera ? 'on' : 'off'}`;
}

/** What the ⋯ menu can do to a person. The room maps each one to a store action. */
export type ParticipantAction =
  | { type: 'makePresenter' }
  | { type: 'setCamera'; on: boolean }
  /**
   * The Microphone switch. `on` for a muted person asks them to unmute (or
   * cancels a pending request); `off` mutes a live one. The switch is
   * checked only while their microphone is on.
   */
  | { type: 'microphone'; on: boolean }
  | { type: 'flag'; flag: 'hasWhiteboard' | 'isModerator' | 'chatLocked'; value: boolean }
  | { type: 'remove' };

export interface ParticipantRowProps extends Omit<ComponentProps<'li'>, 'children'> {
  participant: Participant;
  /** The room clock, for "Raised · 3 min". */
  now: number;
  /** Show the engagement note as the second line (the Low engagement filter) instead of the hand and presenter line. */
  showEngagement?: boolean;
  /** The ⋯ menu is open; the room keeps it in `ui.peopleMenu`. Left out, the row keeps the state itself. */
  isMenuOpen?: boolean;
  onMenuOpenChange?: (isOpen: boolean) => void;
  /** "Message privately": opens the direct thread. */
  onMessage?: () => void;
  onAction?: (action: ParticipantAction) => void;
  /** The ⋯ button, so the list can move focus to a neighbouring row when this one is removed (WCAG 2.4.3). */
  moreRef?: Ref<HTMLButtonElement>;
  className?: string;
}

/**
 * One person in the People list. The status columns are one image named
 * "Muted, camera on", so the state is never color alone; a speaking
 * person also gets the green ring on the avatar. The two actions are
 * icon buttons with tooltips, and the ⋯ `Menu` holds the student actions:
 * Make presenter, the camera, the four switches as checkbox items (X9)
 * and Remove from session behind a `ConfirmDialog`. Your own row has no
 * actions.
 *
 * The Microphone switch keeps its label and is checked only while the
 * microphone is on (X7, X9): for a muted person, turning it on asks them
 * to unmute and the row's second line says "Asked to unmute"; turning it
 * on again cancels the request. Before audio is joined it is disabled and
 * described as such.
 *
 * A cut-off name shows in full in a tooltip while the row is hovered or
 * holds focus (`useTruncationTooltip`); it is not cut off for assistive
 * technology, and the ⋯ menu header repeats it in full.
 */
export function ParticipantRow({
  participant: p,
  now,
  showEngagement = false,
  isMenuOpen: controlledMenuOpen,
  onMenuOpenChange,
  onMessage,
  onAction,
  moreRef,
  className,
  ...props
}: ParticipantRowProps) {
  const [innerMenuOpen, setInnerMenuOpen] = useState(false);
  const isMenuOpen = controlledMenuOpen ?? innerMenuOpen;
  const setMenuOpen = (open: boolean) => {
    setInnerMenuOpen(open);
    onMenuOpenChange?.(open);
  };
  const subline = showEngagement ? (p.engagement.note ?? '') : participantSubline(p, now);
  const sublineTone: ParticipantRowSublineTone =
    !showEngagement && p.handRaisedAt !== null ? 'hand' : !showEngagement && p.isPresenter ? 'presenting' : 'muted';
  const sublineIcon: IconName | null = sublineTone === 'hand' ? 'raiseHand' : sublineTone === 'presenting' ? 'presenter' : null;
  const styles = participantRowStyles({ isMenuOpen, sublineTone, audio: p.audio });
  const [confirmRemove, setConfirmRemove] = useState(false);

  // The row is the tooltip's trigger (hover anywhere on it, or focus inside it); the name is what is measured.
  const { labelRef, triggerRef, triggerProps, isOpen, onOpenChange } = useTruncationTooltip<HTMLLIElement>();
  const { hoverProps } = useHover({ onHoverStart: triggerProps.onHoverStart, onHoverEnd: triggerProps.onHoverEnd });

  const audioJoined = p.audio === 'live' || p.audio === 'speaking' || p.audio === 'muted';
  const micOn = p.audio === 'live' || p.audio === 'speaking';
  const flags = new Set<Key>();
  if (micOn) flags.add('microphone');
  if (p.hasWhiteboard) flags.add('whiteboard');
  if (p.isModerator) flags.add('moderator');
  if (p.chatLocked) flags.add('lock');

  const onFlags = (keys: Selection) => {
    if (keys === 'all') return;
    const has = (k: Key) => keys.has(k);
    if (has('microphone') !== micOn) onAction?.({ type: 'microphone', on: has('microphone') });
    if (has('whiteboard') !== p.hasWhiteboard) onAction?.({ type: 'flag', flag: 'hasWhiteboard', value: has('whiteboard') });
    if (has('moderator') !== p.isModerator) onAction?.({ type: 'flag', flag: 'isModerator', value: has('moderator') });
    if (has('lock') !== p.chatLocked) onAction?.({ type: 'flag', flag: 'chatLocked', value: has('lock') });
  };
  const onMenuAction = (key: Key) => {
    if (key === 'presenter') onAction?.({ type: 'makePresenter' });
    else if (key === 'camera') onAction?.({ type: 'setCamera', on: !p.camera });
    else if (key === 'remove') setConfirmRemove(true);
  };

  return (
    <li
      {...mergeProps(props, hoverProps, { onFocus: triggerProps.onFocus, onBlur: triggerProps.onBlur })}
      ref={triggerRef}
      className={styles.root({ className })}
    >
      <Avatar
        aria-hidden="true"
        name={p.name}
        participantId={p.id}
        shape={p.role === 'teacher' ? 'square' : 'circle'}
        isSpeaking={p.audio === 'speaking'}
      />
      <div className={styles.body()}>
        <span className={styles.name()}>
          <span ref={labelRef} className={styles.nameText()}>
            {p.name}
          </span>
          {p.isSelf && <span className={styles.you()}>(you)</span>}
          <Tooltip label={p.name} triggerRef={labelRef} isOpen={isOpen} onOpenChange={onOpenChange} />
        </span>
        {subline && (
          <span className={styles.subline()}>
            {sublineIcon && <Icon name={sublineIcon} size="xs" />}
            {subline}
          </span>
        )}
      </div>
      {!p.isSelf && (
        <span className={styles.actions()}>
          <IconButton label={`Message ${p.name} privately`} icon="chat" variant="soft" size="sm" onPress={onMessage} />
          <Menu
            isOpen={isMenuOpen}
            onOpenChange={setMenuOpen}
            onAction={onMenuAction}
            trigger={<IconButton ref={moreRef} label={`More actions for ${p.name}`} icon="more" variant="soft" size="sm" />}
            header={
              <>
                <Avatar aria-hidden="true" name={p.name} participantId={p.id} size="lg" />
                <span className={styles.menuHeaderBody()}>
                  <span className={styles.menuHeaderName()}>{p.name}</span>
                  <span className={styles.menuHeaderStatus()}>{participantStatus(p)}</span>
                </span>
              </>
            }
          >
            <MenuItem id="presenter" icon="presenter" isDisabled={p.isPresenter}>
              Make presenter
            </MenuItem>
            <MenuItem id="camera" icon={p.camera ? 'cameraOff' : 'camera'}>
              {p.camera ? 'Turn off camera' : 'Turn on camera'}
            </MenuItem>
            <MenuSeparator />
            <MenuSection aria-label="Permissions" selectionMode="multiple" selectedKeys={flags} onSelectionChange={onFlags}>
              <MenuItem
                id="microphone"
                icon={micOn ? 'microphone' : 'microphoneOff'}
                isDisabled={!audioJoined}
                description={audioJoined ? undefined : 'Audio not joined'}
              >
                Microphone
              </MenuItem>
              <MenuItem id="whiteboard" icon="whiteboardAccess">
                Whiteboard access
              </MenuItem>
              <MenuItem id="moderator" icon="moderator">
                Moderator
              </MenuItem>
              <MenuItem id="lock" icon="lockChat">
                Lock public chat
              </MenuItem>
            </MenuSection>
            <MenuSeparator />
            <MenuItem id="remove" icon="removeFromSession" tone="danger">
              Remove from session
            </MenuItem>
          </Menu>
          <ConfirmDialog
            isOpen={confirmRemove}
            onOpenChange={setConfirmRemove}
            title={`Remove ${p.name}?`}
            description="They leave the session now and can only come back with a new invitation."
            confirmLabel="Remove"
            tone="danger"
            onConfirm={() => onAction?.({ type: 'remove' })}
          />
        </span>
      )}
      <span role="img" aria-label={participantStatus(p)} className={styles.status()}>
        <span className={styles.mic()}>
          <Icon name={micIcon[p.audio]} size={p.audio === 'speaking' ? 'xs' : 'sm'} />
        </span>
        <span className={styles.camera()}>{p.camera && <Icon name="camera" size="sm" className={styles.cameraIcon()} />}</span>
      </span>
    </li>
  );
}
