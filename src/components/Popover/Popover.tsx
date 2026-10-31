import {
  useEffect,
  useMemo,
  type ContextType,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import {
  DialogTrigger,
  Heading,
  OverlayTriggerStateContext,
  Dialog as RacDialog,
  Popover as RacPopover,
  composeRenderProps,
  type PopoverProps as RacPopoverProps,
} from 'react-aria-components';
import { tv, type VariantProps } from '../../styles/tv';
import { IconButton } from '../IconButton';
import { SurfaceProvider } from '../Surface';

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
 * is drawn. A long title wraps: it is the dialog's name, so it is never
 * cut off.
 */
export const overlayHeaderStyles = tv({
  slots: {
    root: 'flex items-start gap-2',
    title: 'min-w-0 flex-1 self-center text-lg font-bold break-words text-text',
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

/**
 * Focus is never lost to <body> (WCAG 2.4.3). React Aria returns focus to
 * the element that was focused when the popover opened; a popover that
 * was open on load (a deep link to H1, N1 or BO1) had none, so when this
 * unmounts with the popover and nothing holds focus, `target` takes it.
 * It runs at the real unmount, after any exit animation, a tick later so
 * React Aria's own restore goes first when it has somewhere to go.
 */
export function FocusFallback({ target }: { target?: RefObject<Element | null> }) {
  useEffect(() => {
    // The trigger is mounted before its popover opens, so it is known here and kept for the cleanup.
    const element = target?.current;
    return () => {
      if (!(element instanceof HTMLElement)) return;
      setTimeout(() => {
        if (document.activeElement === null || document.activeElement === document.body) element.focus();
      }, 0);
    };
  }, [target]);
  return null;
}

export interface PopoverProps extends Pick<
  RacPopoverProps,
  'placement' | 'offset' | 'shouldFlip' | 'isOpen' | 'defaultOpen' | 'onOpenChange'
> {
  /**
   * A React Aria pressable: IconButton or Button. It gets `aria-expanded`
   * and `aria-controls`, and opens and closes the popover itself. Leave it
   * out and pass `triggerRef` for a control that keeps its own open state
   * in the store (the action bar's Plugins and Share media toggles): the
   * popover is then controlled through `isOpen` / `onOpenChange`, is
   * anchored to that element, and the control sets `aria-expanded`,
   * `aria-haspopup="dialog"` and `aria-controls={id}` itself.
   */
  trigger?: ReactElement;
  /** Without `trigger`: the element the card is positioned against. */
  triggerRef?: RefObject<Element | null>;
  /** The dialog element's id, for a standalone trigger's `aria-controls`. */
  id?: string;
  /**
   * Where focus goes when the popover closes and nothing else holds it (it
   * was open on load, so there was no trigger press to return to). Defaults
   * to `triggerRef`; with a `trigger` element, pass its ref.
   */
  restoreFocusTo?: RefObject<Element | null>;
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
 * A floating dialog anchored to its trigger (X1). It is modal while open:
 * focus moves into it, Tab and Shift+Tab wrap inside it, and the rest of
 * the page is hidden from assistive technology. Escape, the close button
 * and a press outside close it, and focus returns to the trigger.
 *
 * It portals to <body> and always draws as a panel, white over the dark
 * stage too, as the canvas draws every picker (owner decision 2026-10-24).
 * Its content sits in a `SurfaceProvider`, so a tooltip inside it is a
 * panel tooltip as well.
 *
 * Menus use `Menu`, not this; this is for pickers and forms.
 */
export function Popover({
  trigger,
  triggerRef,
  id,
  restoreFocusTo,
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
  // With a trigger, DialogTrigger owns the open state and the trigger's aria
  // attributes. Standalone, the popover takes the state props and the anchor
  // itself, and the dialog's `close` (the close button) reads the same state
  // from this context, which React Aria's Popover provides only through
  // DialogTrigger.
  const isOpen = state.isOpen ?? false;
  const onOpenChange = state.onOpenChange;
  const standaloneState = useMemo<NonNullable<ContextType<typeof OverlayTriggerStateContext>>>(
    () => ({
      isOpen,
      setOpen: (open) => onOpenChange?.(open),
      open: () => onOpenChange?.(true),
      close: () => onOpenChange?.(false),
      toggle: () => onOpenChange?.(!isOpen),
      // The anchor point of a context-menu overlay; not used by an anchored popover.
      point: null,
      setPoint: () => undefined,
    }),
    [isOpen, onOpenChange],
  );
  const popover = (
    <RacPopover
      {...(trigger ? undefined : state)}
      triggerRef={trigger ? undefined : triggerRef}
      placement={placement}
      offset={offset}
      shouldFlip={shouldFlip}
      className={composeRenderProps(className, (cls) => popoverStyles({ className: cls }))}
    >
      <SurfaceProvider kind="panel">
        <RacDialog id={id} ref={ref} className={popoverDialogStyles()}>
          {({ close }) => (
            <>
              <FocusFallback target={restoreFocusTo ?? (trigger ? undefined : triggerRef)} />
              <OverlayHeader title={title} titleHidden={titleHidden} onClose={close} />
              {children}
            </>
          )}
        </RacDialog>
      </SurfaceProvider>
    </RacPopover>
  );
  if (!trigger)
    return (
      <OverlayTriggerStateContext.Provider value={standaloneState}>
        {popover}
      </OverlayTriggerStateContext.Provider>
    );
  return (
    <DialogTrigger {...state}>
      {trigger}
      {popover}
    </DialogTrigger>
  );
}
