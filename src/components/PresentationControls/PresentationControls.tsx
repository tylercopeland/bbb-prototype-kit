import type { ComponentProps } from 'react';
import type { InkColor, WhiteboardTool } from '../../mocks/types';
import { tv, type VariantProps } from '../../styles/tv';
import { IconButton } from '../IconButton';
import { SlideOverview } from '../SlideOverview';
import { WhiteboardToolbar } from '../WhiteboardToolbar';

/**
 * The row over the bottom of the slide (Focus.dc.html 108–125): the Slides
 * group on the left (All slides, the pager) and the whiteboard tools on
 * the right. It sits inside the slide, which is the hover `group`, and is
 * hidden until the slide is hovered or holds focus, and always shown on a
 * touch device (X13); it fades with opacity so Tab reaches it. While the
 * All slides dialog is open the row stays visible (`isRevealed`), because
 * focus is in the dialog then.
 */
export const presentationControlsStyles = tv({
  slots: {
    root: 'pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-2 opacity-0 transition-opacity group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100 pointer-coarse:pointer-events-auto pointer-coarse:opacity-100',
    slides: 'flex items-center gap-1 rounded-tile border border-border bg-surface p-1 shadow-overlay',
    divider: 'mx-1 h-5 shrink-0 border-l border-border',
    counter: 'min-w-14 text-center text-sm font-semibold text-text tabular-nums',
    counterLabel: 'sr-only',
  },
  variants: {
    isRevealed: {
      true: { root: 'pointer-events-auto opacity-100' },
    },
  },
});

export type PresentationControlsVariants = VariantProps<typeof presentationControlsStyles>;

export interface PresentationControlsProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** The deck's file name and slide titles, for All slides. */
  deckName: string;
  slides: string[];
  /** Zero-based. */
  slideIndex: number;
  overviewOpen?: boolean;
  onOverviewChange?: (open: boolean) => void;
  /** Zero-based, from All slides. */
  onGoToSlide?: (index: number) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  tool: WhiteboardTool;
  color: InkColor;
  onToolChange?: (tool: WhiteboardTool) => void;
  onColorChange?: (color: InkColor) => void;
  /** Keep the row visible regardless of hover and focus. Set while the All slides dialog is open. */
  isRevealed?: boolean;
  className?: string;
}

/**
 * A group named "Presentation controls": the Slides group (All slides with
 * its dialog, Previous, "3 / 12", Next) and the `WhiteboardToolbar`.
 * Previous and Next are disabled at the ends of the deck but stay focusable
 * with their tooltips. Nothing here reads the store: the room passes the
 * state and handles each change.
 */
export function PresentationControls({
  deckName,
  slides,
  slideIndex,
  overviewOpen,
  onOverviewChange,
  onGoToSlide,
  onPrevious,
  onNext,
  tool,
  color,
  onToolChange,
  onColorChange,
  isRevealed = false,
  className,
  ...props
}: PresentationControlsProps) {
  const styles = presentationControlsStyles({ isRevealed: isRevealed || overviewOpen });
  const count = slides.length;

  return (
    <div role="group" aria-label="Presentation controls" {...props} className={styles.root({ className })}>
      <div role="group" aria-label="Slides" className={styles.slides()}>
        <SlideOverview
          deckName={deckName}
          slides={slides}
          currentIndex={slideIndex}
          isOpen={overviewOpen}
          onOpenChange={onOverviewChange}
          onPick={onGoToSlide}
        />
        <span aria-hidden="true" className={styles.divider()} />
        <IconButton
          label="Previous slide"
          icon="previousSlide"
          isDisabled={slideIndex <= 0}
          onPress={onPrevious}
        />
        <span className={styles.counter()}>
          <span className={styles.counterLabel()}>Slide </span>
          {count === 0 ? '0 / 0' : `${slideIndex + 1} / ${count}`}
        </span>
        <IconButton
          label="Next slide"
          icon="nextSlide"
          variant="primary"
          isDisabled={slideIndex >= count - 1}
          onPress={onNext}
        />
      </div>
      <WhiteboardToolbar
        tool={tool}
        color={color}
        onToolChange={onToolChange}
        onColorChange={onColorChange}
      />
    </div>
  );
}
