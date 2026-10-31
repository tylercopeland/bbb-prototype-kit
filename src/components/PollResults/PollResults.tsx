import type { ComponentProps } from 'react';
import type { PollResult } from '../../mocks/poll';
import type { PollPhase } from '../../mocks/types';
import { tv, type VariantProps } from '../../styles/tv';
import { IconButton } from '../IconButton';

/**
 * The poll results (Focus.dc.html 529–539 in the panel, 161–167 on the
 * stage): a status line, the question, then one bar per answer with its
 * count and share as text. The bar is decoration; the numbers carry the
 * result, so it is never color-only. The top answer is bold and named
 * "most chosen" for assistive technology. Whether only the teacher sees
 * the results or everyone does is said in words.
 */
export const pollResultsStyles = tv({
  slots: {
    root: 'flex flex-col gap-3 text-text',
    status: 'flex flex-col gap-2 rounded-lg bg-surface-sunken px-3 py-3',
    statusLine: 'flex items-center gap-2 text-sm font-bold',
    statusDot: 'size-2 shrink-0 rounded-full',
    progress: 'h-2 w-full overflow-hidden rounded-full',
    progressTrack: 'fill-surface-raised',
    progressBar: 'fill-status-live',
    header: 'flex items-center gap-2',
    kicker: 'rounded-full bg-accent-soft px-2 text-xs leading-5 font-bold text-accent',
    count: 'min-w-0 flex-1 truncate text-sm text-text-muted',
    question: 'font-bold text-balance',
    list: 'flex list-none flex-col gap-3 p-0',
    row: 'flex flex-col gap-1',
    rowText: 'flex items-baseline gap-2 text-md',
    label: 'min-w-0 flex-1 break-words',
    numbers: 'shrink-0 text-text-muted tabular-nums',
    percent: 'font-bold',
    srOnly: 'sr-only',
    bar: 'w-full overflow-hidden rounded-full',
    barTrack: 'fill-surface-raised',
    barFill: 'fill-accent',
    note: 'text-xs text-text-muted',
  },
  variants: {
    variant: {
      /** In the side panel: the teacher's view, with the status box and the counts. */
      panel: { question: 'text-lg', bar: 'h-3' },
      /** On the stage, for everyone: the Poll kicker, the count, the bigger question and the shares. */
      stage: {
        root: 'w-panel max-w-full rounded-panel border border-border bg-surface p-5 shadow-overlay',
        question: 'text-xl',
        bar: 'h-3',
      },
    },
    isLive: {
      true: { statusLine: 'text-status-live-text', statusDot: 'bg-status-live' },
      false: { statusLine: 'text-text-secondary', statusDot: 'bg-border-control' },
    },
    isTop: {
      true: { label: 'font-bold', percent: 'text-accent' },
      false: { barFill: 'fill-border-strong' },
    },
  },
  defaultVariants: { variant: 'panel', isLive: true, isTop: false },
});

export type PollResultsVariant = NonNullable<VariantProps<typeof pollResultsStyles>['variant']>;

export interface PollResultsProps extends Omit<ComponentProps<'section'>, 'children' | 'title' | 'results'> {
  question: string;
  /** One row per answer (`selectPollResults`). */
  results: PollResult[];
  /** How many have answered (`selectPollAnswered`). */
  answered: number;
  /** How many could (`selectPollEligible`). */
  eligible: number;
  /** `live` or `ended`; the status line says which. */
  phase: Extract<PollPhase, 'live' | 'ended'>;
  /** The results are on the stage for everyone. */
  shown: boolean;
  anonymous?: boolean;
  /** @default 'panel' */
  variant?: PollResultsVariant;
  /** The stage card's "Hide results from everyone". */
  onHide?: () => void;
  className?: string;
}

/** "Live · 9 of 13 answered" or "Poll closed · 9 of 13 answered". */
export function pollStatusText(phase: 'live' | 'ended', answered: number, eligible: number): string {
  return `${phase === 'live' ? 'Live' : 'Poll closed'} · ${answered} of ${eligible} answered`;
}

/** Who sees the results, in words. */
export function pollVisibilityText(shown: boolean, anonymous: boolean): string {
  const who = anonymous ? 'Answers are anonymous.' : 'You can see who answered what.';
  return shown
    ? `${who} Results are shown to everyone on the stage.`
    : `${who} Only you see the results until you show them.`;
}

/**
 * A section named "Poll results" (the panel) or "Poll results shown to
 * everyone" (the stage). The rows are a list; each reads as "Grey icons for
 * muted, 6 · 67%, most chosen". The progress of answers and each bar are
 * SVG rectangles sized by percentage, so no inline style is needed.
 */
export function PollResults({
  question,
  results,
  answered,
  eligible,
  phase,
  shown,
  anonymous = true,
  variant = 'panel',
  onHide,
  className,
  ...props
}: PollResultsProps) {
  const styles = pollResultsStyles({ variant, isLive: phase === 'live' });
  const progress = eligible === 0 ? 0 : Math.min(100, Math.round((answered / eligible) * 100));
  return (
    <section
      aria-label={variant === 'stage' ? 'Poll results shown to everyone' : 'Poll results'}
      {...props}
      className={styles.root({ className })}
    >
      {variant === 'stage' ? (
        <div className={styles.header()}>
          <span className={styles.kicker()}>Poll</span>
          <span className={styles.count()}>
            {answered} of {eligible} answered · shown to everyone
          </span>
          <IconButton
            label="Hide results from everyone"
            icon="close"
            variant="soft"
            size="sm"
            onPress={onHide}
          />
        </div>
      ) : (
        <div className={styles.status()}>
          <p className={styles.statusLine()}>
            <span aria-hidden="true" className={styles.statusDot()} />
            {pollStatusText(phase, answered, eligible)}
          </p>
          <svg
            aria-hidden="true"
            className={styles.progress()}
            preserveAspectRatio="none"
            viewBox="0 0 100 1"
          >
            <rect width="100" height="1" className={styles.progressTrack()} />
            <rect width={progress} height="1" className={styles.progressBar()} />
          </svg>
        </div>
      )}
      <h3 className={styles.question()}>{question}</h3>
      {results.length === 0 ? (
        <p className={styles.note()}>This poll has no answers to choose from.</p>
      ) : (
        <ul className={styles.list()}>
          {results.map((r, i) => {
            const row = pollResultsStyles({ variant, isTop: r.isTop });
            return (
              <li key={`${r.key}-${i}`} className={row.row()}>
                <p className={row.rowText()}>
                  <span className={row.label()}>{r.label}</span>
                  <span className={row.numbers()}>
                    {variant === 'panel' && <>{r.votes} · </>}
                    <span className={row.percent()}>{r.percent}%</span>
                  </span>
                  {r.isTop && <span className={row.srOnly()}>, most chosen</span>}
                </p>
                <svg aria-hidden="true" className={row.bar()} preserveAspectRatio="none" viewBox="0 0 100 1">
                  <rect width="100" height="1" className={row.barTrack()} />
                  <rect width={r.percent} height="1" className={row.barFill()} />
                </svg>
              </li>
            );
          })}
        </ul>
      )}
      {variant === 'panel' && <p className={styles.note()}>{pollVisibilityText(shown, anonymous)}</p>}
    </section>
  );
}
