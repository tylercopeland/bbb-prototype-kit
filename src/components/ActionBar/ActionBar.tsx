import { useId, useMemo, useRef, useState, type ComponentProps, type ReactNode, type Ref } from 'react';
import { mergeRefs } from 'react-aria';
import { Icon } from '../../icons';
import { formatRaisedHands, formatUnread } from '../../mocks/format';
import type { AudioState, Panel, ReactionKind } from '../../mocks/types';
import { tv } from '../../styles/tv';
import { ConfirmDialog } from '../Dialog';
import { IconButton } from '../IconButton';
import { Popover } from '../Popover';
import { ReactionTray } from '../ReactionTray';
import { ToggleButton } from '../ToggleButton';

/**
 * The action bar (Focus.dc.html 45–64, and the `ActionBarOnStage` story):
 * three groups on one 60px row at the bottom of the stage. Panels on the
 * left, media in the middle, the personal controls and Leave on the right.
 * The outer groups share the leftover width so the media group stays
 * centred whatever the panel buttons take.
 */
export const actionBarStyles = tv({
  slots: {
    root: 'flex h-15 items-center gap-3',
    panels: 'flex min-w-0 flex-1 items-center gap-2',
    media: 'flex items-center gap-2',
    personal: 'flex min-w-0 flex-1 items-center justify-end gap-2',
    /** The Share media picker is wider than the Plugins one (Focus.dc.html 322: 452px). */
    mediaPicker: 'w-112',
  },
});

/** The panels a bar button opens. Poll comes from Plugins, not the bar. */
export type ActionBarPanel = Extract<Panel, 'people' | 'chat' | 'notes'>;

export interface ActionBarProps extends Omit<ComponentProps<'nav'>, 'children'> {
  /** The open panel; its button is pressed. */
  panel: Panel;
  /** The Plugins picker is open; its button is pressed and expanded. */
  pluginsOpen?: boolean;
  /** The Share media picker is open; its button is pressed and expanded. */
  mediaOpen?: boolean;
  /** The count on People, hidden while People is open. */
  raisedHands: number;
  /** The count on Chat, hidden while Chat is open. */
  unread: number;
  /** Your own audio. `notJoined` and `listening` show "Join audio" in the mic slot instead of the toggle. */
  audio: AudioState;
  camera: boolean;
  handRaised: boolean;
  /** Share media is pressed while something is shared, as well as while its picker is open. */
  isSharing?: boolean;
  /** The Learning Analytics tooltip is pinned open on mount (O1). */
  analyticsTipOpen?: boolean;
  onTogglePanel: (panel: ActionBarPanel) => void;
  onPluginsOpenChange?: (open: boolean) => void;
  onMediaOpenChange?: (open: boolean) => void;
  onJoinAudio?: () => void;
  onMicrophoneChange?: (on: boolean) => void;
  onCameraChange?: (on: boolean) => void;
  onRaiseHandChange?: (raised: boolean) => void;
  /** A reaction chosen in the React tray (D5); the tray closes after it. */
  onReaction?: (kind: ReactionKind) => void;
  onAnalytics?: () => void;
  /** Called after the person confirms in the Leave dialog. */
  onLeave?: () => void;
  /** The Plugins picker's content (`PluginsMenu`). Without it the button is a plain toggle. */
  pluginsPicker?: ReactNode;
  /** The Share media picker's content (`MediaPicker`). Without it the button is a plain toggle. */
  mediaPicker?: ReactNode;
  /** The Room settings popover's content (`RoomSettings`). Without it the button only calls nothing. */
  settings?: ReactNode;
  /**
   * Refs to the panel toggles (and Plugins, which opens the Poll panel), so
   * the room can return focus to the right one when a panel's close button
   * unmounts under the keyboard (WCAG 2.4.3).
   */
  panelRefs?: Partial<Record<ActionBarPanel | 'plugins' | 'media', Ref<HTMLButtonElement>>>;
  className?: string;
}

/**
 * A `nav` named "Actions". Every control is a 44px soft square (X2) with a
 * tooltip (X5); the panel buttons and the media toggles keep fixed labels
 * and expose their state as `aria-pressed` (X7), with the counts as badges
 * that describe the button. Before audio is joined the mic slot is a "Join
 * audio" button, never a third toggle state (see the ToggleButton
 * docblock). Plugins and Share media keep their open state in the store,
 * so their pickers are standalone `Popover`s anchored to the toggles,
 * which carry `aria-expanded` and `aria-controls` (X1: each has a close
 * button, Escape closes, focus returns). React opens the reaction tray and
 * Room settings its switches from their own triggers. Leave opens a
 * `ConfirmDialog` (D5) and calls `onLeave` only after the confirmation.
 * Nothing here reads the store: the room passes the state and handles
 * each change.
 */
