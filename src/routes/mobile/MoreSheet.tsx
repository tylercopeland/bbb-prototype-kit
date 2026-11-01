/**
 * The More sheet (MB7, Mobile.dc.html 200–216): "Share media, notes,
 * captions, breakout rooms, poll, timer, plugins, Learning Analytics and
 * Room settings move into More" (canvas notes). Two groups of four cards
 * and two rows for a moderator; a student (MB15) gets the tools everyone
 * has, with no class tools and no settings. Every item is a real button;
 * what the phone prototype does not build yet says so in a toast after the
 * sheet closes (the same `notInPrototype` the desktop uses).
 */
import type { RefObject } from 'react';
import { Button as RacButton } from 'react-aria-components';
import { Icon, type IconName } from '../../icons';
import { Button, FocusFallback, Sheet, type SheetPosition } from '../../components';
import { useRoom, useRoomDispatch } from '../../mocks/context';
import { selectSelf } from '../../mocks/selectors';
import { tv, type VariantProps } from '../../styles/tv';
import { notInPrototype } from '../room/notInPrototype';

const moreSheetStyles = tv({
  slots: {
    group: 'flex flex-col gap-2 pb-3',
    kicker: 'px-1 text-2xs font-bold tracking-label text-text-muted uppercase',
    grid: 'grid grid-cols-4 gap-2',
    rows: 'flex flex-col border-t border-border pt-2',
    row: 'w-full justify-start px-2 text-text',
  },
});

/** One card: the icon disc over a two-line label, 44px+ tall for touch (X14). */
const moreItemStyles = tv({
  slots: {
    root: 'flex min-h-20 flex-col items-center justify-center gap-2 rounded-tile border border-border bg-surface p-2 text-center text-xs leading-4 font-semibold text-text focus-ring data-hovered:bg-surface-sunken data-pressed:bg-surface-sunken',
    disc: 'flex size-9 shrink-0 items-center justify-center rounded-control',
  },
  variants: {
    tone: {
      neutral: { disc: 'bg-surface-sunken text-icon' },
      accent: { disc: 'bg-accent-soft text-accent' },
      live: { disc: 'bg-status-live-soft text-status-live-text' },
      hand: { disc: 'bg-status-hand-soft text-status-hand-text' },
      insight: { disc: 'bg-insight-soft text-insight-text' },
    },
  },
  defaultVariants: { tone: 'neutral' },
});

type MoreTone = NonNullable<VariantProps<typeof moreItemStyles>['tone']>;

interface MoreItem {
  label: string;
  icon: IconName;
  tone: MoreTone;
}

interface MoreGroup {
  title: string;
  items: MoreItem[];
}

/** The moderator's groups (Mobile.dc.html 488–491). */
const moderatorGroups: MoreGroup[] = [
  {
    title: 'Present',
    items: [
      { label: 'Share media', icon: 'shareMedia', tone: 'accent' },
      { label: 'Shared notes', icon: 'notes', tone: 'neutral' },
      { label: 'Captions', icon: 'captions', tone: 'neutral' },
      { label: 'Whiteboard', icon: 'whiteboard', tone: 'neutral' },
    ],
  },
  {
    title: 'Class tools',
    items: [
      { label: 'Breakout rooms', icon: 'breakouts', tone: 'live' },
      { label: 'Poll', icon: 'poll', tone: 'hand' },
      { label: 'Timer', icon: 'timer', tone: 'insight' },
      { label: 'More plugins', icon: 'plugins', tone: 'neutral' },
    ],
  },
];

/** A student's tools (MB15): what everyone in the room has. */
const studentGroups: MoreGroup[] = [
  {
    title: 'Tools',
    items: [
      { label: 'Shared notes', icon: 'notes', tone: 'neutral' },
      { label: 'Captions', icon: 'captions', tone: 'neutral' },
    ],
  },
];

function MoreCard({ item, onPress }: { item: MoreItem; onPress: () => void }) {
  const styles = moreItemStyles({ tone: item.tone });
  return (
    <RacButton onPress={onPress} className={styles.root()}>
      <span aria-hidden="true" className={styles.disc()}>
        <Icon name={item.icon} size="sm" />
      </span>
      {item.label}
    </RacButton>
  );
}

export interface MoreSheetProps {
  isOpen: boolean;
  position: SheetPosition;
  /** The More bar button, for the focus fallback when the sheet was open on load. */
  triggerRef: RefObject<HTMLButtonElement | null>;
}

export function MoreSheet({ isOpen, position, triggerRef }: MoreSheetProps) {
  const styles = moreSheetStyles();
  const dispatch = useRoomDispatch();
  const me = useRoom(selectSelf);
  const isModerator = me?.isModerator ?? false;
  const groups = isModerator ? moderatorGroups : studentGroups;
  // The toast would be hidden behind the modal sheet, so the sheet closes first.
  const pick = (label: string) => {
    dispatch({ type: 'setSheet', sheet: 'none' });
    notInPrototype(label);
  };
  return (
    <Sheet
      isOpen={isOpen}
      onOpenChange={(open) => !open && dispatch({ type: 'setSheet', sheet: 'none' })}
      title="More"
      position={position}
    >
      <FocusFallback target={triggerRef} />
      {groups.map((group) => (
        <div key={group.title} role="group" aria-label={group.title} className={styles.group()}>
          <p aria-hidden="true" className={styles.kicker()}>
            {group.title}
          </p>
          <div className={styles.grid()}>
            {group.items.map((item) => (
              <MoreCard key={item.label} item={item} onPress={() => pick(item.label)} />
            ))}
          </div>
        </div>
      ))}
      {isModerator && (
        <div className={styles.rows()}>
          <Button
            variant="ghost"
            size="touch"
            icon="analytics"
            iconEnd="externalLink"
            className={styles.row()}
            onPress={() => pick('The Learning Analytics Dashboard')}
          >
            Learning Analytics Dashboard
          </Button>
          <Button
            variant="ghost"
            size="touch"
            icon="settings"
            className={styles.row()}
            onPress={() => pick('Room settings')}
          >
            Room settings
          </Button>
        </div>
      )}
    </Sheet>
  );
}
