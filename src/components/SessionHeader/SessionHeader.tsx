import type { ComponentProps } from 'react';
import { tv } from '../../styles/tv';

/**
 * The information row at the top of the room (Focus.dc.html 27–31): the
 * session title, the recording indicator and "14 people · 29:36". It sits
 * on the stage, so its colors come from the stage ramp through the tokens
 * (`text-text` is white there). One line, 40px tall, never wrapping.
 */
export const sessionHeaderStyles = tv({
  slots: {
    root: 'flex h-control-lg min-w-0 items-center gap-3 whitespace-nowrap',
    title: 'min-w-0 truncate text-md font-bold text-text',
    recording: 'flex shrink-0 items-center gap-1 text-xs font-bold text-danger-text',
    dot: 'size-2 rounded-full bg-danger-text',
    meta: 'shrink-0 text-sm text-text-muted tabular-nums',
  },
});

export interface SessionHeaderProps extends Omit<ComponentProps<'header'>, 'children' | 'title'> {
  /** The session name, rendered as the page's `h1`. */
  title: string;
  /** Shows the REC indicator. */
  recording?: boolean;
  /** Everyone in the room, including you; the text pluralizes. */
  peopleCount: number;
  /** The elapsed time, already formatted ("29:36", `formatElapsed`). */
  elapsed: string;
  className?: string;
}

/** "14 people" or "1 person". */
export function formatPeopleCount(count: number): string {
  return count === 1 ? '1 person' : `${count} people`;
}

/**
 * Plain text, no live region (X10): the clock ticks every second and a
 * screen reader must never hear it. `Announcer` speaks the events that
 * matter instead. The recording indicator is an image named "Recording",
 * so "REC" is never read as a word.
 */
export function SessionHeader({ title, recording = false, peopleCount, elapsed, className, ...props }: SessionHeaderProps) {
  const styles = sessionHeaderStyles();
  return (
    <header {...props} className={styles.root({ className })}>
      <h1 className={styles.title()}>{title}</h1>
      {recording && (
        <span role="img" aria-label="Recording" className={styles.recording()}>
          <span className={styles.dot()} />
          REC
        </span>
      )}
      <p className={styles.meta()}>
        {formatPeopleCount(peopleCount)} · <span className="sr-only">Session time </span>
        {elapsed}
      </p>
    </header>
  );
}
