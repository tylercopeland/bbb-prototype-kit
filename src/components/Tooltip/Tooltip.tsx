import type { ReactElement, ReactNode } from 'react';
import {
  Keyboard,
  Tooltip as RacTooltip,
  TooltipTrigger,
  composeRenderProps,
  type TooltipTriggerComponentProps,
} from 'react-aria-components';
import { formatShortcut, type ShortcutId } from '../../shortcuts';
import { tv } from '../../styles/tv';
import { useSurfaceProps } from '../Surface';

/**
 * Inverted relative to the surface: dark on light panels, white with
 * stage-700 text on the stage (Focus.dc.html `.tipw .tip`, Shell.dc.html
 * line 222). No arrow, no shadow.
 */
export const tooltipStyles = tv({
  base: 'flex max-w-64 items-center gap-2 rounded-md bg-text px-2 py-1 text-sm font-semibold text-surface',
});

/** The key chip: a <kbd> in the tooltip's own color. */
export const tooltipKeyStyles = tv({
  base: 'rounded-xs border border-current px-1 font-sans text-xs font-medium',
});

/** Two steps of the 4px spacing scale: the canvas draws the tip 10px above the control. */
const TOOLTIP_OFFSET = 8;

export type TooltipPlacement = 'top' | 'bottom' | 'start' | 'end';

export interface TooltipProps extends Pick<
  TooltipTriggerComponentProps,
  'delay' | 'closeDelay' | 'isOpen' | 'defaultOpen' | 'onOpenChange' | 'isDisabled'
> {
  /** The trigger: a focusable React Aria element, or one wrapped in `Focusable`. */
  children: ReactElement;
  /** For icon buttons, this equals their `aria-label`. */
  label: ReactNode;
  /**
   * The trigger already has `label` as its accessible name, so hide it from
   * the tooltip's description: assistive technology then hears only the
   * shortcut ("Alt + M") instead of the name twice. IconButton and
   * ToggleButton set this; a plain trigger keeps the label.
   */
  labelHidden?: boolean;
  /** A key from `src/shortcuts.ts`, rendered as a key chip. */
  shortcut?: ShortcutId;
  /** @default 'top' */
  placement?: TooltipPlacement;
  className?: string;
}

/**
 * A tooltip for icon-only controls (X5). Opens on hover after `delay` and
 * at once on keyboard focus; closes on pointer leave after `closeDelay`, on
 * blur, on Escape and on press. Touch never opens it, so the trigger must
 * carry its own `aria-label` and `aria-keyshortcuts`: the tooltip only
 * repeats them.
 *
 * It portals to <body>, so it takes `useSurfaceProps()` to stay on the
 * stage ramp when its trigger is on the stage.
 */
export function Tooltip({
  children,
  label,
  labelHidden = false,
  shortcut,
  placement = 'top',
  delay = 600,
  closeDelay = 100,
  className,
  ...trigger
}: TooltipProps) {
  const surfaceProps = useSurfaceProps();
  return (
    <TooltipTrigger delay={delay} closeDelay={closeDelay} {...trigger}>
      {children}
      <RacTooltip
        {...surfaceProps}
        placement={placement}
        offset={TOOLTIP_OFFSET}
        className={composeRenderProps(className, (cls) => tooltipStyles({ className: cls }))}
      >
        <span aria-hidden={labelHidden || undefined}>{label}</span>
        {shortcut && (
          <>
            {' '}
            <Keyboard className={tooltipKeyStyles()}>{formatShortcut(shortcut)}</Keyboard>
          </>
        )}
      </RacTooltip>
    </TooltipTrigger>
  );
}
