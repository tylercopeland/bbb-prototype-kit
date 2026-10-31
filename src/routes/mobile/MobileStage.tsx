/**
 * The phone's stage, in two pieces the screen lays out per orientation
 * (P1, P3): `PresentationBlock` is the slide with Minimize over its corner
 * and the pager under it (never over it: there is no hover on touch, and
 * the canvas's landscape pager covered the slide); `WebcamBand` is the
 * two-column grid of the four tiles that matter most (the canvas notes:
 * "capped at four so faces stay readable: the speaker, then raised hands
 * by longest wait, then recent activity") with the "+N · See all" row.
 * Everything comes from the store; nothing here hard-codes a count (X15).
 *
 * While annotating (MB12) the whiteboard toolbar takes the pager's place
 * under the slide and the slide carries the selected ring, as the canvas
 * draws it (Mobile.dc.html 57–67); the Annotate toggle stays where it is,
 * so toggling off or Escape ends it without losing focus. With the
 * presentation minimized (MB13, MB14) the band shows everyone, three to a
 * row in portrait and five in landscape, with the presentation as a tile
 * whose whole face is the Restore button (Mobile.dc.html 73, 407–408).
 */
import { useEffect, useRef, type Ref, type RefObject } from 'react';
import {
  Button,
  IconButton,
  PresentationTile,
  StageSlide,
  ToggleButton,
  WebcamStrip,
  WhiteboardToolbar,
} from '../../components';
import { useRoom, useRoomDispatch, useRoomStore } from '../../mocks/context';
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
    /** Annotating: the selected ring marks the slide as the thing being drawn on (the canvas's blue outline). */
    slide: '',
    minimize: 'absolute top-2 right-2',
    /** The row under the slide: the pager pill, or the toolbar card beside the Annotate toggle. */
    row: 'mx-auto flex max-w-full shrink-0 items-center gap-1',
    /** The pager: a pill on the stage, always visible (no hover on touch), the stage tokens like every control there. */
    pager: 'rounded-full border border-border bg-surface p-1 shadow-overlay',
    all: 'h-control-touch w-control-touch',
    divider: 'mx-1 h-5 shrink-0 border-l border-border',
    counter: 'min-w-14 text-center text-sm font-semibold text-text tabular-nums',
    counterLabel: 'sr-only',
    toolbar: 'min-w-0 flex-1',
  },
  variants: {
    orientation: {
      portrait: { root: 'shrink-0' },
      landscape: { root: 'min-h-0 flex-1', fit: 'container-size flex-1' },
    },
    annotating: {
      true: { slide: 'selected-ring', row: 'items-start gap-2' },
      false: { row: 'rounded-full border border-border bg-surface p-1 shadow-overlay' },
    },
  },
});

const webcamBandStyles = tv({
  slots: {
    root: 'flex min-h-0 flex-col gap-2',
    grid: 'min-h-0 overflow-y-auto',
    row: 'flex shrink-0 items-center justify-between gap-2',
    hint: 'min-w-0 text-xs leading-4 text-text-muted',
  },
});

export interface PresentationBlockProps {
  orientation: Orientation;
  /** The All slides button, so the slides sheet can hand focus back to it (MB11). */
  allSlidesRef?: Ref<HTMLButtonElement>;
  className?: string;
}

/**
 * The slide and its pager. Only the presenter gets the pager (a student
 * cannot turn the slides, MB15); everyone sees the slide number on the
 * slide itself. All slides opens the slides sheet (MB11); Annotate swaps
 * the pager for the whiteboard toolbar (MB12). Renders nothing while the
 * presentation is minimized (MB13) or when there is no deck.
 */
