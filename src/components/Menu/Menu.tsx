import { useState, type ReactElement, type ReactNode, type Ref } from 'react';
import {
  Header,
  MenuTrigger,
  Menu as RacMenu,
  MenuItem as RacMenuItem,
  MenuSection as RacMenuSection,
  Popover as RacPopover,
  Separator,
  SubmenuTrigger,
  Text,
  composeRenderProps,
  type MenuProps as RacMenuProps,
  type MenuItemProps as RacMenuItemProps,
  type MenuSectionProps as RacMenuSectionProps,
  type MenuTriggerProps,
  type PopoverProps as RacPopoverProps,
} from 'react-aria-components';
import { Icon, type IconName } from '../../icons';
import { tv, type VariantProps } from '../../styles/tv';
import { SurfaceProvider } from '../Surface';

/**
 * The student actions menu (Focus.dc.html 588, docs/screenshots/
 * O2StudentActions.png): a 260px white card with a 12px radius, a
 * hairline border and the overlay shadow, 6px of padding around 36px rows.
 */
export const menuPopoverStyles = tv({
  base: 'min-w-64 rounded-lg border border-border bg-surface text-text shadow-overlay outline-none data-entering:animate-overlay-in data-exiting:animate-overlay-out',
});

export const menuStyles = tv({
  base: 'flex max-h-full flex-col overflow-auto p-1 outline-none',
});

/** The avatar-and-name row above the items, with the hairline under it. */
export const menuHeaderStyles = tv({
  base: 'flex items-center gap-3 border-b border-border px-3 pt-2 pb-3',
});

/**
 * One row: icon, label, then a switch (checkbox items) or a chevron
 * (submenu). Keyboard focus and hover are the same sunken fill; the ring
 * marks keyboard focus. `tone="danger"` is Remove from session.
 */
export const menuItemStyles = tv({
  base: 'flex min-h-control-md cursor-default items-center gap-3 rounded-control px-3 text-md font-medium focus-ring outline-none data-disabled:text-text-muted data-focused:bg-surface-sunken data-open:bg-surface-sunken',
  variants: {
    tone: {
      neutral: 'text-text',
      danger: 'text-danger-text data-focused:bg-danger-soft data-open:bg-danger-soft',
    },
  },
  defaultVariants: { tone: 'neutral' },
});

export const menuItemIconStyles = tv({
  base: 'shrink-0 text-icon',
  variants: {
    tone: {
      neutral: '',
      danger: 'text-danger-text',
    },
  },
  defaultVariants: { tone: 'neutral' },
});

export const menuItemTextStyles = tv({
  slots: {
    body: 'flex min-w-0 flex-1 flex-col',
    label: 'truncate',
    description: 'truncate text-xs font-regular text-text-muted',
  },
});

/**
 * The switch glyph of a checkbox item (X9). It is decoration: the state is
 * `aria-checked` on the item. The track is border-control off and accent
 * on, both at least 3:1 on the surface; the thumb moves 16px.
 */
export const menuSwitchStyles = tv({
  slots: {
    track: 'ml-auto flex h-5 w-9 shrink-0 items-center rounded-full p-1',
    thumb: 'size-3 rounded-full',
  },
  variants: {
    isSelected: {
      true: {
        track: 'forced-colors-track-on bg-accent',
        thumb: 'translate-x-4 forced-colors-thumb-on bg-on-accent',
      },
      false: { track: 'forced-colors-track bg-border-control', thumb: 'forced-colors-thumb bg-surface' },
    },
  },
  defaultVariants: { isSelected: false },
});

export const menuSectionStyles = tv({
  slots: {
    root: 'flex flex-col',
    header: 'px-3 pt-2 pb-1 text-2xs font-bold tracking-label text-text-muted uppercase',
  },
});

export const menuSeparatorStyles = tv({ base: 'mx-1 my-1 border-t border-border' });

export type MenuItemTone = NonNullable<VariantProps<typeof menuItemStyles>['tone']>;

