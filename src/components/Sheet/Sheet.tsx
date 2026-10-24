import { createContext, useContext, type ReactElement, type ReactNode, type Ref } from 'react';
import {
  DialogTrigger,
  Modal,
  ModalOverlay,
  Dialog as RacDialog,
  composeRenderProps,
  type ModalOverlayProps,
} from 'react-aria-components';
import { tv, type VariantProps } from '../../styles/tv';
import type { DialogRenderable } from '../Dialog';
import { OverlayHeader } from '../Popover';
import { useSurfaceProps } from '../Surface';

/**
 * The scrim and the sheet's anchor. `bottom` is the portrait sheet
 * (Mobile.dc.html 118–125: full width, open from the bottom, at most the
 * viewport minus the top band); `end` is the landscape side sheet (the
 * canvas-notes: "sheets open from the right half so the slide stays
 * visible"). A sheet stacked on another draws no scrim of its own (P4).
 */
export const sheetOverlayStyles = tv({
  base: 'fixed inset-0 z-50 flex data-entering:animate-fade-in data-exiting:animate-fade-out',
  variants: {
    position: {
      bottom: 'items-end justify-center pt-16',
      end: 'items-stretch justify-end',
    },
    backdrop: {
      true: 'bg-scrim',
      false: 'bg-transparent',
    },
  },
  defaultVariants: { position: 'bottom', backdrop: true },
});

/** The sheet itself: rounded on the edge away from the screen edge, sliding in from its side. */
export const sheetModalStyles = tv({
  base: 'flex max-h-full flex-col bg-surface text-text shadow-overlay outline-none',
  variants: {
    position: {
      bottom:
        'w-full rounded-t-xl data-entering:animate-sheet-in-bottom data-exiting:animate-sheet-out-bottom',
      end: 'h-full w-panel max-w-full rounded-l-xl data-entering:animate-sheet-in-end data-exiting:animate-sheet-out-end',
    },
  },
  defaultVariants: { position: 'bottom' },
});

/** Inside: the drag handle (decorative; the close button is the control), header, scrolling body and footer. */
export const sheetStyles = tv({
  slots: {
    root: 'flex min-h-0 flex-1 flex-col outline-none',
    handle: 'mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border-strong',
    header: 'px-4 pt-2 pb-3',
    body: 'min-h-0 flex-1 overflow-auto px-4 pb-4',
    footer: 'flex gap-2 border-t border-border px-4 py-3',
  },
});

export type SheetPosition = NonNullable<VariantProps<typeof sheetOverlayStyles>['position']>;

/** How many sheets are open around this one; a sheet inside another is stacked and draws no scrim. */
const SheetDepthContext = createContext(0);

export interface SheetProps extends Pick<
  ModalOverlayProps,
  'isOpen' | 'defaultOpen' | 'onOpenChange' | 'isDismissable' | 'isKeyboardDismissDisabled'
> {
  /** A React Aria pressable that opens the sheet. Leave it out to drive the sheet from state (`isOpen`). */
  trigger?: ReactElement;
  /** The accessible name and, unless `titleHidden`, the visible heading. */
  title: string;
  /** The People and chat sheet shows tabs in place of a title; the name is still announced. */
  titleHidden?: boolean;
  /** Rendered between the title and the close button: a count, or the tabs. */
  headerExtra?: ReactNode;
  /** `bottom` in portrait, `end` (a side sheet) in landscape. @default 'bottom' */
  position?: SheetPosition;
  children?: DialogRenderable;
  /** Pinned under the scrolling body. */
  footer?: DialogRenderable;
  /** Merged onto the sheet. */
  className?: string;
  /** The dialog element. */
  ref?: Ref<HTMLElement>;
}

function renderWith(content: DialogRenderable | undefined, close: () => void): ReactNode {
  return typeof content === 'function' ? content({ close }) : content;
}

/**
 * The mobile sheet (X1, P4): a modal dialog anchored to the bottom in
 * portrait or the end in landscape. Focus moves in, Tab stays inside,
 * Escape, the scrim and the visible close button close it, and focus
 * returns to the trigger. A Sheet opened from inside another (the student
 * actions over People) stacks: it keeps the parent's single scrim and
 * closing it returns to the parent. Swipe-to-dismiss is not built; the
 * handle is decoration.
 */
export function Sheet({
  trigger,
  title,
  titleHidden = false,
  headerExtra,
  position = 'bottom',
  children,
  footer,
  isDismissable = true,
  isKeyboardDismissDisabled,
  className,
  ref,
  ...state
}: SheetProps) {
  const surfaceProps = useSurfaceProps();
  const depth = useContext(SheetDepthContext);
  const styles = sheetStyles();

  const overlay = (
    <ModalOverlay
      {...surfaceProps}
      {...state}
      isDismissable={isDismissable}
      isKeyboardDismissDisabled={isKeyboardDismissDisabled}
      className={sheetOverlayStyles({ position, backdrop: depth === 0 })}
    >
      <Modal
        className={composeRenderProps(className, (cls) => sheetModalStyles({ position, className: cls }))}
      >
        <RacDialog ref={ref} className={styles.root()}>
          {({ close }) => (
            <SheetDepthContext.Provider value={depth + 1}>
              {position === 'bottom' && <span aria-hidden="true" className={styles.handle()} />}
              <OverlayHeader
                title={title}
                titleHidden={titleHidden}
                onClose={close}
                className={styles.header()}
              >
                {headerExtra}
              </OverlayHeader>
              <div className={styles.body()}>{renderWith(children, close)}</div>
              {footer && <div className={styles.footer()}>{renderWith(footer, close)}</div>}
            </SheetDepthContext.Provider>
          )}
        </RacDialog>
      </Modal>
    </ModalOverlay>
  );

  if (!trigger) return overlay;
  return (
    <DialogTrigger>
      {trigger}
      {overlay}
    </DialogTrigger>
  );
}
