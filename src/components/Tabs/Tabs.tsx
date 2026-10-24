import type { ReactNode, Ref } from 'react';
import {
  Tab as RacTab,
  TabList as RacTabList,
  TabPanel as RacTabPanel,
  Tabs as RacTabs,
  composeRenderProps,
  type TabListProps as RacTabListProps,
  type TabPanelProps as RacTabPanelProps,
  type TabProps as RacTabProps,
  type TabsProps as RacTabsProps,
} from 'react-aria-components';
import { tv } from '../../styles/tv';
import { Badge, type BadgeProps } from '../Badge';

/**
 * The tabs sit above their panels (D3). `Tabs` is the root that links the
 * list to the panels; its layout is a column with the list first.
 */
export const tabsStyles = tv({
  base: 'flex min-h-0 flex-col gap-3',
  variants: {
    orientation: {
      horizontal: '',
      vertical: 'flex-row',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
});

/**
 * The segmented control of the panel header (Focus.dc.html 416–420,
 * People / Chat) and the chat scope (429–431, Everyone / Direct): a sunken
 * track with 4px of padding and equal-width segments.
 */
export const tabListStyles = tv({
  base: 'flex rounded-control bg-surface-sunken p-1',
  variants: {
    orientation: {
      horizontal: 'flex-row',
      vertical: 'flex-col',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
});

/**
 * One segment: 32px tall, equal width, bold 13px text. The selected
 * segment lifts to the surface with the inset `selected-ring` as its
 * non-color cue (the canvas's white-on-grey alone is 1.1:1). Hover and
 * press on an unselected tab use the raised fill.
 */
export const tabStyles = tv({
  base: 'hit-area flex h-control-sm min-w-0 flex-1 cursor-default items-center justify-center gap-2 rounded-xs px-3 text-sm font-semibold whitespace-nowrap text-text-secondary focus-ring outline-none data-disabled:text-text-muted data-hovered:bg-surface-raised data-pressed:bg-surface-raised data-selected:bg-surface data-selected:text-text data-selected:selected-ring data-selected:data-hovered:bg-surface data-selected:data-pressed:bg-surface',
});

export const tabLabelStyles = tv({ base: 'truncate' });

/** The panel: focusable when it has no focusable child, so it carries the ring. */
export const tabPanelStyles = tv({
  base: 'min-h-0 flex-1 rounded-xs focus-ring outline-none',
});

export interface TabsProps extends Omit<RacTabsProps, 'className' | 'children' | 'style'> {
  /** A `TabList` and one `TabPanel` per tab. */
  children: ReactNode;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

/**
 * Tabs on React Aria's Tabs. The arrow keys move between tabs and select
 * them (`keyboardActivation="automatic"`), Tab moves from the selected tab
 * into its panel, and Home / End jump to the first and last tab. The list
 * is named by `TabList`'s `label`.
 */
export function Tabs({ children, className, orientation = 'horizontal', ...props }: TabsProps) {
  return (
    <RacTabs
      {...props}
      orientation={orientation}
      className={composeRenderProps(className, (cls) => tabsStyles({ orientation, className: cls }))}
    >
      {children}
    </RacTabs>
  );
}

export interface TabListProps extends Omit<
  RacTabListProps<object>,
  'className' | 'children' | 'style' | 'aria-label' | 'items' | 'dependencies'
> {
  /** The accessible name of the tab list: "People and chat", "Chat type". */
  label: string;
  children: ReactNode;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

export function TabList({ label, children, className, ...props }: TabListProps) {
  return (
    <RacTabList
      {...props}
      aria-label={label}
      className={composeRenderProps(className, (cls, { orientation }) =>
        tabListStyles({ orientation, className: cls }),
      )}
    >
      {children}
    </RacTabList>
  );
}

export interface TabProps extends Omit<RacTabProps, 'className' | 'children' | 'style' | 'href'> {
  /** The tab's text; its accessible name together with the badge label. */
  children: string;
  /** A count on the tab (D3): raised hands on People, unread on Chat. */
  badge?: Pick<BadgeProps, 'count' | 'label' | 'tone'>;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

/**
 * One tab. A tab needs an `id` that matches its `TabPanel`. With a badge the
 * tab reads "Chat, 3 unread".
 */
export function Tab({ children, badge, className, ...props }: TabProps) {
  return (
    <RacTab {...props} className={composeRenderProps(className, (cls) => tabStyles({ className: cls }))}>
      <span className={tabLabelStyles()}>{children}</span>
      {/* The space keeps the name "Chat 2 unread", not "Chat2 unread"; flex drops it visually. */}
      {badge && (
        <>
          {' '}
          <Badge {...badge} />
        </>
      )}
    </RacTab>
  );
}

export interface TabPanelProps extends Omit<RacTabPanelProps, 'className' | 'children' | 'style'> {
  children: ReactNode;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

/** The panel for the tab with the same `id`. Only the selected panel renders. */
export function TabPanel({ children, className, ...props }: TabPanelProps) {
  return (
    <RacTabPanel
      {...props}
      className={composeRenderProps(className, (cls) => tabPanelStyles({ className: cls }))}
    >
      {children}
    </RacTabPanel>
  );
}
