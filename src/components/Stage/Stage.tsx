import type { ReactNode, Ref } from 'react';
import { Button as RacButton, type Key } from 'react-aria-components';
import { Icon } from '../../icons';
import type { Participant, ParticipantId, ReactionKind, ScreenKind, StageCorner } from '../../mocks/types';
import { tv, type VariantProps } from '../../styles/tv';
import { IconButton } from '../IconButton';
import { Surface } from '../Surface';
import { Tab, TabList, TabPanel, Tabs } from '../Tabs';
import { VideoTile } from '../VideoTile';
import { DEFAULT_MAX_TILES, WebcamStrip } from '../WebcamStrip';

/**
 * The dark video area (Focus.dc.html 16–24, 128–156): the slide and the
 * webcam strip in the presentation layouts, or a grid of everyone when the
 * presentation is minimized or there is none. Everything here sits inside
 * `<Surface kind="stage">`, so the tokens resolve to the stage ramp.
 *
 * With the strip beside the slide (`side`), the slide column fills the
 * stage and the slide fits by height inside its own size container, while
 * the strip starts at the canvas's offset below the top of the stage
 * (Focus.dc.html 870: 162px from the room's top, 98px into the stage). With
 * the strip above (`top`), the stage is the size container and the strip
 * and the slide are centred together as one block (883–884).
 */
export const stageStyles = tv({
  slots: {
    root: 'relative flex min-h-0 min-w-0 flex-1 gap-3 bg-surface-stage p-3',
    /** The slide column: the chrome row, then the slide. */
    presentation: 'flex min-h-0 min-w-0 flex-col gap-3',
    chrome: 'flex min-h-control-md items-center justify-between gap-3',
    /** The right end of the chrome row: the share pill (M1, M2), then Minimize. */
    chromeEnd: 'flex min-w-0 flex-1 items-center justify-end gap-3',
    /** The box the slide fits in; the overlay layer is positioned against it. */
    fit: 'relative flex min-h-0 min-w-0 items-center justify-center',
    /** The webcam strip. */
    strip: '',
    /** The shared screen's frame: fitted like the slide. */
    screen:
      'relative flex items-center justify-center overflow-hidden rounded-tile border border-border bg-surface-tile text-text shadow-overlay',
    screenNote: 'flex items-center gap-2 text-md font-semibold',
    screenDot: 'size-2 rounded-full bg-danger-text',
    /** The "What everyone sees" tabs in the chrome row. */
    shareTabs: 'w-96 max-w-full',
    /** The tab panels only say what is on stage; the stage itself shows it. */
    shareNote: 'sr-only',
    /** A grid cell. */
    cell: 'flex',
  },
  variants: {
    webcams: {
      side: {
        root: 'flex-row',
        presentation: 'flex-1',
        fit: '@container flex-1',
        strip: 'mt-21',
        screen: 'slide-fit',
      },
      top: {
        root: '@container flex-col items-center justify-center',
        presentation: 'w-full flex-none',
        fit: 'flex-none',
        screen: 'slide-fit-stacked',
      },
    },
  },
  defaultVariants: { webcams: 'side' },
});

/**
 * The slide placeholder: white paper in every mode (`slide` / `on-slide`),
 * 16:9, fitted like the stage says. It is the hover `group` for the
 * presentation controls drawn over its bottom edge (X13). `below` and
 * `beside` are the phone's slide (Mobile.dc.html 38): full width with the
 * webcams under it in portrait, fitted by height with the webcams beside
 * it in landscape, both with tighter padding and no reserved corner,
 * because the pager sits below the slide and the alerts in the header.
 */
