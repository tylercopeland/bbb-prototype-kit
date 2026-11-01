/**
 * The React sheet (MB6, Mobile.dc.html 102–110): "React holds Raise hand"
 * (canvas notes), so the sheet is the Raise hand toggle over the six
 * reactions. The canvas's tray had no backdrop and no close button (P4,
 * X1); here it is a `Sheet` like the others: one scrim, a visible close
 * button, Escape closes, focus returns to the React button. A reaction
 * sends and closes the sheet; the hand stays as it is set.
 */
import type { RefObject } from 'react';
import { FocusFallback, ReactionTray, Sheet, TextToggle, type SheetPosition } from '../../components';
import { useRoom, useRoomDispatch } from '../../mocks/context';
import { selectSelf } from '../../mocks/selectors';
import { tv } from '../../styles/tv';

const reactSheetStyles = tv({
  slots: {
    body: 'flex flex-col gap-3',
    tray: 'justify-between',
  },
});

export interface ReactSheetProps {
  isOpen: boolean;
  position: SheetPosition;
  /** The React bar button, for the focus fallback when the sheet was open on load. */
  triggerRef: RefObject<HTMLButtonElement | null>;
}

export function ReactSheet({ isOpen, position, triggerRef }: ReactSheetProps) {
  const styles = reactSheetStyles();
  const dispatch = useRoomDispatch();
  const me = useRoom(selectSelf);
  const close = () => dispatch({ type: 'setReacting', reacting: false });
  return (
    <Sheet isOpen={isOpen} onOpenChange={(open) => !open && close()} title="React" position={position}>
      <FocusFallback target={triggerRef} />
      <div className={styles.body()}>
        <TextToggle
          icon="raiseHand"
          selectedTone="hand"
          shortcut="raiseHand"
          isSelected={me?.handRaisedAt != null}
          onChange={(raised) => me && dispatch({ type: raised ? 'raiseHand' : 'lowerHand', participantId: me.id })}
        >
          Raise hand
        </TextToggle>
        <ReactionTray
          className={styles.tray()}
          onReact={(kind) => {
            if (me) dispatch({ type: 'sendReaction', from: me.id, kind });
            close();
          }}
        />
      </div>
    </Sheet>
  );
}
