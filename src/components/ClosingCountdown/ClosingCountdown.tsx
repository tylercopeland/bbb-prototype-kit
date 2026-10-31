import type { ComponentProps, Ref } from 'react';
import { formatCountdown } from '../../mocks/time';
import { tv, type VariantProps } from '../../styles/tv';
import { Button } from '../Button';

/**
 * The closing countdown (Breakout.dc.html 324–335, B5): "Rooms close in
 * 0:60" with Keep rooms open and Bring everyone back now. `dialog` is the
 * content of the "Closing rooms" dialog the room opens when the countdown
 * starts; `banner` is the card in the live panel's footer that stays while
 * the dialog is dismissed, so the countdown is always in view. The time is
 * plain text: it ticks, so it is never in a live region (X10); the room
 * announces the start and the end assertively.
 */
export const closingCountdownStyles = tv({
  slots: {
    root: 'flex flex-col gap-3 text-text',
    kicker: 'text-2xs font-bold tracking-label text-status-hand-text uppercase',
    readout: 'flex items-baseline gap-2',
    time: 'font-bold tabular-nums',
    label: 'text-sm text-text-muted',
    note: 'text-md text-text-muted',
    actions: 'flex flex-wrap gap-2',
    grow: 'flex-1',
  },
  variants: {
    variant: {
      dialog: { time: 'text-2xl' },
      banner: {
        root: 'rounded-lg border border-status-hand bg-status-hand-soft p-3',
        time: 'text-xl',
      },
    },
  },
  defaultVariants: { variant: 'banner' },
});

export type ClosingCountdownVariant = NonNullable<VariantProps<typeof closingCountdownStyles>['variant']>;

export interface ClosingCountdownProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Seconds left (`selectClosingLeft`). */
  leftSec: number;
  /** @default 'banner' */
  variant?: ClosingCountdownVariant;
  /** Cancel the countdown: the rooms stay open. */
  onKeepOpen?: () => void;
  /** Cut it short: everyone returns now. */
  onBringBack?: () => void;
  /** "Keep rooms open", so the room can hand focus to it when the dialog closes. */
  keepOpenRef?: Ref<HTMLButtonElement>;
  className?: string;
}

/**
 * A group named "Closing rooms". The banner carries the "Wrapping up"
 * kicker and the note about saved work; the dialog variant leaves those to
 * the dialog's kicker and description.
 */
export function ClosingCountdown({
  leftSec,
  variant = 'banner',
  onKeepOpen,
  onBringBack,
  keepOpenRef,
  className,
  ...props
}: ClosingCountdownProps) {
  const styles = closingCountdownStyles({ variant });
  return (
    <div role="group" aria-label="Closing rooms" {...props} className={styles.root({ className })}>
      {variant === 'banner' && <p className={styles.kicker()}>Wrapping up</p>}
      <p className={styles.readout()}>
        <span className={styles.label()}>Rooms close in</span>
        <span className={styles.time()}>{formatCountdown(leftSec)}</span>
      </p>
      {variant === 'banner' && (
        <p className={styles.note()}>Students see the countdown. Boards, notes and room chat are saved.</p>
      )}
      <div className={styles.actions()}>
        <Button ref={keepOpenRef} size="lg" onPress={onKeepOpen}>
          Keep rooms open
        </Button>
        <Button variant="primary" size="lg" onPress={onBringBack} className={styles.grow()}>
          Bring everyone back now
        </Button>
      </div>
    </div>
  );
}
