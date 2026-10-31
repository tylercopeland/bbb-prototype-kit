import { useEffect, useId, useRef, type ComponentProps } from 'react';
import { Icon } from '../../icons';
import { roomName } from '../../mocks/breakouts';
import { formatAgo } from '../../mocks/time';
import type { HelpRequest, ParticipantId } from '../../mocks/types';
import { tv } from '../../styles/tv';
import { IconButton } from '../IconButton';

/**
 * The help queue (B3): every request from a room as a row in the live
 * panel, open ones first and oldest first (`selectHelpQueue`). The canvas
 * pinned "Room 2 asked for help" to one pill; here each request is data
 * with Open (the preview), Acknowledge and Clear.
 */
export const helpQueueStyles = tv({
  slots: {
    root: 'flex flex-col gap-2',
    kicker: 'flex items-baseline gap-2 text-2xs font-bold tracking-label text-text-muted uppercase',
    count: 'font-semibold',
    list: 'flex list-none flex-col gap-1 p-0',
    row: 'flex min-h-row items-center gap-2 rounded-control px-2 py-1',
    icon: 'flex size-6 shrink-0 items-center justify-center rounded-full',
    body: 'flex min-w-0 flex-1 flex-col',
    title: 'truncate text-md font-semibold text-text',
    when: 'truncate text-xs',
    actions: 'flex shrink-0 gap-1',
    empty: 'px-2 py-3 text-sm text-text-muted',
  },
  variants: {
    isOpen: {
      true: {
        row: 'bg-status-hand-soft',
        icon: 'bg-status-hand text-on-status-hand',
        when: 'font-semibold text-status-hand-text',
      },
      false: {
        row: 'bg-surface-sunken',
        icon: 'bg-surface-raised text-icon',
        when: 'text-text-muted',
      },
    },
  },
  defaultVariants: { isOpen: true },
});

export interface HelpQueueProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Sorted, open first then oldest first (`selectHelpQueue`). */
  requests: HelpRequest[];
  /** Short names (B9) for who asked. */
  names: Record<ParticipantId, string>;
  /** The room clock, for "1 min ago". */
  now: number;
  /** Preview the room that asked. */
  onOpen?: (request: HelpRequest) => void;
  onAcknowledge?: (id: string) => void;
  onClear?: (id: string) => void;
  className?: string;
}

/** "Room 2 · Ana" or "Room 2". */
export function helpTitle(request: HelpRequest, names: Record<ParticipantId, string>): string {
  const who = request.from ? names[request.from] : undefined;
  return who ? `${roomName(request.roomIndex)} · ${who}` : roomName(request.roomIndex);
}

/**
 * A section named "Help requests" with a list of rows. Open requests are
 * amber with "Asked 1 min ago"; acknowledged ones are grey with
 * "Acknowledged". Acknowledging swaps the row's button for Clear, which
 * takes focus; clearing removes the row and focus moves to the next row's
 * first button, else the previous row's, else the heading (WCAG 2.4.3).
 */
export function HelpQueue({ requests, names, now, onOpen, onAcknowledge, onClear, className, ...props }: HelpQueueProps) {
  const styles = helpQueueStyles();
  const headingId = useId();
  const open = requests.filter((r) => r.acknowledgedAt === null).length;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const pending = useRef<{ kind: 'acknowledged' | 'cleared'; id: string; target: string | null } | null>(null);

  useEffect(() => {
    const p = pending.current;
    if (!p) return;
    const stillOpen = requests.find((r) => r.id === p.id && r.acknowledgedAt === null);
    if (p.kind === 'acknowledged' && !stillOpen) {
      pending.current = null;
      buttons.current.get(`clear-${p.id}`)?.focus();
    } else if (p.kind === 'cleared' && !requests.some((r) => r.id === p.id)) {
      pending.current = null;
      const target = p.target ? buttons.current.get(`open-${p.target}`) : undefined;
      (target ?? headingRef.current)?.focus();
    }
  });

  const register = (key: string) => (el: HTMLButtonElement | null) => {
    if (el) buttons.current.set(key, el);
    else buttons.current.delete(key);
  };

  const clear = (id: string) => {
    const index = requests.findIndex((r) => r.id === id);
    const target = requests[index + 1] ?? requests[index - 1] ?? null;
    pending.current = { kind: 'cleared', id, target: target?.id ?? null };
    onClear?.(id);
  };

  const acknowledge = (id: string) => {
    pending.current = { kind: 'acknowledged', id, target: null };
    onAcknowledge?.(id);
  };

  return (
    <section aria-labelledby={headingId} {...props} className={styles.root({ className })}>
      <h3 id={headingId} ref={headingRef} tabIndex={-1} className={styles.kicker()}>
        Help requests {open > 0 && <span className={styles.count()}>{open}</span>}
      </h3>
      {requests.length === 0 ? (
        <p className={styles.empty()}>No room has asked for help.</p>
      ) : (
        <ul className={styles.list()}>
          {requests.map((r) => {
            const isOpen = r.acknowledgedAt === null;
            const row = helpQueueStyles({ isOpen });
            const title = helpTitle(r, names);
            return (
              <li key={r.id} className={row.row()}>
                <span aria-hidden="true" className={row.icon()}>
                  <Icon name="help" size="xs" />
                </span>
                <span className={row.body()}>
                  <span className={row.title()}>{title}</span>
                  <span className={row.when()}>
                    {isOpen ? `Asked ${formatAgo(r.askedAt, now)} ago` : 'Acknowledged'}
                  </span>
                </span>
                <span className={row.actions()}>
                  <IconButton
                    ref={register(`open-${r.id}`)}
                    label={`Preview ${title}`}
                    icon="preview"
                    variant="soft"
                    size="sm"
                    onPress={() => onOpen?.(r)}
                  />
                  {isOpen ? (
                    <IconButton
                      label={`Acknowledge ${title}`}
                      icon="check"
                      variant="soft"
                      size="sm"
                      onPress={() => acknowledge(r.id)}
                    />
                  ) : (
                    <IconButton
                      ref={register(`clear-${r.id}`)}
                      label={`Clear ${title}`}
                      icon="close"
                      variant="soft"
                      size="sm"
                      onPress={() => clear(r.id)}
                    />
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
