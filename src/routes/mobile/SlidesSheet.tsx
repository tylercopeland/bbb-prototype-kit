/**
 * The All slides sheet (MB11, Mobile.dc.html 236–255): the deck's
 * thumbnails three to a row, the current one marked, with the slide count
 * beside the title. It replaces the desktop's popover on the phone: the
 * same `SlideThumb`s (12px captions, P6), in a `Sheet` like every other
 * overlay (P4, X1). Picking a slide moves the deck and closes the sheet;
 * focus returns to the pager's All slides button, also from a deep link.
 */
import type { RefObject } from 'react';
import { FocusFallback, Sheet, SlideThumb, type SheetPosition } from '../../components';
import { useRoom, useRoomDispatch } from '../../mocks/context';
import { selectDeck, selectSlideCount } from '../../mocks/selectors';
import { tv } from '../../styles/tv';

const slidesSheetStyles = tv({
  slots: {
    count: 'self-center text-md font-semibold text-text-muted tabular-nums',
    grid: 'grid grid-cols-3 gap-2',
    empty: 'py-6 text-center text-sm text-text-muted',
  },
});

export interface SlidesSheetProps {
  isOpen: boolean;
  position: SheetPosition;
  /** The pager's All slides button, for the focus fallback when the sheet was open on load. */
  triggerRef: RefObject<HTMLButtonElement | null>;
}

export function SlidesSheet({ isOpen, position, triggerRef }: SlidesSheetProps) {
  const styles = slidesSheetStyles();
  const dispatch = useRoomDispatch();
  const deck = useRoom(selectDeck);
  const slideCount = useRoom(selectSlideCount);
  const slideIndex = useRoom((s) => s.presentation.slideIndex);
  const slides = deck?.slides ?? [];
  return (
    <Sheet
      isOpen={isOpen}
      onOpenChange={(open) => !open && dispatch({ type: 'setSheet', sheet: 'none' })}
      title="All slides"
      headerExtra={
        <span aria-label={`Slide ${slideIndex + 1} of ${slideCount}`} className={styles.count()}>
          {slideCount === 0 ? '0 / 0' : `${slideIndex + 1} / ${slideCount}`}
        </span>
      }
      position={position}
    >
      <FocusFallback target={triggerRef} />
      {slides.length === 0 ? (
        <p className={styles.empty()}>This deck has no slides.</p>
      ) : (
        <div role="list" aria-label="Slides" className={styles.grid()}>
          {slides.map((title, i) => (
            <SlideThumb
              key={i}
              index={i}
              title={title}
              isCurrent={i === slideIndex}
              onPress={() => {
                dispatch({ type: 'goToSlide', index: i });
                dispatch({ type: 'setSheet', sheet: 'none' });
              }}
            />
          ))}
        </div>
      )}
    </Sheet>
  );
}
