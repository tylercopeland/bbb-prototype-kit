/**
 * The poll builder's presets and limits (Focus.dc.html 971–978). The answer
 * type is one choice among four (X8), so it is a radio group; only
 * `choice` has editable options, the others are fixed. Nothing here is a
 * count on a screen: the numbers are the builder's bounds.
 */
import type { PollState, PollType } from './types';

export interface PollTypeInfo {
  /** The chip's text. */
  label: string;
  /** The options the type starts with. */
  options: string[];
  /** Whether the teacher can edit, add and remove options. */
  editable: boolean;
}

/** The canvas's four multiple-choice answers (Focus.dc.html 971). */
export const CHOICE_OPTIONS = [
  'Grey icons for muted',
  'A red badge on everyone',
  'Hide the mic icon',
  'Text under each name',
];

export const POLL_TYPES: Record<PollType, PollTypeInfo> = {
  choice: { label: 'Multiple choice', options: CHOICE_OPTIONS, editable: true },
  yesno: { label: 'Yes / No', options: ['Yes', 'No'], editable: false },
  tf: { label: 'True / False', options: ['True', 'False'], editable: false },
  rate: { label: 'Rating 1–5', options: ['1', '2', '3', '4', '5'], editable: false },
};

/** The chips' order. */
export const POLL_TYPE_ORDER: PollType[] = ['choice', 'yesno', 'tf', 'rate'];

/** A multiple-choice poll keeps between two and five answers (A–E). */
export const MIN_POLL_OPTIONS = 2;
export const MAX_POLL_OPTIONS = 5;

const KEYS = 'ABCDE';

/** The letter before an answer ("A"), or the star for a rating step. */
export function pollOptionKey(type: PollType, index: number): string {
  return type === 'rate' ? '★' : (KEYS.charAt(index) ?? String(index + 1));
}

/** Whether the setup can be asked: a question and at least two answers, none blank. */
export function canStartPoll(poll: Pick<PollState, 'question' | 'options'>): boolean {
  return (
    poll.question.trim().length > 0 &&
    poll.options.length >= MIN_POLL_OPTIONS &&
    poll.options.every((o) => o.trim().length > 0)
  );
}

export interface PollResult {
  key: string;
  label: string;
  votes: number;
  /** Rounded, of the answers so far; 0 while nobody has answered. */
  percent: number;
  /** The most chosen answer (ties share it), when anyone has answered. */
  isTop: boolean;
}

/** One row per option, with the share of the answers so far. */
export function pollResults(poll: Pick<PollState, 'type' | 'options' | 'votes'>): PollResult[] {
  const answered = poll.votes.reduce((a, b) => a + b, 0);
  const max = Math.max(0, ...poll.votes);
  return poll.options.map((label, i) => {
    const votes = poll.votes[i] ?? 0;
    return {
      key: pollOptionKey(poll.type, i),
      label,
      votes,
      percent: answered === 0 ? 0 : Math.round((votes / answered) * 100),
      isTop: votes > 0 && votes === max,
    };
  });
}
