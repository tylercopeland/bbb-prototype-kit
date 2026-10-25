import { useId, type Ref } from 'react';
import { mergeProps } from 'react-aria';
import { Button as RacButton, composeRenderProps, type ButtonProps as RacButtonProps } from 'react-aria-components';
import { Icon, type IconName } from '../../icons';
import { tv, type VariantProps } from '../../styles/tv';
import { Tooltip, useTruncationTooltip } from '../Tooltip';

/**
 * The notification pills in the session header (Focus.dc.html 33–41): a
 * 32px pill with a dashed border in the alert's color, a colored icon disc
 * and bold 13px text. They sit on the stage, so the fills come from the
 * stage ramp (`bg-surface-sunken` is stage-800 there) and the kind colors
 * are the status families, each already checked against the stage.
 */
export const alertPillStyles = tv({
  base: 'hit-area inline-flex h-control-sm max-w-64 shrink-0 items-center gap-2 rounded-full border border-dashed bg-surface-sunken pr-3 pl-1 text-sm font-semibold whitespace-nowrap text-text focus-ring data-hovered:bg-surface-raised data-pressed:bg-surface-raised',
  variants: {
    kind: {
      hands: 'border-status-hand',
      question: 'border-accent',
      insight: 'border-insight',
      help: 'border-danger-text',
      back: 'border-status-live',
    },
  },
  defaultVariants: { kind: 'hands' },
});

/** The 24px disc with the kind's glyph; its pair is contrast-checked for every mode. */
export const alertPillIconStyles = tv({
  base: 'flex size-6 shrink-0 items-center justify-center rounded-full',
  variants: {
    kind: {
      hands: 'bg-status-hand text-on-status-hand',
      question: 'bg-accent text-on-accent',
      insight: 'bg-insight text-on-insight',
      help: 'bg-danger text-on-danger',
      back: 'bg-status-live text-on-status-live',
    },
  },
  defaultVariants: { kind: 'hands' },
});

export const alertPillLabelStyles = tv({ base: 'truncate' });

export type AlertPillKind = NonNullable<VariantProps<typeof alertPillStyles>['kind']>;

const kindIcon: Record<AlertPillKind, IconName> = {
  hands: 'raiseHand',
  question: 'question',
  insight: 'insight',
  help: 'help',
  back: 'breakouts',
};

export interface AlertPillProps extends Omit<RacButtonProps, 'className' | 'children' | 'aria-label' | 'aria-describedby'> {
  /** Raised hands (amber), a question in chat (blue), the engagement insight (purple), a help request (red) or rooms closed (green). */
  kind: AlertPillKind;
  /** The visible text, which is also the whole accessible name (D4): "4 raised", "Rafaela asked", "3 low engagement". */
  children: string;
  /** What pressing does, as the description: "Opens People filtered to raised hands". Leave it out for a pill that is status only. */
  description?: string;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
}

/**
 * One alert in the session header. Its accessible name is exactly its
 * visible text (D4: the canvas announced a longer sentence than it showed);
 * what the press opens goes in `description`, read after the name. Text
 * longer than the pill truncates, and hover or keyboard focus then show
 * the full text in a Tooltip (D6) through `useTruncationTooltip`, as Chip
 * and Tab do. Pressing it is the owner's job (`onPress`), usually opening
 * the panel that resolves the alert.
 */
export function AlertPill({ kind, children, description, className, ref, ...props }: AlertPillProps) {
  const descriptionId = useId();
  const { labelRef, triggerRef, triggerProps, isOpen, onOpenChange } = useTruncationTooltip<HTMLButtonElement>(ref);
  return (
    <>
      <RacButton
        {...mergeProps(props, triggerProps)}
        ref={triggerRef}
        aria-describedby={description ? descriptionId : undefined}
        className={composeRenderProps(className, (cls) => alertPillStyles({ kind, className: cls }))}
      >
        <span aria-hidden="true" className={alertPillIconStyles({ kind })}>
          <Icon name={kindIcon[kind]} size="xs" />
        </span>
        <span ref={labelRef} className={alertPillLabelStyles()}>
          {children}
        </span>
        <Tooltip label={children} triggerRef={triggerRef} isOpen={isOpen} onOpenChange={onOpenChange} />
      </RacButton>
      {description && (
        <span id={descriptionId} hidden>
          {description}
        </span>
      )}
    </>
  );
}
