import { useId, type ComponentProps } from 'react';
import type { Participant, ParticipantId, PeopleFilter } from '../../mocks/types';
import { tv } from '../../styles/tv';
import { Button } from '../Button';
import { Chip, ChipGroup } from '../ChipGroup';
import { ParticipantRow, type ParticipantAction } from '../ParticipantRow';

/**
 * The People list (Focus.dc.html 578–603): the filter chips, then the
 * "Raised hands" section first and "Everyone" under it, or the insight note
 * and the quiet students for the Low engagement filter. The list scrolls;
 * the chips stay.
 */
export const participantListStyles = tv({
  slots: {
    root: 'flex min-h-0 flex-1 flex-col gap-2 p-2',
    filters: 'px-1 pt-1',
    scroll: 'flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto',
    kicker: 'flex items-baseline gap-2 px-2 pt-3 pb-1 text-2xs font-bold tracking-label uppercase first:pt-1',
    count: 'font-semibold text-text-muted',
    list: 'flex list-none flex-col gap-1 p-0',
    empty: 'px-2 py-6 text-center text-sm text-text-muted',
    note: 'mx-1 mb-1 flex flex-col items-start gap-2 rounded-control bg-insight-soft p-3 text-sm leading-5 text-insight-text',
  },
  variants: {
    kickerTone: {
      hand: { kicker: 'text-status-hand-text' },
      neutral: { kicker: 'text-text-muted' },
    },
  },
  defaultVariants: { kickerTone: 'neutral' },
});

export interface ParticipantListCounts {
  all: number;
  hands: number;
  low: number;
}

export interface ParticipantListProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Raised hands, longest wait first (`selectPeople(filter)`). Empty under the Low engagement filter. */
  hands: Participant[];
  /** Everyone else for the All filter; the quiet students for Low engagement; empty for Raised hands. */
  others: Participant[];
  /** The chip counts (`selectPeopleFilterCounts`). */
  counts: ParticipantListCounts;
  filter: PeopleFilter;
  onFilterChange?: (filter: PeopleFilter) => void;
  /** The room clock, for "Raised · 3 min". */
  now: number;
  /** Whose ⋯ menu is open (`ui.peopleMenu`). */
  openMenu?: ParticipantId | null;
  onMenuOpenChange?: (participantId: ParticipantId, isOpen: boolean) => void;
  onMessage?: (participantId: ParticipantId) => void;
  onAction?: (participantId: ParticipantId, action: ParticipantAction) => void;
  /** "See full activity in Learning Analytics" in the insight note. */
  onAnalytics?: () => void;
  className?: string;
}

const filterLabels: Record<PeopleFilter, string> = { all: 'All', hands: 'Raised hands', low: 'Low engagement' };

/**
 * The filter is a radio group of chips (X8), each with its count, so the
 * list reads "All 14 people, Raised hands 4 people, Low engagement 3
 * people". Every section is a list named by its heading, and every count
 * comes from the data (X15). Empty states say what is empty: no raised
 * hands, nobody quiet, nobody else here.
 */
export function ParticipantList({
  hands,
  others,
  counts,
  filter,
  onFilterChange,
  now,
  openMenu = null,
  onMenuOpenChange,
  onMessage,
  onAction,
  onAnalytics,
  className,
  ...props
}: ParticipantListProps) {
  const styles = participantListStyles();
  const handsId = useId();
  const othersId = useId();
  const row = (p: Participant) => (
    <ParticipantRow
      key={p.id}
      participant={p}
      now={now}
      showEngagement={filter === 'low'}
      isMenuOpen={openMenu === p.id}
      onMenuOpenChange={(open) => onMenuOpenChange?.(p.id, open)}
      onMessage={() => onMessage?.(p.id)}
      onAction={(action) => onAction?.(p.id, action)}
    />
  );
  const othersTitle = filter === 'low' ? 'Low engagement' : 'Everyone';
  return (
    <div {...props} className={styles.root({ className })}>
      <ChipGroup
        label="Filter people"
        labelHidden
        value={filter}
        onChange={(v) => onFilterChange?.(v as PeopleFilter)}
        className={styles.filters()}
      >
        {(['all', 'hands', 'low'] as const).map((f) => (
          <Chip key={f} value={f} badge={{ count: counts[f], label: `${counts[f]} people` }}>
            {filterLabels[f]}
          </Chip>
        ))}
      </ChipGroup>
      <div className={styles.scroll()}>
        {filter === 'low' && (
          <div className={styles.note()}>
            Quiet for 15+ minutes: no chat, reactions, poll answers or speaking. Based only on activity in this
            session, so a quick check-in is the right next step, not a judgement.
            <Button variant="ghost" size="sm" iconEnd="externalLink" onPress={onAnalytics}>
              See full activity in Learning Analytics
            </Button>
          </div>
        )}
        {filter !== 'low' && hands.length > 0 && (
          <>
            <h3 id={handsId} className={participantListStyles({ kickerTone: 'hand' }).kicker()}>
              Raised hands <span className={styles.count()}>{hands.length}</span>
            </h3>
            <ul aria-labelledby={handsId} className={styles.list()}>
              {hands.map(row)}
            </ul>
          </>
        )}
        {filter === 'hands' && hands.length === 0 && <p className={styles.empty()}>No raised hands right now.</p>}
        {filter !== 'hands' && others.length > 0 && (
          <>
            <h3 id={othersId} className={styles.kicker()}>
              {othersTitle} <span className={styles.count()}>{others.length}</span>
            </h3>
            <ul aria-labelledby={othersId} className={styles.list()}>
              {others.map(row)}
            </ul>
          </>
        )}
        {filter === 'low' && others.length === 0 && <p className={styles.empty()}>Everyone has been active.</p>}
        {filter === 'all' && hands.length === 0 && others.length === 0 && (
          <p className={styles.empty()}>No one is here yet.</p>
        )}
      </div>
    </div>
  );
}