export const slideStyles = tv({
  slots: {
    root: 'group relative flex flex-col justify-between overflow-hidden rounded-tile bg-slide p-6 text-on-slide shadow-overlay',
    /** The deck name and the title keep clear of the reserved top-right corner (D1): room for the widest card (the poll results, panel width) and its inset. */
    header: 'flex flex-col pr-96',
    deck: 'text-sm font-semibold tracking-label uppercase',
    title: 'text-xl font-bold text-balance',
    number: 'self-end text-sm font-semibold tabular-nums',
    /** "Slide" before the number, for assistive technology only. */
    numberLabel: 'sr-only',
  },
  variants: {
    webcams: {
      side: { root: 'slide-fit' },
      top: { root: 'slide-fit-stacked' },
      below: { root: 'aspect-video w-full p-4', header: 'pr-12', title: 'text-lg' },
      beside: { root: 'slide-fit p-4', header: 'pr-12', title: 'text-lg' },
    },
  },
  defaultVariants: { webcams: 'side' },
});

export type SlideWebcams = NonNullable<VariantProps<typeof slideStyles>['webcams']>;

/**
 * The grid of everyone (Focus.dc.html 141–155): the column count comes
 * from the number of tiles, never a fixed 5×3 (X15). Cells keep 16:9
 * through the tile; the grid centres them in the stage.
 */
export const stageGridStyles = tv({
  base: 'grid w-full list-none content-center gap-3 p-0',
  variants: {
    columns: {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
      7: 'grid-cols-7',
      8: 'grid-cols-8',
    },
  },
  defaultVariants: { columns: 1 },
});

/**
 * The minimized presentation's cell: a tile with the slide thumbnail, its
 * plate and the Restore button. The plate and the button share the bottom
 * row (the plate truncates, the button never moves), and the thumbnail
 * keeps clear of that row and clamps its title to two lines, so the cell
 * still reads at eight columns with thirty people.
 */
export const presentationTileStyles = tv({
  slots: {
    root: 'relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-tile border border-border-strong bg-surface-sunken',
    thumb:
      'absolute inset-x-4 top-3 bottom-12 flex items-center justify-center overflow-hidden rounded-xs bg-slide p-2 text-center text-xs leading-4 font-semibold text-on-slide',
    thumbTitle: 'line-clamp-2 break-words',
    bottom: 'absolute inset-x-2 bottom-2 flex items-center justify-between gap-2',
    plate:
      'min-w-0 truncate rounded-xs bg-surface-overlay px-2 text-xs leading-5 font-semibold text-text-on-stage',
    restore: 'shrink-0',
    /** The restore glyph in the corner of the whole-tile button (Mobile.dc.html 73). */
    glyph:
      'absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-surface-overlay text-text-on-stage',
  },
  variants: {
    variant: {
      /** The desktop grid's cell: the plate and a Restore button share the bottom row. */
      tile: {},
      /** The phone's cell (MB13, MB14): the whole tile is the Restore button, so a small cell still has a 44px target (X14); the thumbnail is bare paper. */
      button: {
        thumb: 'inset-x-3 top-2 bottom-8 p-0',
        thumbTitle: 'hidden',
        bottom: 'justify-start',
      },
    },
  },
  defaultVariants: { variant: 'tile' },
});

/** The whole-tile Restore button: fills the cell, the focus ring on the cell's radius, the raised fill under the pointer. */
export const presentationTileButtonStyles = tv({
  base: 'absolute inset-0 rounded-tile focus-ring outline-none data-hovered:bg-surface-raised data-pressed:bg-surface-raised',
});

export type PresentationTileVariant = NonNullable<VariantProps<typeof presentationTileStyles>['variant']>;

/**
 * The overlay layer (D1): four corner slots over the slide (or over the
 * whole stage in the grid layouts), each a column of cards. The layer lets
 * pointer events through to the slide; the cards take them back. The top
 * right is the reserved corner: the timer defaults there and the poll
 * results always sit there, and the slide's title block keeps clear of it.
 * Alert pills live in the session header and the webcam strip is outside
 * the slide column, so neither overlaps a card.
 */
export const stageOverlayStyles = tv({
  slots: {
    layer: 'pointer-events-none absolute inset-0 grid grid-cols-2 grid-rows-2 gap-3 p-3',
    corner: 'flex min-w-0 flex-col gap-3 *:pointer-events-auto',
  },
  variants: {
    corner: {
      topLeft: { corner: 'items-start justify-start' },
      topRight: { corner: 'items-end justify-start' },
      bottomLeft: { corner: 'items-start justify-end' },
      bottomRight: { corner: 'items-end justify-end' },
    },
  },
});

