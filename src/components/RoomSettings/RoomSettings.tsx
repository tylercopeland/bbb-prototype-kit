import type { ComponentProps } from 'react';
import { tv } from '../../styles/tv';
import { Switch } from '../Switch';

/** The settings list: switch rows, each with its own hairline. */
export const roomSettingsStyles = tv({
  base: 'flex w-72 max-w-full flex-col',
});

export interface RoomSettingsProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** `session.privateChat`. */
  privateChat: boolean;
  onPrivateChatChange?: (on: boolean) => void;
  className?: string;
}

/**
 * The Room settings picker's content (owner decision 2026-10-30): the
 * "Private chat" switch. Its label never changes; the description says what
 * off means. The Popover around it (title "Room settings", the close
 * button) belongs to the action bar's settings button.
 */
export function RoomSettings({ privateChat, onPrivateChatChange, className, ...props }: RoomSettingsProps) {
  return (
    <div {...props} className={roomSettingsStyles({ className })}>
      <Switch
        isSelected={privateChat}
        onChange={onPrivateChatChange}
        description="Students can message each other privately. Off, only moderators can start a private conversation, and students can still reply."
      >
        Private chat
      </Switch>
    </div>
  );
}
