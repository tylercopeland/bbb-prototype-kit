import { useRef, useState, type ReactNode, type Ref } from 'react';
import {
  Button as RacButton,
  composeRenderProps,
  type ButtonProps as RacButtonProps,
} from 'react-aria-components';
import { Icon, type IconName, type IconSize } from '../../icons';
import { tv, type VariantProps } from '../../styles/tv';
import { Tooltip } from '../Tooltip';

/**
 * Text button styles. The variants come from a survey of every board
 * (docs/plans/m2-primitives.md §2.2): primary is the blue fill, secondary
 * the white outlined default, soft the light fill without a border, ghost
 * the transparent blue text. `tone="danger"` recolors each one. State
 * styling uses React Aria's data attributes, never a function className.
 * IconButton and ToggleButton extend these styles.
 */
export const buttonStyles = tv({
  base: 'hit-area inline-flex max-w-full shrink-0 items-center justify-center gap-2 rounded-control font-semibold whitespace-nowrap focus-ring',
  variants: {
    variant: {
      primary:
        'bg-accent text-on-accent data-disabled:bg-surface-raised data-disabled:text-text-muted data-hovered:bg-accent-hover data-pressed:bg-accent-hover',
      secondary:
        'border border-border-control bg-surface text-text data-disabled:border-border data-disabled:text-text-muted data-hovered:bg-surface-sunken data-pressed:bg-surface-sunken',
      soft: 'bg-surface-raised text-text data-disabled:text-text-muted data-hovered:bg-surface-sunken data-pressed:bg-surface-sunken',
      ghost:
        'bg-transparent text-accent data-disabled:text-text-muted data-hovered:bg-surface-sunken data-pressed:bg-surface-sunken',
    },
    tone: {
      neutral: '',
      danger: '',
    },
    size: {
      sm: 'h-control-sm px-3 text-sm',
      md: 'h-control-md px-4 text-md',
      lg: 'h-control-lg px-4 text-md',
      touch: 'h-control-touch px-5 text-lg',
    },
  },
  compoundVariants: [
    {
      variant: 'primary',
      tone: 'danger',
      class: 'bg-danger text-on-danger data-hovered:bg-danger-hover data-pressed:bg-danger-hover',
    },
    {
      variant: 'secondary',
      tone: 'danger',
      class: 'border-danger-text text-danger-text data-hovered:bg-danger-soft data-pressed:bg-danger-soft',
    },
    {
      // Hover through opacity is banned, so the soft danger button fills on hover.
      variant: 'soft',
      tone: 'danger',
      class:
        'bg-danger-soft text-danger-text data-hovered:bg-danger-hover data-hovered:text-on-danger data-pressed:bg-danger-hover data-pressed:text-on-danger',
    },
    {
      variant: 'ghost',
      tone: 'danger',
      class: 'text-danger-text data-hovered:bg-danger-soft data-pressed:bg-danger-soft',
    },
  ],
  defaultVariants: { variant: 'secondary', tone: 'neutral', size: 'md' },
});

/** The text inside a Button: it truncates instead of wrapping when the button is narrower than its label. */
export const buttonLabelStyles = tv({ base: 'truncate' });

export type ButtonVariant = NonNullable<VariantProps<typeof buttonStyles>['variant']>;
export type ButtonTone = NonNullable<VariantProps<typeof buttonStyles>['tone']>;
/** Control heights: 32 / 36 / 40 / 44px, from the `component.control.*` tokens. Shared by Button, IconButton and ToggleButton. */
export type ControlSize = NonNullable<VariantProps<typeof buttonStyles>['size']>;

/** The glyph for a control size: 16px in the 32px control, 20px in the others. */
export function iconSizeFor(size: ControlSize): IconSize {
  return size === 'sm' ? 'sm' : 'md';
}

export interface ButtonProps extends Omit<RacButtonProps, 'className' | 'children'> {
  /** @default 'secondary' */
  variant?: ButtonVariant;
  /** @default 'neutral' */
  tone?: ButtonTone;
  /** @default 'md' */
  size?: ControlSize;
  /** An icon before the text. */
  icon?: IconName;
  /** An icon after the text. */
  iconEnd?: IconName;
  children: ReactNode;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
}

/**
 * A text button on React Aria's Button. Icon-only controls use IconButton
 * instead. A disabled Button is natively disabled (it has text, so it needs
 * no tooltip to be understood).
 *
 * When the label is cut off (the button is narrower than its text), hover
 * and keyboard focus show the full text in a Tooltip, which also describes
 * the button while open. A label that fits opens nothing: the trigger asks
 * to open and the button answers by measuring the label at that moment, so
 * no observer runs while idle.
 */
export function Button({
  variant,
  tone,
  size = 'md',
  icon,
  iconEnd,
  children,
  className,
  ...props
}: ButtonProps) {
  const labelRef = useRef<HTMLSpanElement>(null);
  const [isTooltipOpen, setTooltipOpen] = useState(false);
  const onTooltipOpenChange = (open: boolean) => {
    const label = labelRef.current;
    setTooltipOpen(open && label !== null && label.scrollWidth > label.clientWidth);
  };
  return (
    <Tooltip label={children} isOpen={isTooltipOpen} onOpenChange={onTooltipOpenChange}>
      <RacButton
        {...props}
        className={composeRenderProps(className, (cls) =>
          buttonStyles({ variant, tone, size, className: cls }),
        )}
      >
        {icon && <Icon name={icon} size={iconSizeFor(size)} />}
        <span ref={labelRef} className={buttonLabelStyles()}>
          {children}
        </span>
        {iconEnd && <Icon name={iconEnd} size={iconSizeFor(size)} />}
      </RacButton>
    </Tooltip>
  );
}
