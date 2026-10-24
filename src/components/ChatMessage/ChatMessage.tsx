import type { ComponentProps, ReactNode } from 'react';
import { tv, type VariantProps } from '../../styles/tv';
import { Avatar } from '../Avatar';

/**
 * One chat message. `public` is the Everyone list (Focus.dc.html 484–492):
 * a 24px avatar, the name and time on one line, the text under them.
 * `bubble` is the private thread (466–471): a rounded bubble aligned to
 * the sender's side, blue for your own, sunken for theirs, the time
 * below. Both are list items; the list around them is the owner's.
 */
export const chatMessageStyles = tv({
  slots: {
    root: 'flex gap-2',
    body: 'flex min-w-0 flex-col gap-1',
    meta: 'flex min-w-0 items-baseline gap-2',
    name: 'truncate text-sm font-bold text-text',
    time: 'shrink-0 text-xs text-text-muted tabular-nums',
    text: 'text-md break-words text-text',
    /** "You:" or "Bruno:" before a bubble's text, for assistive technology only: the side says it visually. */
    sender: 'sr-only',
  },
  variants: {
    variant: {
      public: {},
      bubble: {
        root: 'max-w-64 flex-col gap-1',
        body: 'gap-1',
        text: 'rounded-lg px-3 py-2',
        time: 'px-1',
      },
    },
    isSelf: {
      true: {},
      false: {},
    },
  },
  compoundVariants: [
    { variant: 'bubble', isSelf: true, class: { root: 'items-end self-end', body: 'items-end', text: 'bg-accent text-on-accent' } },
    { variant: 'bubble', isSelf: false, class: { root: 'items-start self-start', body: 'items-start', text: 'bg-surface-sunken text-text' } },
  ],
  defaultVariants: { variant: 'public', isSelf: false },
});

export type ChatMessageVariant = NonNullable<VariantProps<typeof chatMessageStyles>['variant']>;

export interface ChatMessageProps extends Omit<ComponentProps<'li'>, 'children'> {
  /** The sender's full name. */
  name: string;
  /** The color seed for the avatar. @default name */
  participantId?: string;
  /** Already formatted ("9:02", `formatTimeOfDay`). */
  time: string;
  /** Sent by the local person. */
  isSelf?: boolean;
  /** @default 'public' */
  variant?: ChatMessageVariant;
  children: ReactNode;
  className?: string;
}

/**
 * A `li`. In a bubble the sender is not drawn (the side says it), so a
 * hidden "You:" or "Rafaela:" precedes the text for assistive technology.
 */
export function ChatMessage({
  name,
  participantId,
  time,
  isSelf = false,
  variant = 'public',
  children,
  className,
  ...props
}: ChatMessageProps) {
  const styles = chatMessageStyles({ variant, isSelf });
  if (variant === 'bubble') {
    return (
      <li {...props} className={styles.root({ className })}>
        <p className={styles.text()}>
          <span className={styles.sender()}>{isSelf ? 'You' : name}: </span>
          {children}
        </p>
        <span className={styles.time()}>{time}</span>
      </li>
    );
  }
  return (
    <li {...props} className={styles.root({ className })}>
      <Avatar aria-hidden="true" name={name} participantId={participantId} size="sm" />
      <div className={styles.body()}>
        <p className={styles.meta()}>
          <span className={styles.name()}>{name}</span>
          <span className={styles.time()}>{time}</span>
        </p>
        <p className={styles.text()}>{children}</p>
      </div>
    </li>
  );
}
