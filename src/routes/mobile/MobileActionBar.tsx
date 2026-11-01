/**
 * The phone's action bar (Mobile.dc.html 89–99, canvas notes: "People &
 * chat · Mic · Camera · React · More · Leave; React holds Raise hand, so
 * the bar fits one thumb row"). One row of 44px controls: People & chat on
 * the left with the unread count, the media group in the middle, Leave on
 * the right. Nothing here reads the store: the screen passes the state and
 * handles each change, as the desktop `ActionBar` does.
 */
import type { Ref } from 'react';
import { IconButton, ToggleButton } from '../../components';
import { formatUnread } from '../../mocks/format';
import type { AudioState } from '../../mocks/types';
import { tv } from '../../styles/tv';

const mobileActionBarStyles = tv({
  slots: {
    root: 'flex items-center justify-between gap-2',
    media: 'flex items-center gap-2',
  },
});

export interface MobileActionBarProps {
  /** The People & chat sheet (or the student sheet over it) is open; its button is pressed. */
  peopleOpen: boolean;
  /** The React sheet is open; its button is expanded. */
  reactOpen: boolean;
  /** The More sheet is open; its button is expanded. */
  moreOpen: boolean;
  /** The count on People & chat, hidden while the sheet is open. */
  unread: number;
  /** Your own audio. `notJoined` and `listening` show "Join audio" in the mic slot instead of the toggle. */
  audio: AudioState;
  camera: boolean;
  onPeopleChange: (open: boolean) => void;
  onReact: () => void;
  onMore: () => void;
  /** Opens the Leave confirmation (MB16); the screen leaves after it. */
  onLeave: () => void;
  onJoinAudio?: () => void;
  onMicrophoneChange?: (on: boolean) => void;
  onCameraChange?: (on: boolean) => void;
  /** The buttons that open the sheets and the confirmation, so a sheet opened from a deep link can hand focus back (WCAG 2.4.3). */
  refs?: Partial<Record<'people' | 'react' | 'more' | 'leave', Ref<HTMLButtonElement>>>;
  className?: string;
}

/**
 * A `nav` named "Actions", like the desktop bar, so the e2e walks find it
 * the same way. People & chat is a toggle with a fixed label and the count
 * as its description (X7); React and More open sheets, so they carry
 * `aria-expanded` and `aria-haspopup="dialog"`; Leave asks first (D5).
 */
export function MobileActionBar({
  peopleOpen,
  reactOpen,
  moreOpen,
  unread,
  audio,
  camera,
  onPeopleChange,
  onReact,
  onMore,
  onLeave,
  onJoinAudio,
  onMicrophoneChange,
  onCameraChange,
  refs,
  className,
}: MobileActionBarProps) {
  const styles = mobileActionBarStyles();
  const audioJoined = audio === 'live' || audio === 'speaking' || audio === 'muted';
  return (
    <nav aria-label="Actions" className={styles.root({ className })}>
      <ToggleButton
        ref={refs?.people}
        label="People and chat"
        icon="people"
        isSelected={peopleOpen}
        onChange={onPeopleChange}
        badge={unread > 0 && !peopleOpen ? { count: unread, label: formatUnread(unread) } : undefined}
      />
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
        <IconButton
          ref={refs?.react}
          label="React"
          icon="react"
          variant="soft"
          size="touch"
          aria-haspopup="dialog"
          aria-expanded={reactOpen}
          onPress={onReact}
        />
        <IconButton
          ref={refs?.more}
          label="More"
          icon="more"
          variant="soft"
          size="touch"
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          onPress={onMore}
        />
      </div>
      <IconButton
        ref={refs?.leave}
        label="Leave session"
        icon="leave"
        variant="soft"
        tone="danger"
        size="touch"
        aria-haspopup="dialog"
        onPress={onLeave}
      />
    </nav>
  );
}
