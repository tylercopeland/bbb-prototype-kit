import type { Ref } from 'react';
import { useRoom, useRoomDispatch } from '../../mocks/context';
import { firstName } from '../../mocks/names';
import { selectDisplayNames, selectParticipant, selectSelf } from '../../mocks/selectors';
import type { ParticipantId } from '../../mocks/types';
import { tv } from '../../styles/tv';
import { TextArea, type TextAreaProps } from '../TextArea';

/** The composer sits at the bottom of the chat panel with the panel's padding (Focus.dc.html 473, 494). */
export const composerStyles = tv({
  base: 'px-3 pb-3',
});

export interface ComposerProps extends Pick<TextAreaProps, 'autoFocus' | 'isDisabled' | 'description'> {
  /**
   * The other person of a private thread. Left out, the message goes to
   * everyone. The label, placeholder and the lock glyph follow from it.
   */
  to?: ParticipantId;
  /** Called after the message was sent, with its text. */
  onSent?: (text: string) => void;
  className?: string;
  /** The textarea element. */
  ref?: Ref<HTMLTextAreaElement>;
}

/**
 * The chat composer: a `TextArea` that sends through the room store. Enter
 * sends and Shift + Enter adds a line (TextArea's keys); the reducer adds
 * the message from the local person, to everyone or to `to`, and the
 * `RoomProvider` announces messages from others, never our own. It needs
 * a `RoomProvider` above it, like every store-connected piece.
 */
export function Composer({ to, onSent, className, ...props }: ComposerProps) {
  const dispatch = useRoomDispatch();
  const me = useRoom(selectSelf);
  const other = useRoom(selectParticipant(to ?? null));
  const names = useRoom(selectDisplayNames);
  // The short name tells two Anas apart (B9): "Message Ana S. privately".
  const label = other ? `Message ${names[other.id] ?? firstName(other.name)} privately` : 'Message everyone';
  const send = (text: string) => {
    if (!me) return;
    dispatch({ type: 'sendMessage', from: me.id, text, to });
    onSent?.(text);
  };
  return (
    <TextArea
      {...props}
      label={label}
      labelHidden
      placeholder={label}
      icon={other ? 'private' : undefined}
      onSend={send}
      className={composerStyles({ className })}
    />
  );
}
