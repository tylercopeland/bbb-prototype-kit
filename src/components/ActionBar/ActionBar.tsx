import type { ComponentProps } from 'react';
import type { AudioState, Panel } from '../../mocks/types';
import { tv } from '../../styles/tv';
import { ConfirmDialog } from '../Dialog';
import { IconButton } from '../IconButton';
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
  },
});

/** The panels a bar button opens. Poll comes from Plugins, not the bar. */
export type ActionBarPanel = Extract<Panel, 'people' | 'chat' | 'notes'>;

export interface ActionBarProps extends Omit<ComponentProps<'nav'>, 'children'> {
  /** The open panel; its button is pressed. */
  panel: Panel;
  /** The Plugins picker is open; its button is pressed. */
  pluginsOpen?: boolean;
  /** The count on People, hidden while People is open. */
  raisedHands: number;
  /** The count on Chat, hidden while Chat is open. */
  unread: number;
  /** Your own audio. `notJoined` and `listening` show "Join audio" in the mic slot instead of the toggle. */
  audio: AudioState;
  camera: boolean;
  handRaised: boolean;
  /** Share media is pressed while the picker is open or something is shared. */
  isSharing?: boolean;
  onTogglePanel: (panel: ActionBarPanel) => void;
  onTogglePlugins?: () => void;
  onJoinAudio?: () => void;
  onMicrophoneChange?: (on: boolean) => void;
  onCameraChange?: (on: boolean) => void;
  onRaiseHandChange?: (raised: boolean) => void;
  onShareMedia?: () => void;
  onReact?: () => void;
  onAnalytics?: () => void;
  onSettings?: () => void;
  /** Called after the person confirms in the Leave dialog. */
  onLeave?: () => void;
  className?: string;
}

/**
 * A `nav` named "Actions". Every control is a 44px soft square (X2) with a
 * tooltip (X5); the panel buttons and the media toggles keep fixed labels
 * and expose their state as `aria-pressed` (X7), with the counts as badges
 * that describe the button. Before audio is joined the mic slot is a "Join
 * audio" button, never a third toggle state (see the ToggleButton
 * docblock). Leave opens a `ConfirmDialog` (D5) and calls `onLeave` only
 * after the confirmation. Nothing here reads the store: the room passes
 * the state and handles each change.
 */
export function ActionBar({
  panel,
  pluginsOpen = false,
  raisedHands,
  unread,
  audio,
  camera,
  handRaised,
  isSharing = false,
  onTogglePanel,
  onTogglePlugins,
  onJoinAudio,
  onMicrophoneChange,
  onCameraChange,
  onRaiseHandChange,
  onShareMedia,
  onReact,
  onAnalytics,
  onSettings,
  onLeave,
  className,
  ...props
}: ActionBarProps) {
  const styles = actionBarStyles();
  const audioJoined = audio === 'live' || audio === 'speaking' || audio === 'muted';
  const peopleOpen = panel === 'people';
  const chatOpen = panel === 'chat';
  return (
    <nav aria-label="Actions" {...props} className={styles.root({ className })}>
      <div className={styles.panels()}>
        <ToggleButton
          label="People"
          icon="people"
          isSelected={peopleOpen}
          onChange={() => onTogglePanel('people')}
          badge={raisedHands > 0 && !peopleOpen ? { count: raisedHands, label: `${raisedHands} raised hands` } : undefined}
        />
        <ToggleButton
          label="Chat"
          icon="chat"
          isSelected={chatOpen}
          onChange={() => onTogglePanel('chat')}
          badge={unread > 0 && !chatOpen ? { count: unread, label: `${unread} unread` } : undefined}
        />
        <ToggleButton label="Shared notes" icon="notes" isSelected={panel === 'notes'} onChange={() => onTogglePanel('notes')} />
        <ToggleButton label="Plugins" icon="plugins" isSelected={pluginsOpen} onChange={() => onTogglePlugins?.()} />
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
        <ToggleButton label="Share media" icon="shareMedia" isSelected={isSharing} onChange={() => onShareMedia?.()} />
        <IconButton label="React" icon="react" variant="soft" size="touch" onPress={() => onReact?.()} />
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
        <IconButton
          label="Learning Analytics Dashboard"
          icon="analytics"
          variant="soft"
          size="touch"
          onPress={() => onAnalytics?.()}
        />
        <IconButton label="Room settings" icon="settings" variant="soft" size="touch" onPress={() => onSettings?.()} />
        <ConfirmDialog
          trigger={<IconButton label="Leave session" icon="leave" variant="soft" tone="danger" size="touch" />}
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