export interface MenuItemProps extends Omit<RacMenuItemProps, 'className' | 'children' | 'style'> {
  /** The label. The accessible name; keep it a string so the menu can type-ahead. */
  children: string;
  icon?: IconName;
  /** A second line under the label. */
  description?: string;
  /** @default 'neutral' */
  tone?: MenuItemTone;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

/**
 * A menu row. Inside a `MenuSection selectionMode="multiple"` it is a
 * `menuitemcheckbox` drawn with a switch, and the menu stays open while
 * it is toggled; inside a `Submenu` trigger it shows the chevron.
 */
export function MenuItem({ children, icon, description, tone, className, ref, ...props }: MenuItemProps) {
  const text = menuItemTextStyles();
  return (
    <RacMenuItem
      {...props}
      ref={ref}
      textValue={props.textValue ?? children}
      className={composeRenderProps(className, (cls) => menuItemStyles({ tone, className: cls }))}
    >
      {({ selectionMode, isSelected, hasSubmenu }) => {
        const sw = menuSwitchStyles({ isSelected });
        return (
          <>
            {icon && <Icon name={icon} size="sm" className={menuItemIconStyles({ tone })} />}
            <span className={text.body()}>
              <Text slot="label" className={text.label()}>
                {children}
              </Text>
              {description && (
                <Text slot="description" className={text.description()}>
                  {description}
                </Text>
              )}
            </span>
            {selectionMode === 'multiple' && (
              <span aria-hidden="true" className={sw.track()}>
                <span className={sw.thumb()} />
              </span>
            )}
            {hasSubmenu && <Icon name="submenu" size="sm" className={menuItemIconStyles({ tone })} />}
          </>
        );
      }}
    </RacMenuItem>
  );
}

export interface MenuSectionProps<T extends object> extends Omit<
  RacMenuSectionProps<T>,
  'className' | 'children' | 'style'
> {
  /** An uppercase heading above the group. */
  title?: string;
  children: ReactNode;
  className?: string;
}

/**
 * A group of items. With `selectionMode="multiple"` and `selectedKeys` /
 * `onSelectionChange` it is the switch group (Microphone, Whiteboard
 * access, Moderator, Lock public chat): each item announces on and off.
 */
export function MenuSection<T extends object>({ title, children, className, ...props }: MenuSectionProps<T>) {
  const styles = menuSectionStyles();
  return (
    <RacMenuSection
      {...props}
      aria-label={props['aria-label'] ?? title}
      className={styles.root({ className })}
    >
      {title && <Header className={styles.header()}>{title}</Header>}
      {children}
    </RacMenuSection>
  );
}

export interface MenuSeparatorProps {
  className?: string;
}

export function MenuSeparator({ className }: MenuSeparatorProps) {
  return <Separator className={menuSeparatorStyles({ className })} />;
}

export interface SubmenuProps {
  /** The trigger row's label; React Aria names the submenu by it. */
  label: string;
  icon?: IconName;
  /** The submenu's items. */
  children: ReactNode;
  /** @default 'neutral' */
  tone?: MenuItemTone;
  isDisabled?: boolean;
  onAction?: RacMenuProps<object>['onAction'];
  className?: string;
}

/**
 * "Move to…" (B2): a row that opens a second menu with ArrowRight, Enter
 * or hover. Escape or ArrowLeft returns to the row. It renders inside the
 * Menu's `SurfaceProvider`, so it is a panel too.
 */
export function Submenu({ label, icon, children, tone, isDisabled, onAction, className }: SubmenuProps) {
  return (
    <SubmenuTrigger>
      <MenuItem icon={icon} tone={tone} isDisabled={isDisabled}>
        {label}
      </MenuItem>
      <RacPopover className={composeRenderProps(className, (cls) => menuPopoverStyles({ className: cls }))}>
        <RacMenu onAction={onAction} className={menuStyles()}>
          {children}
        </RacMenu>
      </RacPopover>
    </SubmenuTrigger>
  );
}

/** Below the trigger, aligned to its end, as the row's ⋯ button opens on the canvas. */
const MENU_OFFSET = 4;

export interface MenuProps extends Pick<MenuTriggerProps, 'isOpen' | 'defaultOpen' | 'onOpenChange'> {
  /**
   * A React Aria pressable: IconButton or Button. It gets `aria-haspopup`,
   * `aria-expanded` and `aria-controls`, and its label names the menu
   * ("More actions for Anton Georgiev"), so name the trigger for the person.
   */
  trigger: ReactElement;
  /** Something above the items, such as the person's avatar and name. */
  header?: ReactNode;
  /** The items, sections, separators and submenus. */
  children: ReactNode;
  onAction?: RacMenuProps<object>['onAction'];
  /** @default 'bottom end' */
  placement?: RacPopoverProps['placement'];
  /** Merged onto the card. */
  className?: string;
  /** The menu element. */
  ref?: Ref<HTMLDivElement>;
}

/**
 * A dropdown menu on React Aria's MenuTrigger, Popover and Menu. It opens
 * with a press, Enter, Space or ArrowDown (focus lands on the first item),
 * moves with the arrow keys and type-ahead, acts with Enter or Space, and
 * closes on Escape, on an action and on an outside press, returning focus
 * to the trigger. Tab stays inside while it is open. It is named by its
 * trigger (`aria-labelledby`).
 *
 * It portals and always draws as a panel, white over the dark stage too,
 * as the canvas draws the student actions menu (owner decision
 * 2026-10-24). Its content sits in a `SurfaceProvider`, so a tooltip
 * inside it is a panel tooltip as well.
 *
 * Milestone 5 (B2): after "Move to…" the People row that held the ⋯
 * trigger unmounts (the student leaves the list), so focus cannot return
 * to it. The People panel must then move focus itself (to the next row,
 * or the filter chips) and announce the move politely ("Ana moved to Room
 * 2") through `Announcer`.
 */
export function Menu({
  trigger,
  header,
  children,
  onAction,
  placement = 'bottom end',
  className,
  ref,
  ...state
}: MenuProps) {
  // A menu that is open on load (O2, the `pmenu` prop) had no trigger press to set
  // the focus strategy, so its first item takes focus; otherwise the trigger decides.
  const [openedOnMount] = useState(() => state.isOpen ?? state.defaultOpen ?? false);
  return (
    <MenuTrigger {...state}>
      {trigger}
      <RacPopover
        placement={placement}
        offset={MENU_OFFSET}
        className={composeRenderProps(className, (cls) => menuPopoverStyles({ className: cls }))}
      >
        <SurfaceProvider kind="panel">
          {header && <div className={menuHeaderStyles()}>{header}</div>}
          <RacMenu
            ref={ref}
            onAction={onAction}
            autoFocus={openedOnMount ? 'first' : undefined}
            className={menuStyles()}
          >
            {children}
          </RacMenu>
        </SurfaceProvider>
      </RacPopover>
    </MenuTrigger>
  );
}
