import type { ReactNode, Ref } from 'react';
import {
  Label,
  Radio as RacRadio,
  RadioGroup as RacRadioGroup,
  composeRenderProps,
  type RadioGroupProps as RacRadioGroupProps,
  type RadioProps as RacRadioProps,
} from 'react-aria-components';
import { tv } from '../../styles/tv';
import { Badge, type BadgeProps } from '../Badge';

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
  base: 'flex flex-wrap gap-2',
  variants: {
    orientation: {
      horizontal: 'flex-row',
      vertical: 'flex-col',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
});

/**
 * One chip, the canvas's pill (Focus.dc.html 932): 32px tall, a control
 * border, bold 13px text; selected inverts to text on surface, so the
 * state is a lightness swap plus `aria-checked`, never a hue. The
 * durations' blue fill (Breakout.dc.html 489) is folded into this one look.
 */
export const chipStyles = tv({
  base: 'hit-area inline-flex h-control-sm max-w-full cursor-default items-center justify-center gap-2 rounded-full border border-border-control bg-surface px-3 text-sm font-semibold whitespace-nowrap text-text-secondary focus-ring outline-none data-disabled:border-border data-disabled:text-text-muted data-hovered:bg-surface-sunken data-pressed:bg-surface-sunken data-selected:border-text data-selected:bg-text data-selected:text-surface data-selected:data-hovered:bg-text data-selected:data-pressed:bg-text',
});

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
      <div className={chipListStyles({ orientation })}>{children}</div>
    </RacRadioGroup>
  );
}

export interface ChipProps extends Omit<RacRadioProps, 'className' | 'children' | 'style'> {
  /** The chip's text; its accessible name together with the badge label. */
  children: string;
  /** A count on the chip: "All 14", "Raised hands 4". */
  badge?: Pick<BadgeProps, 'count' | 'label' | 'tone'>;
  className?: string;
  ref?: Ref<HTMLLabelElement>;
}

/** One chip. `value` is what the group reports when this chip is checked. */
export function Chip({ children, badge, className, ...props }: ChipProps) {
  return (
    <RacRadio {...props} className={composeRenderProps(className, (cls) => chipStyles({ className: cls }))}>
      {({ isSelected }) => (
        <>
          <span className={chipLabelStyles()}>{children}</span>
          {/* The space keeps the name "All 14 people", not "All14 people"; flex drops it visually. */}
          {badge && (
            <>
              {' '}
              <Badge {...badge} inverted={isSelected && badge.tone !== 'urgent'} />
            </>
          )}
        </>
      )}
    </RacRadio>
  );
}
