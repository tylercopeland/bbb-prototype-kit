import { useId, type ComponentProps } from 'react';
import { Icon, type IconName } from '../../icons';
import type { Participant } from '../../mocks/types';
import { tv, type VariantProps } from '../../styles/tv';
import { Avatar } from '../Avatar';

/**
 * A webcam tile (Focus.dc.html 131–135 in the strip, 143–148 in the
 * minimized grid): the tile surface with a hairline border, the name plate
 * over the bottom-left corner, and the status badges over the top-right.
 * A tile with the camera on draws the raised fill with a person glyph (the
 * prototype has no video); camera off draws the avatar. Speaking adds the
 * green ring, which is never the only cue: the badge says it too (X12).
 * Tiles always sit inside `<Surface kind="stage">`.
 */
export const videoTileStyles = tv({
  slots: {
    root: 'relative flex shrink-0 items-center justify-center overflow-hidden rounded-tile border border-border bg-surface-tile text-text-on-stage',
    placeholder: 'text-icon-subtle',
    badges: 'absolute top-2 right-2 flex gap-1',
    plateRow: 'absolute inset-x-2 bottom-2 flex',
    plate: 'min-w-0 truncate rounded-xs bg-surface-overlay px-2 text-xs leading-5 font-semibold text-text-on-stage',
  },
  variants: {
    size: {
      strip: { root: 'h-24 w-42' },
      grid: { root: 'aspect-video w-full' },
    },
    hasVideo: {
      true: { root: 'bg-surface-raised' },
    },
    isSpeaking: {
      true: { root: 'ring-speaking' },
    },
  },
  defaultVariants: { size: 'strip' },
});

/** One status disc over the tile: the hand, speaking and muted badges (X12). */
export const videoTileBadgeStyles = tv({
  base: 'flex size-6 items-center justify-center rounded-full',
  variants: {
    kind: {
      hand: 'bg-status-hand text-on-status-hand',
      speaking: 'bg-status-live text-on-status-live',
      muted: 'bg-surface-raised text-icon',
    },
  },
});

export type VideoTileSize = NonNullable<VariantProps<typeof videoTileStyles>['size']>;
export type VideoTileBadge = NonNullable<VariantProps<typeof videoTileBadgeStyles>['kind']>;

const badgeIcon: Record<VideoTileBadge, IconName> = { hand: 'raiseHand', speaking: 'speaking', muted: 'microphoneOff' };

const audioStatus: Record<Participant['audio'], string> = {
  live: 'microphone on',
  speaking: 'speaking',
  muted: 'muted',
  listening: 'listening only',
  notJoined: 'audio not joined',
};

/** ", speaking, hand raised, camera on": what the tile shows, as text, after the name. */
export function tileStatus(p: Pick<Participant, 'audio' | 'camera' | 'handRaisedAt'>): string {
  const parts = [audioStatus[p.audio]];
  if (p.handRaisedAt !== null) parts.push('hand raised');
  parts.push(p.camera ? 'camera on' : 'camera off');
  return parts.join(', ');
}

export interface VideoTileProps extends Omit<ComponentProps<'figure'>, 'children'> {
  participant: Participant;
  /** The name on the plate: the short, disambiguated name (B9), or "You". @default participant.name */
  shortName?: string;
  /** `strip` is the 168×96 tile of the webcam strip; `grid` fills its grid cell at 16:9. @default 'strip' */
  size?: VideoTileSize;
  className?: string;
}

/**
 * A `figure` named by its caption (linked explicitly with
 * `aria-labelledby`, since not every accessibility API derives a figure's
 * name from its figcaption): the plate's name plus a hidden status
 * (", speaking, hand raised, camera on"), so assistive technology hears
 * what the badges show. Not interactive (P7: desktop tiles are not
 * tappable; the People panel has the actions).
 */
export function VideoTile({ participant, shortName, size = 'strip', className, ...props }: VideoTileProps) {
  const captionId = useId();
  const isSpeaking = participant.audio === 'speaking';
  const styles = videoTileStyles({ size, hasVideo: participant.camera, isSpeaking });
  const badges: VideoTileBadge[] = [];
  if (participant.handRaisedAt !== null) badges.push('hand');
  if (isSpeaking) badges.push('speaking');
  else if (participant.audio === 'muted') badges.push('muted');
  return (
    <figure {...props} aria-labelledby={captionId} className={styles.root({ className })}>
      {participant.camera ? (
        <Icon name="person" size="lg" className={styles.placeholder()} />
      ) : (
        <Avatar
          aria-hidden="true"
          name={participant.name}
          participantId={participant.id}
          size={size === 'grid' ? 'xl' : 'lg'}
          shape={participant.role === 'teacher' ? 'square' : 'circle'}
        />
      )}
      {badges.length > 0 && (
        <span aria-hidden="true" className={styles.badges()}>
          {badges.map((kind) => (
            <span key={kind} className={videoTileBadgeStyles({ kind })}>
              <Icon name={badgeIcon[kind]} size="xs" />
            </span>
          ))}
        </span>
      )}
      <figcaption id={captionId} className={styles.plateRow()}>
        <span className={styles.plate()}>{shortName ?? participant.name}</span>
        <span className="sr-only">, {tileStatus(participant)}</span>
      </figcaption>
    </figure>
  );
}
