import { useEffect, useRef, type Ref } from 'react';
import {
  Text,
  UNSTABLE_Toast as RacToast,
  UNSTABLE_ToastList as RacToastList,
  UNSTABLE_ToastQueue as ToastQueue,
  UNSTABLE_ToastRegion as RacToastRegion,
  type QueuedToast,
  type ToastOptions,
} from 'react-aria-components';
import { Icon, type IconName } from '../../icons';
import { tv, type VariantProps } from '../../styles/tv';
import { useAnnouncer, type Politeness } from '../Announcer';
import { Button } from '../Button';
import { IconButton } from '../IconButton';

/**
 * The region sits above the action bar, centered, and lets pointer events
 * through to the room around the toasts. F6 moves focus into it.
 */
export const toastRegionStyles = tv({
  base: 'pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center p-4 focus-ring outline-none',
});

export const toastListStyles = tv({
  base: 'flex w-full max-w-96 flex-col gap-2',
});

/**
 * One toast: a panel card with the overlay shadow, an icon for the tone
 * (never color alone), the text, an optional action and the close button.
 * The toast itself is focusable, so it shows the focus ring.
 */
export const toastStyles = tv({
  slots: {
    root: 'pointer-events-auto flex w-full animate-overlay-in items-start gap-3 rounded-lg border border-border bg-surface p-3 text-text shadow-overlay focus-ring outline-none',
    icon: 'mt-1 shrink-0',
    content: 'flex min-w-0 flex-1 flex-col gap-1',
    title: 'text-md font-semibold',
    description: 'text-sm text-text-secondary',
    action: 'self-start',
  },
  variants: {
    tone: {
      neutral: { icon: 'text-icon' },
      danger: { icon: 'text-danger-text' },
    },
  },
  defaultVariants: { tone: 'neutral' },
});

export type ToastTone = NonNullable<VariantProps<typeof toastStyles>['tone']>;

const toneIcon: Record<ToastTone, IconName> = { neutral: 'info', danger: 'error' };

export interface ToastContent {
  /** One line: "Ana moved to Room 2", "Recording started". */
  title: string;
  /** A second line with the detail. */
  description?: string;
  /** `danger` for errors and losses (connection dropped, upload failed). @default 'neutral' */
  tone?: ToastTone;
  /** How it is announced; see Announcer for the rules. @default 'polite' */
  politeness?: Politeness;
  /** One optional action, such as "Undo" or "Open People". A toast with an action never times out. */
  action?: { label: string; onPress: () => void };
}

/** Three toasts at a time; older ones wait in the queue. */
export const MAX_VISIBLE_TOASTS = 3;

/** The shortest auto-dismiss allowed (X10, WCAG 2.2.1): anything shorter is raised to this. */
export const MIN_TOAST_TIMEOUT = 5000;

/** The app's one queue. `ToastRegion` renders it and `showToast` adds to it. */
export const toastQueue = new ToastQueue<ToastContent>({ maxVisibleToasts: MAX_VISIBLE_TOASTS });

/**
 * Adds a toast. Without `timeout` it stays until dismissed; with one, it
 * stays at least `MIN_TOAST_TIMEOUT` and React Aria pauses the timer while
 * the toast is hovered or focused. A toast with an action ignores
 * `timeout`. Returns the toast key for `queue.close(key)`.
 */
export function showToast(
  content: ToastContent,
  options: ToastOptions = {},
  queue: ToastQueue<ToastContent> = toastQueue,
): string {
  const timeout =
    content.action || options.timeout === undefined
      ? undefined
      : Math.max(options.timeout, MIN_TOAST_TIMEOUT);
  return queue.add(content, { ...options, timeout });
}

export interface ToastRegionProps {
  /** @default toastQueue */
  queue?: ToastQueue<ToastContent>;
  className?: string;
  /** The region element. */
  ref?: Ref<HTMLDivElement>;
}

/**
 * Renders the queue's visible toasts (X10). Mount it once, inside
 * `Announcer`, next to the room. Each new toast is announced through the
 * Announcer, polite unless its content says assertive: React Aria's own
 * `ToastContent` is a `role="alert"` region, which would make every toast
 * assertive, so it is not used and the text is linked to the `alertdialog`
 * through the title and description slots alone. Each toast has a visible
 * close button; the region is reached with F6 and named with its count.
 */
export function ToastRegion({ queue = toastQueue, className, ref }: ToastRegionProps) {
  const { announce } = useAnnouncer();
  const announced = useRef<Set<string> | null>(null);

  useEffect(() => {
    announced.current ??= new Set(queue.visibleToasts.map((t) => t.key));
    const seen = announced.current;
    return queue.subscribe(() => {
      for (const toast of queue.visibleToasts) {
        if (seen.has(toast.key)) continue;
        seen.add(toast.key);
        const { title, description, politeness = 'polite' } = toast.content;
        announce([title, description].filter(Boolean).join('. '), politeness);
      }
    });
  }, [queue, announce]);

  return (
    <RacToastRegion ref={ref} queue={queue} className={toastRegionStyles({ className })}>
      <RacToastList<ToastContent> className={toastListStyles()}>
        {({ toast }) => <ToastCard toast={toast} queue={queue} />}
      </RacToastList>
    </RacToastRegion>
  );
}

function ToastCard({ toast, queue }: { toast: QueuedToast<ToastContent>; queue: ToastQueue<ToastContent> }) {
  const { title, description, tone = 'neutral', action } = toast.content;
  const styles = toastStyles({ tone });
  return (
    <RacToast toast={toast} className={styles.root()}>
      <Icon name={toneIcon[tone]} size="md" className={styles.icon()} />
      <div className={styles.content()}>
        <Text slot="title" className={styles.title()}>
          {title}
        </Text>
        {description && (
          <Text slot="description" className={styles.description()}>
            {description}
          </Text>
        )}
        {action && (
          <Button
            size="sm"
            variant="ghost"
            className={styles.action()}
            onPress={() => {
              action.onPress();
              queue.close(toast.key);
            }}
          >
            {action.label}
          </Button>
        )}
      </div>
      <IconButton slot="close" label="Close" icon="close" size="sm" />
    </RacToast>
  );
}
