import type { ComponentProps } from 'react';
import { tv, type VariantProps } from '../../styles/tv';

/**
 * A count badge (X4: one style everywhere, red only for urgent). The canvas
 * drew the action-bar count blue and the tab counts red, amber or purple
 * (Focus.dc.html 49, 417–418, 582); here every count is the inverted
 * neutral pair the tooltip uses (text on surface), so it reads on a soft
 * button, a tab and a chip in every mode, and `tone="urgent"` is the
 * danger fill. 20px tall with 12px bold digits (the canvas's 17–18px and
 * 10.5–11px are under the 12px minimum). `inverted` swaps the pair for a
 * badge inside a selected (dark) chip.
 */
export const badgeStyles = tv({
  base: 'inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1 text-xs font-bold whitespace-nowrap tabular-nums',
  variants: {
    tone: {
      neutral: 'bg-text text-surface',
      urgent: 'bg-danger text-on-danger',
    },
    inverted: {
      true: '',
    },
  },
  compoundVariants: [{ tone: 'neutral', inverted: true, class: 'bg-surface text-text' }],
  defaultVariants: { tone: 'neutral', inverted: false },
});

export type BadgeTone = NonNullable<VariantProps<typeof badgeStyles>['tone']>;

/** Counts above this show as "99+". */
export const BADGE_MAX = 99;

/** "99+" above BADGE_MAX, otherwise the number. */
export function formatCount(count: number): string {
  return count > BADGE_MAX ? `${BADGE_MAX}+` : String(Math.max(0, Math.trunc(count)));
}

export interface BadgeProps extends Omit<ComponentProps<'span'>, 'children' | 'role' | 'aria-label'> {
  /** The number; it shows as "99+" above 99. */
  count: number;
  /**
   * The accessible text, with its unit: "3 unread", "4 raised hands". It
   * replaces the bare digits for assistive technology, so a tab reads
   * "Chat, 3 unread" and a chip "Raised hands, 4 people".
   */
  label: string;
  /** `urgent` is the red fill: only for counts that need attention now. @default 'neutral' */
  tone?: BadgeTone;
  /** Inside a selected (dark) chip, a neutral badge swaps to surface on text. @default false */
  inverted?: boolean;
  className?: string;
}

/**
 * A plain element (`role="img"` named by `label`), so the digits never
 * reach assistive technology without their unit. Not focusable, no live
 * region: the owner announces changes through `Announcer` where they matter.
 */
export function Badge({ count, label, tone, inverted, className, ...props }: BadgeProps) {
  return (
    <span {...props} role="img" aria-label={label} className={badgeStyles({ tone, inverted, className })}>
      {formatCount(count)}
    </span>
  );
}
