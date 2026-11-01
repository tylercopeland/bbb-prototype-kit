import type { Ref } from 'react';
import {
  ToggleButton as RacToggleButton,
  composeRenderProps,
  type ToggleButtonProps as RacToggleButtonProps,
} from 'react-aria-components';
import { Icon, type IconName } from '../../icons';
import { useAriaKeyshortcuts, type ShortcutId } from '../../shortcuts';
import { tv, type VariantProps } from '../../styles/tv';
import { buttonStyles, iconSizeFor, type ControlSize } from '../Button';

/**
 * A toggle with a visible label (Mobile.dc.html 105: the React sheet's
 * "Raise hand" row). The soft fill of a Button, and `data-selected` swaps it
 * to the selected pair plus the inset `selected-ring`, as `ToggleButton`
 * does, so the state never rests on color alone; `selectedTone="hand"` turns
 * the selected state amber. Full width in a sheet.
 */
export const textToggleStyles = tv({
  extend: buttonStyles,
  base: 'w-full data-selected:selected-ring',
  variants: {
    selectedTone: {
      accent:
        'data-selected:bg-selected data-selected:text-selected-text data-selected:data-hovered:bg-selected data-selected:data-pressed:bg-selected',
      hand: 'data-selected:bg-status-hand data-selected:text-on-status-hand data-selected:selected-ring-hand data-selected:data-hovered:bg-status-hand data-selected:data-pressed:bg-status-hand',
    },
  },
  defaultVariants: { variant: 'soft', tone: 'neutral', size: 'touch', selectedTone: 'accent' },
});

export type TextToggleSelectedTone = NonNullable<VariantProps<typeof textToggleStyles>['selectedTone']>;

export interface TextToggleProps extends Omit<RacToggleButtonProps, 'className' | 'children' | 'style'> {
  /** The fixed label: "Raise hand". The state is `aria-pressed`, never the text. */
  children: string;
  /** Shown before the label while not selected. */
  icon?: IconName;
  /** Shown while selected; the icon may swap, the label never does. @default icon */
  selectedIcon?: IconName;
  /** @default 'touch' */
  size?: ControlSize;
  /** Adds `aria-keyshortcuts`. */
  shortcut?: ShortcutId;
  /** `hand` colors the selected state amber, for Raise hand. @default 'accent' */
  selectedTone?: TextToggleSelectedTone;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
}

/**
 * A text toggle on React Aria's ToggleButton: "Raise hand, toggle button,
 * pressed". It has a visible label, so it needs no tooltip; a disabled one
 * is natively disabled, like a text `Button`. Use `ToggleButton` for the
 * icon-only version.
 */
export function TextToggle({
  children,
  icon,
  selectedIcon,
  size = 'touch',
  shortcut,
  selectedTone,
  className,
  ref,
  ...props
}: TextToggleProps) {
  const buttonRef = useAriaKeyshortcuts<HTMLButtonElement>(shortcut, ref);
  return (
    <RacToggleButton
      {...props}
      ref={buttonRef}
      className={composeRenderProps(className, (cls) =>
        textToggleStyles({ selectedTone, size, className: cls }),
      )}
    >
      {({ isSelected }) => (
        <>
          {icon && <Icon name={isSelected ? (selectedIcon ?? icon) : icon} size={iconSizeFor(size)} />}
          {children}
        </>
      )}
    </RacToggleButton>
  );
}
