import type { Ref } from 'react';
import {
  FieldError,
  Input,
  Label,
  TextField as RacTextField,
  Text,
  composeRenderProps,
  type TextFieldProps as RacTextFieldProps,
} from 'react-aria-components';
import { Icon } from '../../icons';
import { tv } from '../../styles/tv';
import type { ControlSize } from '../Button';

/** Label, control, then description or error, 4px apart. Shared with TextArea. */
export const fieldStyles = tv({
  base: 'flex flex-col gap-1',
});

/**
 * The visible label, or the same text for assistive technology only
 * (`labelHidden`): a field always has a label element, so its name never
 * depends on the placeholder, which disappears while typing.
 */
export const fieldLabelStyles = tv({
  base: 'text-sm font-semibold text-text',
  variants: {
    isHidden: {
      true: 'sr-only',
    },
  },
});

export const fieldDescriptionStyles = tv({
  base: 'text-xs text-text-muted',
});

/** The error line (B8): danger text with the error glyph, so it is not color alone. */
export const fieldErrorStyles = tv({
  base: 'flex items-center gap-1 text-xs font-medium text-danger-text',
});

/**
 * The input (Breakout.dc.html 476, 496 and the panel inputs): a control
 * border on the surface, 14px text, the focus ring on the element itself
 * (D2: the canvas set `outline: none` with no replacement). Invalid swaps
 * the border to danger text; disabled fades the border and text.
 */
export const textInputStyles = tv({
  base: 'w-full rounded-control border border-border-control bg-surface px-3 text-md text-text focus-ring outline-none placeholder:text-text-muted data-disabled:border-border data-disabled:text-text-muted data-invalid:border-danger-text',
  variants: {
    size: {
      md: 'h-control-md',
      lg: 'h-control-lg',
      touch: 'h-control-touch text-lg',
    },
  },
  defaultVariants: { size: 'lg' },
});

/** Field heights share the control scale minus `sm`: 36 / 40 / 44px, since a 32px input is too short for its text. */
export type TextFieldSize = Exclude<ControlSize, 'sm'>;

export interface TextFieldProps extends Omit<
  RacTextFieldProps,
  'className' | 'children' | 'style' | 'aria-label' | 'aria-labelledby'
> {
  /** The label. Visible by default; with `labelHidden` it is still the field's name. */
  label: string;
  /** @default false */
  labelHidden?: boolean;
  /** Help text under the field; it becomes the description. */
  description?: string;
  /**
   * Shown under the field while `isInvalid`, and announced as the field's
   * error. Without one, the field shows the messages from `validate` or
   * the browser's constraint validation instead.
   */
  errorMessage?: string;
  placeholder?: string;
  /** 36 / 40 / 44px. @default 'lg' */
  size?: TextFieldSize;
  className?: string;
  /** The input element. */
  ref?: Ref<HTMLInputElement>;
}

/**
 * A single-line text field on React Aria's TextField (B8: a real input).
 * The label names it, `description` describes it and the error line is
 * linked while invalid: `errorMessage` when given, otherwise React Aria's
 * `validationErrors`. Tab reaches the input; Enter and Escape do nothing
 * on their own, so a form or dialog around it decides.
 */
export function TextField({
  label,
  labelHidden = false,
  description,
  errorMessage,
  placeholder,
  size = 'lg',
  className,
  ref,
  ...props
}: TextFieldProps) {
  return (
    <RacTextField
      {...props}
      className={composeRenderProps(className, (cls) => fieldStyles({ className: cls }))}
    >
      <Label className={fieldLabelStyles({ isHidden: labelHidden })}>{label}</Label>
      <Input ref={ref} placeholder={placeholder} className={textInputStyles({ size })} />
      {description && (
        <Text slot="description" className={fieldDescriptionStyles()}>
          {description}
        </Text>
      )}
      <FieldError className={fieldErrorStyles()}>
        {({ validationErrors }) => (
          <>
            <Icon name="error" size="sm" />
            {errorMessage ?? validationErrors.join(' ')}
          </>
        )}
      </FieldError>
    </RacTextField>
  );
}
