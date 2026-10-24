import type { Ref } from 'react';
import {
  Group,
  Input,
  Label,
  NumberField as RacNumberField,
  Text,
  composeRenderProps,
  type NumberFieldProps as RacNumberFieldProps,
} from 'react-aria-components';
import { tv } from '../../styles/tv';
import type { ControlSize } from '../Button';
import { IconButton } from '../IconButton';

/**
 * The room stepper of the breakout setup (Breakout.dc.html 228–235,
 * docs/screenshots/BO2SetupGroups-desk.png): an uppercase label, then a
 * bordered box with − / value / + at 40px, and a note beside it.
 */
export const stepperStyles = tv({
  base: 'flex flex-col gap-2',
});

export const stepperLabelStyles = tv({
  base: 'text-2xs font-bold tracking-label text-text-muted uppercase',
});

export const stepperGroupStyles = tv({
  base: 'inline-flex items-center self-start rounded-lg border border-border-control bg-surface data-disabled:border-border',
});

/** The value: a real number input, centered and bold, with the focus ring on itself. */
export const stepperInputStyles = tv({
  base: 'h-control-lg w-12 rounded-xs border-0 bg-transparent text-center text-lg font-bold text-text tabular-nums focus-ring outline-none data-disabled:text-text-muted',
});

export const stepperDescriptionStyles = tv({
  base: 'text-sm text-text-secondary',
});

export interface StepperProps extends Omit<
  RacNumberFieldProps,
  'className' | 'children' | 'style' | 'formatOptions' | 'aria-label'
> {
  /** The visible label: "Rooms". */
  label: string;
  /** A note under the control: "about 3 students per room". */
  description?: string;
  /** The − button's label and tooltip. React Aria appends the field label to its name: "Fewer Rooms". @default 'Fewer' */
  decrementLabel?: string;
  /** The + button's label and tooltip, named "More Rooms" the same way. @default 'More' */
  incrementLabel?: string;
  /** The − and + buttons: 40px (`lg`) as the canvas draws them, 44px on touch through `hit-area`. @default 'lg' */
  size?: ControlSize;
  className?: string;
  /** The number input. */
  ref?: Ref<HTMLInputElement>;
}

/**
 * A stepper on React Aria's NumberField: − and + IconButtons around a
 * number input. The buttons step by `step` and stop at `minValue` and
 * `maxValue` (B6: the breakout setup allows up to about 50 rooms); the
 * input takes typing, ArrowUp / ArrowDown, PageUp / PageDown and Home /
 * End, and clamps on blur. Each button has a tooltip with its name.
 */
export function Stepper({
  label,
  description,
  decrementLabel = 'Fewer',
  incrementLabel = 'More',
  size = 'lg',
  className,
  ref,
  ...props
}: StepperProps) {
  return (
    <RacNumberField
      {...props}
      className={composeRenderProps(className, (cls) => stepperStyles({ className: cls }))}
    >
      <Label className={stepperLabelStyles()}>{label}</Label>
      <Group className={stepperGroupStyles()}>
        <IconButton slot="decrement" label={decrementLabel} icon="decrease" variant="ghost" size={size} />
        <Input ref={ref} className={stepperInputStyles()} />
        <IconButton slot="increment" label={incrementLabel} icon="increase" variant="ghost" size={size} />
      </Group>
      {description && (
        <Text slot="description" className={stepperDescriptionStyles()}>
          {description}
        </Text>
      )}
    </RacNumberField>
  );
}
