import type { ReactNode, Ref } from 'react';
import {
  ToggleButtonGroup as RacToggleButtonGroup,
  composeRenderProps,
  type ToggleButtonGroupProps as RacToggleButtonGroupProps,
} from 'react-aria-components';
import { tv } from '../../styles/tv';

/**
 * A row of ToggleButtons that share one selection: the whiteboard tools
 * (Focus.dc.html 117–125, 36px squares with a 4px gap). The floating
 * card around them belongs to the WhiteboardToolbar in milestone 5; this
 * is only the group.
 */
export const toggleGroupStyles = tv({
  base: 'inline-flex items-center gap-1',
  variants: {
    orientation: {
      horizontal: 'flex-row',
      vertical: 'flex-col',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
});

export interface ToggleGroupProps extends Omit<
  RacToggleButtonGroupProps,
  'className' | 'children' | 'style' | 'aria-label'
> {
  /** The group's name: "Whiteboard tools". */
  label: string;
  /** `ToggleButton`s, each with an `id` that the selection reports. */
  children: ReactNode;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

/**
 * A toggle group on React Aria's ToggleButtonGroup. With
 * `selectionMode="single"` (the default) it is a radio group: one tool at a
 * time, each button `role="radio"` with `aria-checked`. With `"multiple"`
 * it is a toolbar of pressed buttons (`aria-pressed`). Either way the arrow
 * keys move focus, Space and Enter toggle, and Tab leaves the group. The
 * selected state keeps ToggleButton's fill plus the inset `selected-ring`.
 */
export function ToggleGroup({
  label,
  children,
  className,
  orientation = 'horizontal',
  selectionMode = 'single',
  ...props
}: ToggleGroupProps) {
  return (
    <RacToggleButtonGroup
      {...props}
      aria-label={label}
      orientation={orientation}
      selectionMode={selectionMode}
      className={composeRenderProps(className, (cls) => toggleGroupStyles({ orientation, className: cls }))}
    >
      {children}
    </RacToggleButtonGroup>
  );
}
