import type { ReactNode, Ref } from 'react';
import { mergeProps } from 'react-aria';
import {
  Label,
  Radio as RacRadio,
  RadioGroup as RacRadioGroup,
  composeRenderProps,
  type RadioGroupProps as RacRadioGroupProps,
  type RadioProps as RacRadioProps,
} from 'react-aria-components';
import { tv, type VariantProps } from '../../styles/tv';
import { Badge, type BadgeProps } from '../Badge';
import { Tooltip, useTruncationTooltip } from '../Tooltip';

/**
 * A row of single-select chips (X8): the People filters (Focus.dc.html
 * 580–584), the timer presets (192) and the breakout durations
 * (Breakout.dc.html 254–256) are one choice among a few, so the group is
 * a radio group and each chip a radio, not a row of toggle buttons.
 */
export const chipGroupStyles = tv({
  base: 'flex flex-col gap-2',
});

/** The optional visible label: the uppercase kicker above the breakout durations ("Time"). */
export const chipGroupLabelStyles = tv({
  base: 'text-2xs font-bold tracking-label text-text-muted uppercase',
  variants: {
    isHidden: {
      true: 'sr-only',
    },
  },
});

export const chipListStyles = tv({
  base: 'flex',
  variants: {
    orientation: {
      horizontal: 'flex-row',
      vertical: 'flex-col',
    },
    /** `compact` keeps the chips on one row at the panel width (the People filters): tighter gap, no wrapping, labels truncate. */
    density: {
      default: 'flex-wrap gap-2',
      compact: 'flex-nowrap gap-1',
    },
  },
  defaultVariants: { orientation: 'horizontal', density: 'default' },
});

/**
 * One chip, the canvas's pill (Focus.dc.html 932): 32px tall, a control
 * border, bold 13px text; selected inverts to text on surface, so the
 * state is a lightness swap plus `aria-checked`, never a hue. The
 * durations' blue fill (Breakout.dc.html 489) is folded into this one look.
 * In forced colors, which drop the fill, the selected chip gets a Highlight
 * border (`forced-colors-selected`), as a selected toggle does.
 */
export const chipStyles = tv({
  base: 'hit-area inline-flex h-control-sm max-w-full cursor-default items-center justify-center rounded-full border border-border-control bg-surface text-sm font-semibold whitespace-nowrap text-text-secondary focus-ring outline-none data-disabled:border-border data-disabled:text-text-muted data-hovered:bg-surface-sunken data-pressed:bg-surface-sunken data-selected:border-text data-selected:bg-text data-selected:text-surface data-selected:forced-colors-selected data-selected:data-hovered:bg-text data-selected:data-pressed:bg-text',
  variants: {
    /** `compact` tightens the padding and the gap before the badge, and lets the chip shrink (the label truncates). */
    density: {
      default: 'gap-2 px-3',
      compact: 'min-w-0 gap-1 px-2',
    },
  },
  defaultVariants: { density: 'default' },
});

export type ChipDensity = NonNullable<VariantProps<typeof chipStyles>['density']>;

export const chipLabelStyles = tv({ base: 'truncate' });

export interface ChipGroupProps extends Omit<
  RacRadioGroupProps,
  'className' | 'children' | 'style' | 'aria-label' | 'orientation'
> {
  /** The group's name: "Filter people", "Time", "Timer presets". */
  label: string;
  /** Keeps the label for assistive technology only (the People filters have no visible one). @default false */
  labelHidden?: boolean;
  /** @default 'horizontal' */
  orientation?: 'horizontal' | 'vertical';
  /** `compact` keeps the row on one line with a tighter gap; give the chips the same density. @default 'default' */
  density?: ChipDensity;
  /** The chips. */
  children: ReactNode;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

/**
 * A single-select chip row on React Aria's RadioGroup: one chip is checked,
 * the arrow keys move the check, Tab enters and leaves the group on the
 * checked chip, and the whole group takes one `value` / `onChange`.
 */
export function ChipGroup({
  label,
  labelHidden = false,
  orientation = 'horizontal',
  density = 'default',
  children,
  className,
  ...props
}: ChipGroupProps) {
  return (
    <RacRadioGroup
      {...props}
      orientation={orientation}
      className={composeRenderProps(className, (cls) => chipGroupStyles({ className: cls }))}
    >
      <Label className={chipGroupLabelStyles({ isHidden: labelHidden })}>{label}</Label>
      <div className={chipListStyles({ orientation, density })}>{children}</div>
    </RacRadioGroup>
  );
}

export interface ChipProps extends Omit<RacRadioProps, 'className' | 'children' | 'style'> {
  /** The chip's text; its accessible name together with the badge label. */
  children: string;
  /** A count on the chip: "All 14", "Raised hands 4". */
  badge?: Pick<BadgeProps, 'count' | 'label' | 'tone'>;
  /** Match the group's density. @default 'default' */
  density?: ChipDensity;
  className?: string;
  ref?: Ref<HTMLLabelElement>;
}

/**
 * One chip. `value` is what the group reports when this chip is checked.
 * When its text is cut off (the chip is narrower than its label), hover and
 * keyboard focus show the full text in a Tooltip (`useTruncationTooltip`);
 * the accessible name is always the full text.
 */
export function Chip({ children, badge, density = 'default', className, ref, ...props }: ChipProps) {
  const { labelRef, triggerRef, triggerProps, isOpen, onOpenChange } = useTruncationTooltip<HTMLLabelElement>(ref);
  return (
    <RacRadio
      {...mergeProps(props, triggerProps)}
      ref={triggerRef}
      className={composeRenderProps(className, (cls) => chipStyles({ density, className: cls }))}
    >
      {({ isSelected }) => (
        <>
          <span ref={labelRef} className={chipLabelStyles()}>
            {children}
          </span>
          {/* The space keeps the name "All 14 people", not "All14 people"; flex drops it visually. */}
          {badge && (
            <>
              {' '}
              <Badge {...badge} inverted={isSelected && badge.tone !== 'urgent'} />
            </>
          )}
          <Tooltip label={children} triggerRef={triggerRef} isOpen={isOpen} onOpenChange={onOpenChange} />
        </>
      )}
    </RacRadio>
  );
}
