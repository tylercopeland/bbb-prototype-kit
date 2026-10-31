/**
 * The Everyone sheet (MB10, Mobile.dc.html 218–234): every webcam, two to a
 * row, in the tile order the band uses. "See all" opens it (the canvas
 * notes: "+10 · See all opens everyone"). The sheet is a white panel like
 * every overlay (owner decision 2026-10-24); the tiles sit on a stage
 * surface inside it, as video always does. Sized per orientation (P3): a
 * full-height bottom sheet in portrait, a side sheet in landscape. Tiles
 * are not tappable, as on desktop (P7).
 */
import type { RefObject } from 'react';
import { FocusFallback, Sheet, Surface, WebcamStrip, type SheetPosition } from '../../components';
import { useRoom, useRoomDispatch } from '../../mocks/context';
import { selectDisplayNames, selectReactions, selectTileOrder } from '../../mocks/selectors';
import { tv } from '../../styles/tv';

const everyoneSheetStyles = tv({
  slots: {
    sheet: 'h-full',
    count: 'self-center text-lg font-semibold text-text-muted',
    stage: 'rounded-tile bg-surface-stage p-2',
    /** The list is the sheet's only content and the body scrolls, so the list is tabbable: keyboard users can reach and scroll it (axe: scrollable-region-focusable). */
    list: 'rounded-tile focus-ring',
  },
});

export interface EveryoneSheetProps {
  isOpen: boolean;
  position: SheetPosition;
  /** The "See all" button, for the focus fallback when the sheet was open on load. */
  triggerRef: RefObject<HTMLButtonElement | null>;
}

export function EveryoneSheet({ isOpen, position, triggerRef }: EveryoneSheetProps) {
  const styles = everyoneSheetStyles();
  const dispatch = useRoomDispatch();
  const tiles = useRoom(selectTileOrder);
  const names = useRoom(selectDisplayNames);
  const reactions = useRoom(selectReactions);
  return (
    <Sheet
      isOpen={isOpen}
      onOpenChange={(open) => !open && dispatch({ type: 'setSheet', sheet: 'none' })}
      title="Everyone"
      headerExtra={
        <span aria-label={`${tiles.length} people`} className={styles.count()}>
          {tiles.length}
        </span>
      }
      position={position}
      className={styles.sheet()}
    >
      <FocusFallback target={triggerRef} />
      <Surface kind="stage" className={styles.stage()}>
        <WebcamStrip
          direction="grid"
          participants={tiles}
          names={names}
          max={tiles.length}
          reactions={reactions}
          tabIndex={0}
          className={styles.list()}
        />
      </Surface>
    </Sheet>
  );
}
