import type { ComponentProps } from 'react';
import type { Participant, ParticipantId, ReactionKind } from '../../mocks/types';
import { tv, type VariantProps } from '../../styles/tv';
import { Button } from '../Button';
import { VideoTile } from '../VideoTile';

/**
 * The webcam strip (Focus.dc.html 129–139): a row above the slide when the
 * panel is open, a column beside it when not, 8px apart. The last cell is
 * the "+N more" button when more people are in the room than tiles fit.
 */
export const webcamStripStyles = tv({
  base: 'flex list-none gap-2 p-0',
  variants: {
    direction: {
      row: 'flex-row',
      column: 'flex-col',
    },
  },
  defaultVariants: { direction: 'column' },
});

/** The dashed "+N more" cell: a full tile in a row, a 36px bar under the column. */
export const webcamStripMoreStyles = tv({
  base: 'border-dashed bg-transparent text-text data-hovered:bg-surface-raised data-pressed:bg-surface-raised',
  variants: {
    direction: {
      row: 'h-24 w-24 rounded-tile',
      column: 'h-control-md w-42',
    },
  },
  defaultVariants: { direction: 'column' },
});

/** One cell of the strip: a flex box so the tile and the more button fill it. */
export const webcamStripCellStyles = tv({ base: 'flex' });

export type WebcamStripDirection = NonNullable<VariantProps<typeof webcamStripStyles>['direction']>;

/** How many tiles the strip shows before "+N more" (the canvas draws five). */
export const DEFAULT_MAX_TILES = 5;

export interface WebcamStripProps extends Omit<ComponentProps<'ul'>, 'children'> {
  /** Everyone, already in tile order (`selectTileOrder`: speakers, hands, cameras, the rest). */
  participants: Participant[];
  /** The short names for the plates (`selectDisplayNames`, B9); the local person is "You". */
  names: Record<ParticipantId, string>;
  /** @default 5 */
  max?: number;
  /** @default 'column' */
  direction?: WebcamStripDirection;
  /** Current reactions by person (`selectReactions`), shown on their tiles. */
  reactions?: Record<ParticipantId, ReactionKind>;
  /** "+N more" opens the People panel. */
  onShowAll?: () => void;
  className?: string;
}

/**
 * A list named "Webcams" of the first `max` people as tiles, plus a
 * "+N more" button for the remainder (X15: the count and the remainder
 * come from the data, never a literal). Its name starts with the visible
 * text, "+9 more, show all 14 people", so speech input can press it (WCAG
 * 2.5.3). With everyone fitting there is no button; with nobody there is
 * an empty list.
 */
export function WebcamStrip({
  participants,
  names,
  max = DEFAULT_MAX_TILES,
  direction = 'column',
  reactions,
  onShowAll,
  className,
  ...props
}: WebcamStripProps) {
  const shown = participants.slice(0, Math.max(0, max));
  const rest = participants.length - shown.length;
  return (
    <ul aria-label="Webcams" {...props} className={webcamStripStyles({ direction, className })}>
      {shown.map((p) => (
        <li key={p.id} className={webcamStripCellStyles()}>
          <VideoTile
            participant={p}
            shortName={p.isSelf ? 'You' : (names[p.id] ?? p.name)}
            reaction={reactions?.[p.id]}
          />
        </li>
      ))}
      {rest > 0 && (
        <li className={webcamStripCellStyles()}>
          <Button
            aria-label={`+${rest} more, show all ${participants.length} people`}
            onPress={onShowAll}
            className={webcamStripMoreStyles({ direction })}
          >
            {`+${rest} more`}
          </Button>
        </li>
      )}
    </ul>
  );
}