/** The corners in grid order: top row, then bottom row. */
export const STAGE_CORNER_ORDER: StageCorner[] = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];

/** Cards per corner. */
export type StageOverlays = Partial<Record<StageCorner, ReactNode>>;

export type StageWebcams = NonNullable<VariantProps<typeof stageStyles>['webcams']>;
export type StageColumns = NonNullable<VariantProps<typeof stageGridStyles>['columns']>;
export type StageLayout = 'presentation' | 'presenter' | 'minimized' | 'grid';
export type StageTab = 'slides' | 'screen';

export const MAX_GRID_COLUMNS = 8;

/**
 * Columns for `count` tiles on a wide stage: enough that rows stay few
 * and tiles stay 16:9 (15 tiles give the canvas's 5 columns; 2 give 2; 31
 * give 8, the cap).
 */
export function gridColumns(count: number): StageColumns {
  const cols = Math.ceil(Math.sqrt(Math.max(1, count) * 1.6));
  return Math.max(1, Math.min(MAX_GRID_COLUMNS, cols)) as StageColumns;
}

export interface StagePresentation {
  /** The deck's file name ("bbb-4-refined.pdf"). */
  deckName: string;
  slideTitle: string;
  /** One-based, as shown. */
  slideNumber: number;
  slideCount: number;
}

export interface StageShare {
  kind: ScreenKind;
  /** Which tab is on stage for everyone while the screen is shared. */
  showing: StageTab;
}

export interface StageProps {
  /**
   * `presentation`: the slide and the webcam strip. `presenter`: the same
   * with the Presentation / Screen tabs above it while a screen is shared.
   * `minimized`: the grid of everyone plus the presentation tile. `grid`:
   * the grid alone, for a room with nothing to present.
   */
  layout: StageLayout;
  /** Everyone, in tile order (`selectTileOrder`). */
  participants: Participant[];
  /** Short names for the plates (`selectDisplayNames`); the local person is "You". */
  names: Record<ParticipantId, string>;
  /** Where the strip sits in the presentation layouts: beside the slide, or above it when the panel narrows the stage. @default 'side' */
  webcams?: StageWebcams;
  /** Tiles in the strip before "+N more". @default 5 */
  maxTiles?: number;
  presentation?: StagePresentation;
  /** The shared screen, for the `presenter` layout. */
  share?: StageShare;
  /** Current reactions by person (`selectReactions`), shown on the tiles. */
  reactions?: Record<ParticipantId, ReactionKind>;
  /** The `PresentationControls`, drawn over the bottom of the slide while the slide is on stage. */
  controls?: ReactNode;
  /** The `SharePill`, in the chrome row before Minimize while a screen is shared. */
  sharePill?: ReactNode;
  onShowAll?: () => void;
  onMinimize?: () => void;
  onRestore?: () => void;
  onShowingChange?: (showing: StageTab) => void;
  /** Floating cards (the timer, poll results) by corner, drawn over the slide in the overlay layer (D1). */
  overlays?: StageOverlays;
  className?: string;
}

/**
 * The stage never hard-codes a count: the strip's remainder, the grid's
 * columns and the slide number all come from props. The minimize and
 * restore controls are always visible, not hover-only (X13); the full
 * presentation controls come with milestone 5.
 */
