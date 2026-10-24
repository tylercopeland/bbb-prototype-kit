import type { ComponentProps, Ref } from 'react';
import { Button as RacButton } from 'react-aria-components';
import { formatTimeOfDay } from '../../mocks/time';
import type { DirectSummary } from '../../mocks/selectors';
import type { ParticipantId } from '../../mocks/types';
import { tv } from '../../styles/tv';
import { Avatar } from '../Avatar';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Tooltip, useTruncationTooltip } from '../Tooltip';

/** The Direct list (Focus.dc.html 435–453): rows 2px apart, then the hint at the bottom. */
export const dmListStyles = tv({
  slots: {
    root: 'flex min-h-0 flex-1 flex-col gap-3 p-2',
    list: 'flex min-h-0 list-none flex-col gap-1 overflow-y-auto p-0',
    empty: 'px-2 py-3 text-center text-sm text-text-muted',
    hint: 'mt-auto flex flex-wrap items-center justify-center gap-1 px-2 py-3 text-center text-sm text-text-muted',
  },
});

/**
 * One conversation: avatar, name and preview, then the time and the unread
 * count. An unread row sits on the sunken fill with the preview in the
 * text color; read rows keep the preview muted. The whole row is a button.
 */
export const dmRowStyles = tv({
  base: 'flex w-full cursor-default items-center gap-3 rounded-control p-2 text-left focus-ring outline-none data-hovered:bg-surface-sunken data-pressed:bg-surface-sunken',
  variants: {
    isUnread: {
      true: 'bg-surface-sunken',
    },
  },
});

export const dmRowTextStyles = tv({
  slots: {
    body: 'flex min-w-0 flex-1 flex-col',
    name: 'truncate text-md font-bold text-text',
    preview: 'truncate text-sm',
    aside: 'flex shrink-0 flex-col items-end gap-1',
    time: 'text-xs text-text-muted tabular-nums',
  },
  variants: {
    isUnread: {
      true: { preview: 'font-medium text-text' },
      false: { preview: 'text-text-muted' },
    },
  },
  defaultVariants: { isUnread: false },
});

export interface DMListProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** The conversations, newest first (`selectDirectList`). */
  threads: DirectSummary[];
  onOpen?: (participantId: ParticipantId) => void;
  /** The "People" link in the hint: open the People panel to start a new conversation. */
  onPickPerson?: () => void;
  /**
   * Each row's button as it mounts and unmounts (`null`), so the owner can
   * move focus to the thread a person just left with "Back to direct
   * messages" instead of losing it with the back button (WCAG 2.4.3).
   */
  rowRef?: (participantId: ParticipantId, element: HTMLButtonElement | null) => void;
  className?: string;
}

/**
 * The list of private conversations. Each row is a button named by its
 * content, starting with the person's name; a cut-off name shows in full
 * in a tooltip on hover and focus (D6). Unread rows carry a count badge
 * ("1 unread"), never a colored dot alone. With no conversations the list
 * says so, and the hint below always points to People.
 */
export function DMList({ threads, onOpen, onPickPerson, rowRef, className, ...props }: DMListProps) {
  const styles = dmListStyles();
  return (
    <div {...props} className={styles.root({ className })}>
      {threads.length === 0 ? (
        <p className={styles.empty()}>No private conversations yet.</p>
      ) : (
        <ul aria-label="Direct messages" className={styles.list()}>
          {threads.map((t) => (
            <li key={t.thread.with}>
              <DMRow
                summary={t}
                ref={rowRef ? (el: HTMLButtonElement | null) => rowRef(t.thread.with, el) : undefined}
                onPress={() => onOpen?.(t.thread.with)}
              />
            </li>
          ))}
        </ul>
      )}
      <p className={styles.hint()}>
        To start a private chat, pick someone in
        <Button variant="ghost" size="sm" onPress={onPickPerson}>
          People
        </Button>
      </p>
    </div>
  );
}

/** One row. A cut-off name shows in a tooltip while the row is hovered or focused (`useTruncationTooltip`, as Chip and Tab). */
function DMRow({ summary, ref, onPress }: { summary: DirectSummary; ref?: Ref<HTMLButtonElement>; onPress: () => void }) {
  const isUnread = summary.unread > 0;
  const text = dmRowTextStyles({ isUnread });
  const name = summary.person?.name ?? 'Someone who left';
  const { labelRef, triggerRef, triggerProps, isOpen, onOpenChange } = useTruncationTooltip<HTMLButtonElement>(ref);
  return (
    <RacButton {...triggerProps} ref={triggerRef} onPress={onPress} className={dmRowStyles({ isUnread })}>
      <Avatar aria-hidden="true" name={name} participantId={summary.thread.with} />
      {/* The spaces keep the name "Rafaela Monaco, Can I…, 9:06, 1 unread" readable; flex drops them visually. */}
      <span className={text.body()}>
        <span ref={labelRef} className={text.name()}>
          {name}
        </span>{' '}
        {summary.preview && <span className={text.preview()}>{summary.preview}</span>}
      </span>{' '}
      <span className={text.aside()}>
        {summary.last && <span className={text.time()}>{formatTimeOfDay(summary.last.sentAt)}</span>}{' '}
        {isUnread && <Badge count={summary.unread} label={`${summary.unread} unread`} />}
      </span>
      <Tooltip label={name} triggerRef={triggerRef} isOpen={isOpen} onOpenChange={onOpenChange} />
    </RacButton>
  );
}
