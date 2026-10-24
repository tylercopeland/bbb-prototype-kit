import type { ReactElement, ReactNode } from 'react';
import {
  Keyboard,
  Tooltip as RacTooltip,
  TooltipTrigger,
  type TooltipTriggerComponentProps,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';
import { formatShortcut, type ShortcutId } from '../../shortcuts';
import { useSurface } from '../Surface';

/**
 * Inverted relative to the surface: dark on light panels, white with
 * stage-700 text on the stage (Focus.dc.html `.tipw .tip`, Shell.dc.html
 * line 222). No arrow, no shadow. The key chip is a <kbd> in the same color.
 */
export const tooltipStyles = tv({
  slots: {
    tooltip:
      'flex max-w-64 items-center gap-2 rounded-md bg-text px-2 py-1 text-sm font-semibold text-surface',
    kbd: 'rounded-xs border border-current px-1 font-sans text-xs font-medium',
  },
});

export type TooltipPlacement = 'top' | 'bottom' | 'start' | 'end';

export interface TooltipProps extends Pick<
  TooltipTriggerComponentProps,
  'delay' | 'closeDelay' | 'isOpen' | 'defaultOpen' | 'onOpenChange' | 'isDisabled'
> {
  /** The trigger: a focusable React Aria element, or one wrapped in `Focusable`. */
  children: ReactElement;
  /** For icon buttons, this equals their `aria-label`. */
  label: ReactNode;
  /** A key from `src/shortcuts.ts`, rendered as a key chip. */
  shortcut?: ShortcutId;
  /** @default 'top' */
  placement?: TooltipPlacement;
}

/**
 * A tooltip for icon-only controls (X5). Opens on hover after `delay` and
 * at once on keyboard focus; closes on pointer leave after `closeDelay`, on
 * blur, on Escape and on press. Touch never opens it, so the trigger must
 * carry its own `aria-label` and `aria-keyshortcuts`: the tooltip only
 * repeats them.
 *
 * It portals to <body>, so it reads `useSurface()` and sets `data-surface`
 * on itself to stay on the stage ramp when its trigger is on the stage.
 */
export function Tooltip({
  children,
  label,
  shortcut,
  placement = 'top',
  delay = 600,
  closeDelay = 100,
  ...trigger
}: TooltipProps) {
  const surface = useSurface();
  const { tooltip, kbd } = tooltipStyles();
  return (
    <TooltipTrigger delay={delay} closeDelay={closeDelay} {...trigger}>
      {children}
      {/* offset is two spacing steps: the canvas draws the tip 10px above the control */}
      <RacTooltip
        placement={placement}
        offset={8}
        data-surface={surface === 'stage' ? 'stage' : undefined}
        className={tooltip()}
      >
        {label}
        {shortcut && <Keyboard className={kbd()}>{formatShortcut(shortcut)}</Keyboard>}
      </RacTooltip>
    </TooltipTrigger>
  );
}