export function Stage({
  layout,
  participants,
  names,
  webcams = 'side',
  maxTiles = DEFAULT_MAX_TILES,
  presentation,
  share,
  reactions,
  controls,
  sharePill,
  onShowAll,
  onMinimize,
  onRestore,
  onShowingChange,
  overlays,
  className,
}: StageProps) {
  const styles = stageStyles({ webcams });
  const showGrid = layout === 'grid' || layout === 'minimized' || !presentation;
  const layer =
    overlays && STAGE_CORNER_ORDER.some((c) => overlays[c]) ? <OverlayLayer overlays={overlays} /> : null;
  const strip = (
    <WebcamStrip
      participants={participants}
      names={names}
      max={maxTiles}
      direction={webcams === 'top' ? 'row' : 'column'}
      reactions={reactions}
      onShowAll={onShowAll}
      className={styles.strip()}
    />
  );
  return (
    <Surface kind="stage" className={styles.root({ className })}>
      {showGrid ? (
        <>
          <StageGrid
            participants={participants}
            names={names}
            reactions={reactions}
            presentation={layout === 'minimized' ? presentation : undefined}
            onRestore={onRestore}
          />
          {layer}
        </>
      ) : (
        <>
          {webcams === 'top' && strip}
          <section aria-label="Presentation" className={styles.presentation()}>
            <div className={styles.chrome()}>
              {layout === 'presenter' && share ? (
                <ShareTabs presentation={presentation} share={share} onShowingChange={onShowingChange} />
              ) : (
                <span />
              )}
              <div className={styles.chromeEnd()}>
                {layout === 'presenter' && share ? sharePill : null}
                <IconButton
                  label="Minimize presentation"
                  icon="minimize"
                  variant="soft"
                  onPress={onMinimize}
                />
              </div>
            </div>
            <div className={styles.fit()}>
              {layout === 'presenter' && share?.showing === 'screen' ? (
                <ScreenFrame kind={share.kind} webcams={webcams} />
              ) : (
                <Slide {...presentation} webcams={webcams}>
                  {controls}
                </Slide>
              )}
              {layer}
            </div>
          </section>
          {webcams === 'side' && strip}
        </>
      )}
    </Surface>
  );
}

/** The four corner slots; an empty corner renders nothing but keeps its cell. */
function OverlayLayer({ overlays }: { overlays: StageOverlays }) {
  const styles = stageOverlayStyles();
  return (
    <div className={styles.layer()}>
      {STAGE_CORNER_ORDER.map((corner) => (
        <div key={corner} className={stageOverlayStyles({ corner }).corner()}>
          {overlays[corner]}
        </div>
      ))}
    </div>
  );
}

export interface StageSlideProps extends StagePresentation {
  /** How the slide fits: beside the strip, under it, or alone at full width (the phone). */
  webcams: SlideWebcams;
  /** Drawn over the slide: the presentation controls, or the phone's Minimize button. */
  children?: ReactNode;
  className?: string;
}

/** The slide alone, for a stage that lays it out itself (the phone). The `Stage` renders it in its layouts. */
export function StageSlide(props: StageSlideProps) {
  return <Slide {...props} />;
}

function Slide({
  deckName,
  slideTitle,
  slideNumber,
  slideCount,
  webcams,
  children,
  className,
}: StageSlideProps) {
  const styles = slideStyles({ webcams });
  return (
    <div className={styles.root({ className })}>
      <div className={styles.header()}>
        <p className={styles.deck()}>{deckName}</p>
        <h2 className={styles.title()}>{slideTitle}</h2>
      </div>
      <p className={styles.number()}>
        <span className={styles.numberLabel()}>Slide </span>
        {slideNumber} / {slideCount}
      </p>
      {children}
    </div>
  );
}

/** What everyone sees while the screen is on stage: a dark frame naming the share (the pill in the chrome row says who sees it). */
function ScreenFrame({ kind, webcams }: { kind: ScreenKind; webcams: StageWebcams }) {
  const styles = stageStyles({ webcams });
  return (
    <div className={styles.screen()}>
      <p className={styles.screenNote()}>
        <span aria-hidden="true" className={styles.screenDot()} />
        Your {kind.toLowerCase()}
      </p>
    </div>
  );
}

