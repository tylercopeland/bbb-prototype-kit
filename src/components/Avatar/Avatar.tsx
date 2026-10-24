import type { ComponentProps } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
import { Icon, type IconName } from '../../icons';
import { avatarColor, avatarColorClass, type AvatarColor } from './avatarColor';
import { initials as deriveInitials } from './initials';

/**
 * Focus.dc.html 588 and StatusList.dc.html 29: a 32px disc with 12px bold
 * white initials; the teacher's is a rounded square. Badges come from the
 * tile name plates (Shell.dc.html 54, RoomImproved.dc.html 464–467) and
 * prepare for X12. The speaking ring and the focus ring compose through
 * CSS variables (theme.css), so a focused speaking avatar shows both.
 */
export const avatarStyles = tv({
  slots: {
    root: 'relative inline-flex shrink-0 items-center justify-center font-bold text-white',
    badge:
      'absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full border-2 border-ring-offset',
  },
  variants: {
    size: {
      sm: { root: 'size-avatar-sm text-xs' },
      md: { root: 'size-avatar-md text-xs' },
      lg: { root: 'size-avatar-lg text-md' },
    },
    shape: {
      circle: { root: 'rounded-full' },
      square: { root: 'rounded-md' },
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

export interface AvatarProps extends Omit<ComponentProps<'span'>, 'color' | 'children'> {
  /** The source of the initials and the accessible name. */
  name: string;
  /** The color seed: stable across renames, distinct for two "Ana"s. @default name */
  id?: string;
  /** An override from the data layer, for duplicate first names (B9). */
  initials?: string;
  /** 24 / 32 / 40px. xl waits for milestone 4. @default 'md' */
  size?: AvatarSize;
  /** The teacher's avatar is a rounded square; the row decides. @default 'circle' */
  shape?: AvatarShape;
  /** The green speaking ring. */
  isSpeaking?: boolean;
  /** A 16px status disc at the bottom right, for tiles, avatar stacks and mobile. */
  badge?: AvatarBadge;
  /** A fixed color, for stories and tests; otherwise hashed from `id`. */
  color?: AvatarColor;
}

/**
 * A participant's initials on one of ten colors. Not interactive: a
 * `role="img"` named "{name}, speaking" and so on, unless `aria-hidden` is
 * set because the name sits next to it. Extra props (and `ref`) reach the
 * span, so `Focusable` can wrap it when it needs a tooltip.
 */
export function Avatar({
  name,
  id,
  initials,
  size,
  shape,
  isSpeaking = false,
  badge,
  color,
  className,
  ...props
}: AvatarProps) {
  const { root, badge: badgeSlot } = avatarStyles({ size, shape, isSpeaking, badge });
  const fill = avatarColorClass[color ?? avatarColor(id ?? name)];
  const hidden = props['aria-hidden'] === true || props['aria-hidden'] === 'true';
  const status = [
    (isSpeaking || badge === 'speaking') && badgeStatus.speaking,
    badge === 'muted' && badgeStatus.muted,
    badge === 'hand' && badgeStatus.hand,
  ].filter((s): s is string => typeof s === 'string');
  const label = [name, ...status].join(', ');
  return (
    <span
      {...props}
      role={hidden ? undefined : 'img'}
      aria-label={hidden ? undefined : label}
      className={root({ className: [fill, className] })}
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
