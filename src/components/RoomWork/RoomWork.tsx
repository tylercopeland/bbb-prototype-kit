import type { ComponentProps } from 'react';
import { Icon, type IconName } from '../../icons';
import type { RoomWorkKind } from '../../mocks/types';
import { tv, type VariantProps } from '../../styles/tv';

/**
 * What a breakout room is working on (the canvas's `RoomScreen` import,
 * Breakout.dc.html 121, 162, 83): a shared whiteboard, shared notes, a
 * practice quiz or the teacher's slides. The prototype has no real room
 * content, so this is a 16:9 paper in the slide colors (white in every
 * mode, like the slide) with the kind's glyph, its name and a few
 * placeholder strokes. Cards show it as a thumbnail, the preview and the
 * stage at full size.
 */
export const roomWorkStyles = tv({
  slots: {
    root: 'relative flex aspect-video w-full flex-col overflow-hidden rounded-tile bg-slide text-on-slide',
    /** The placeholder strokes: decorative, in the slide's muted ink. */
    strokes: 'grid flex-1 grid-cols-6 content-center gap-2 opacity-40',
    stroke: 'rounded-full bg-on-slide',
    /** The kind's glyph and name over the bottom-left corner. */
    label: 'flex items-center gap-1 font-semibold',
  },
  variants: {
    size: {
      thumb: {
        root: 'p-2',
        strokes: 'gap-1',
        stroke: 'h-1',
        label: 'text-xs',
      },
      full: {
        root: 'p-6',
        strokes: 'gap-3',
        stroke: 'h-2',
        label: 'text-md',
      },
    },
    kind: {
      board: {},
      doc: {},
      quiz: {},
      slide: {},
    },
  },
  defaultVariants: { size: 'thumb', kind: 'board' },
});

export type RoomWorkSize = NonNullable<VariantProps<typeof roomWorkStyles>['size']>;

/** The kind's name, as the canvas labels it (Breakout.dc.html 410). */
export const roomWorkLabels: Record<RoomWorkKind, string> = {
  board: 'Shared whiteboard',
  doc: 'Shared notes',
  quiz: 'Practice quiz',
  slide: 'Your slides',
};

const kindIcon: Record<RoomWorkKind, IconName> = {
  board: 'whiteboard',
  doc: 'notes',
  quiz: 'quiz',
  slide: 'mediaSlides',
};

/** The placeholder strokes per kind: how many of the six columns each one spans, as a hint of the content's shape. */
const strokes: Record<RoomWorkKind, string[]> = {
  board: ['col-span-2', 'col-span-3', 'col-span-1'],
  doc: ['col-span-6', 'col-span-5', 'col-span-4', 'col-span-6'],
  quiz: ['col-span-4', 'col-span-2', 'col-span-2', 'col-span-2'],
  slide: ['col-span-3', 'col-span-4'],
};

export interface RoomWorkProps extends Omit<ComponentProps<'div'>, 'children' | 'role'> {
  kind: RoomWorkKind;
  /** `thumb` on a room card; `full` in the preview and on the stage. @default 'thumb' */
  size?: RoomWorkSize;
  /** Hide the glyph and name (the card's footer names the kind in its status). @default true */
  showLabel?: boolean;
  className?: string;
}

/**
 * An image named by the kind ("Shared whiteboard"), since the strokes are
 * decoration and the name is what matters. Not interactive: a card wraps it
 * in its own button when a press should preview the room.
 */
export function RoomWork({ kind, size = 'thumb', showLabel = true, className, ...props }: RoomWorkProps) {
  const styles = roomWorkStyles({ size, kind });
  return (
    <div {...props} role="img" aria-label={roomWorkLabels[kind]} className={styles.root({ className })}>
      <div aria-hidden="true" className={styles.strokes()}>
        {strokes[kind].map((width, i) => (
          <span key={i} className={styles.stroke({ className: width })} />
        ))}
      </div>
      {showLabel && (
        <span aria-hidden="true" className={styles.label()}>
          <Icon name={kindIcon[kind]} size={size === 'thumb' ? 'xs' : 'sm'} />
          {roomWorkLabels[kind]}
        </span>
      )}
    </div>
  );
}
