import type { ComponentProps, ReactNode } from 'react';
import type { Key } from 'react-aria-components';
import { formatRaisedHands, formatUnread } from '../../mocks/format';
import type { Panel } from '../../mocks/types';
import { tv } from '../../styles/tv';
import { IconButton } from '../IconButton';
import { Tab, TabList, TabPanel, Tabs } from '../Tabs';

/**
 * The white panel down the left of the room (Focus.dc.html 413–427): panel
 * width, full height, a hairline on the right, the overlay shadow over the
 * stage. The header holds the People / Chat segmented tabs (or a plain
 * title for Notes and Poll) and the close button; the body is whatever the
 * open tab shows and scrolls on its own.
 */
export const sidePanelStyles = tv({
  slots: {
    root: 'flex h-full w-panel shrink-0 flex-col border-r border-border bg-surface text-text shadow-overlay',
    header: 'flex items-center gap-2 border-b border-border py-3 pr-2 pl-4',
    tabs: 'min-h-0 flex-1 gap-0',
    /** The segmented People / Chat control takes the header's width before the close button. */
    tabList: 'flex-1',
    title: 'min-w-0 flex-1 truncate text-lg font-semibold text-text',
    /** The tabbed panel's heading, for assistive technology only: the tabs are the visible title, and the sections under them are h3. */
    heading: 'sr-only',
    body: 'flex min-h-0 flex-1 flex-col',
  },
});

export type SidePanelTab = Extract<Panel, 'people' | 'chat'>;

export interface SidePanelProps extends Omit<ComponentProps<'aside'>, 'children' | 'title'> {
  /** The open panel. People and Chat share the tabs; Notes and Poll show `title` instead. */
  panel: Exclude<Panel, 'none'>;
  /** The count on the People tab. */
  raisedHands?: number;
  /** The count on the Chat tab. */
  unread?: number;
  onPanelChange?: (panel: SidePanelTab) => void;
  onClose?: () => void;
  /** The People tab's content. */
  people?: ReactNode;
  /** The Chat tab's content. */
  chat?: ReactNode;
  /** The heading for Notes and Poll (and the aside's name). @default the panel's name */
  title?: string;
  /** The body for Notes and Poll. */
  children?: ReactNode;
  className?: string;
}

const panelTitles: Record<Exclude<Panel, 'none'>, string> = {
  people: 'People',
  chat: 'Chat',
  notes: 'Shared notes',
  poll: 'Poll',
};

/**
 * A `complementary` landmark named after the open panel. People and Chat
 * are one `Tabs` (D3: the tabs sit above their panels), controlled by the
 * room so the action bar's buttons and the tabs agree; the counts describe
 * the tabs ("People, 4 raised hands"), and the Chat count hides while Chat
 * is the open tab. Every panel has the visible close button (X1).
 */
export function SidePanel({
  panel,
  raisedHands = 0,
  unread = 0,
  onPanelChange,
  onClose,
  people,
  chat,
  title,
  children,
  className,
  ...props
}: SidePanelProps) {
  const styles = sidePanelStyles();
  const tabbed = panel === 'people' || panel === 'chat';
  const name = title ?? panelTitles[panel];
  const close = <IconButton label="Close panel" icon="close" onPress={onClose} />;
  const onChange = (key: Key) => onPanelChange?.(key === 'chat' ? 'chat' : 'people');

  if (!tabbed) {
    return (
      <aside aria-label={name} {...props} className={styles.root({ className })}>
        <div className={styles.header()}>
          <h2 className={styles.title()}>{name}</h2>
          {close}
        </div>
        <div className={styles.body()}>{children}</div>
      </aside>
    );
  }

  return (
    <aside aria-label={name} {...props} className={styles.root({ className })}>
      {/* Keeps the heading levels in order: the room's h1, this h2, then "Raised hands" and the thread's name as h3. */}
      <h2 className={styles.heading()}>{name}</h2>
      <Tabs selectedKey={panel} onSelectionChange={onChange} className={styles.tabs()}>
        <div className={styles.header()}>
          <TabList label="People and chat" className={styles.tabList()}>
            <Tab
              id="people"
              badge={
                raisedHands > 0 ? { count: raisedHands, label: formatRaisedHands(raisedHands) } : undefined
              }
            >
              People
            </Tab>
            {/* The unread count hides while Chat is open: the messages are on screen (Focus.dc.html 418). */}
            <Tab
              id="chat"
              badge={
                unread > 0 && panel !== 'chat' ? { count: unread, label: formatUnread(unread) } : undefined
              }
            >
              Chat
            </Tab>
          </TabList>
          {close}
        </div>
        <TabPanel id="people" className={styles.body()}>
          {people}
        </TabPanel>
        <TabPanel id="chat" className={styles.body()}>
          {chat}
        </TabPanel>
      </Tabs>
    </aside>
  );
}
