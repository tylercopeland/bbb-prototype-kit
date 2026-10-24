import { useId, useRef, type ReactElement, type ReactNode, type Ref } from 'react';
import {
  DialogTrigger,
  Modal,
  ModalOverlay,
  Dialog as RacDialog,
  composeRenderProps,
  type ModalOverlayProps,
} from 'react-aria-components';
import { tv, type VariantProps } from '../../styles/tv';
import { Button, type ButtonTone } from '../Button';
import { OverlayHeader } from '../Popover';
import { SurfaceProvider } from '../Surface';

/** The scrim over the whole room, centering the box (Breakout.dc.html 326). */
export const dialogOverlayStyles = tv({
  base: 'fixed inset-0 z-50 flex items-center justify-center bg-scrim p-4 data-entering:animate-fade-in data-exiting:animate-fade-out',
});

/** The box: the canvas draws it 420px wide with an 18px radius and the overlay shadow. */
export const dialogModalStyles = tv({
  base: 'w-full max-w-104 rounded-xl bg-surface text-text shadow-overlay outline-none data-entering:animate-overlay-in data-exiting:animate-overlay-out',
});

/**
 * Inside the box: header, optional kicker ("Wrapping up"), description,
 * content and the footer with the actions. The kicker's tone follows the
 * status families: amber for a countdown, red for a destructive step.
 */
export const dialogStyles = tv({
  slots: {
    root: 'flex max-h-full flex-col gap-3 overflow-auto p-6 outline-none',
    kicker: 'text-2xs font-bold tracking-label uppercase',
    description: 'text-md text-text-muted',
    footer: 'flex flex-wrap justify-end gap-2 pt-1',
  },
  variants: {
    kickerTone: {
      neutral: { kicker: 'text-text-muted' },
      hand: { kicker: 'text-status-hand-text' },
      danger: { kicker: 'text-danger-text' },
    },
  },
  defaultVariants: { kickerTone: 'neutral' },
});

export type DialogKickerTone = NonNullable<VariantProps<typeof dialogStyles>['kickerTone']>;

/** Content that may need `close`, the way React Aria's Dialog children do. */
export type DialogRenderable = ReactNode | ((opts: { close: () => void }) => ReactNode);

/** Renders a `DialogRenderable`, handing a function `close`. Dialog and Sheet share it. */
export function renderWith(content: DialogRenderable | undefined, close: () => void): ReactNode {
  return typeof content === 'function' ? content({ close }) : content;
}

export interface DialogProps extends Pick<
  ModalOverlayProps,
  'isOpen' | 'defaultOpen' | 'onOpenChange' | 'isDismissable' | 'isKeyboardDismissDisabled'
> {
  /**
   * A React Aria pressable that opens the dialog. Leave it out to drive the
   * dialog from state alone (`isOpen` and `onOpenChange`), as the routes do.
   */
  trigger?: ReactElement;
  /** The accessible name and the visible heading. */
  title: string;
  /** A short uppercase label above the title, such as "Wrapping up". */
  kicker?: string;
  /** @default 'neutral' */
  kickerTone?: DialogKickerTone;
  /** Explanatory text, linked as the dialog's description. */
  description?: ReactNode;
  children?: DialogRenderable;
  /** The actions, right-aligned. */
  footer?: DialogRenderable;
  /** `alertdialog` for a confirmation that interrupts; `dialog` otherwise. @default 'dialog' */
  role?: 'dialog' | 'alertdialog';
  /** Merged onto the box: pass a `max-w-*` to change its width. */
  className?: string;
  /** The dialog element. */
  ref?: Ref<HTMLElement>;
}

/**
 * A modal dialog (X1): it moves focus in on open, keeps Tab inside, closes
 * on Escape and on its visible close button, and returns focus to the
 * trigger. Clicking the scrim closes it unless `isDismissable={false}`.
 * The title is the accessible name; `description` is linked through
 * `aria-describedby`. Confirmations use `ConfirmDialog`.
 *
 * It always draws as a panel, white over the dark stage too, as the canvas
 * draws every confirmation (owner decision 2026-10-24). Its content sits
 * in a `SurfaceProvider`, so a tooltip inside it is a panel tooltip as
 * well.
 */
