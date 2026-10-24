import { useCallback } from 'react';
import {
  Button as RacButton,
  composeRenderProps,
  type ButtonProps as RacButtonProps,
} from 'react-aria-components';
import { tv, type VariantProps } from 'tailwind-variants';
import { Icon, type IconName } from '../../icons';
import { ariaKeyshortcuts, type ShortcutId } from '../../shortcuts';
import { buttonStyles, type ButtonTone, type ButtonVariant, type ControlSize } from '../Button';
import { Tooltip, type TooltipPlacement } from '../Tooltip';

/**
 * Icon-only control: a square of the control size with one radius (X2),
 * `hit-area` for the sizes under 44px (X14), and the Button colors. The
 * ghost icon color is `text-icon`. ToggleButton extends these styles.
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
  },
  compoundVariants: [{ variant: 'ghost', tone: 'neutral', class: 'text-icon' }],
  defaultVariants: { variant: 'ghost', tone: 'neutral', size: 'md' },
});

export type IconButtonSize = NonNullable<VariantProps<typeof iconButtonStyles>['size']>;

/** 16px glyph in the 32px control, 20px in the others. */
export function iconSizeFor(size: ControlSize) {
  return size === 'sm' ? 'sm' : 'md';
}

/**
 * React Aria's Button forwards only the labelling `aria-*` props to the
 * DOM, so `aria-keyshortcuts` is set on the element itself through this
 * callback ref. Components built on it take no `ref` prop: React Aria
 * triggers (TooltipTrigger, MenuTrigger, DialogTrigger) reach the button
 * through context instead.
 */
export function useAriaKeyshortcuts<T extends HTMLElement>(shortcut: ShortcutId | undefined) {
  const value = shortcut ? ariaKeyshortcuts(shortcut) : undefined;
  return useCallback(
    (el: T | null) => {
      if (!el) return;
      if (value) el.setAttribute('aria-keyshortcuts', value);
      else el.removeAttribute('aria-keyshortcuts');
    },
    [value],
  );
}

export interface IconButtonProps extends Omit<
  RacButtonProps,
  'className' | 'children' | 'aria-label' | 'ref'
> {
  /** The accessible name and the tooltip text. */
  label: string;
  icon: IconName;
  /** @default 'ghost' */
  variant?: ButtonVariant;
  /** @default 'neutral' */
  tone?: ButtonTone;
  /** @default 'md' */
  size?: IconButtonSize;
  /** Adds `aria-keyshortcuts` and the key chip in the tooltip. */
  shortcut?: ShortcutId;
  /** @default 'top' */
  tooltipPlacement?: TooltipPlacement;
  className?: string;
}

/**
 * An icon-only button with a required name and a tooltip that repeats it
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
  className,
  ...props
}: IconButtonProps) {
  const buttonRef = useAriaKeyshortcuts<HTMLButtonElement>(shortcut);
  return (
    <Tooltip label={label} shortcut={shortcut} placement={tooltipPlacement}>
      <RacButton
        {...props}
        ref={buttonRef}
        aria-label={label}
        className={composeRenderProps(className, (cls) =>
          iconButtonStyles({ variant, tone, size, className: cls }),
        )}
      >
        <Icon name={icon} size={iconSizeFor(size)} />
      </RacButton>
    </Tooltip>
  );
}