/** The "What you're presenting" tabs (Focus.dc.html 67–70): Presentation with its slide number, and the shared screen. */
function ShareTabs({
  presentation,
  share,
  onShowingChange,
}: {
  presentation: StagePresentation;
  share: StageShare;
  onShowingChange?: (showing: StageTab) => void;
}) {
  const styles = stageStyles();
  const onChange = (key: Key) => onShowingChange?.(key === 'screen' ? 'screen' : 'slides');
  return (
    <Tabs selectedKey={share.showing} onSelectionChange={onChange} className={styles.shareTabs()}>
      <TabList label="What everyone sees">
        <Tab id="slides">{`Presentation ${presentation.slideNumber} / ${presentation.slideCount}`}</Tab>
        <Tab id="screen">{share.kind}</Tab>
      </TabList>
      <TabPanel id="slides" className={styles.shareNote()}>
        Everyone sees your slides. Your screen is still shared.
      </TabPanel>
      <TabPanel id="screen" className={styles.shareNote()}>
        Everyone sees your {share.kind.toLowerCase()}.
      </TabPanel>
    </Tabs>
  );
}

function StageGrid({
  participants,
  names,
  reactions,
  presentation,
  onRestore,
}: Pick<StageProps, 'participants' | 'names' | 'reactions' | 'presentation' | 'onRestore'>) {
  const count = participants.length + (presentation ? 1 : 0);
  const styles = stageStyles();
  return (
    <ul
      aria-label={presentation ? 'Webcams and minimized presentation' : 'Webcams'}
      className={stageGridStyles({ columns: gridColumns(count) })}
    >
      {participants.map((p) => (
        <li key={p.id} className={styles.cell()}>
          <VideoTile
            participant={p}
            shortName={p.isSelf ? 'You' : (names[p.id] ?? p.name)}
            size="grid"
            reaction={reactions?.[p.id]}
          />
        </li>
      ))}
      {presentation && <PresentationTile {...presentation} onRestore={onRestore} />}
    </ul>
  );
}

export interface PresentationTileProps extends Pick<
  StagePresentation,
  'slideTitle' | 'slideNumber' | 'slideCount'
> {
  onRestore?: () => void;
  /** @default 'tile' */
  variant?: PresentationTileVariant;
  className?: string;
  /** The Restore button (the whole cell as a `button`), so the room can hand it focus after Minimize (WCAG 2.4.3). */
  ref?: Ref<HTMLButtonElement>;
}

/**
 * The minimized presentation as one cell of a webcam list (Focus.dc.html
 * 143–148; Mobile.dc.html 73): the slide thumbnail, a plate with the slide
 * number and the way back. A list item, so it sits among the tiles of
 * `StageGrid` or `WebcamStrip`. As a `tile` the plate and a Restore button
 * share the bottom row; as a `button` (the phone, MB13 / MB14) the whole
 * cell is the button, named by its visible plate ("Presentation · 3 / 12,
 * restore", WCAG 2.5.3) with the restore glyph in its corner.
 */
export function PresentationTile({
  slideTitle,
  slideNumber,
  slideCount,
  onRestore,
  variant = 'tile',
  className,
  ref,
}: PresentationTileProps) {
  const tile = presentationTileStyles({ variant });
  const plate = `Presentation · ${slideNumber} / ${slideCount}`;
  if (variant === 'button') {
    return (
      <li className={tile.root({ className })}>
        <RacButton
          ref={ref}
          aria-label={`${plate}, restore`}
          onPress={onRestore}
          className={presentationTileButtonStyles()}
        >
          <span aria-hidden="true" className={tile.thumb()} />
          <span aria-hidden="true" className={tile.glyph()}>
            <Icon name="restore" size="xs" />
          </span>
          <span aria-hidden="true" className={tile.bottom()}>
            <span className={tile.plate()}>{plate}</span>
          </span>
        </RacButton>
      </li>
    );
  }
  return (
    <li className={tile.root({ className })}>
      <span aria-hidden="true" className={tile.thumb()}>
        <span className={tile.thumbTitle()}>{slideTitle}</span>
      </span>
      <span className={tile.bottom()}>
        <span className={tile.plate()}>{plate}</span>
        <IconButton
          ref={ref}
          label="Restore presentation"
          icon="restore"
          variant="primary"
          size="sm"
          onPress={onRestore}
          className={tile.restore()}
        />
      </span>
    </li>
  );
}
