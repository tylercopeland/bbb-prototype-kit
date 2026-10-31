/**
 * The Updates sheet (MB2, Mobile.dc.html 257–270): one row per alert, each
 * a button that opens the view resolving it (the canvas notes: "each update
 * jumps to the people or chat view that resolves it"). The rows are named by
 * their title and described by their second line, so a row reads "4 hands
 * raised, Bruno has waited 3 min".
 *
 * Each row is tinted in its kind's soft color with a dashed border in the
 * kind's text color, as the canvas draws them (Mobile.dc.html 263, 497–499:
 * a tinted fill and a colored dashed border), so the rows read against the
 * sheet's white without relying on the border alone, and every border is
 * at least 3:1 on both the tint and the sheet (WCAG 1.4.11). The border
 * tokens are the `*-text` colors, which pass in every mode where the
 * fills (`*`) do not (`insight` is 2.4:1 on the dark tint).
 */
import { useId, type RefObject } from 'react';
import { Button as RacButton } from 'react-aria-components';
import { Icon } from '../../icons';
import {
  alertPillIconStyles,
  alertPillKindIcon,
  FocusFallback,
  Sheet,
  type SheetPosition,
} from '../../components';
import { useRoom, useRoomDispatch } from '../../mocks/context';
import { selectAlerts, selectDisplayNames, type Alert } from '../../mocks/selectors';
import { formatAgo } from '../../mocks/time';
import { tv } from '../../styles/tv';

const alertRowStyles = tv({
  slots: {
    list: 'flex list-none flex-col gap-2 p-0',
    /** The dashed border turns solid under the pointer and the press, so the row answers without losing its tint. */
    row: 'flex min-h-16 w-full items-center gap-3 rounded-tile border border-dashed px-3 py-2 text-left focus-ring data-hovered:border-solid data-pressed:border-solid',
    disc: 'size-9',
    body: 'flex min-w-0 flex-1 flex-col',
    title: 'text-md font-bold text-text',
    sub: 'text-sm text-text-muted',
    chevron: 'shrink-0 text-icon-subtle',
  },
  variants: {
    kind: {
      hands: { row: 'border-status-hand-text bg-status-hand-soft' },
      question: { row: 'border-accent bg-accent-soft' },
      insight: { row: 'border-insight-text bg-insight-soft' },
      help: { row: 'border-danger-text bg-danger-soft' },
      back: { row: 'border-status-live-text bg-status-live-soft' },
    },
  },
});

/** The row's two lines, from the alert (Mobile.dc.html 496–500). */
function alertLines(alert: Alert, names: Record<string, string>, now: number, question: string | null) {
  switch (alert.kind) {
    case 'hands':
      return {
        title: alert.count === 1 ? '1 hand raised' : `${alert.count} hands raised`,
        sub: alert.longest
          ? `${names[alert.longest.id] ?? alert.longest.name} has waited ${formatAgo(alert.longest.handRaisedAt ?? now, now)}`
          : '',
      };
    case 'question':
      return {
        title: `${alert.from ? (names[alert.from.id] ?? alert.from.name) : 'Someone'} asked a question`,
        sub: question ? `“${question}”` : '',
      };
    case 'insight':
      return {
        title:
          alert.count === 1 ? '1 student with low engagement' : `${alert.count} students with low engagement`,
        sub: 'Quiet for 15+ minutes in this session',
      };
    case 'help':
    case 'back':
      return { title: alert.text, sub: '' };
  }
}

function AlertRow({ alert, onPress }: { alert: Alert; onPress: () => void }) {
  const styles = alertRowStyles({ kind: alert.kind });
  const names = useRoom(selectDisplayNames);
  const now = useRoom((s) => s.clock.now);
  const question = useRoom((s) =>
    alert.kind === 'question' ? (s.chat.everyone.find((m) => m.id === alert.messageId)?.text ?? null) : null,
  );
  const titleId = useId();
  const subId = useId();
  const { title, sub } = alertLines(alert, names, now, question);
  return (
    <li>
      <RacButton
        aria-labelledby={titleId}
        aria-describedby={sub ? subId : undefined}
        onPress={onPress}
        className={styles.row()}
      >
        <span
          aria-hidden="true"
          className={alertPillIconStyles({ kind: alert.kind, className: styles.disc() })}
        >
          <Icon name={alertPillKindIcon[alert.kind]} size="sm" />
        </span>
        <span className={styles.body()}>
          <span id={titleId} className={styles.title()}>
            {title}
          </span>
          {sub && (
            <span id={subId} className={styles.sub()}>
              {sub}
            </span>
          )}
        </span>
        <Icon name="submenu" size="sm" className={styles.chevron()} />
      </RacButton>
    </li>
  );
}

export interface AlertsSheetProps {
  isOpen: boolean;
  position: SheetPosition;
  /** The "3 updates" pill, for the focus fallback when the sheet was open on load. */
  triggerRef: RefObject<HTMLButtonElement | null>;
}

export function AlertsSheet({ isOpen, position, triggerRef }: AlertsSheetProps) {
  const styles = alertRowStyles();
  const dispatch = useRoomDispatch();
  const alerts = useRoom(selectAlerts);
  const open = (alert: Alert) => {
    if (alert.kind === 'hands') {
      dispatch({ type: 'setPeopleFilter', filter: 'hands' });
      dispatch({ type: 'setSheet', sheet: 'people' });
    } else if (alert.kind === 'question') {
      dispatch({ type: 'setScope', scope: 'everyone' });
      dispatch({ type: 'setSheet', sheet: 'chat' });
    } else if (alert.kind === 'insight') {
      dispatch({ type: 'setPeopleFilter', filter: 'low' });
      dispatch({ type: 'setSheet', sheet: 'people' });
    } else {
      // Breakout rooms are not on the phone (owner decision 2026-10-31): the sheet just closes.
      dispatch({ type: 'setSheet', sheet: 'none' });
    }
  };
  return (
    <Sheet
      isOpen={isOpen}
      onOpenChange={(open) => !open && dispatch({ type: 'setSheet', sheet: 'none' })}
      title="Updates"
      position={position}
    >
      <FocusFallback target={triggerRef} />
      {alerts.length === 0 ? (
        <p className={styles.sub()}>Nothing needs you right now.</p>
      ) : (
        <ul className={styles.list()}>
          {alerts.map((a) => (
            <AlertRow key={a.id} alert={a} onPress={() => open(a)} />
          ))}
        </ul>
      )}
    </Sheet>
  );
}
