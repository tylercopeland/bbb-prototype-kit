import type { ComponentProps } from 'react';
import { Icon, type IconName } from '../../icons';
import { tv, type VariantProps } from '../../styles/tv';
import { avatarColor, type AvatarColor } from './avatarColor';
import { initials as deriveInitials } from './initials';

/**
 * Focus.dc.html 588 and StatusList.dc.html 29: a 32px disc with 12px bold
 * initials in on-avatar; the teacher's is a rounded square. Badges come
 * from the tile name plates (Shell.dc.html 54, RoomImproved.dc.html
 * 464–467) and prepare for X12. The speaking ring and the focus ring
 * compose through CSS variables (theme.css), so a focused speaking control
 * shows both.
 */
export const avatarStyles = tv({
  slots: {
    root: 'relative inline-flex shrink-0 items-center justify-center font-bold text-on-avatar',
    badge:
      'absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full border-2 border-ring-offset',
  },
  variants: {
    size: {
      sm: { root: 'size-avatar-sm text-xs' },
      md: { root: 'size-avatar-md text-xs' },
      lg: { root: 'size-avatar-lg text-md' },
      xl: { root: 'size-avatar-xl text-lg' },
    },
    shape: {
      circle: { root: 'rounded-full' },
      square: { root: 'rounded-md' },
    },
    /** The ten avatar-* tokens; every one passes 4.5:1 with on-avatar initials. */
    color: {
      1: { root: 'bg-avatar-1' },
      2: { root: 'bg-avatar-2' },
      3: { root: 'bg-avatar-3' },
      4: { root: 'bg-avatar-4' },
      5: { root: 'bg-avatar-5' },
      6: { root: 'bg-avatar-6' },
      7: { root: 'bg-avatar-7' },
      8: { root: 'bg-avatar-8' },
      9: { root: 'bg-avatar-9' },
      10: { root: 'bg-avatar-10' },
    },
    isSpeaking: {
      true: { root: 'ring-speaking' },
    },
    badge: {
      speaking: { badge: 'bg-status-live text-on-status-live' },
      muted: { badge: 'bg-surface-raised text-icon' },
      hand: { badge: 'bg-status-hand text-on-status-hand' },
    },
  },
  defaultVariants: { size: 'md', shape: 'circle' },
});

export type AvatarSize = NonNullable<VariantProps<typeof avatarStyles>['size']>;
export type AvatarShape = NonNullable<VariantProps<typeof avatarStyles>['shape']>;
export type AvatarBadge = NonNullable<VariantProps<typeof avatarStyles>['badge']>;

const badgeIcon: Record<AvatarBadge, IconName> = {
  speaking: 'speaking',
  muted: 'microphoneOff',
  hand: 'raiseHand',
};

const badgeStatus: Record<AvatarBadge, string> = {
  speaking: 'speaking',
  muted: 'muted',
  hand: 'hand raised',
};

interface AvatarBaseProps extends Omit<ComponentProps<'span'>, 'color' | 'children'> {
  /** The source of the initials and the accessible name. */
  name: string;
  /** The color seed: stable across renames, distinct for two "Ana"s. @default name */
  participantId?: string;
  /** An override from the data layer, for duplicate first names (B9). */
  initials?: string;
  /** The teacher's avatar is a rounded square; the row decides. @default 'circle' */
  shape?: AvatarShape;
  /** The green speaking ring. */
  isSpeaking?: boolean;
  /** A fixed color, for stories and tests; otherwise hashed from `participantId`. */
  color?: AvatarColor;
}

/**
 * 24 / 32 / 40 / 48px (`xl` is the camera-off avatar in a grid tile,
 * milestone 4). The 16px status badge (a 12px glyph) fits `md` and up
 * only: at `sm` it would cover a third of the avatar or shrink its glyph
 * under the 12px floor, so `badge` is not allowed there (the row's status
 * columns carry the state instead).
 */
export type AvatarProps = AvatarBaseProps &
  (
    | {
        /** @default 'md' */
        size?: Extract<AvatarSize, 'md' | 'lg' | 'xl'>;
        /** A 16px status disc at the bottom right, for tiles, avatar stacks and mobile. */
        badge?: AvatarBadge;
      }
    | { size: 'sm'; badge?: never }
  );

/**
 * A participant's initials on one of ten colors. Not interactive and not
 * focusable: a `role="img"` named "{name}, speaking" and so on, unless
 * `aria-hidden` is set because the name sits next to it. When both a badge
 * and `isSpeaking` are given, the name carries the badge's state only (the
 * more specific one). Avatar stacks (milestone 4) wrap an `aria-hidden`
 * Avatar in a button, which then owns focus, the tooltip and the rings.
 */
export function Avatar({
  name,
  participantId,
  initials,
  size = 'md',
  shape = 'circle',
  isSpeaking = false,
  badge,
  color,
  className,
  ...props
}: AvatarProps) {
  const { root, badge: badgeSlot } = avatarStyles({
    size,
    shape,
    isSpeaking,
    badge,
    color: color ?? avatarColor(participantId ?? name),
  });
  const hidden = props['aria-hidden'] === true || props['aria-hidden'] === 'true';
  const status = badge ? badgeStatus[badge] : isSpeaking ? badgeStatus.speaking : undefined;
  const label = status ? `${name}, ${status}` : name;
  return (
    <span
      {...props}
      role={hidden ? undefined : 'img'}
      aria-label={hidden ? undefined : label}
      className={root({ className })}
    >
      <span aria-hidden="true">{initials ?? deriveInitials(name)}</span>
      {badge && (
        <span className={badgeSlot()}>
          <Icon name={badgeIcon[badge]} size="xs" />
        </span>
      )}
    </span>
  );
}
