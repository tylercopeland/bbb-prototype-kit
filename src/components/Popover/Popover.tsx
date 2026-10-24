import type { ReactElement, ReactNode, Ref } from 'react';
import {
  DialogTrigger,
  Heading,
  Dialog as RacDialog,
  Popover as RacPopover,
  composeRenderProps,
  type PopoverProps as RacPopoverProps,
} from 'react-aria-components';
import { tv, type VariantProps } from '../../styles/tv';
import { IconButton } from '../IconButton';
import { useSurfaceProps } from '../Surface';

/**
 * The floating card of the Plugins and Share media pickers (Focus.dc.html
 * 211 and 322): a white card with one radius, the overlay shadow and a
 * hairline border for the dark theme. 360px wide by default (the Plugins
 * picker); Share media passes a wider className. React Aria positions it
 * and sets its max height, so the dialog inside scrolls.
 */
export const popoverStyles = tv({
  base: 'w-panel max-w-full rounded-xl border border-border bg-surface text-text shadow-overlay outline-none data-entering:animate-overlay-in data-exiting:animate-overlay-out',
});

/** The dialog inside the card: padding, the gap between header and content, and the scroll. */
export const popoverDialogStyles = tv({
  base: 'flex max-h-full flex-col gap-3 overflow-auto p-3 outline-none',
});

/**
 * The header every overlay shares (X1: a visible close button on each):
 * the title on the left, the close IconButton on the right. With
 * `titleHidden` the title still names the dialog but only the close button
 * is drawn.
 */
export const overlayHeaderStyles = tv({
  slots: {
    root: 'flex items-start gap-2',
    title: 'min-w-0 flex-1 self-center truncate text-lg font-bold text-text',
  },
  variants: {
    titleHidden: {
      true: { root: 'justify-end', title: 'sr-only' },
    },
  },
});

export interface OverlayHeaderProps extends VariantProps<typeof overlayHeaderStyles> {
  /** The dialog's accessible name, rendered as its `Heading slot="title"`. */
  title: ReactNode;
  /** Closes the overlay; from the Dialog's render prop. */
  onClose: () => void;
  /** @default 'Close' */
  closeLabel?: string;
  /** Something between the title and the close button, such as a count. */
  children?: ReactNode;
  className?: string;
}

/** The title row with the close button. Popover, Dialog and Sheet render it. */
export function OverlayHeader({
  title,
  titleHidden,
  onClose,
  closeLabel = 'Close',
  children,
  className,
}: OverlayHeaderProps) {
  const styles = overlayHeaderStyles({ titleHidden });
  return (
    <div className={styles.root({ className })}>
      <Heading slot="title" className={styles.title()}>
        {title}
      </Heading>
      {children}
      <IconButton label={closeLabel} icon="close" onPress={onClose} />
    </div>
  );
}

/** Two steps of the spacing scale between the trigger and the card (the canvas draws 10px). */
const POPOVER_OFFSET = 8;

export interface PopoverProps extends Pick<
  RacPopoverProps,
  'placement' | 'offset' | 'shouldFlip' | 'isOpen' | 'defaultOpen' | 'onOpenChange'
> {
  /** A React Aria pressable: IconButton, ToggleButton or Button. It gets `aria-expanded` and `aria-controls`. */
  trigger: ReactElement;
  /** The dialog's accessible name and, unless `titleHidden`, its visible heading. */
  title: string;
  /** Share media has no visible title; the close button still shows. */
  titleHidden?: boolean;
  children: ReactNode;
  /** Merged onto the card: pass a width such as `w-112` to change it. */
  className?: string;
  /** The dialog element. */
  ref?: Ref<HTMLElement>;
}

/**
 * A non-modal floating dialog anchored to its trigger (X1). Focus moves
 * into it on open, Escape and the close button close it, clicking outside
 * closes it, and focus returns to the trigger. It portals to <body>, so it
 * spreads `useSurfaceProps()` and keeps the stage colors when its trigger
 * is on the action bar.
 *
 * Menus use `Menu`, not this; this is for pickers and forms.
 */
export function Popover({
  trigger,
  title,
  titleHidden = false,
  children,
  placement = 'top',
  offset = POPOVER_OFFSET,
  shouldFlip,
  className,
  ref,
  ...state
}: PopoverProps) {
  const surfaceProps = useSurfaceProps();
  return (
    <DialogTrigger {...state}>
      {trigger}
      <RacPopover
        {...surfaceProps}
        placement={placement}
        offset={offset}
        shouldFlip={shouldFlip}
        className={composeRenderProps(className, (cls) => popoverStyles({ className: cls }))}
      >
        <RacDialog ref={ref} className={popoverDialogStyles()}>
          {({ close }) => (
            <>
              <OverlayHeader title={title} titleHidden={titleHidden} onClose={close} />
              {children}
            </>
          )}
        </RacDialog>
      </RacPopover>
    </DialogTrigger>
  );
}