export function ActionBar({
  panel,
  pluginsOpen = false,
  mediaOpen = false,
  raisedHands,
  unread,
  audio,
  camera,
  handRaised,
  isSharing = false,
  analyticsTipOpen = false,
  onTogglePanel,
  onPluginsOpenChange,
  onMediaOpenChange,
  onJoinAudio,
  onMicrophoneChange,
  onCameraChange,
  onRaiseHandChange,
  onReaction,
  onAnalytics,
  onLeave,
  pluginsPicker,
  mediaPicker,
  settings,
  panelRefs,
  className,
  ...props
}: ActionBarProps) {
  const styles = actionBarStyles();
  const audioJoined = audio === 'live' || audio === 'speaking' || audio === 'muted';
  const peopleOpen = panel === 'people';
  const chatOpen = panel === 'chat';

  // The two store-driven pickers anchor to their toggles; the Plugins toggle's ref is also the room's.
  const pluginsRef = useRef<HTMLButtonElement>(null);
  const forwardedPlugins = panelRefs?.plugins;
  const pluginsMergedRef = useMemo(() => mergeRefs(pluginsRef, forwardedPlugins), [forwardedPlugins]);
  const mediaRef = useRef<HTMLButtonElement>(null);
  const forwardedMedia = panelRefs?.media;
  const mediaMergedRef = useMemo(() => mergeRefs(mediaRef, forwardedMedia), [forwardedMedia]);
  const pluginsId = useId();
  const mediaId = useId();
  const [reactOpen, setReactOpen] = useState(false);

  return (
    <nav aria-label="Actions" {...props} className={styles.root({ className })}>
      <div className={styles.panels()}>
        <ToggleButton
          ref={panelRefs?.people}
          label="People"
          icon="people"
          isSelected={peopleOpen}
          onChange={() => onTogglePanel('people')}
          badge={
            raisedHands > 0 && !peopleOpen
              ? { count: raisedHands, label: formatRaisedHands(raisedHands) }
              : undefined
          }
        />
        <ToggleButton
          ref={panelRefs?.chat}
          label="Chat"
          icon="chat"
          isSelected={chatOpen}
          onChange={() => onTogglePanel('chat')}
          badge={unread > 0 && !chatOpen ? { count: unread, label: formatUnread(unread) } : undefined}
        />
        <ToggleButton
          ref={panelRefs?.notes}
          label="Shared notes"
          icon="notes"
          isSelected={panel === 'notes'}
          onChange={() => onTogglePanel('notes')}
        />
        <ToggleButton
          ref={pluginsMergedRef}
          label="Plugins"
          icon="plugins"
          isSelected={pluginsOpen}
          onChange={(on) => onPluginsOpenChange?.(on)}
          aria-haspopup={pluginsPicker ? 'dialog' : undefined}
          aria-expanded={pluginsPicker ? pluginsOpen : undefined}
          aria-controls={pluginsPicker && pluginsOpen ? pluginsId : undefined}
        />
        {pluginsPicker && (
          <Popover
            id={pluginsId}
            title="Plugins"
            triggerRef={pluginsRef}
            isOpen={pluginsOpen}
            onOpenChange={onPluginsOpenChange}
          >
            {pluginsPicker}
          </Popover>
        )}
      </div>
      <div className={styles.media()}>
        {audioJoined ? (
          <ToggleButton
            label="Microphone"
            icon="microphoneOff"
            selectedIcon="microphone"
            shortcut="microphone"
            isSelected={audio === 'live' || audio === 'speaking'}
            isSpeaking={audio === 'speaking'}
            onChange={(on) => onMicrophoneChange?.(on)}
          />
        ) : (
          <IconButton
            label="Join audio"
            icon="audioNotJoined"
            variant="soft"
            size="touch"
            shortcut="microphone"
            onPress={() => onJoinAudio?.()}
          />
        )}
        <ToggleButton
          label="Camera"
          icon="cameraOff"
          selectedIcon="camera"
          shortcut="camera"
          isSelected={camera}
          onChange={(on) => onCameraChange?.(on)}
        />
        <ToggleButton
          ref={mediaMergedRef}
          label="Share media"
          icon="shareMedia"
          isSelected={mediaOpen || isSharing}
          onChange={() => onMediaOpenChange?.(!mediaOpen)}
          aria-haspopup={mediaPicker ? 'dialog' : undefined}
          aria-expanded={mediaPicker ? mediaOpen : undefined}
          aria-controls={mediaPicker && mediaOpen ? mediaId : undefined}
        />
        {mediaPicker && (
          <Popover
            id={mediaId}
            title="Share media"
            titleHidden
            triggerRef={mediaRef}
            isOpen={mediaOpen}
            onOpenChange={onMediaOpenChange}
            className={styles.mediaPicker()}
          >
            {mediaPicker}
          </Popover>
        )}
        <Popover
          title="React"
          titleHidden
          isOpen={reactOpen}
          onOpenChange={setReactOpen}
          trigger={<IconButton label="React" icon="react" variant="soft" size="touch" />}
        >
          <ReactionTray
            onReact={(kind) => {
              onReaction?.(kind);
              setReactOpen(false);
            }}
          />
        </Popover>
        <ToggleButton
          label="Raise hand"
          icon="raiseHand"
          shortcut="raiseHand"
          selectedTone="hand"
          isSelected={handRaised}
          onChange={(raised) => onRaiseHandChange?.(raised)}
        />
      </div>
      <div className={styles.personal()}>
        {/* The tooltip's hint (Focus.dc.html 60: the external-link mark) describes the button while it is open. */}
        <IconButton
          label="Learning Analytics Dashboard"
          icon="analytics"
          variant="soft"
          size="touch"
          tooltipDefaultOpen={analyticsTipOpen}
          tooltipHint={
            <>
              Opens in a new tab
              <Icon name="externalLink" size="xs" />
            </>
          }
          onPress={() => onAnalytics?.()}
        />
        {settings ? (
          <Popover
            title="Room settings"
            trigger={<IconButton label="Room settings" icon="settings" variant="soft" size="touch" />}
          >
            {settings}
          </Popover>
        ) : (
          <IconButton label="Room settings" icon="settings" variant="soft" size="touch" />
        )}
        <ConfirmDialog
          trigger={
            <IconButton label="Leave session" icon="leave" variant="soft" tone="danger" size="touch" />
          }
          title="Leave the session?"
          description="You can come back with the same link. The class carries on without you."
          confirmLabel="Leave session"
          tone="danger"
          onConfirm={() => onLeave?.()}
        />
      </div>
    </nav>
  );
}