export function Dialog({
  trigger,
  title,
  kicker,
  kickerTone,
  description,
  children,
  footer,
  role = 'dialog',
  isDismissable = true,
  isKeyboardDismissDisabled,
  className,
  ref,
  ...state
}: DialogProps) {
  const descriptionId = useId();
  const styles = dialogStyles({ kickerTone });

  // With a trigger, DialogTrigger owns the open state (as Popover does): the
  // trigger then keeps aria-expanded, reopens after Escape and gets focus back.
  // Without one, the overlay takes the state props itself.
  const overlay = (
    <ModalOverlay
      {...(trigger ? undefined : state)}
      isDismissable={isDismissable}
      isKeyboardDismissDisabled={isKeyboardDismissDisabled}
      className={dialogOverlayStyles()}
    >
      <Modal className={composeRenderProps(className, (cls) => dialogModalStyles({ className: cls }))}>
        <SurfaceProvider kind="panel">
          <RacDialog
            ref={ref}
            role={role}
            aria-describedby={description ? descriptionId : undefined}
            className={styles.root()}
          >
            {({ close }) => (
              <>
                {kicker && <p className={styles.kicker()}>{kicker}</p>}
                <OverlayHeader title={title} onClose={close} />
                {description && (
                  <p id={descriptionId} className={styles.description()}>
                    {description}
                  </p>
                )}
                {renderWith(children, close)}
                {footer && <div className={styles.footer()}>{renderWith(footer, close)}</div>}
              </>
            )}
          </RacDialog>
        </SurfaceProvider>
      </Modal>
    </ModalOverlay>
  );

  if (!trigger) return overlay;
  return (
    <DialogTrigger {...state}>
      {trigger}
      {overlay}
    </DialogTrigger>
  );
}

export interface ConfirmDialogProps extends Omit<DialogProps, 'children' | 'footer' | 'role'> {
  /** The confirming action: "Leave session", "Remove Anton", "Open 4 rooms". */
  confirmLabel: string;
  /** @default 'Cancel' */
  cancelLabel?: string;
  /** `danger` for Leave and Remove; `neutral` for Open rooms. @default 'neutral' */
  tone?: ButtonTone;
  onConfirm: () => void;
  onCancel?: () => void;
  /** Extra content between the description and the buttons. */
  children?: ReactNode;
}

/**
 * The confirmation before Leave (D5), Remove from session and Open rooms
 * (B5): an `alertdialog` whose Cancel button takes focus first, so Enter
 * never confirms by accident, with the confirming action as the primary
 * button in `tone`. Clicking the scrim does not dismiss it. Every other way
 * out but the confirming action (the Cancel button, the close button,
 * Escape) is a cancel and calls `onCancel` once.
 */
export function ConfirmDialog({
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'neutral',
  onConfirm,
  onCancel,
  onOpenChange,
  children,
  isDismissable = false,
  ...props
}: ConfirmDialogProps) {
  // Set by the confirming action, so the close that follows it is not a cancel.
  const confirmed = useRef(false);
  return (
    <Dialog
      {...props}
      role="alertdialog"
      isDismissable={isDismissable}
      onOpenChange={(isOpen) => {
        if (!isOpen && !confirmed.current) onCancel?.();
        confirmed.current = false;
        onOpenChange?.(isOpen);
      }}
      footer={({ close }) => (
        <>
          <Button autoFocus onPress={close}>
            {cancelLabel}
          </Button>
          <Button
            variant="primary"
            tone={tone}
            onPress={() => {
              confirmed.current = true;
              onConfirm();
              close();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      )}
    >
      {children}
    </Dialog>
  );
}
