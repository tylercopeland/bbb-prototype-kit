/**
 * The phone's stage, in two pieces the screen lays out per orientation
 * (P1, P3): `PresentationBlock` is the slide with Minimize over its corner
 * and the pager under it (never over it: there is no hover on touch, and
 * the canvas's landscape pager covered the slide); `WebcamBand` is the
 * two-column grid of the four tiles that matter most (the canvas notes:
 * "capped at four so faces stay readable: the speaker, then raised hands
 * by longest wait, then recent activity") with the "+N · See all" row.
 * Everything comes from the store; nothing here hard-codes a count (X15).
 */
import type { Ref } from 'react';
import {
  Button,
  IconButton,
  SlideOverview,
  StageSlide,
  ToggleButton,
  WebcamStrip,
} from '../../components';
import { useRoom, useRoomDispatch } from '../../mocks/context';
import {
  selectDeck,
  selectDisplayNames,
  selectReactions,
  selectSelf,
  selectSlideCount,
  selectTileOrder,
} from '../../mocks/selectors';
import type { Orientation } from '../../mocks/types';
import { tv } from '../../styles/tv';

/** Tiles in the band before "+N · See all" (Mobile.dc.html 392: `nTiles = 4`). */
export const PHONE_TILES = 4;

const presentationStyles = tv({
  slots: {
    root: 'flex min-h-0 flex-col gap-2',
    /** The box the slide fits in: the size container in landscape, where the slide fits by height. */
    fit: 'relative flex min-h-0 items-center justify-center',
    minimize: 'absolute top-2 right-2',
    /** The pager: a pill on the stage, always visible (no hover on touch), the stage tokens like every control there. */
    pager: 'mx-auto flex shrink-0 items-center gap-1 rounded-full border border-border bg-surface p-1 shadow-overlay',
    all: 'h-control-touch w-control-touch',
    divider: 'mx-1 h-5 shrink-0 border-l border-border',
    counter: 'min-w-14 text-center text-sm font-semibold text-text tabular-nums',
    counterLabel: 'sr-only',
  },
  variants: {
    orientation: {
      portrait: { root: 'shrink-0' },
      landscape: { root: 'min-h-0 flex-1', fit: '@container flex-1' },
    },
  },
});

const webcamBandStyles = tv({
  slots: {
    root: 'flex min-h-0 flex-col gap-2',
    grid: 'min-h-0 overflow-y-auto',
    row: 'flex shrink-0 items-center justify-between gap-2',
    hint: 'min-w-0 truncate text-xs text-text-muted',
  },
});

export interface PresentationBlockProps {
  orientation: Orientation;
  className?: string;
}

/**
 * The slide and its pager. Only the presenter gets the pager (a student
 * cannot turn the slides, MB15); everyone sees the slide number on the
 * slide itself. All slides is the desktop's `SlideOverview` dialog until
 * batch B's sheet (MB11); Annotate keeps its state as a toggle until batch
 * B draws the toolbar (MB12). Renders nothing while the presentation is
 * minimized (MB13, batch B) or when there is no deck.
 */
