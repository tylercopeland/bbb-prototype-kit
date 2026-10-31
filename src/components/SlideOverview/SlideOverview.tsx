import { useMemo, useRef, type Ref } from 'react';
import { mergeRefs } from 'react-aria';
import { Button as RacButton, composeRenderProps } from 'react-aria-components';
import { tv } from '../../styles/tv';
import { IconButton } from '../IconButton';
import { Popover } from '../Popover';

/** The grid of thumbnails (Focus.dc.html 88–105): four columns, 10px apart. */
export const slideOverviewStyles = tv({
  slots: {
    /** The popover: wide enough for four thumbnails a row. */
    popover: 'w-166',
    subtitle: 'text-sm text-text-muted',
    grid: 'grid grid-cols-4 gap-2',
    empty: 'py-6 text-center text-sm text-text-muted',
  },
});

/** The "All slides" trigger; the consumer's className merges here. */
export const slideOverviewTriggerStyles = tv({ base: '' });

/** One slide's button: a column of paper and caption, the sunken fill on hover. */
export const slideThumbStyles = tv({
  base: 'flex w-full min-w-0 flex-col gap-1 rounded-control p-1 text-left focus-ring outline-none data-hovered:bg-surface-sunken data-pressed:bg-surface-sunken',
});

/**
 * Inside a slide's button: a 16:9 paper thumbnail (the slide pair in every
 * mode) with the title inside, then the number and title under it. The
 * current slide gets the selected border and ring plus `aria-current`, so
 * the state is never color alone.
 */
export const slideThumbPartsStyles = tv({
  slots: {
    item: 'flex min-w-0',
    paper:
      'flex aspect-video w-full items-start overflow-hidden rounded-control border border-border bg-slide p-2 text-xs leading-4 font-bold text-on-slide',
    paperTitle: 'line-clamp-2 break-words',
    caption: 'flex min-w-0 items-baseline gap-1 text-xs',
    number: 'shrink-0 font-bold text-text-muted',
    title: 'min-w-0 truncate text-text-secondary',
  },
  variants: {
    isCurrent: {
      true: {
        paper: 'border-selected-border selected-ring',
        number: 'text-accent',
      },
    },
  },
});

export interface SlideOverviewProps {
  /** The deck's file name, for the subtitle ("bbb-4-refined.pdf · 12 slides"). */
  deckName: string;
  /** Slide titles, in order; the count is the length. */
  slides: string[];
  /** Zero-based current slide. */
  currentIndex: number;
  /** Controlled by the room (`presentation.overviewOpen`). */
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  /** Called with the zero-based index of the chosen slide; the room goes there and closes the overview. */
  onPick?: (index: number) => void;
  className?: string;
  /** The trigger button. */
  ref?: Ref<HTMLButtonElement>;
}

/**
 * "All slides" (N1): an IconButton trigger with `aria-expanded`, and a
 * popover dialog named "All slides" holding the thumbnails as buttons
 * ("Go to slide 3: BigBlueButton 4.0, refined"), the current one marked
 * with `aria-current`. Picking a slide calls `onPick`; the room then moves
 * the deck and closes the dialog, and focus returns to the trigger (X1).
 * The grid scales with the deck: three slides or thirty, four per row.
 */
export function SlideOverview({
  deckName,
  slides,
  currentIndex,
  isOpen,
  defaultOpen,
  onOpenChange,
  onPick,
  className,
  ref,
}: SlideOverviewProps) {
  const styles = slideOverviewStyles();
  // The trigger, for the popover's focus fallback (a deep link to N1 opens it with no trigger press to return to).
  const trigger = useRef<HTMLButtonElement>(null);
  const triggerRef = useMemo(() => mergeRefs(trigger, ref), [ref]);
  return (
    <Popover
      title="All slides"
      trigger={
        <IconButton
          ref={triggerRef}
          label="All slides"
          icon="slidesOverview"
          className={slideOverviewTriggerStyles({ className })}
        />
      }
      restoreFocusTo={trigger}
      isOpen={isOpen}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      placement="top start"
      className={styles.popover()}
    >
      <p className={styles.subtitle()}>
        {deckName} · {slides.length} {slides.length === 1 ? 'slide' : 'slides'}
      </p>
      {slides.length === 0 ? (
        <p className={styles.empty()}>This deck has no slides.</p>
      ) : (
        <div role="list" aria-label="Slides" className={styles.grid()}>
          {slides.map((title, i) => (
            <SlideThumb
              key={i}
              index={i}
              title={title}
              isCurrent={i === currentIndex}
              onPress={() => onPick?.(i)}
            />
          ))}
        </div>
      )}
    </Popover>
  );
}

interface SlideThumbProps {
  index: number;
  title: string;
  isCurrent: boolean;
  onPress?: () => void;
  className?: string;
}

function SlideThumb({ index, title, isCurrent, onPress, className }: SlideThumbProps) {
  const styles = slideThumbPartsStyles({ isCurrent });
  const number = index + 1;
  return (
    <div role="listitem" className={styles.item()}>
      <RacButton
        aria-label={`Go to slide ${number}: ${title}`}
        aria-current={isCurrent ? 'true' : undefined}
        onPress={onPress}
        className={composeRenderProps(className, (cls) => slideThumbStyles({ className: cls }))}
      >
        <span aria-hidden="true" className={styles.paper()}>
          <span className={styles.paperTitle()}>{title}</span>
        </span>
        <span aria-hidden="true" className={styles.caption()}>
          <span className={styles.number()}>{number}</span>
          <span className={styles.title()}>{title}</span>
        </span>
      </RacButton>
    </div>
  );
}
