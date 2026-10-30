import type { Ref } from 'react';
import {
  Focusable,
  Button as RacButton,
  composeRenderProps,
  type ButtonProps as RacButtonProps,
} from 'react-aria-components';
import { Icon, type IconName } from '../../icons';
import { useAriaKeyshortcuts, type ShortcutId } from '../../shortcuts';
import { tv } from '../../styles/tv';
import { buttonStyles, iconSizeFor, type ButtonTone, type ButtonVariant, type ControlSize } from '../Button';
import { Tooltip, type TooltipPlacement } from '../Tooltip';

/**
 * Icon-only control: a square of the control size with one radius (X2),
 * `hit-area` for the sizes under 44px (X14), and the Button colors. The
 * ghost icon color is `text-icon`. A disabled icon control is not natively
 * disabled (see IconButton), so its colors come from the `isDisabled`
 * variant rather than `data-disabled`. ToggleButton extends these styles.
 */
export const iconButtonStyles = tv({
  extend: buttonStyles,
  variants: {
    size: {
      sm: 'w-control-sm p-0',
      md: 'w-control-md p-0',
      lg: 'w-control-lg p-0',
      touch: 'w-control-touch p-0',
    },
    isDisabled: {
      true: 'forced-colors-disabled',
    },
  },
  compoundVariants: [
    { variant: 'ghost', tone: 'neutral', class: 'text-icon' },
    { isDisabled: true, variant: 'primary', class: 'bg-surface-raised text-text-muted' },
    { isDisabled: true, variant: 'secondary', class: 'border-border bg-surface text-text-muted' },
    { isDisabled: true, variant: 'soft', class: 'bg-surface-raised text-text-muted' },
    { isDisabled: true, variant: 'ghost', class: 'bg-transparent text-text-muted' },
  ],
  defaultVariants: { variant: 'ghost', tone: 'neutral', size: 'md' },
});

export interface IconButtonProps extends Omit<
  RacButtonProps,
  'className' | 'children' | 'aria-label' | 'isDisabled'
> {
  /** The accessible name and the tooltip text. */
  label: string;
  icon: IconName;
  /** @default 'ghost' */
  variant?: ButtonVariant;
  /** @default 'neutral' */
  tone?: ButtonTone;
  /** @default 'md' */
  size?: ControlSize;
  /** Adds `aria-keyshortcuts` and the key chip in the tooltip. */
  shortcut?: ShortcutId;
  /** @default 'top' */
  tooltipPlacement?: TooltipPlacement;
  /**
   * Opens the tooltip on mount (the Learning Analytics entry point, O1,
   * shows its tooltip pinned open). It closes as any tooltip does.
   */
  tooltipDefaultOpen?: boolean;
  /**
   * Disabled icon controls stay focusable and hoverable (`aria-disabled`,
   * no press handler) so their tooltip can still say what they are.
   */
  isDisabled?: boolean;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
}

/**
 * The DOM-safe props (`id`, `aria-*`, `data-*`, `autoFocus`) that the
 * disabled path passes to its plain `<button>`, so a disabled control keeps
 * them (for example `aria-controls` on a Menu trigger). React Aria's own
 * `filterDOMProps` is not exported by the packages we install.
 */
export function disabledDomProps(props: object): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(props).filter(
      ([key]) => key === 'id' || key === 'autoFocus' || key.startsWith('aria-') || key.startsWith('data-'),
    ),
  );
}

/**
 * An icon-only button with a required name and a tooltip that shows it
 * with its shortcut (X5). Leave is
 * `variant="soft" tone="danger" size="touch" icon="leave" label="Leave session"`.
 */
export function IconButton({
  label,
  icon,
  variant,
  tone,
  size = 'md',
  shortcut,
  tooltipPlacement,
  tooltipDefaultOpen,
  isDisabled = false,
  className,
  ref,
  ...props
}: IconButtonProps) {
  const buttonRef = useAriaKeyshortcuts<HTMLButtonElement>(shortcut, ref);
  const glyph = <Icon name={icon} size={iconSizeFor(size)} />;

  if (isDisabled) {
    // A native disabled button drops hover and focus, and with them the
    // tooltip (React Aria's recommendation is a Focusable wrapper).
    return (
      <Tooltip label={label} labelHidden shortcut={shortcut} placement={tooltipPlacement} defaultOpen={tooltipDefaultOpen}>
        <Focusable>
          <button
            {...disabledDomProps(props)}
            type="button"
            ref={buttonRef}
            aria-label={label}
            aria-disabled="true"
            className={iconButtonStyles({ variant, tone, size, isDisabled: true, className })}
          >
            {glyph}
          </button>
        </Focusable>
      </Tooltip>
    );
  }

  return (
    <Tooltip label={label} labelHidden shortcut={shortcut} placement={tooltipPlacement} defaultOpen={tooltipDefaultOpen}>
      <RacButton
        {...props}
        ref={buttonRef}
        aria-label={label}
        className={composeRenderProps(className, (cls) =>
          iconButtonStyles({ variant, tone, size, className: cls }),
        )}
      >
        {glyph}
      </RacButton>
    </Tooltip>
  );
}