export function PresentationBlock({ orientation, className }: PresentationBlockProps) {
  const styles = presentationStyles({ orientation });
  const dispatch = useRoomDispatch();
  const deck = useRoom(selectDeck);
  const slideCount = useRoom(selectSlideCount);
  const slideIndex = useRoom((s) => s.presentation.slideIndex);
  const minimized = useRoom((s) => s.presentation.minimized);
  const sheet = useRoom((s) => s.ui.sheet);
  const annotating = useRoom((s) => s.ui.annotating);
  const me = useRoom(selectSelf);
  if (!deck || minimized) return null;
  return (
    <section aria-label="Presentation" className={styles.root({ className })}>
      <div className={styles.fit()}>
        <StageSlide
          deckName={deck.file}
          slideTitle={deck.slides[slideIndex] ?? ''}
          slideNumber={slideIndex + 1}
          slideCount={slideCount}
          webcams={orientation === 'portrait' ? 'below' : 'beside'}
        >
          <IconButton
            label="Minimize presentation"
            icon="minimize"
            variant="soft"
            size="touch"
            className={styles.minimize()}
            onPress={() => dispatch({ type: 'setPresentationMinimized', minimized: true })}
          />
        </StageSlide>
      </div>
      {me?.isPresenter && (
        <div role="group" aria-label="Slides" className={styles.pager()}>
          <SlideOverview
            deckName={deck.file}
            slides={deck.slides}
            currentIndex={slideIndex}
            isOpen={sheet === 'slides'}
            onOpenChange={(open) => dispatch({ type: 'setSheet', sheet: open ? 'slides' : 'none' })}
            onPick={(index) => {
              dispatch({ type: 'goToSlide', index });
              dispatch({ type: 'setSheet', sheet: 'none' });
            }}
            className={styles.all()}
          />
          <span aria-hidden="true" className={styles.divider()} />
          <IconButton
            label="Previous slide"
            icon="previousSlide"
            size="touch"
            isDisabled={slideIndex <= 0}
            onPress={() => dispatch({ type: 'prevSlide' })}
          />
          <span className={styles.counter()}>
            <span className={styles.counterLabel()}>Slide </span>
            {slideCount === 0 ? '0 / 0' : `${slideIndex + 1} / ${slideCount}`}
          </span>
          <IconButton
            label="Next slide"
            icon="nextSlide"
            variant="primary"
            size="touch"
            isDisabled={slideIndex >= slideCount - 1}
            onPress={() => dispatch({ type: 'nextSlide' })}
          />
          <span aria-hidden="true" className={styles.divider()} />
          <ToggleButton
            label="Annotate"
            icon="annotate"
            isSelected={annotating}
            onChange={(on) => dispatch({ type: 'setAnnotating', annotating: on })}
          />
        </div>
      )}
    </section>
  );
}

export interface WebcamBandProps {
  /** "+N · See all" opens the Everyone sheet (MB10). */
  onSeeAll: () => void;
  /** The See all button, so the Everyone sheet opened from a deep link can hand focus back. */
  seeAllRef?: Ref<HTMLButtonElement>;
  className?: string;
}

/**
 * The four tiles that matter most, in `selectTileOrder`, and the row that
 * says so with the "+N · See all" button, named "+10 more, see all 14
 * people" (WCAG 2.5.3: the name starts with the visible text). While the
 * presentation is minimized every tile shows and "Show presentation"
 * brings the slide back (the canvas's slide tile is batch B, MB13).
 */
export function WebcamBand({ onSeeAll, seeAllRef, className }: WebcamBandProps) {
  const styles = webcamBandStyles();
  const dispatch = useRoomDispatch();
  const tiles = useRoom(selectTileOrder);
  const names = useRoom(selectDisplayNames);
  const reactions = useRoom(selectReactions);
  const minimized = useRoom((s) => s.presentation.minimized);
  const hasDeck = useRoom(selectDeck) !== null;
  const shown = minimized ? tiles : tiles.slice(0, PHONE_TILES);
  const hidden = tiles.length - shown.length;
  return (
    <div className={styles.root({ className })}>
      <WebcamStrip
        direction="grid"
        participants={shown}
        names={names}
        max={shown.length}
        reactions={reactions}
        className={styles.grid()}
      />
      {(hidden > 0 || (minimized && hasDeck)) && (
        <div className={styles.row()}>
          {hidden > 0 ? (
            <p className={styles.hint()}>Speaker and raised hands first</p>
          ) : (
            <p className={styles.hint()}>Everyone</p>
          )}
          {minimized && hasDeck ? (
            <Button
              size="sm"
              icon="restore"
              onPress={() => dispatch({ type: 'setPresentationMinimized', minimized: false })}
            >
              Show presentation
            </Button>
          ) : (
            <Button
              ref={seeAllRef}
              size="sm"
              icon="webcamsAll"
              aria-label={`+${hidden} more, see all ${tiles.length} people`}
              onPress={onSeeAll}
            >
              {`+${hidden} · See all`}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