export function PresentationBlock({ orientation, allSlidesRef, className }: PresentationBlockProps) {
  const dispatch = useRoomDispatch();
  const deck = useRoom(selectDeck);
  const slideCount = useRoom(selectSlideCount);
  const slideIndex = useRoom((s) => s.presentation.slideIndex);
  const minimized = useRoom((s) => s.presentation.minimized);
  const tool = useRoom((s) => s.presentation.tool);
  const color = useRoom((s) => s.presentation.color);
  const sheet = useRoom((s) => s.ui.sheet);
  const annotating = useRoom((s) => s.ui.annotating);
  const me = useRoom(selectSelf);
  const isPresenter = me?.isPresenter ?? false;
  const styles = presentationStyles({ orientation, annotating: annotating && isPresenter });
  const annotateButton = useRef<HTMLButtonElement>(null);
  useAnnotateEscape(annotating && isPresenter, annotateButton);
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
          className={styles.slide()}
        >
          {!annotating && (
            <IconButton
              label="Minimize presentation"
              icon="minimize"
              variant="soft"
              size="touch"
              className={styles.minimize()}
              onPress={() => dispatch({ type: 'setPresentationMinimized', minimized: true })}
            />
          )}
        </StageSlide>
      </div>
      {isPresenter && (
        <div role="group" aria-label="Slides" className={styles.row()}>
          {annotating ? (
            <WhiteboardToolbar
              size="touch"
              wrap
              tool={tool}
              color={color}
              onToolChange={(next) => dispatch({ type: 'setTool', tool: next })}
              onColorChange={(next) => dispatch({ type: 'setInkColor', color: next })}
              className={styles.toolbar()}
            />
          ) : (
            <>
              <IconButton
                ref={allSlidesRef}
                label="All slides"
                icon="slidesOverview"
                size="touch"
                aria-haspopup="dialog"
                aria-expanded={sheet === 'slides'}
                className={styles.all()}
                onPress={() => dispatch({ type: 'setSheet', sheet: 'slides' })}
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
            </>
          )}
          <ToggleButton
            ref={annotateButton}
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

/**
 * Escape ends annotating (MB12) when nothing above the stage is open: a
 * sheet or a confirmation takes Escape for itself. Focus is kept: when it
 * was on the toolbar, which unmounts, it moves to the Annotate toggle,
 * which stays; anywhere else it stays where it is.
 */
function useAnnotateEscape(active: boolean, toggle: RefObject<HTMLButtonElement | null>) {
  const store = useRoomStore();
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      const { ui } = store.getState();
      if (ui.sheet !== 'none' || ui.reacting || ui.confirm !== 'none') return;
      const button = toggle.current;
      const row = button?.parentElement;
      const inRow = row?.contains(document.activeElement) ?? false;
      store.dispatch({ type: 'setAnnotating', annotating: false });
      if (inRow) button?.focus();
      event.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active, store, toggle]);
}

export interface WebcamBandProps {
  orientation: Orientation;
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
 * presentation is minimized every tile shows, with the presentation first
 * as a tile that restores it (MB13, MB14), and the See all row goes: the
 * list is already everyone.
 */
export function WebcamBand({ orientation, onSeeAll, seeAllRef, className }: WebcamBandProps) {
  const styles = webcamBandStyles();
  const dispatch = useRoomDispatch();
  const tiles = useRoom(selectTileOrder);
  const names = useRoom(selectDisplayNames);
  const reactions = useRoom(selectReactions);
  const minimized = useRoom((s) => s.presentation.minimized);
  const deck = useRoom(selectDeck);
  const slideCount = useRoom(selectSlideCount);
  const slideIndex = useRoom((s) => s.presentation.slideIndex);
  const presentationTile = minimized && deck !== null;
  const shown = minimized ? tiles : tiles.slice(0, PHONE_TILES);
  const hidden = tiles.length - shown.length;
  return (
    <div className={styles.root({ className })}>
      <WebcamStrip
        direction="grid"
        columns={minimized ? (orientation === 'portrait' ? 3 : 5) : 2}
        participants={shown}
        names={names}
        max={shown.length}
        reactions={reactions}
        {...(presentationTile ? { 'aria-label': 'Webcams and minimized presentation' } : {})}
        leading={
          presentationTile ? (
            <PresentationTile
              variant="button"
              slideTitle={deck.slides[slideIndex] ?? ''}
              slideNumber={slideIndex + 1}
              slideCount={slideCount}
              onRestore={() => dispatch({ type: 'setPresentationMinimized', minimized: false })}
            />
          ) : undefined
        }
        className={styles.grid()}
      />
      {hidden > 0 && (
        <div className={styles.row()}>
          <p className={styles.hint()}>Speaker and raised hands first</p>
          <Button
            ref={seeAllRef}
            size="sm"
            icon="webcamsAll"
            aria-label={`+${hidden} more, see all ${tiles.length} people`}
            onPress={onSeeAll}
          >
            {`+${hidden} · See all`}
          </Button>
        </div>
      )}
    </div>
  );
}
